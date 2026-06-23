# -*- coding: utf-8 -*-
"""
km_api_setup.py - KM_API 配置和 Token 管理模块

KM_API 服务地址：config/km_api.json
Token 存储位置：~/.bluecode/skills/km_config/km_tokens.json
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Optional

import requests

CONFIG_DIR = Path(__file__).parent.parent / "config"
KM_API_CONFIG_FILE = CONFIG_DIR / "km_api.json"
TOKEN_DIR = Path.home() / ".bluecode" / "skills" / "km_config"
TOKEN_FILE = TOKEN_DIR / "km_tokens.json"

DEFAULT_KM_API_URL = "https://qds-test.vmic.xyz/api/km-api"


def _ensure_config_dir():
    """确保配置目录存在"""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)


def _ensure_token_dir():
    """确保Token存储目录存在"""
    TOKEN_DIR.mkdir(parents=True, exist_ok=True)


def configure_km_api_url(url: str) -> Dict:
    """保存 KM_API 服务地址到 config/km_api.json"""
    url = url.strip().rstrip("/")

    if not url.startswith("http"):
        return {"success": False, "error": "URL必须以http://或https://开头"}

    try:
        _ensure_config_dir()
        config = {"km_api_url": url}
        with open(KM_API_CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        return {"success": True, "message": f"KM_API地址已保存：{url}"}
    except IOError as e:
        return {"success": False, "error": f"保存配置失败：{str(e)}"}


def load_km_api_config() -> Dict:
    """读取 config/km_api.json"""
    if not KM_API_CONFIG_FILE.exists():
        return {"km_api_url": DEFAULT_KM_API_URL, "configured": False}

    try:
        with open(KM_API_CONFIG_FILE, "r", encoding="utf-8") as f:
            config = json.load(f)
            return {**config, "configured": True}
    except (json.JSONDecodeError, IOError) as e:
        return {"km_api_url": DEFAULT_KM_API_URL, "configured": False, "error": str(e)}


def _get_km_api_url() -> str:
    """获取KM_API服务地址"""
    config = load_km_api_config()
    return config.get("km_api_url", DEFAULT_KM_API_URL)


def _load_tokens() -> Dict[str, Dict]:
    """加载所有Token配置"""
    _ensure_token_dir()
    if not TOKEN_FILE.exists():
        return {}
    try:
        with open(TOKEN_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {}


def _save_tokens(tokens: Dict[str, Dict]) -> bool:
    """保存Token配置"""
    _ensure_token_dir()
    try:
        with open(TOKEN_FILE, "w", encoding="utf-8") as f:
            json.dump(tokens, f, ensure_ascii=False, indent=2)
        return True
    except IOError:
        return False


def upload_token(kb_name: str, kb_id: int, token: str, owner: str, env: str = "prd", remark: str = "") -> Dict:
    """调用 KM_API 上传 Token"""
    validation = validate_kb_id(token, kb_id)
    if not validation.get("success"):
        return {"success": False, "error": validation.get("error")}
    if not validation.get("authorized"):
        authorized_kbs = validation.get("authorized_kbs", [])
        kb_list_str = "\n".join([f"  - {kb['kb_id']}: {kb['kb_name']}" for kb in authorized_kbs]) if authorized_kbs else "  (无)"
        return {
            "success": False,
            "error": f"Token无权访问知识库 ID: {kb_id}\n\n当前Token已授权的知识库：\n{kb_list_str}\n\n请在 wiki.vivo.xyz 开放接口授权中添加该知识库"
        }

    url = f"{_get_km_api_url()}/admin/tokens/upload"
    payload = {
        "kb_name": kb_name,
        "kb_id": kb_id,
        "token": token,
        "owner": owner,
        "env": env,
        "remark": remark
    }

    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()

        if result.get("code") == 1 or result.get("success"):
            real_kb_name = result.get("data", {}).get("kb_name") or kb_name
            _save_token_local(kb_name, kb_id, token, owner, env, remark, real_kb_name)
            return {"success": True, "message": "Token上传成功", "data": result.get("data")}

        return {"success": False, "error": result.get("message", "上传失败")}
    except requests.exceptions.RequestException as e:
        return {"success": False, "error": f"网络请求失败：{str(e)}"}


def _save_token_local(kb_name: str, kb_id: int, token: str, owner: str, env: str, remark: str, real_kb_name: str = None) -> None:
    """本地保存Token记录"""
    tokens = _load_tokens()
    token_key = real_kb_name if real_kb_name else kb_name
    tokens[token_key] = {
        "kb_id": kb_id,
        "token": token,
        "owner": owner,
        "env": env,
        "remark": remark
    }
    _save_tokens(tokens)


def list_tokens() -> List[Dict]:
    """调用 KM_API 列出所有 Token（脱敏）"""
    url = f"{_get_km_api_url()}/admin/tokens/list"

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        result = response.json()

        if result.get("code") == 1 or result.get("success"):
            tokens = result.get("data", {}).get("tokens", result.get("data", []))
            return [_mask_token(t) for t in tokens]

        return []
    except requests.exceptions.RequestException as e:
        return []


def _mask_token(token_info: Dict) -> Dict:
    """脱敏Token信息"""
    masked = token_info.copy()
    if "token" in masked and masked["token"]:
        masked["token"] = masked["token"][:8] + "***" + masked["token"][-4:] if len(masked["token"]) > 12 else "***"
    return masked


def update_token(token_id: str, old_token: str, new_token: str) -> Dict:
    """调用 KM_API 更新 Token"""
    url = f"{_get_km_api_url()}/admin/tokens/update"
    payload = {
        "id": token_id,
        "token": new_token
    }

    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()

        if result.get("code") == 1 or result.get("success"):
            return {"success": True, "message": "Token更新成功"}

        return {"success": False, "error": result.get("message", "更新失败")}
    except requests.exceptions.RequestException as e:
        return {"success": False, "error": f"网络请求失败：{str(e)}"}


def revoke_token(token_id: str, token: str) -> Dict:
    """调用 KM_API 撤销 Token"""
    url = f"{_get_km_api_url()}/admin/tokens/revoke"
    payload = {
        "id": token_id
    }

    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()

        if result.get("code") == 1 or result.get("success"):
            return {"success": True, "message": "Token已撤销"}

        return {"success": False, "error": result.get("message", "撤销失败")}
    except requests.exceptions.RequestException as e:
        return {"success": False, "error": f"网络请求失败：{str(e)}"}


def verify_connection() -> Dict:
    """调用 KM_API health 检查连接"""
    url = f"{_get_km_api_url()}/health"

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        result = response.json()

        if result.get("code") == 0 or result.get("success"):
            return {
                "success": True,
                "connected": True,
                "message": "KM_API连接正常",
                "data": result.get("data", {})
            }

        return {"success": False, "connected": False, "error": result.get("message", "连接异常")}
    except requests.exceptions.Timeout:
        return {"success": False, "connected": False, "error": "连接超时"}
    except requests.exceptions.RequestException as e:
        return {"success": False, "connected": False, "error": f"连接失败：{str(e)}"}


def get_local_tokens() -> Dict[str, Dict]:
    """获取本地存储的Token记录"""
    return _load_tokens()


def remove_local_token(kb_name: str) -> Dict:
    """删除本地Token记录"""
    tokens = _load_tokens()
    if kb_name not in tokens:
        return {"success": False, "error": f"未找到知识库：{kb_name}"}

    del tokens[kb_name]
    if _save_tokens(tokens):
        return {"success": True, "message": f"已删除本地记录：{kb_name}"}
    return {"success": False, "error": "删除失败"}


def list_token_kbs(token: str) -> Dict:
    """获取 token 可访问的所有知识库"""
    url = f"{_get_km_api_url()}/kb/info"
    payload = {"accessToken": token}

    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()

        if result.get("code") == 1:
            kb_list = result.get("data", {}).get("kbList", [])
            return {
                "success": True,
                "kbs": [{"kb_id": kb.get("kbId"), "kb_name": kb.get("kbName")} for kb in kb_list],
                "count": len(kb_list)
            }

        return {"success": False, "error": result.get("message", "获取知识库列表失败"), "kbs": [], "count": 0}
    except requests.exceptions.RequestException as e:
        return {"success": False, "error": f"网络请求失败：{str(e)}", "kbs": [], "count": 0}


def validate_kb_id(token: str, kb_id: int) -> Dict:
    """验证 token 是否有权限访问指定 kb_id"""
    url = f"{_get_km_api_url()}/kb/info"
    payload = {"accessToken": token}

    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()

        if result.get("code") == 1:
            kb_list = result.get("data", {}).get("kbList", [])
            authorized_ids = [str(kb.get("kbId")) for kb in kb_list]

            if str(kb_id) in authorized_ids:
                return {"success": True, "authorized": True}

            kb_name = next((kb.get("kbName") for kb in kb_list if str(kb.get("kbId")) == str(kb_id)), None)
            return {
                "success": False,
                "authorized": False,
                "error": f"Token无权访问知识库 ID: {kb_id}",
                "authorized_kbs": [{"kb_id": kb.get("kbId"), "kb_name": kb.get("kbName")} for kb in kb_list]
            }

        return {"success": False, "authorized": False, "error": result.get("message", "验证失败")}
    except requests.exceptions.RequestException as e:
        return {"success": False, "authorized": False, "error": f"网络请求失败：{str(e)}"}