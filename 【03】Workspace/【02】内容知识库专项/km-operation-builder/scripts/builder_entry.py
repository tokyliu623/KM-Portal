# -*- coding: utf-8 -*-
"""
builder_entry.py - km-operation-builder 统一入口

简化流程：
1. builder_create() - 一键创建知识库运营助手
2. 自动安装到 ~/.config/bluecode/skills/
3. 自动打包供分发
"""

import sys
import os
import re
import shutil
import zipfile
from pathlib import Path
from typing import Dict, Any, Optional

current_dir = Path(__file__).parent
project_root = current_dir.parent
runtime_lib_dir = project_root / "runtime_lib"
for p in [str(runtime_lib_dir), str(current_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from kb_config import check_config, get_setup_guide
from kb_client import list_kbs, search_kb_by_name
from kb_probe import probe_all, list_accessible_kbs
from template_selector import list_templates, recommend_template
from skill_generator import generate_skill
from km_api_setup import upload_token, verify_connection, validate_kb_id, list_token_kbs
from name_translator import translate_kb_name, generate_skill_name_candidates
import scripts
__version__ = getattr(scripts, '__version__', '1.0.2')

SKILLS_DIR = Path.home() / ".config" / "bluecode" / "skills"
KM_API_URL = "https://qds-test.vmic.xyz/api/km-api"


def builder_create(kb_name: str, kb_id: int, token: str, owner: str,
                   template: str = "operation", env: str = "prd") -> Dict[str, Any]:
    """
    一键创建知识库运营助手

    流程：
    1. 调用 KM-API 上传 Token，获取 token_id
    2. 生成 Skill 项目
    3. 自动安装到 ~/.config/bluecode/skills/
    4. 自动打包为 zip 文件

    Args:
        kb_name: 知识库名称
        kb_id: 知识库 ID
        token: wiki.vivo.xyz 的 accessToken（格式：u-xxxx）
        owner: 所有者名称
        template: 模板类型 - operation, analysis, distribution (默认: operation)
        env: 环境 - prd, test (默认: prd)

    Returns:
        {
            success: True/False,
            token_id: str,           # KM-API 返回的 UUID
            skill_name: str,         # 如 kb-zhi-jian-wei-lai-operation
            install_path: str,       # 安装路径
            zip_path: str,           # 打包文件路径
            message: str
        }
    """
    print(f"=== 创建知识库运营助手 ===")
    print(f"知识库: {kb_name} (ID: {kb_id})")
    print()

    print("Step 1: 验证 Token 并上传到 KM-API...")
    upload_result = upload_token(kb_name, kb_id, token, owner, env)
    if not upload_result.get("success"):
        return {
            "success": False,
            "step": "token_upload",
            "error": upload_result.get("error", "Token 上传失败"),
            "guide": "请确保提供的 token 有效且有对应知识库的访问权限"
        }

    token_id = upload_result.get("data", {}).get("id")
    if not token_id:
        return {
            "success": False,
            "step": "token_upload",
            "error": "Token 上传成功但未返回 token_id",
            "upload_result": upload_result
        }

    real_kb_name = upload_result.get("data", {}).get("kb_name") or kb_name

    print(f"  ✓ Token 已上传，token_id: {token_id}")
    print()

    print("Step 2: 生成 Skill 项目...")
    skill_name = _generate_skill_name(real_kb_name)
    temp_output = project_root / "temp_build" / skill_name

    gen_result = generate_skill(
        kb_name=real_kb_name,
        kb_id=kb_id,
        template=template,
        output_dir=str(temp_output),
        token_id=token_id
    )

    if not gen_result.get("success"):
        return {
            "success": False,
            "step": "skill_generate",
            "error": gen_result.get("error", "Skill 生成失败")
        }

    print(f"  ✓ Skill 项目已生成: {gen_result.get('output_dir')}")
    print()

    print("Step 3: 安装到 BlueCode Skills 目录...")
    install_path = SKILLS_DIR / skill_name

    if install_path.exists():
        shutil.rmtree(install_path)

    shutil.copytree(temp_output, install_path)
    print(f"  ✓ 已安装到: {install_path}")
    print()

    print("Step 4: 打包为 zip 文件...")
    zip_name = f"{skill_name}-v{__version__}.zip"
    zip_path = SKILLS_DIR / zip_name

    if zip_path.exists():
        os.remove(zip_path)

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(install_path):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, install_path)
                zf.write(file_path, arcname)

    print(f"  ✓ 已打包: {zip_path}")
    print()

    shutil.rmtree(temp_output.parent, ignore_errors=True)

    return {
        "success": True,
        "token_id": token_id,
        "skill_name": skill_name,
        "install_path": str(install_path),
        "zip_path": str(zip_path),
        "message": f"""知识库运营助手创建成功！

=== 分发说明 ===
1. 打包文件: {zip_path}
2. 安装路径: {install_path}
3. 分发方式: 将 zip 文件发送给其他人，解压到 ~/.config/bluecode/skills/ 目录

=== 使用方式 ===
1. 解压 zip 文件到 ~/.config/bluecode/skills/
2. 重启 BlueCode
3. 通过触发词 "{real_kb_name}知识库" 或 "{real_kb_name}运营" 使用
"""
    }


def builder_check_connection() -> Dict[str, Any]:
    """检查 KM-API 连接状态"""
    return verify_connection()


def builder_list_kbs(token: str) -> Dict[str, Any]:
    """
    通过 Token 获取可访问的知识库列表

    Args:
        token: wiki.vivo.xyz 的 accessToken

    Returns:
        {success: True, kbs: [{kb_id, kb_name, permission, link}], count: int}
    """
    from kb_client import KMClient

    client = KMClient()
    result = client.list_kbs()

    if not result.get("success"):
        return {
            "success": False,
            "error": result.get("error", "获取知识库列表失败")
        }

    kbs = result.get("data", [])
    formatted = []
    for kb in kbs:
        formatted.append({
            "kb_id": kb.get("kbId"),
            "kb_name": kb.get("kbName"),
            "permission": kb.get("effectivePermType"),
            "link": kb.get("link")
        })

    return {
        "success": True,
        "kbs": formatted,
        "count": len(formatted)
    }


def builder_quick(kb_name: str, kb_id: int, token: str, owner: str,
                  template: str = "operation") -> Dict[str, Any]:
    """
    快捷创建（简化参数）

    Args:
        kb_name: 知识库名称
        kb_id: 知识库 ID
        token: wiki.vivo.xyz 的 accessToken
        owner: 所有者名称
        template: 模板类型

    Returns:
        创建结果
    """
    return builder_create(kb_name, kb_id, token, owner, template)


def _generate_skill_name(kb_name: str) -> str:
    """生成 Skill 名称（英文，无 ID）"""
    name_lower = kb_name.lower()
    name_slug = re.sub(r'[^a-z0-9]+', '-', name_lower)
    name_slug = name_slug.strip('-')

    if not name_slug:
        name_slug = "knowledge"

    return f"kb-{name_slug}-operation"


def builder_translate_name(kb_name: str, count: int = 3) -> Dict[str, Any]:
    """
    调用大模型翻译知识库名称，生成候选名称

    Args:
        kb_name: 知识库名称（中文）
        count: 返回候选数量（默认3）

    Returns:
        {
            success: True/False,
            candidates: List[str],
            source: str,
            error: str
        }
    """
    return translate_kb_name(kb_name, count)


def builder_validate_kb(token: str, kb_id: int) -> Dict[str, Any]:
    """
    验证 token 是否有权限访问指定知识库

    Args:
        token: wiki.vivo.xyz 的 accessToken
        kb_id: 知识库 ID

    Returns:
        {
            success: True/False,
            authorized: True/False,
            error: str,
            authorized_kbs: List[Dict]
        }
    """
    return validate_kb_id(token, kb_id)


def builder_list_my_kbs(token: str) -> Dict[str, Any]:
    """
    获取 token 可访问的所有知识库

    Args:
        token: wiki.vivo.xyz 的 accessToken

    Returns:
        {
            success: True/False,
            kbs: [{kb_id, kb_name}],
            count: int,
            error: str
        }
    """
    return list_token_kbs(token)


def _ensure_skills_dir():
    """确保 Skills 目录存在"""
    SKILLS_DIR.mkdir(parents=True, exist_ok=True)


if __name__ == "__main__":
    import json

    print("=== km-operation-builder ===")
    print()

    print("KM-API 连接状态:")
    conn = builder_check_connection()
    print(json.dumps(conn, ensure_ascii=False, indent=2))