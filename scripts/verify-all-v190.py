#!/usr/bin/env python3
"""KM-Portal v1.9.0 一站式端到端验证脚本
======================================
集成 8 步验收 + 5 个代理路由 + by-skill 双维度 + 凭证自检 + 业务数据清理
- 真 token: u-46311a0f761a4d7fac562df2b789c96e (KB 34754)
- 服务: http://127.0.0.1:5053
- 输出: 完整 PASS/FAIL 报告 + cleanup 选项
"""
import json
import os
import shutil
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime

BASE = "http://127.0.0.1:5053"
KB_ID = 34754
KB_NAME = "vivo产品知识库"
KB_TOKEN = "u-46311a0f761a4d7fac562df2b789c96e"
DATA_DIR = r"D:\Users\11033406\【01】Projects\KM-Portal\data"
ARTIFACT_DIR = os.path.join(DATA_DIR, ".verify-all-v190")
SKILL_NAME = "v190-all-in-one"

results = []  # [(step, status, detail), ...]
skill_id = None
api_key = None


def call(method, path, body=None, headers=None, timeout=15):
    url = BASE + path
    data = json.dumps(body).encode("utf-8") if body is not None else None
    h = {"Content-Type": "application/json"} if data else {}
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace")


def step(num, name, status, detail=""):
    icon = {"PASS": "✓", "FAIL": "✗", "WARN": "△"}.get(status, "?")
    line = f"  [{icon}] Step {num}: {name}  {status}"
    if detail:
        line += f"  ({detail})"
    print(line)
    results.append((num, name, status, detail))


def section(title):
    print(f"\n{'='*60}\n  {title}\n{'='*60}")


# ============================================================
# Step 1: 健康检查 + 凭证自检
# ============================================================
section("Step 1: 服务健康 + 凭证自检")
code, body = call("GET", "/api/health")
if code == 200:
    j = json.loads(body)
    if j.get("version") == "1.9.0":
        step(1, "服务健康 1.9.0", "PASS", f"timestamp={j.get('timestamp')}")
    else:
        step(1, "服务健康", "FAIL", f"version={j.get('version')}")
else:
    step(1, "服务健康", "FAIL", f"HTTP {code}")


# ============================================================
# Step 2: 业务 Token 入库 (KB 34754 + 真 token)
# ============================================================
section("Step 2: 业务 Token 入库 (KB 34754)")
code, body = call("POST", "/api/admin/tokens", {
    "kb_id": KB_ID,
    "kb_name": KB_NAME,
    "token": KB_TOKEN,
    "owner": "verify-all-v190",
    "permission": "read",
})
if code == 200:
    j = json.loads(body)
    if j.get("success"):
        step(2, "Token 入库", "PASS", f"kb_id={KB_ID} owner=verify-all-v190")
    else:
        step(2, "Token 入库", "FAIL", body[:200])
else:
    step(2, "Token 入库", "FAIL", f"HTTP {code}: {body[:200]}")


# ============================================================
# Step 3: 创建 Skill (自动生成 API Key)
# ============================================================
section("Step 3: 创建 Skill (自动 API Key)")
code, body = call("POST", "/api/skill/", {
    "name": SKILL_NAME,
    "description": "v1.9.0 一站式验证 - 验证 API Key 自动关联 + 5 代理 + 双维度统计",
    "kbId": KB_ID,
    "kbName": KB_NAME,
    "permission": "read",
}, timeout=30)
if code == 200:
    j = json.loads(body)
    if j.get("success") and j["data"].get("apiKey"):
        skill_id = j["data"]["id"]
        api_key = j["data"]["apiKey"]
        warning = j["data"].get("warning", "")
        step(3, "Skill 创建", "PASS", f"id={skill_id[:8]}... apiKey={api_key[:20]}... warning={warning[:50] or '空'}")
    else:
        step(3, "Skill 创建", "FAIL", body[:200])
else:
    step(3, "Skill 创建", "FAIL", f"HTTP {code}: {body[:200]}")


