# TaskCube 桌面端打包指南 (Electron)

本文档说明如何将 **零构建 (Zero-Build)** 的 TaskCube 网页应用打包为 Windows (.exe) 和 macOS (.dmg) 桌面应用程序。

通过 Electron 打包，应用将拥有独立的数据存储环境，不受浏览器缓存清理策略的影响，从而实现**数据持久化**。

## 核心原理

Electron 本质上是一个包含了 Chromium 浏览器和 Node.js 的运行时。它可以直接加载一个 `index.html` 文件并将其作为原生应用运行。由于我们的应用是零构建的，打包过程非常直接：我们只需将所有源文件（HTML, TSX, TS 等）告诉 Electron 打包器即可。

## 实施步骤

### 1. 准备工作

在项目根目录下，运行以下命令安装 Electron 核心及其打包工具：

```bash
npm install --save-dev electron electron-builder
```

### 2. 创建主进程文件

在项目根目录创建一个名为 `electron-main.js` 的文件，内容如下：

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      // 安全性考虑：保持默认值
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "TaskCube",
    autoHideMenuBar: true, // Windows 下自动隐藏菜单栏
  });

  // 直接加载项目根目录的 index.html
  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
```

### 3. 修改 package.json 配置

如果你的项目还没有 `package.json` 文件，请运行 `npm init -y` 来创建一个。然后，添加或修改以下字段：

1.  **设置主进程入口**：
    ```json
    {
      "main": "electron-main.js",
      ...
    }
    ```

2.  **添加打包脚本 (`scripts`)**：
    ```json
    "scripts": {
      "electron:start": "electron .",
      "dist": "electron-builder"
    }
    ```

3.  **添加构建配置 (`build`)**：
    在 `package.json` 的顶层添加 `build` 字段。**这是最关键的一步**，因为它告诉 `electron-builder` 需要包含哪些源文件。
    ```json
    "build": {
      "appId": "com.yourname.taskcube",
      "productName": "TaskCube",
      "files": [
        "**/*",
        "!node_modules/**/*" 
      ],
      "directories": {
        "output": "dist"
      },
      "win": {
        "target": "nsis"
      },
      "mac": {
        "target": "dmg"
      }
    }
    ```
    > `files: ["**/*", "!node_modules/**/*"]` 意味着“包含所有文件，除了 `node_modules` 文件夹”。

### 4. 执行打包

完成上述配置后，运行以下命令即可生成安装包：

```bash
npm run dist
```
打包成功后，你会在项目根目录下的 `dist` 文件夹中找到对应的安装文件（`.exe` 或 `.dmg`）。

---

## 数据存储位置说明

打包后的应用会自动将 IndexedDB 数据存储在系统的标准应用数据目录下，完全独立于浏览器。

具体路径如下（假设应用名为 TaskCube）：

*   **Windows**: `C:\Users\<用户名>\AppData\Roaming\TaskCube\IndexedDB`
*   **macOS**: `/Users/<用户名>/Library/Application Support/TaskCube/IndexedDB`
*   **Linux**: `~/.config/TaskCube/IndexedDB`

只要用户不重装操作系统或手动进入上述目录删除文件，**数据将永久存在**。即使你发布了新版本的安装包，只要 `appId` 保持不变，新版软件安装后依然能自动读取到旧版的数据。