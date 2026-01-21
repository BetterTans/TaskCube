#!/bin/bash

set -e

echo "=========================================="
echo "GitHub 推送助手"
echo "=========================================="
echo ""
echo "这个脚本将帮助你："
echo "1. 配置 GitHub 认证"
echo "2. 推送代码到 GitHub"
echo ""

# 检测操作系统
OS="$(uname)"
case $OS in
    'Linux')
        OS='Linux'
        ;;
    'Darwin')
        OS='macOS'
        ;;
    *)
        OS='Unknown'
        ;;
esac

echo "检测到系统: $OS"
echo ""

# 方法选择
echo "请选择认证方式："
echo "1) GitHub CLI (推荐) - 最安全和方便"
echo "2) Personal Access Token (PAT) - 适用于 HTTPS"
echo "3) SSH 密钥 - 免密推送"
echo "4) 取消"
echo ""
read -p "请输入选项 (1-4): " choice

case $choice in
    1)
        echo ""
        echo "安装 GitHub CLI..."
        if [ "$OS" = "macOS" ]; then
            if command -v brew &> /dev/null; then
                brew install gh
            else
                echo "错误：未找到 Homebrew，请手动安装 GitHub CLI:"
                echo "访问: https://cli.github.com/"
                exit 1
            fi
        elif [ "$OS" = "Linux" ]; then
            echo "请根据你的 Linux 发行版安装 GitHub CLI:"
            echo "访问: https://github.com/cli/cli#installation"
            exit 1
        fi

        echo ""
        echo "请完成 GitHub CLI 认证..."
        gh auth login

        echo ""
        echo "开始推送代码..."
        git push -u origin dev-win
        ;;

    2)
        echo ""
        echo "Personal Access Token 方式"
        echo ""
        echo "步骤 1: 创建 Personal Access Token"
        echo "1. 访问 https://github.com/settings/tokens"
        echo "2. 点击 'Generate new token' → 'Generate new token (classic)'"
        echo "3. 设置名称和权限"
        echo "   - 勾选 'repo' (Full control of private repositories)"
        echo "   - 勾选 'write:packages' (Upload packages)"
        echo "4. 点击 'Generate token'"
        echo "5. 复制生成的 token (只显示一次)"
        echo ""

        read -p "你有 GitHub Personal Access Token 吗? (y/n): " has_token

        if [ "$has_token" = "y" ] || [ "$has_token" = "Y" ]; then
            echo ""
            read -p "请输入你的 GitHub 用户名: " username
            read -s -p "请输入你的 Personal Access Token: " token
            echo ""

            # 临时使用 token 推送
            echo ""
            echo "正在推送代码..."
            git remote set-url origin https://${username}:${token}@github.com/BetterTans/TaskCube.git
            git push -u origin dev-win

            echo ""
            echo "✅ 推送成功！"

            # 询问是否保存凭据
            read -p "是否要保存凭据以便下次免密推送? (y/n): " save_creds
            if [ "$save_creds" = "y" ] || [ "$save_creds" = "Y" ]; then
                if [ "$OS" = "macOS" ]; then
                    git config --global credential.helper osxkeychain
                elif [ "$OS" = "Linux" ]; then
                    git config --global credential.helper store
                fi
                echo "✅ 凭据已保存"
            else
                # 移除 token 从 remote URL
                git remote set-url origin https://github.com/BetterTans/TaskCube.git
            fi
        else
            echo ""
            echo "请先到 https://github.com/settings/tokens 创建 Personal Access Token"
            echo "然后重新运行此脚本"
            exit 1
        fi
        ;;

    3)
        echo ""
        echo "SSH 密钥方式"
        echo ""

        if [ -f ~/.ssh/id_rsa.pub ]; then
            echo "找到现有的 SSH 公钥："
            cat ~/.ssh/id_rsa.pub
            echo ""
            read -p "是否将此密钥添加到 GitHub? (y/n): " add_key

            if [ "$add_key" = "y" ] || [ "$add_key" = "Y" ]; then
                echo ""
                echo "请手动将此公钥添加到 GitHub:"
                echo "1. 访问 https://github.com/settings/keys"
                echo "2. 点击 'New SSH key'"
                echo "3. 粘贴上面的公钥内容"
                echo ""
                read -p "添加完成后按回车继续..."
            fi
        else
            echo "未找到 SSH 密钥，创建新的密钥对..."
            read -p "请输入你的邮箱地址: " email
            ssh-keygen -t ed25519 -C "$email" -f ~/.ssh/id_rsa

            echo ""
            echo "SSH 公钥已创建："
            cat ~/.ssh/id_rsa.pub
            echo ""
            echo "请将此公钥添加到 GitHub:"
            echo "1. 访问 https://github.com/settings/keys"
            echo "2. 点击 'New SSH key'"
            echo "3. 粘贴上面的公钥内容"
            echo ""
            read -p "添加完成后按回车继续..."
        fi

        echo ""
        echo "测试 SSH 连接..."
        ssh -T git@github.com

        echo ""
        echo "切换到 SSH 远程地址..."
        git remote set-url origin git@github.com:BetterTans/TaskCube.git

        echo ""
        echo "开始推送代码..."
        git push -u origin dev-win
        ;;

    4)
        echo "操作已取消"
        exit 0
        ;;

    *)
        echo "无效选项"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "✅ 推送完成！"
echo "=========================================="
echo ""
echo "你可以访问以下链接查看："
echo "https://github.com/BetterTans/TaskCube/tree/dev-win"
echo ""
echo "包含的文件："
echo "- dist-app/NextDo Setup 0.0.0.exe (97MB Windows 安装程序)"
echo "- 完整的打包文档和配置"
echo ""