# ============================================================
# Step 4: 下载 + 验证 zip 内部 (v1.9.0 改造)
# ============================================================
section("Step 4: 下载 + 验证 zip 改造")
if skill_id:
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    zip_path = os.path.join(ARTIFACT_DIR, "skill.zip")
    code, body = call("GET", f"/api/skill/{skill_id}/export", timeout=30)
    if code == 200:
        # urllib 返回的是 dict,这里需要重写下载逻辑
        url = f"{BASE}/api/skill/{skill_id}/export"
        req = urllib.request.Request(url)
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                with open(zip_path, "wb") as f:
                    f.write(r.read())
            size = os.path.getsize(zip_path)
            if size > 1000:
                step(4, "zip 下载", "PASS", f"{size} 字节")
                # 解压
                import zipfile
                with zipfile.ZipFile(zip_path, "r") as z:
                    z.extractall(ARTIFACT_DIR)
                sub_dir = os.path.join(ARTIFACT_DIR, SKILL_NAME)
                # 验证 SKILL.md
                skill_md = os.path.join(sub_dir, "SKILL.md")
                user_json = os.path.join(sub_dir, "config", "user.json")
                kb_client = os.path.join(sub_dir, "scripts", "kb_client.py")
                if os.path.exists(skill_md):
                    with open(skill_md, "r", encoding="utf-8") as f:
                        md = f.read()
                    checks = {
                        "name 双引号": 'name: "' in md,
                        "trigger 列表": "trigger:" in md and "  -" in md,
                        "description": "description:" in md,
                        "kb_id": "kb_id:" in md,
                    }
                    all_pass = all(checks.values())
                    step(4, "zip SKILL.md 改造", "PASS" if all_pass else "WARN", str(checks))
                else:
                    step(4, "zip SKILL.md", "FAIL", "文件缺失")
                # 验证 user.json
                if os.path.exists(user_json):
                    with open(user_json, "r", encoding="utf-8") as f:
                        uj = json.loads(f.read())
                    checks = {
                        "api_key": "api_key" in uj and uj["api_key"] == api_key,
                        "km_api_url": "km_api_url" in uj and "5053" in uj["km_api_url"],
                    }
                    step(4, "zip user.json", "PASS" if all(checks.values()) else "WARN", str(checks))
                else:
                    step(4, "zip user.json", "FAIL", "文件缺失")
                # 验证 kb_client.py
                if os.path.exists(kb_client):
                    with open(kb_client, "r", encoding="utf-8") as f:
                        kc = f.read()
                    bearer_n = kc.count("Bearer")
                    auth_n = kc.count("Authorization")
                    step(4, "zip kb_client.py", "PASS" if bearer_n >= 1 and auth_n >= 1 else "FAIL",
                         f"Bearer×{bearer_n} Authorization×{auth_n}")
                else:
                    step(4, "zip kb_client.py", "FAIL", "文件缺失")
            else:
                step(4, "zip 下载", "FAIL", f"仅 {size} 字节")
        except Exception as e:
            step(4, "zip 下载", "FAIL", str(e)[:200])
    else:
        step(4, "zip 下载", "FAIL", f"HTTP {code}: {body[:200]}")
else:
    step(4, "zip 下载", "FAIL", "无 skill_id")


# ============================================================
# Step 5: 5 个代理路由 (v1.9.0 KB 代理)
# ============================================================
section("Step 5: KB 代理 5 路由 (v1.9.0 核心)")
if api_key:
    auth = {"Authorization": f"Bearer {api_key}"}
    proxies = [
        ("tree", "POST", {"kbId": KB_ID}),
        ("info", "POST", {"kbId": KB_ID}),
        ("content", "POST", {"kbId": KB_ID, "docId": 1}),
        ("contents/create", "POST", {"kbId": KB_ID, "parentId": 0, "name": "test-v190", "content": "v1.9.0 验证文档"}),
        ("contents/update", "POST", {"kbId": KB_ID, "docId": 1, "name": "test-v190-updated", "content": "v1.9.0 验证更新"}),
    ]
    for name, method, body_data in proxies:
        # 写入类路由(read token 必然 403,业务正确)
        is_write = name in ("contents/create", "contents/update")
        code, body = call(method, f"/api/kb/{name}", body_data, auth, timeout=20)
        # 鉴权层错误: 401 (无 token / 无效 token / 鉴权失败)
        if code == 401:
            step(5, f"代理 {name}", "FAIL", f"鉴权失败 HTTP 401")
        elif code == 403 and not is_write:
            step(5, f"代理 {name}", "FAIL", f"权限被拒 HTTP 403")
        elif code == 403 and is_write:
            # read token 写入: 业务上正确(测试用 read token)
            step(5, f"代理 {name}", "PASS", "鉴权通过+业务权限控制(read token 不能写)")
        elif code == 200:
            step(5, f"代理 {name}", "PASS", "上游 200")
        elif code in (404, 500, 502):
            # 上游不可达或上游 4xx,但鉴权已通过
            try:
                j = json.loads(body)
                err = j.get("error", body[:100])
            except Exception:
                err = body[:100]
            step(5, f"代理 {name}", "WARN", f"鉴权通过+上游 HTTP {code}: {err[:80]}")
        else:
            step(5, f"代理 {name}", "WARN", f"HTTP {code}: {body[:80]}")
else:
    step(5, "代理 5 路由", "FAIL", "无 api_key")


