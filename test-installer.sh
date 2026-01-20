#!/bin/bash

echo "========================================"
echo "NextDo Windows 安装程序测试"
echo "========================================"

cd dist-app

echo ""
echo "1. 检查安装程序文件:"
ls -lh "NextDo Setup 0.0.0.exe"

echo ""
echo "2. 检查文件完整性:"
if [ -f "NextDo Setup 0.0.0.exe" ]; then
    echo "✅ 安装程序文件存在"
    file_size=$(stat -f%z "NextDo Setup 0.0.0.exe" 2>/dev/null || stat -c%s "NextDo Setup 0.0.0.exe" 2>/dev/null)
    echo "文件大小: $(expr $file_size / 1024 / 1024) MB"
else
    echo "❌ 安装程序文件不存在"
    exit 1
fi

echo ""
echo "3. 检查更新配置文件:"
if [ -f "latest.yml" ]; then
    echo "✅ 更新配置文件存在"
    cat latest.yml
else
    echo "❌ 更新配置文件不存在"
fi

echo ""
echo "4. 检查未打包的应用文件:"
if [ -d "win-unpacked" ]; then
    echo "✅ 未打包文件目录存在"
    echo "目录中的文件:"
    ls -1 win-unpacked/ | head -10
    echo "... 共 $(ls win-unpacked/ | wc -l) 个文件"
else
    echo "❌ 未打包文件目录不存在"
fi

echo ""
echo "========================================"
echo "Windows 安装程序已准备好！"
echo "========================================"
echo ""
echo "下一步操作:"
echo "1. 将 NextDo Setup 0.0.0.exe 复制到 Windows 电脑"
echo "2. 双击运行安装程序"
echo "3. 按照安装向导完成安装"
echo ""
echo "如需在其他平台打包，请运行:"
echo "  pnpm run dist:mac    # macOS"
echo "  pnpm run dist:linux  # Linux"
echo ""
