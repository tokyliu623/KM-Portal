#!/usr/bin/env python3
"""v1.9.0 执行引擎：带心跳+即时报告+失败即停+主动根因分析

用法：
  python scripts/run-with-heartbeat.py "<step_name>" <timeout_sec> -- <command> [args...]

特性：
  - 后台启动子进程
  - 每 5s 输出一次心跳（仍在跑 + 已用时间 + 进程 PID）
  - 命令结束立即报告：exit code / 耗时 / stdout tail / stderr tail
  - 退出码 != 0 时进入"主动根因分析"模式（grep 关键词，定位失败原因）
  - stdout 实时 streaming，不缓冲
"""
import subprocess
import sys
import time
import threading
import os
import re
from datetime import datetime

# 失败分析关键词映射
FAIL_KEYWORDS = {
    r"cannot find module .*?'(.+?)'": "模块未找到: \\1（检查 import path）",
    r"error: (.+?)(\n|\r)": "报错: \\1",
    r"EADDRINUSE": "端口被占用（用 lsof / netstat 查占用）",
    r"permission denied": "权限不足（chmod / chown）",
    r"no such file or directory": "路径不存在（检查 pwd / path）",
    r"ECONNREFUSED": "连接被拒（检查服务是否启动）",
    r"timeout|timed out": "超时（检查网络/上游）",
    r"json.*?error|json\.decoder": "JSON 损坏（检查文件格式）",
    r"tsc.*?error": "TypeScript 编译错误（看 stack trace）",
    r"eslint": "ESLint 报错（看 rule）",
    r"vitest.*?fail": "vitest 测试失败（看 FAIL 行）",
}


def stream_output(stream, prefix, output_buf):
    """实时读子进程输出，避免缓冲"""
    for line in iter(stream.readline, b""):
        try:
            decoded = line.decode("utf-8", errors="replace").rstrip()
        except Exception:
            decoded = str(line)
        print(f"  [{prefix}] {decoded}", flush=True)
        output_buf.append(decoded)
    stream.close()


def analyze_failure(stdout_buf, stderr_buf, exit_code):
    """主动根因分析 - 失败时调用"""
    print(f"\n{'!'*60}")
    print(f"  ✗ 失败主动根因分析（exit code = {exit_code}）")
    print(f"{'!'*60}")
    combined = "\n".join(stdout_buf + stderr_buf)
    found = False
    for pattern, hint in FAIL_KEYWORDS.items():
        m = re.search(pattern, combined)
        if m:
            print(f"  → 命中模式 [{pattern}]")
            print(f"  → 建议: {hint.format(*m.groups()) if m.groups() else hint}")
            found = True
    if not found:
        print(f"  → 未命中已知模式，输出末尾 30 行人工诊断:")
        tail = (stdout_buf + stderr_buf)[-30:]
        for line in tail:
            print(f"      {line}")
    print(f"{'!'*60}\n")


def main():
    if len(sys.argv) < 4 or sys.argv[3] != "--":
        print("用法: python run-with-heartbeat.py <step_name> <timeout_sec> -- <cmd> [args...]")
        sys.exit(2)

    step_name = sys.argv[1]
    timeout_sec = int(sys.argv[2])
    cmd = sys.argv[4:]

    print(f"\n{'='*60}")
    print(f"  ▶ 启动: {step_name}")
    print(f"  ▶ 命令: {' '.join(cmd)}")
    print(f"  ▶ 超时: {timeout_sec}s  起始: {datetime.now().strftime('%H:%M:%S')}")
    print(f"{'='*60}", flush=True)

    # Windows 启动参数
    kwargs = {
        "stdout": subprocess.PIPE,
        "stderr": subprocess.PIPE,
        "bufsize": 0,  # unbuffered
        "shell": True,  # Windows 上需要 shell=True 才能跑 .cmd / npm
    }
    if os.name == "nt":
        kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW

    # shell=True 时命令必须是字符串
    if kwargs["shell"]:
        cmd = " ".join(f'"{a}"' if " " in a else a for a in cmd)

    start = time.time()
    try:
        proc = subprocess.Popen(cmd, **kwargs)
    except FileNotFoundError as e:
        print(f"  ✗ 命令未找到: {e}")
        sys.exit(127)

    stdout_buf = []
    stderr_buf = []
    t_out = threading.Thread(target=stream_output, args=(proc.stdout, "out", stdout_buf), daemon=True)
    t_err = threading.Thread(target=stream_output, args=(proc.stderr, "err", stderr_buf), daemon=True)
    t_out.start()
    t_err.start()

    # 心跳循环
    last_heartbeat = 0
    while proc.poll() is None:
        time.sleep(1)
        elapsed = int(time.time() - start)
        if elapsed - last_heartbeat >= 5:
            last_heartbeat = elapsed
            print(f"  ♥ 心跳 [{step_name}] 已用 {elapsed}s PID={proc.pid} 仍在运行...", flush=True)
        if elapsed >= timeout_sec:
            print(f"  ✗ 超时 {timeout_sec}s, 强制终止进程 {proc.pid}", flush=True)
            proc.kill()
            proc.wait()
            analyze_failure(stdout_buf, stderr_buf, -1)
            sys.exit(124)

    # 进程结束
    exit_code = proc.returncode
    t_out.join(timeout=2)
    t_err.join(timeout=2)
    elapsed = int(time.time() - start)

    print(f"\n{'='*60}")
    if exit_code == 0:
        print(f"  ✓ 完成: {step_name}  exit=0  用时 {elapsed}s")
    else:
        print(f"  ✗ 失败: {step_name}  exit={exit_code}  用时 {elapsed}s")
    print(f"{'='*60}\n", flush=True)

    if exit_code != 0:
        analyze_failure(stdout_buf, stderr_buf, exit_code)
        sys.exit(exit_code)


if __name__ == "__main__":
    main()