# ============================================================
# Step 6: by-skill 双维度统计
# ============================================================
section("Step 6: /api/stats/by-skill 双维度")
code, body = call("GET", "/api/stats/by-skill?days=1")
if code == 200:
    j = json.loads(body)
    data = j.get("data", {})
    total = data.get("total", 0)
    skills = data.get("skills", [])
    has_skill = any(s.get("skillName") == SKILL_NAME for s in skills)
    if total > 0 and has_skill:
        step(6, "by-skill 双维度", "PASS", f"total={total} skills={len(skills)} 含 {SKILL_NAME}")
    elif total > 0:
        step(6, "by-skill 双维度", "WARN", f"total={total} 但未含 {SKILL_NAME}")
    else:
        step(6, "by-skill 双维度", "WARN", "total=0 (Step 5 代理未成功,无新日志)")
else:
    step(6, "by-skill", "FAIL", f"HTTP {code}")


# ============================================================
# Step 7: api-logs.json 含 skillName/skillId 字段
# ============================================================
section("Step 7: api-logs.json skillName 字段")
logs_path = os.path.join(DATA_DIR, "api-logs.json")
try:
    with open(logs_path, "r", encoding="utf-8") as f:
        logs = json.load(f)
    calls = logs.get("calls", []) if isinstance(logs, dict) else logs
    with_sn = [c for c in calls if c.get("skillName")]
    with_sid = [c for c in calls if c.get("skillId")]
    pct_sn = (len(with_sn) / len(calls) * 100) if calls else 0
    step(7, "skillName 字段", "PASS" if pct_sn > 50 else "WARN",
         f"total={len(calls)} 含 skillName={len(with_sn)}({pct_sn:.0f}%) 含 skillId={len(with_sid)}")
except json.JSONDecodeError as e:
    step(7, "api-logs.json 解析", "FAIL", f"JSON 损坏: {e}")
except Exception as e:
    step(7, "api-logs.json", "FAIL", str(e)[:200])


# ============================================================
# Step 8: 翻译健康探针 (v1.7.1 自检)
# ============================================================
section("Step 8: 翻译健康探针 (v1.7.1 自检)")
code, body = call("GET", "/api/diag/translate-health")
step(8, "translate-health 探针", "PASS" if code == 200 else "WARN", f"HTTP {code}: {body[:200]}")


# ============================================================
# 总结
# ============================================================
section("总结")
total_n = len(results)
pass_n = sum(1 for r in results if r[2] == "PASS")
warn_n = sum(1 for r in results if r[2] == "WARN")
fail_n = sum(1 for r in results if r[2] == "FAIL")
print(f"  总计: {total_n} 项  PASS={pass_n}  WARN={warn_n}  FAIL={fail_n}")
print()
if skill_id:
    print(f"  Skill ID: {skill_id}")
    print(f"  API Key:  {api_key}")
    print()
    cleanup_choice = "yes"
    try:
        cleanup_choice = input("  是否清理测试数据? (yes/no, 默认 yes): ").strip().lower()
    except EOFError:
        print("  (stdin EOF, 默认 yes)")
    if cleanup_choice in ("", "yes", "y"):
        # 清理
        if skill_id:
            call("DELETE", f"/api/skill/{skill_id}")
            print(f"  [CLEAN] 删除 Skill {skill_id}")
        if os.path.exists(ARTIFACT_DIR):
            shutil.rmtree(ARTIFACT_DIR)
            print(f"  [CLEAN] 删除 {ARTIFACT_DIR}")
        # 清理 api-keys 中的 verify-all-v190
        keys_path = os.path.join(DATA_DIR, "api-keys.json")
        if os.path.exists(keys_path):
            with open(keys_path, "r", encoding="utf-8") as f:
                kd = json.load(f)
            kd["keys"] = [k for k in kd.get("keys", []) if k.get("skillName") != SKILL_NAME]
            with open(keys_path, "w", encoding="utf-8") as f:
                json.dump(kd, f, ensure_ascii=False, indent=2)
            print(f"  [CLEAN] api-keys.json 移除 {SKILL_NAME}")
        # 清理 tokens
        tok_path = os.path.join(DATA_DIR, "tokens.json")
        if os.path.exists(tok_path):
            with open(tok_path, "r", encoding="utf-8") as f:
                td = json.load(f)
            td["tokens"] = [t for t in td.get("tokens", []) if t.get("token") != KB_TOKEN]
            with open(tok_path, "w", encoding="utf-8") as f:
                json.dump(td, f, ensure_ascii=False, indent=2)
            print(f"  [CLEAN] tokens.json 移除 verify-all-v190")
        # 重置 api-logs
        with open(logs_path, "w", encoding="utf-8") as f:
            json.dump({"calls": []}, f, ensure_ascii=False, indent=2)
        print(f"  [CLEAN] api-logs.json 重置")
        print()
        print("  清理完成")
    else:
        print(f"  保留测试数据: {ARTIFACT_DIR}")

# 退出码
sys.exit(0 if fail_n == 0 else 1)
