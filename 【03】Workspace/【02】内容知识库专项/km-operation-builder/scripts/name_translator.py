# -*- coding: utf-8 -*-
"""
name_translator.py - 名称翻译模块

提供知识库名称的中英翻译和 Skill 名称候选生成功能。
"""

import re
import json
import pypinyin
from typing import List, Dict, Any, Optional

KM_API_URL = "https://qds-test.vmic.xyz/api/km-api"


def translate_kb_name(kb_name: str, count: int = 3) -> Dict[str, Any]:
    """
    调用大模型翻译知识库名称

    Args:
        kb_name: 知识库名称（中文）
        count: 返回候选数量（默认3）

    Returns:
        {
            success: True/False,
            candidates: List[str],  # 翻译结果列表
            source: str,            # "api" 或 "fallback"
            error: str              # 失败时返回
        }
    """
    prompt = f"""你是一个专业的命名助手。请将以下中文知识库名称翻译成英文，用于生成 BlueCode Skill 名称。

要求：
1. 生成 {count} 个不同的英文翻译候选
2. 每个名称应该是简洁的英文词组（2-4个单词）
3. 名称应该体现知识库的核心主题
4. 只返回英文名称，不要解释

知识库名称：{kb_name}

请以 JSON 格式返回，格式如下：
{{"candidates": ["名称1", "名称2", "名称3"]}}
"""

    try:
        import urllib.request
        import urllib.parse

        url = f"{KM_API_URL}/llm/translate"
        data = json.dumps({"prompt": prompt}).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode("utf-8"))

        if result.get("success"):
            raw_text = result.get("data", {}).get("content", "")
            candidates = _parse_candidates(raw_text)
            if candidates:
                return {
                    "success": True,
                    "candidates": candidates[:count],
                    "source": "api"
                }

        return {
            "success": False,
            "error": result.get("error", "翻译接口返回异常"),
            "candidates": _generate_fallback_names(kb_name, count),
            "source": "fallback"
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "candidates": _generate_fallback_names(kb_name, count),
            "source": "fallback"
        }


def generate_skill_name_candidates(kb_name: str, count: int = 3) -> Dict[str, Any]:
    """
    生成 Skill 名称候选

    Args:
        kb_name: 知识库名称
        count: 候选数量（默认3）

    Returns:
        {
            success: True/False,
            candidates: List[str],  # Skill 名称列表
            source: str
        }
    """
    prompt = f"""你是一个 BlueCode Skill 命名专家。请为以下知识库生成 {count} 个英文 Skill 名称候选。

要求：
1. 名称格式：kb-{{英文名}}-operation
2. 英文名使用 kebab-case（连字符分隔）
3. 每个候选应该是独特的
4. 只返回名称列表

知识库名称：{kb_name}

请以 JSON 格式返回：
{{"candidates": ["kb-name1-operation", "kb-name2-operation", "kb-name3-operation"]}}
"""

    try:
        import urllib.request

        url = f"{KM_API_URL}/llm/translate"
        data = json.dumps({"prompt": prompt}).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode("utf-8"))

        if result.get("success"):
            raw_text = result.get("data", {}).get("content", "")
            candidates = _parse_candidates(raw_text)
            if candidates:
                normalized = [_normalize_name(c) for c in candidates]
                return {
                    "success": True,
                    "candidates": normalized[:count],
                    "source": "api"
                }

        return _generate_fallback_skill_names(kb_name, count)

    except Exception as e:
        return _generate_fallback_skill_names(kb_name, count)


def _parse_candidates(raw_text: str) -> List[str]:
    """
    解析大模型返回结果

    Args:
        raw_text: 大模型返回的原始文本

    Returns:
        解析出的候选名称列表
    """
    raw_text = raw_text.strip()

    json_match = re.search(r'\{[^{}]*"candidates"\s*:\s*\[[^\]]+\][^{}]*\}', raw_text, re.DOTALL)
    if json_match:
        try:
            data = json.loads(json_match.group())
            if isinstance(data.get("candidates"), list):
                return [str(c).strip() for c in data["candidates"] if c]
        except json.JSONDecodeError:
            pass

    try:
        data = json.loads(raw_text)
        if isinstance(data.get("candidates"), list):
            return [str(c).strip() for c in data["candidates"] if c]
    except json.JSONDecodeError:
        pass

    lines = raw_text.split('\n')
    candidates = []
    for line in lines:
        line = line.strip()
        line = re.sub(r'^[-*\d.)\s]+', '', line)
        line = re.sub(r'^["\']|["\']$', '', line)
        if line and len(line) > 1:
            candidates.append(line)

    return candidates


def _normalize_name(name: str) -> str:
    """
    规范化名称

    Args:
        name: 原始名称

    Returns:
        规范化后的名称
    """
    name = name.strip()

    name = re.sub(r'^["\']|["\']$', '', name)

    name = re.sub(r'^kb[-_]', '', name, flags=re.IGNORECASE)
    name = re.sub(r'[-_]operation$', '', name, flags=re.IGNORECASE)

    name = name.lower()
    name = re.sub(r'[^a-z0-9]+', '-', name)
    name = re.sub(r'^-+|-+$', '', name)

    if not name:
        name = "knowledge"

    return f"kb-{name}-operation"


def _generate_fallback_names(kb_name: str, count: int) -> List[str]:
    """
    生成备用翻译方案（拼音）

    Args:
        kb_name: 知识库名称
        count: 候选数量

    Returns:
        拼音候选列表
    """
    pinyins = pypinyin.lazy_pinyin(kb_name)

    candidates = []

    full_pinyin = ''.join(pinyins)
    candidates.append(full_pinyin.title())

    if len(pinyins) >= 2:
        candidates.append(f"{pinyins[0].title()} {pinyins[-1].title()}")

    if len(pinyins) >= 3:
        candidates.append(''.join(pinyins[:3]).title())

    while len(candidates) < count:
        idx = len(candidates)
        candidates.append(f"{full_pinyin}-{idx}")

    return candidates[:count]


def _generate_fallback_skill_names(kb_name: str, count: int) -> Dict[str, Any]:
    """
    生成备用 Skill 名称

    Args:
        kb_name: 知识库名称
        count: 候选数量

    Returns:
        包含 fallback 候选的结果
    """
    fallback_names = _generate_fallback_names(kb_name, count)
    candidates = [f"kb-{name.lower().replace(' ', '-')}-operation" for name in fallback_names]

    return {
        "success": False,
        "error": "调用翻译接口失败，使用拼音备用方案",
        "candidates": candidates,
        "source": "fallback"
    }