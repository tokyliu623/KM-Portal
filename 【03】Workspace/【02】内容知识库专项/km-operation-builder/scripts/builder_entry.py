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
    1. 验证 kb_id 权限
    2. 上传 Token 到 KM-API
    3. 生成 Skill 项目
    4. 自动安装到 ~/.config/bluecode/skills/
    5. 自动打包为 zip 文件

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
            skill_name: str,         # 如 kb-zhi-jian-wei-lai-operation
            install_path: str,       # 安装路径
            zip_path: str,           # 打包文件路径
            message: str
        }
    """
    print(f"=== 创建知识库运营助手 ===")
    print(f"知识库: {kb_name} (ID: {kb_id})")
    print()

    print("Step 1: 验证 kb_id 权限...")
    validation = validate_kb_id(token, kb_id)
    if not validation.get("success"):
        return {
            "success": False,
            "step": "kb_id_validation",
            "error": validation.get("error", "验证失败")
        }
    if not validation.get("authorized"):
        authorized_kbs = validation.get("authorized_kbs", [])
        kb_list_str = "\n".join([f"  - {kb['kb_id']}: {kb['kb_name']}" for kb in authorized_kbs]) if authorized_kbs else "  (无)"
        return {
            "success": False,
            "step": "kb_id_validation",
            "error": f"Token 无权访问知识库 ID: {kb_id}",
            "authorized_kbs": authorized_kbs,
            "guide": f"请在 wiki.vivo.xyz 开放接口授权中添加该知识库\n\n当前Token已授权的知识库：\n{kb_list_str}"
        }

    print(f"  ✓ Token 有权访问该知识库")
    print()

    print("Step 2: 上传 Token 到 KM-API...")
    upload_result = upload_token(kb_name, kb_id, token, owner, env)
    if not upload_result.get("success"):
        return {
            "success": False,
            "step": "token_upload",
            "error": upload_result.get("error", "Token 上传失败"),
            "guide": "请确保提供的 token 有效且有对应知识库的访问权限"
        }

    real_kb_name = upload_result.get("data", {}).get("kb_name") or kb_name
    print(f"  ✓ Token 已上传")
    print()

    print("Step 3: 生成 Skill 项目...")
    result = generate_skill_name_candidates(real_kb_name, count=1, kb_id=kb_id)
    if result.get("success") and result.get("candidates"):
        skill_name = result["candidates"][0]
    else:
        skill_name = "kb-" + str(kb_id) + "-operation"

    temp_output = project_root / "temp_build" / skill_name

    gen_result = generate_skill(
        kb_name=real_kb_name,
        kb_id=kb_id,
        template=template,
        output_dir=str(temp_output)
    )

    if not gen_result.get("success"):
        return {
            "success": False,
            "step": "skill_generate",
            "error": gen_result.get("error", "Skill 生成失败")
        }

    print(f"  ✓ Skill 项目已生成: {gen_result.get('output_dir')}")
    print()

    print("Step 4: 安装到 BlueCode Skills 目录...")
    install_path = SKILLS_DIR / skill_name

    if install_path.exists():
        shutil.rmtree(install_path)

    shutil.copytree(temp_output, install_path)
    print(f"  ✓ 已安装到: {install_path}")
    print()

    print("Step 5: 打包为 zip 文件...")
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


def builder_translate_name(kb_name: str, count: int = 3, kb_id: int = 0) -> Dict[str, Any]:
    """
    调用大模型翻译知识库名称，生成候选名称

    Args:
        kb_name: 知识库名称（中文）
        count: 返回候选数量（默认3）
        kb_id: 知识库 ID（可选，用于会话复用）

    Returns:
        {
            success: True/False,
            candidates: List[str],
            source: str,
            error: str
        }
    """
    return translate_kb_name(kb_name, count, kb_id)


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


def builder_package(skill_name: str = "km-operation-builder") -> Dict[str, Any]:
    """
    打包 km-operation-builder Skill（无需 token）

    用于将 km-operation-builder 本身打包为 zip 文件，供分发安装。

    流程：
    1. 定位 skill 源码目录
    2. 打包为 zip 文件
    3. 输出安装/分发说明

    Args:
        skill_name: Skill 名称（默认: km-operation-builder）

    Returns:
        {
            success: True/False,
            skill_name: str,
            install_path: str,
            zip_path: str,
            message: str
        }
    """
    import json

    print(f"=== 打包 {skill_name} ===")
    print()

    skill_source = project_root
    if not skill_source.exists():
        return {
            "success": False,
            "error": f"Skill 源码目录不存在: {skill_source}"
        }

    print("Step 1: 打包为 zip 文件...")
    zip_name = f"{skill_name}-v{__version__}.zip"
    zip_path = SKILLS_DIR / zip_name

    if zip_path.exists():
        os.remove(zip_path)

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(skill_source):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, skill_source)
                zf.write(file_path, arcname)

    print(f"  ✓ 已打包: {zip_path}")
    print()

    return {
        "success": True,
        "skill_name": skill_name,
        "zip_path": str(zip_path),
        "message": f"""{skill_name} 打包成功！

=== 分发说明 ===
1. 打包文件: {zip_path}
2. 安装路径: {SKILLS_DIR / skill_name}
3. 分发方式: 将 zip 文件解压到 ~/.config/bluecode/skills/ 目录

=== 使用方式 ===
1. 解压 zip 文件到 ~/.config/bluecode/skills/
2. 重启 BlueCode
3. 通过触发词 "知识库运营"、"KB开发"、"创建KB Skill" 使用
"""
    }


if __name__ == "__main__":
    import json

    args = sys.argv[1:] if len(sys.argv) > 1 else []

    if args and args[0] == "--package":
        result = builder_package()
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print("=== km-operation-builder ===")
        print()
        print("KM-API 连接状态:")
        conn = builder_check_connection()
        print(json.dumps(conn, ensure_ascii=False, indent=2))
        print()
        print("打包命令: python builder_entry.py --package")