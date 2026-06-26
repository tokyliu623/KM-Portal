# -*- coding: utf-8 -*-
"""
name_translator.py - 名称翻译模块

提供知识库名称的中英翻译和 Skill 名称候选生成功能。
"""

import re
import json
import pypinyin
import threading
import time
from typing import List, Dict, Any, Optional

KM_API_URL = "https://qds-test.vmic.xyz/api/km-api"
SESSION_TIMEOUT_SECONDS = 60 * 60  # 1小时


class TranslationError(Exception):
    """翻译异常"""
    pass


def _http_post(url: str, payload: Dict[str, Any], timeout: int = 30) -> Dict[str, Any]:
    """发送 HTTP POST 请求"""
    import urllib.request

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


class TranslateSession:
    """翻译会话管理（按 kb_id 隔离，支持线程安全）"""

    _sessions: Dict[int, 'TranslateSession'] = {}
    _lock = threading.Lock()
    _cleanup_thread: Optional[threading.Thread] = None
    _running = False

    def __init__(self, kb_id: int, km_api_url: str = KM_API_URL):
        self.kb_id = kb_id
        self.km_api_url = km_api_url
        self.conversation_id: Optional[str] = None
        self.last_used: float = time.time()

    @classmethod
    def get_session(cls, kb_id: int, km_api_url: str = KM_API_URL) -> 'TranslateSession':
        with cls._lock:
            if kb_id not in cls._sessions:
                cls._sessions[kb_id] = TranslateSession(kb_id, km_api_url)
                cls._ensure_cleanup_thread()
            session = cls._sessions[kb_id]
            session.last_used = time.time()
            return session

    @classmethod
    def _ensure_cleanup_thread(cls):
        if cls._cleanup_thread is None or not cls._cleanup_thread.is_alive():
            cls._running = True
            cls._cleanup_thread = threading.Thread(target=cls._cleanup_loop, daemon=True)
            cls._cleanup_thread.start()

    @classmethod
    def _cleanup_loop(cls):
        while cls._running:
            time.sleep(60)
            cls._cleanup_expired()

    @classmethod
    def _cleanup_expired(cls):
        with cls._lock:
            now = time.time()
            expired = [kb_id for kb_id, session in cls._sessions.items()
                      if now - session.last_used > SESSION_TIMEOUT_SECONDS]
            for kb_id in expired:
                del cls._sessions[kb_id]

    @classmethod
    def close_session(cls, kb_id: int):
        with cls._lock:
            if kb_id in cls._sessions:
                cls._sessions[kb_id].conversation_id = None

    def translate(self, prompt: str) -> Dict[str, Any]:
        """执行翻译请求"""
        payload: Dict[str, Any] = {"prompt": prompt, "kb_id": self.kb_id}
        if self.conversation_id:
            payload["conversation_id"] = self.conversation_id

        try:
            result = _http_post(self.km_api_url + "/llm/translate", payload)

            if result.get("success") and result.get("data", {}).get("conversation_id"):
                self.conversation_id = result["data"]["conversation_id"]

            return result
        except Exception as e:
            return {"success": False, "error": str(e)}

    def close(self):
        """关闭会话"""
        self.conversation_id = None


def translate_kb_name_strict(kb_name: str, kb_id: int = 0) -> Dict[str, Any]:
    """
    强制翻译知识库名称（翻译失败时抛出异常）

    Args:
        kb_name: 知识库名称（中文）

    Returns:
        {
            success: True,
            name: str  # 翻译后的英文名称
        }

    Raises:
        TranslationError: 翻译失败时抛出
    """
    prompt = f"""你是一个专业的命名助手。请将以下中文知识库名称翻译成英文，用于生成 BlueCode Skill 名称。

要求：
1. 生成 1 个简洁的英文翻译
2. 名称应该体现知识库的核心主题
3. 只返回英文名称，不要解释

知识库名称：{kb_name}

请以 JSON 格式返回：
{{"name": "英文名称"}}
"""

    try:
        if kb_id:
            session = TranslateSession.get_session(kb_id)
            result = session.translate(prompt)
        else:
            result = _http_post(f"{KM_API_URL}/llm/translate", {"prompt": prompt})

        if result.get("success"):
            raw_text = result.get("data", {}).get("content", "")
            name = _parse_strict_name(raw_text)
            if name:
                return {
                    "success": True,
                    "name": name
                }

        raise TranslationError(f"翻译接口返回异常或未返回有效结果")

    except TranslationError:
        raise
    except Exception as e:
        raise TranslationError(f"翻译失败: {str(e)}")


def _parse_strict_name(raw_text: str) -> Optional[str]:
    """解析严格翻译结果"""
    raw_text = raw_text.strip()

    json_match = re.search(r'\{[^{}]*"name"\s*:\s*"([^"]+)"[^{}]*\}', raw_text, re.DOTALL)
    if json_match:
        return json_match.group(1).strip()

    try:
        data = json.loads(raw_text)
        if data.get("name"):
            return str(data["name"]).strip()
    except json.JSONDecodeError:
        pass

    return None


def translate_kb_name(kb_name: str, count: int = 3, kb_id: int = 0) -> Dict[str, Any]:
    """
    调用大模型翻译知识库名称

    Args:
        kb_name: 知识库名称（中文）
        count: 返回候选数量（默认3）
        kb_id: 知识库ID（用于会话隔离）

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
        if kb_id:
            session = TranslateSession.get_session(kb_id)
            result = session.translate(prompt)
        else:
            result = _http_post(f"{KM_API_URL}/llm/translate", {"prompt": prompt})

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


def generate_skill_name_candidates(kb_name: str, count: int = 3, kb_id: int = 0) -> Dict[str, Any]:
    """
    生成 Skill 名称候选

    Args:
        kb_name: 知识库名称
        count: 候选数量（默认3）
        kb_id: 知识库ID（用于会话隔离）

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
        if kb_id:
            session = TranslateSession.get_session(kb_id)
            result = session.translate(prompt)
        else:
            result = _http_post(f"{KM_API_URL}/llm/translate", {"prompt": prompt})

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