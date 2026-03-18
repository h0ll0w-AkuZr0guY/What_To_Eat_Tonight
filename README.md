世纪难题“今天吃什么”终于迎来了终结！🎉

## **《薛定谔的饭 (What To Eat Tonight)》**

本项目由开发者 [@h0ll0w-AkuZr0guY](https://github.com/h0ll0w-AkuZr0guY) 采用 **Vibe Coding** 模式开发完成。

#### **✨ 核心亮点 (Key Features)**

- 🧠 **硬核防连吃算法**
  - **周期管理**：仅参考最近 N 顿的干饭记录，超出既往不咎。
  - **连吃惩罚与拉黑**：短时间内吃过？中签概率锐减！达到拉黑阈值直接踢出今日转盘！
  - **未吃奖励**：太久没翻牌子的美食，权重暴增，带你找回初恋的味道。
- 🗂️ **多级食谱与标签系统**
  - 支持创建“多级群组”（例如：抽中“吃点好的”后，展开二级转盘继续抽麦当劳/肯德基）。
  - 智能标签聚合与过滤，一键筛选“南校区”、“面食”等特定品类。
- 🔄 **全场景数据同步**
  - 高度自由的导入/导出机制。支持通过**剪贴板、网络直链 (Raw URL) 或本地 JSON 文件**进行无缝的数据同步与备份。
- 📱 **丝滑原生体验**
  - 基于 Vue 3 + Capacitor 构建的现代 Web App。
  - **Retina 超清视网膜转盘**：物理像素比动态缩放，告别边缘锯齿。
  - 全面适配移动端刘海屏、防键盘遮挡、优雅的 Toast 吐司提示与高斯模糊模态框。

#### **📦 下载与安装**

**对于 Android 用户：**

1. 在下方 `Assets` 区域下载 `薛定谔的猫 v1.0.6.apk` 文件。
2. 传输到手机并允许“安装未知来源应用”即可体验。\
   *(注：所有数据均默认保存在本地沙盒，绝对保护隐私)*

**对于开发者 (Web / 本地运行)：**

```Shell
git clone https://github.com/h0ll0w-AkuZr0guY/What_To_Eat_Tonight.git
cd What_To_Eat_Tonight
npm install
npm run dev
```

<br />

npm run build

npx cap sync android
