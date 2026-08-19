#!/bin/bash
# start-h5.sh - 在 Linux (host2) 上启动 H5 开发服务器
# 阿南 可以通过局域网 IP 访问: http://192.168.1.187:5173
# 注意:需要阿南 的电脑和 host2 在同一个网络

set -e
cd ~/code/practical-calculator

echo "[1/3] 检查 node 版本..."
node --version

echo "[2/3] 安装依赖(如果还没装)..."
if [ ! -d "node_modules" ]; then
  npm install --no-audit --no-fund
fi

echo "[3/3] 启动 H5 开发服务器..."
echo "=========================================="
echo "访问地址: http://localhost:5173"
echo "局域网地址(同一 WiFi): http://192.168.1.187:5173"
echo "按 Ctrl+C 停止"
echo "=========================================="

npm run dev:h5
