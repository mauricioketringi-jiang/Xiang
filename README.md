# 声音反射训练 · 阶段 D（28 关完整项目）

以阶段 C 为基线，仅新增 **阶段 D 自动磨耳朵连播**，保留原 A/B/C 训练界面、28 关、116 条原词库与 114 条阶段 C 新题。

## 源码说明

- `index.html` — 全部原有应用 + 阶段 D 播放器、界面和事件。
- `stage-c-data.js` — **原阶段 C 独立题库**；与 `index.html` 同级，未改动原有内容。
- `sw.js` — PWA 离线缓存，已更新缓存版本避免加载阶段 C 旧文件。
- `manifest.webmanifest`、`icons/` — PWA 描述与图标。
- `单文件网页版.html` — 内嵌独立题库和完整前端逻辑；无需其他文件即可打开/作为单页面部署，不提供离线 PWA 安装能力。
- `tests/test_stage_d.py` — 阶段 D 浏览器回归测试。
- `代码差异_阶段D.patch` — 标注阶段 C → 阶段 D 的修改。

## 部署（GitHub Pages）

1. 将 `index.html`、`stage-c-data.js`、`sw.js`、`manifest.webmanifest`、`icons/` 上传至 GitHub 仓库的发布目录（保持目录层级）。
2. 仓库 Settings → Pages → Build and deployment → Deploy from a branch → 选择 main 与 /(root)，保存。
3. 用 Pages 提供的公开网址访问；替换旧版时强制刷新或关闭已安装 PWA 后重启，以加载新 service worker。
4. 若只想上传一个文件，可把 `单文件网页版.html` **重命名为 `index.html`** 上传为唯一页面文件。但这种单文件部署不具备正式的离线 PWA 缓存与图标文件。

## 阶段 D 行为

- 关卡准备页的主按钮下新增「🎧 自动磨耳朵连播（免手按）」；适用于当前课程队列的 10/20/30 道题。
- 一题读两遍；两遍音频真实 `onend` 间隔 **600ms**；第二遍结束后 **1500ms** 盲听回想；显示标准答案/英文原文/中文含义 **1200ms**；下一题自动播放；队列结束从头无限循环。
- 页面下方只有「⏹ 停止磨耳朵」按钮；无输入键盘、录音、成绩或统计写入。
- 前台可申请 `navigator.wakeLock` 保持屏幕唤醒，权限拒绝/浏览器不支持时忽略；这是尽力而为，不保证 iPhone 后台/锁屏播放。
- 切后台/来电/语音中断/语音超时时暂停并清理 TTS、音效及所有计时器；恢复前台重新播报**当前题的第一遍**，如浏览器拒绝自动播放，手点卡片内「▶ 点击恢复播放」。绝不使用 watchdog 假造音频播完。
- 保留第 19 关的口音随机逻辑和第 20 关的背景环境音（音频实际取决于系统语音能力）。
- `localStorage` / IndexedDB 的训练记录读取与保存保持阶段 C 的实现，磨耳朵模式本身不计入作答和训练时长。

## 本地验证

`python -m http.server 8000`，浏览器打开 http://localhost:8000/ 。如安装 Playwright、Chromium，运行：

```sh
python tests/test_stage_d.py
python tests/test_stage_c.py
```

## 限制

已在 Chromium 的 iPhone 宽度模拟环境验证事件与布局，不等同于真 iPhone Safari 真机录音/播放。Safari 的语音接口由系统提供，后台/锁屏播放不可保证。完整的公开网页 URL 需要部署到你自己的 GitHub Pages 仓库后才能获得，下载链接本身不等于公开托管。
