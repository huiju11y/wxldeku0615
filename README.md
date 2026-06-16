# 谁在焦虑？——2020-2025中国青年网络情绪图谱

长滚动数据新闻网页（Data Storytelling）

## 快速开始

**直接双击 `index.html` 即可在浏览器中打开**，所有图表数据已内嵌于 `script.js`，无需后端、无需安装依赖。

> 地图模块会优先读取同目录下的 `china.json`（中国省份 GeoJSON）。若本地打开时地图未显示，请使用本地服务器：
> ```bash
> npx serve .
> # 或 python -m http.server 8080
> ```

## 文件结构

```
├── index.html    # 十页滚动叙事结构
├── style.css     # 深色高级感视觉样式
├── script.js     # 全部数据 + 图表逻辑
└── china.json    # 中国地图 GeoJSON（地图热力图用）
```

## 页面结构

1. 封面 — 动态粒子背景
2. 数据来源与方法 — 四源卡片 + 数据统计
3. 2020-2025 情绪变化趋势 — 折线图
4. 情绪占比变化 — 堆叠面积图
5. 情绪词云 — 词云图
6. 焦虑地图 — 中国地图热力图
7. 重大事件情绪波动 — 时间轴
8. 收入增长与焦虑 — 散点图
9. 关键发现 — 数字大屏
10. 结论

## 技术栈

- HTML5 / CSS3 / JavaScript
- ECharts 5 + echarts-wordcloud
- 响应式布局 · 滚动动画 · 数字动画

## GitHub Pages 部署

推送到 GitHub 后，Settings → Pages → 选择 `main` 分支 → `/ (root)` 即可。
