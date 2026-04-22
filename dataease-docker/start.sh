#!/bin/bash
# DataEase v2 本地启动脚本（Mac + Docker Desktop）

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "ℹ️ 未检测到 .env，已根据 .env.example 自动生成本地配置"
  echo ""
fi

echo "🚀 启动 DataEase v2..."
echo "   首次启动需要拉取镜像，约 5~10 分钟（视网络而定）"
echo ""

docker compose up -d

echo ""
echo "⏳ 等待服务就绪..."
echo "   可运行 'docker compose logs -f dataease' 查看启动日志"
echo ""

# 等待 DataEase 健康
for i in $(seq 1 60); do
  if curl -s http://localhost:8100/de2api/health &>/dev/null; then
    echo "✅ DataEase 已就绪！"
    echo ""
    echo "   地址：http://localhost:9080"
    echo "   管理入口会通过 APISIX 转发到 DataEase"
    echo "   若登录异常，请参考 HANDOFF.md 中的 DataEase 排查记录"
    break
  fi
  echo "   等待中... ($i/60)"
  sleep 5
done
