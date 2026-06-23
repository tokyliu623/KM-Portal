# -*- coding: utf-8 -*-
"""
test_integration.py - km-operation-builder 集成测试

测试内容：
1. 模块导入测试
2. KM-API 连接测试
3. 名称翻译功能测试（可选）
"""

import sys
import json
from pathlib import Path

current_dir = Path(__file__).parent
project_root = current_dir.parent
runtime_lib_dir = project_root / "runtime_lib"
for p in [str(runtime_lib_dir), str(current_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)


def test_imports():
    """测试所有模块导入"""
    print("\n" + "=" * 50)
    print("测试 1: 模块导入测试")
    print("=" * 50)

    modules = [
        ("kb_config", "配置模块"),
        ("kb_client", "客户端模块"),
        ("kb_probe", "探测模块"),
        ("template_selector", "模板选择器"),
        ("skill_generator", "Skill生成器"),
        ("km_api_setup", "KM-API设置"),
        ("name_translator", "名称翻译器"),
    ]

    results = []
    for module_name, desc in modules:
        try:
            __import__(module_name)
            print(f"  ✓ {module_name} ({desc})")
            results.append((module_name, True, None))
        except Exception as e:
            print(f"  ✗ {module_name} ({desc}): {e}")
            results.append((module_name, False, str(e)))

    try:
        import scripts
        print(f"  ✓ scripts (主模块) v{getattr(scripts, '__version__', 'unknown')}")
        results.append(("scripts", True, None))
    except Exception as e:
        print(f"  ✗ scripts (主模块): {e}")
        results.append(("scripts", False, str(e)))

    all_passed = all(r[1] for r in results)
    print(f"\n结果: {'全部通过' if all_passed else '存在失败'}")
    return {"success": all_passed, "details": results}


def test_connection():
    """测试 KM-API 连接"""
    print("\n" + "=" * 50)
    print("测试 2: KM-API 连接测试")
    print("=" * 50)

    try:
        from km_api_setup import verify_connection
        result = verify_connection()
        print(f"  连接状态: {result.get('connected', False)}")
        print(f"  消息: {result.get('message', 'N/A')}")
        print(f"  完整响应: {json.dumps(result, ensure_ascii=False, indent=4)}")
        return result
    except Exception as e:
        print(f"  ✗ 连接失败: {e}")
        return {"success": False, "error": str(e)}


def test_name_translation():
    """测试名称翻译功能（可选）"""
    print("\n" + "=" * 50)
    print("测试 3: 名称翻译功能测试（可选）")
    print("=" * 50)

    test_names = ["质见未来", "产品知识库", "客服培训"]

    for name in test_names:
        try:
            from name_translator import translate_kb_name
            result = translate_kb_name(name, count=2)
            print(f"\n  输入: {name}")
            if result.get("success"):
                candidates = result.get("candidates", [])
                print(f"  候选: {candidates}")
            else:
                print(f"  失败: {result.get('error', '未知错误')}")
        except Exception as e:
            print(f"  ✗ {name}: {e}")


def run_all_tests():
    """运行所有测试"""
    print("\n" + "#" * 60)
    print("# km-operation-builder 集成测试")
    print("#" * 60)

    results = {}

    results["imports"] = test_imports()
    results["connection"] = test_connection()

    print("\n" + "=" * 50)
    print("测试 4: 名称翻译功能测试（可选）")
    print("=" * 50)
    test_name_translation()

    print("\n" + "#" * 60)
    print("# 测试汇总")
    print("#" * 60)
    print(f"模块导入: {'✓ 通过' if results['imports']['success'] else '✗ 失败'}")
    print(f"KM-API连接: {'✓ 通过' if results['connection'].get('success') else '✗ 失败'}")

    return results


if __name__ == "__main__":
    run_all_tests()