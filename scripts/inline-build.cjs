#!/usr/bin/env node
/**
 * Post-build: inline all assets into a single self-contained HTML file.
 * Run after `npm run build`. Outputs dist/NextDo.html
 */
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const htmlFile = path.join(distDir, 'index.prod.html');

// Read the built HTML
let html = fs.readFileSync(htmlFile, 'utf-8');

// Inline CSS
const cssMatches = html.match(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g) || [];
for (const tag of cssMatches) {
  const hrefMatch = tag.match(/href="([^"]+)"/);
  if (!hrefMatch) continue;
  const cssPath = path.join(distDir, hrefMatch[1]);
  if (fs.existsSync(cssPath)) {
    const css = fs.readFileSync(cssPath, 'utf-8');
    html = html.replace(tag, `<style>${css}</style>`);
  }
}

// Inline JS
const jsMatches = html.match(/<script[^>]*src="([^"]+)"[^>]*><\/script>/g) || [];
for (const tag of jsMatches) {
  const srcMatch = tag.match(/src="([^"]+)"/);
  if (!srcMatch) continue;
  const jsPath = path.join(distDir, srcMatch[1]);
  if (fs.existsSync(jsPath)) {
    const js = fs.readFileSync(jsPath, 'utf-8');
    // Strip type="module" and crossorigin for file:// compatibility
    const newTag = tag.replace(/ src="[^"]+"/, '').replace(/ type="module"/, '').replace(/ crossorigin/, '').replace('><', '><') + '\n' + js;
    html = html.replace(tag, newTag);
  }
}

// Write single-file output
const outputPath = path.join(distDir, 'NextDo.html');
fs.writeFileSync(outputPath, html);
console.log(`✅ Single-file build: ${outputPath} (${(fs.statSync(outputPath).size / 1024).toFixed(0)} KB)`);

// Also copy a convenience script
const readme = `# NextDo — 自包含离线版

## 使用方法

方式一（推荐）：
  终端执行: cd "$(dirname "$0")" && python3 -m http.server 8080
  浏览器打开: http://localhost:8080/NextDo.html

方式二：
  双击 NextDo.command（Mac 上直接启动并打开浏览器）

所有依赖（React, Dexie, Tailwind CSS, lucide-icons）已打包在内。
数据存储在浏览器 IndexedDB 中，完全离线可用。Python 3 是 macOS 预装的，无需额外安装。
`;
fs.writeFileSync(path.join(distDir, 'README.txt'), readme);

// Create convenience launcher for Mac
const launcher = `#!/bin/bash
cd "$(dirname "$0")"
open "http://localhost:8080/NextDo.html"
python3 -m http.server 8080
`;
fs.writeFileSync(path.join(distDir, 'NextDo.command'), launcher);
require('fs').chmodSync(path.join(distDir, 'NextDo.command'), 0o755);
console.log('✅ README.txt written');
