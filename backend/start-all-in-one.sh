#!/bin/sh
# 单容器启动：API 与 Worker 跑在同一个容器里。
#
# 免费 PaaS 基本不提供常驻 Background Worker，而解析任务必须有人一直领；
# 这里让同一个镜像同时起两个入口，对外只暴露 API 一个端口。
# 需要拆开跑时（docker compose / Northflank）照旧各起各的，不受影响。
set -eu

: "${PORT:=8000}"
export PORT

# 先起 worker：它启动时会跑迁移；advisory lock 保证与 API 并发启动也不会撞车。
python -m app.workers.runner &
worker_pid=$!

uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --proxy-headers &
api_pid=$!

# 平台发 SIGTERM 时两个子进程一起收，别让 worker 变成孤儿继续占着数据库连接。
trap 'kill -TERM "$api_pid" "$worker_pid" 2>/dev/null || true' TERM INT

# API 是前台进程：它挂了（或收到信号退出）就收掉 worker 一起退出，
# 让平台把整个容器重启，而不是留下一个没人管的 worker 继续跑。
# 退出码要透传：API 崩溃（如数据库连不上）时以非零退出，平台才会重启；
# 如果这里固定返回 0，平台会当成「正常结束」，可能不再拉起。
api_status=0
wait "$api_pid" || api_status=$?
kill -TERM "$worker_pid" 2>/dev/null || true
wait "$worker_pid" || true
exit "$api_status"
