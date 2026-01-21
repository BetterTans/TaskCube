#!/bin/bash

echo "=========================================="
echo "NextDo 文件服务器"
echo "=========================================="
echo ""
echo "这个脚本会启动一个简单的 HTTP 服务器，"
echo "让你可以从本地网络访问打包的文件。"
echo ""

# 检查端口是否被占用
PORT=8000
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; do
    echo "端口 $PORT 已被占用，尝试下一个端口..."
    ((PORT++))
done

echo "服务器将在 http://localhost:$PORT 启动"
echo ""
echo "你可以通过以下方式访问："
echo ""
echo "1. 在同一台电脑上:"
echo "   打开浏览器访问 http://localhost:$PORT"
echo ""
echo "2. 在同一网络的其他设备上:"
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "无法获取IP地址")
if [ "$IP" != "无法获取IP地址" ]; then
    echo "   打开浏览器访问 http://$IP:$PORT"
else
    echo "   打开浏览器访问 http://<你的电脑IP>:$PORT"
fi
echo ""
echo "3. 下载安装程序:"
echo "   点击 'dist-app' 文件夹"
echo "   然后点击 'NextDo Setup 0.0.0.exe' 下载"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""
echo "=========================================="
echo "服务器启动中..."
echo "=========================================="
echo ""

# 启动 Python HTTP 服务器
if command -v python3 &> /dev/null; then
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    python -m http.server $PORT
else
    echo "错误：未找到 Python，无法启动 HTTP 服务器"
    echo "请手动复制文件到需要的位置"
    exit 1
fi
