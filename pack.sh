#!/bin/bash

echo "=== NextDo 打包脚本 ==="
echo "请选择打包平台："
echo "1. Windows (exe)"
echo "2. macOS (dmg)"
echo "3. Linux"
echo "4. 所有平台"
echo "5. 仅测试 Electron"

read -p "请输入选项 (1-5): " choice

case $choice in
    1)
        echo "打包 Windows 应用..."
        npm run dist:win
        ;;
    2)
        echo "打包 macOS 应用..."
        npm run dist:mac
        ;;
    3)
        echo "打包 Linux 应用..."
        npm run dist:linux
        ;;
    4)
        echo "打包所有平台..."
        npm run dist
        ;;
    5)
        echo "启动 Electron 测试..."
        npm run electron:dev
        ;;
    *)
        echo "无效选项"
        exit 1
        ;;
esac

echo "打包完成！输出目录: dist-app/"
