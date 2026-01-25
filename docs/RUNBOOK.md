# NextDo 运行手册

## 部署流程

### Web 应用部署

#### 快速部署（使用本地 Web 服务器）
```bash
# 1. 构建生产版本
npm run build

# 2. 使用任意 Web 服务器提供 dist/ 目录内容
# 选项 1: 使用 npx
npx serve dist

# 选项 2: 使用 Python
python -m http.server 8000 --directory dist

# 选项 3: 使用 Node.js http-server
npx http-server dist -p 3000
```

#### 生产部署检查清单

**构建前:**
- [ ] 运行 `npm install` 确保依赖最新
- [ ] 检查 `package.json` 版本号
- [ ] 运行构建命令测试：`npm run build`
- [ ] 检查构建输出是否有警告或错误

**构建后:**
- [ ] 验证 dist/ 目录包含所有必要文件
- [ ] 测试 `npm run preview` 确认应用正常运行
- [ ] 检查 bundle 大小是否合理
- [ ] 验证所有功能正常工作

### 桌面应用部署

#### 构建流程

**Windows 平台:**
```bash
# 完整构建流程
npm run tauri:build:win

# 输出位置
# - 安装包: src-tauri/target/x86_64-pc-windows-msvc/release/bundle/
# - 便携版: src-tauri/target/x86_64-pc-windows-msvc/release/nextdo.exe
```

**macOS 平台:**
```bash
# 完整构建流程
npm run tauri:build:mac

# 输出位置
# src-tauri/target/aarch64-apple-darwin/release/bundle/
```

**Linux 平台:**
```bash
# 完整构建流程
npm run tauri:build:linux

# 输出位置
# src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/
```

#### 发布前检查清单

**通用检查:**
- [ ] 更新版本号（package.json 和 src-tauri/tauri.conf.json）
- [ ] 运行完整构建流程
- [ ] 在干净环境中测试安装包
- [ ] 验证应用图标和元数据正确
- [ ] 检查数字签名（如适用）

**Windows 特别检查:**
- [ ] 验证 WebView2 运行时包含（离线安装包）
- [ ] 测试便携版和安装版两种模式
- [ ] 检查防病毒软件误报

## 监控与告警

### Web 应用监控

由于 NextDo 是本地优先应用，无需传统 Web 监控。但建议：

**性能监控:**
- 浏览器开发者工具 Performance 面板
- Lighthouse 性能评分
- Bundle 分析：`npm run build -- --report`

**错误追踪:**
- 浏览器开发者工具 Console
- 本地测试时查看应用日志

### 桌面应用监控

**Tauri 应用监控:**
- 开发模式：查看终端输出
- 生产模式：检查日志文件位置

**Windows:** `%APPDATA%\\com.nextdo.app\\logs\\`
**macOS:** `~/Library/Application Support/com.nextdo.app/logs/`
**Linux:** `~/.local/share/com.nextdo.app/logs/`

## 常见问题与修复

### 构建问题

#### 问题：模块加载错误
**症状:** `Error: Cannot find module 'xxx'`
**原因:** 依赖未正确安装或版本不兼容

**解决方案:**
```bash
# 1. 清除缓存
npm cache clean --force

# 2. 删除 node_modules
rm -rf node_modules package-lock.json

# 3. 重新安装依赖
npm install
```

#### 问题：Tauri 构建失败
**症状:** Rust 编译错误
**原因:** 依赖不匹配或系统库缺失

**解决方案:**
```bash
# 1. 更新 Rust 工具链
rustup update

# 2. 查看具体错误信息
npm run tauri:build -- --verbose

# 3. 检查系统依赖（特别 Linux）
# Ubuntu/Debian:
sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev

# Fedora:
sudo dnf install gtk3-devel webkit2gtk4.0-devel
```

#### 问题：TypeScript 编译错误
**症状:** 类型检查失败
**原因:** 类型定义不匹配或代码错误

**解决方案:**
```bash
# 检查 TypeScript 错误
npx tsc --noEmit

# 更新类型定义
npm install --save-dev @types/node @types/react @types/react-dom
```

### 运行时问题

#### 问题：IndexedDB 初始化失败
**症状:** 应用启动时白屏，控制台有 IndexedDB 错误
**原因:** 浏览器隐私设置或存储配额已满

**解决方案:**
1. 清除浏览器数据
2. 检查浏览器存储配额
3. 使用隐身模式测试
4. 桌面应用：检查用户数据目录权限

#### 问题：AI 功能无法使用
**症状:** AI 分析或建议功能失败
**原因:** API 配置错误或网络问题

**解决方案:**
1. 检查设置中的 API 配置
2. 验证 API 密钥有效性
3. 检查网络连接
4. 查看控制台网络请求

#### 问题：重复任务不生成
**症状:** 设置了重复规则但新任务不出现
**原因:** 重复规则格式错误或逻辑 Bug

**解决方案:**
1. 检查重复规则格式
2. 查看浏览器控制台错误
3. 导出数据备份后重置规则
4. 检查 `services/recurringService.ts` 逻辑

### 性能问题

