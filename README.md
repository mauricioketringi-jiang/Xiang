# 英语数字与专业词汇声音反射训练

静态单页训练网页。课程、题目生成、练习记录与界面逻辑集中在 `index.html`，学习进度保存在当前浏览器本地。

## 语音播放架构

主语音引擎已调整为：

1. Piper TTS 在浏览器本地将题目文本合成为 PCM。
2. 生成 WAV 音频 Blob。
3. 使用 HTML5 `HTMLAudioElement` 直接播放，不把 `speechSynthesis` 输出伪装成媒体音频。
4. 语音播放结束事件触发反应计时。
5. 原生 `speechSynthesis` 只保留为手动备用方案。

iOS 播放前会尝试把 `navigator.audioSession` 切换到 `playback`，并使用媒体元素播放。网页不能关闭 iPhone 的硬件静音开关；是否能在特定 iOS 版本和设备上正常出声，仍需真机验证。

## 口音模型

| 口音 | 模型 | 资源大小 |
|---|---|---:|
| 美音 | en_US-joe-medium | 约 63.2 MB |
| 英音 | en_GB-alba-medium | 约 63.2 MB |

首次启用需要下载 ONNX Runtime、英语音素转换 WASM 和所选口音模型，合计约 90 MB，实际大小受 CDN 资源版本影响。切换到另一种口音时还需下载对应模型。

模型及配置缓存到浏览器 IndexedDB。语音文本在本机生成，不发送到 TTS 服务。首次启用建议使用 Wi-Fi，并确保 Safari 有足够的本地存储空间。

## 开源组件与模型来源

- ONNX Runtime Web 1.22.0：MIT License。
- `@diffusionstudio/piper-wasm` 1.0.0：MIT License。
- Piper voice repository：<https://huggingface.co/rhasspy/piper-voices>
- 美音 en_US-joe-medium：模型卡标注数据集 CC0。
- 英音 en_GB-alba-medium：模型卡标注数据集 CC BY 4.0，来源为 University of Edinburgh 数据集。来源说明：<https://huggingface.co/rhasspy/piper-voices/tree/v1.0.0/en/en_GB/alba/medium>

## 使用

部署到 GitHub Pages 后，使用 iPhone Safari 打开网页。首次进入练习时，点击“启用媒体语音并播放本题”，授权下载并缓存所选语音模型。之后同一口音可复用缓存。

学习进度、错题和设置保存在当前浏览器。迁移设备时，在应用内导出学习备份，再在新设备导入。

## 部署

推送到 `main` 分支后，GitHub Actions 会检查 `index.html` 内联 JavaScript 语法并自动部署 GitHub Pages。

本项目不使用 Vercel、腾讯云 COS、后端服务器或付费 TTS API。
