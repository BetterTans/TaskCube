# 推送代码到 GitHub 的三种方法

## 方法一：使用 GitHub CLI（推荐）

### 第 1 步：安装 GitHub CLI
```bash
# macOS
brew install gh

# 安装完成后运行
gh auth login
```

### 第 2 步：认证并推送
```bash
# 按照交互式提示完成认证
gh auth login

# 然后推送
git push -u origin dev-win
```

---

## 方法二：使用 HTTPS + 个人访问令牌（PAT）

### 第 1 步：创建个人访问令牌

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 设置令牌名称（如：Push to TaskCube）
4. 选择有效期（推荐 90 天）
5. 勾选以下权限：
   - `repo` - Full control of private repositories
   - `write:packages` - Upload packages
6. 点击 "Generate token"
7. **立即复制生成的 token**（只显示一次）

### 第 2 步：配置 Git 使用令牌

```bash
# 方法 A：在推送时输入令牌作为密码
git push -u origin dev-win
# 用户名：你的 GitHub 用户名
# 密码：粘贴刚才生成的 token

# 方法 B：配置远程 URL 包含令牌
# 注意：这样会在本地存储令牌，其他人可以看到
git remote set-url origin https://YOUR_TOKEN@github.com/BetterTans/TaskCube.git
git push -u origin dev-win
```

### 第 3 步：保存令牌凭据（可选）

如果你不想每次输入 token，可以配置凭据助手：

```bash
# macOS（使用 Keychain）
git config --global credential.helper osxkeychain

# Windows
git config --global credential.helper manager

# Linux
git config --global credential.helper store
```

---

## 方法三：使用 SSH 密钥

### 第 1 步：检查是否已有 SSH 密钥

```bash
ls -la ~/.ssh/id_rsa.pub
```

如果文件不存在，需要创建新的 SSH 密钥。

### 第 2 步：创建 SSH 密钥（如果需要）

```bash
ssh-keygen -t ed25519 -C "your_email@example.com" -f ~/.ssh/id_rsa
```

### 第 3 步：添加 SSH 密钥到 GitHub

```bash
# 复制公钥内容
cat ~/.ssh/id_rsa.pub

# 然后访问 https://github.com/settings/keys
# 点击 "New SSH key"
# 粘贴公钥内容
```

### 第 4 步：测试 SSH 连接

```bash
ssh -T git@github.com
```

你应该看到：
```
Hi username! You've successfully authenticated...
```

### 第 5 步：切换到 SSH 远程并推送

```bash
# 切换到 SSH URL
git remote set-url origin git@github.com:BetterTans/TaskCube.git

# 推送代码
git push -u origin dev-win
```

---

## 验证推送结果

推送成功后，访问：
https://github.com/BetterTans/TaskCube/tree/dev-win

你应该能看到打包好的文件在 `dist-app/` 目录中。

---

## 常见问题

### Q: 推送时提示 "Authentication failed"
A: 你的 token 可能已过期或没有正确的权限。创建新的 Personal Access Token。

### Q: 推送时提示 "Permission denied (publickey)"
A: SSH 密钥未正确配置。检查密钥是否已添加到 GitHub。

### Q: 推送大文件时提示 "LFS upload failed"
A: Git LFS 需要单独的认证。确保已运行 `git lfs install`。

### Q: 不想每次都输入密码
A: 配置凭据助手：
```bash
git config --global credential.helper osxkeychain  # macOS
git config --global credential.helper manager      # Windows
```

---

## 快速开始

### 推荐步骤（2 分钟）：

1. **安装 GitHub CLI**
   ```bash
   brew install gh
   ```

2. **登录并推送**
   ```bash
   gh auth login
   git push -u origin dev-win
   ```

3. **完成！** 访问 GitHub 查看推送结果

---

如果你需要帮助完成推送，请告诉我：
- 你是否有 GitHub 账号？
- 你是否已经安装了 GitHub CLI？
- 你更倾向于使用哪种认证方式？