#### 问题：应用响应慢
**症状:** 界面卡顿，操作延迟
**原因:** 任务数量过多或渲染性能问题

**解决方案:**
1. 检查任务数量（大量任务需要虚拟化优化）
2. 使用 Chrome DevTools 性能分析
3. 检查是否有内存泄漏
4. 考虑分批加载数据

#### 问题：Bundle 过大
**症状:** 构建文件体积大，加载慢
**原因:** 依赖过多或未优化

**解决方案:**
1. 运行 bundle 分析：`npm run build -- --report`
2. 检查未使用的依赖：`npx depcheck`
3. 优化导入（tree-shaking）
4. 考虑代码分割

## 回滚程序

### Web 应用回滚

#### 快速回滚（如果有版本控制）
```bash
# 1. 切换到上一个稳定版本
git checkout stable-tag

# 2. 重新构建
npm run build

# 3. 部署旧版本
cp -r dist/* /path/to/web/root/
```

#### 数据回滚
由于 NextDo 使用本地存储，回滚数据：
1. 备份当前 IndexedDB 数据
2. 恢复到之前的数据备份
3. 清除浏览器缓存和 Service Worker

### 桌面应用回滚

#### Windows 回滚
1. 卸载当前版本
2. 安装旧版本安装包
3. 如有必要，恢复快照（如使用系统还原）

**便携版回滚:**
```bash
# 1. 重命名旧版本目录
mv nextdo-windows-x64 nextdo-windows-x64-broken

# 2. 解压旧版本
unzip nextdo-windows-x64-old.zip

# 3. 验证数据完整性
# 检查 %APPDATA%/com.nextdo.app/
```

#### macOS 回滚
1. 从 Applications 删除应用
2. 从 Time Machine 恢复旧版本
3. 重新安装旧版本 DMG

#### Linux 回滚
```bash
# 如果是 deb/rpm 包
sudo apt remove nextdo  # 或 rpm -e nextdo
sudo apt install ./nextdo-old-version.deb

# 如果是 AppImage
rm NextDo-x86_64.AppImage
wget https://example.com/NextDo-old-version-x86_64.AppImage
chmod +x NextDo-old-version-x86_64.AppImage
```

### 数据恢复

#### IndexedDB 数据恢复

**Web 应用:**
1. 使用 Dexie 的导出功能备份
2. 恢复数据库文件
3. 重新导入数据

**桌面应用:**
```bash
# Windows
cd %APPDATA%\\com.nextdo.app\\
copy nextdo_db_backup.json nextdo_db.json /Y

# macOS
cd ~/Library/Application\\ Support/com.nextdo.app/
cp nextdo_db_backup.json nextdo_db.json

# Linux
cd ~/.local/share/com.nextdo.app/
cp nextdo_db_backup.json nextdo_db.json
```

## 定期维护任务

### 每周
- [ ] 检查构建过程是否正常
- [ ] 测试主要功能流程
- [ ] 查看死代码分析报告

### 每月
- [ ] 更新依赖到最新版本
- [ ] 运行完整测试套件（手动）
- [ ] 检查安全漏洞：`npm audit`
- [ ] 更新文档

### 每季度
- [ ] 全面代码审查
- [ ] 性能审计
- [ ] 依赖审查和清理
- [ ] 备份策略验证

## 紧急联系和支持

### 内部支持
- 代码仓库: [GitHub Repository]
- 文档位置: `/docs` 目录
- 最近更新: 检查 `git log` 和 `docs/BUG_FIX_LOG.md`

### 故障升级程序

1. **Level 1** - 开发团队内部解决
   - 检查文档
   - 查看日志文件
   - 搜索已知问题

2. **Level 2** - 技术负责人介入
   - 代码审查
   - 架构决策
   - 回滚评估

3. **Level 3** - 外部支持
   - Tauri 社区论坛
   - Vite 支持文档
   - React 官方文档

## 工具和脚本

### 快速诊断脚本

```bash
#!/bin/bash
# health-check.sh - 快速健康检查脚本
echo "=== NextDo Health Check ==="

# 检查 Node.js 版本
echo "Node.js version: $(node --version)"

# 检查 npm 版本
echo "npm version: $(npm --version)"

# 检查构建
if npm run build > /dev/null 2>&1; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
fi

# 检查死代码
echo "Running dead code analysis..."
npx depcheck --json | grep -o '"dependencies":\[.*\]' | tr -d '[]"' | tr ',' '\n' | sed 's/^/  /'
```

### 部署自动化

```bash
#!/bin/bash
# deploy.sh - 简化部署脚本
set -e

echo "Starting deployment..."

# 1. 构建
echo "Building application..."
npm run build

# 2. 测试构建
echo "Running preview test..."
timeout 30 npm run preview &
PREVIEW_PID=$!
sleep 5
curl -f http://localhost:4173 || (kill $PREVIEW_PID && exit 1)
kill $PREVIEW_PID

# 3. 部署
echo "Deploying to production..."
# Add your deployment commands here

echo "Deployment completed successfully!"
```

---

*运行手册由 everything-claude-code:update-docs 技能自动生成*
*最后更新: 2026-01-25*
