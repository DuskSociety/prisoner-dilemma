# 塑料好朋友 — 设计系统 v3

> **Glow Pop 明亮派对风格**
>
> 毛玻璃 × 彩色光晕 × 渐变特效 × 浮动粒子 — 属于派对游戏的视觉语言。

---

## 1. 设计宣言

### 告别两件事
1. **AI 橡胶感** — 模糊阴影、Inter 字体、大圆角、安全的蓝色
2. **Neubrutalism 硬阴影** — 太突兀、与🃏emoji不搭、本质仍是色块

### 新方向：Glow Pop
- **明亮底色** — 淡紫/淡粉渐变基底，不深不暗
- **毛玻璃卡片** — `backdrop-blur` + 半透明白底，轻盈通透
- **彩色光晕** — 阴影是彩色的、扩散的、柔和的，不是黑色的
- **渐变装饰** — 按钮、边框、光条全部用渐变
- **浮动粒子** — CSS 动画驱动的大型光球在背景缓慢漂移
- **派对字体** — Fredoka(圆润标题) + DM Sans(现代正文) + Space Grotesk(等宽)

---

## 2. 色彩系统

| Token | Hex | 用途 |
|-------|-----|------|
| 背景基底 | `#F5F0FF` | 淡紫白页面背景 |
| 渐变次色 | `#FFF0F5` | 淡粉混合 |
| 卡片背景 | `rgba(255,255,255,0.65)` | 毛玻璃卡片 |
| 合作色 | `#FF6B35` | 按钮/徽章/高亮 (活力橙) |
| 背叛色 | `#E83F6F` | 按钮/徽章/警告 (派对粉) |
| 万能色 | `#45B7D1` | 按钮/徽章/系统 (清新蓝) |
| 观战色 | `#A855F7` | 观战相关 (紫) |
| 文字主 | `#1E1E2E` | 正文 |
| 文字次 | `#6B6B80` | 描述 |
| 文字弱 | `#9E9EB0` | 占位/装饰 |

### 光晕色 (box-shadow 用)
- 合作光晕：`rgba(255,107,53,0.25)`
- 背叛光晕：`rgba(232,63,111,0.25)`
- 万能光晕：`rgba(69,183,209,0.25)`
- 通用光晕：`rgba(168,130,250,0.15)` (淡紫)

---

## 3. 字体

| 角色 | 字体 | 说明 |
|------|------|------|
| 标题 | **Fredoka** (600/700) | 圆润派对感 |
| 正文 | **DM Sans** (400/500) | 现代几何无衬线 |
| 等宽 | **Space Grotesk** (500) | 怪异有个性的等宽 |
| 中文 | system-ui 回退 | |

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Fredoka:wght@500;600;700&family=Space+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">
```

---

## 4. 特效系统

### 背景浮动光球
```css
/* 大型彩色半透明球体缓慢漂移 */
.bg-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  animation: float-orb 20s ease-in-out infinite;
}
```

### 毛玻璃卡片
```css
.glass-card {
  background: rgba(255,255,255,0.65);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.5);
  border-radius: 20px;
}
```

### 彩色光晕阴影
```css
.glow-cooperate { box-shadow: 0 4px 24px rgba(255,107,53,0.25); }
.glow-betray   { box-shadow: 0 4px 24px rgba(232,63,111,0.25); }
.glow-wild     { box-shadow: 0 4px 24px rgba(69,183,209,0.25); }
.glow-soft     { box-shadow: 0 4px 20px rgba(168,130,250,0.12); }
```

### 渐变按钮
```css
/* 合作按钮 — 橙到珊瑚渐变 */
.btn-cooperate {
  background: linear-gradient(135deg, #FF6B35, #FF8C5A);
  color: white;
  /* hover: 光晕扩散 */
}
```

---

## 5. 圆角

| 元素 | 值 |
|------|-----|
| 卡片 | 20px |
| 按钮 | 14px |
| 输入框 | 14px |
| 徽章 | 9999px |
| 卡牌 | 12px |

---

## 6. 动画

- 浮动光球：20s ease-in-out infinite
- 页面过渡：slide-up 300ms
- 按钮 hover：光晕扩散 300ms
- 卡牌 hover：scale(1.03) + translateY(-3px) + 光晕加强
- 分数变化：数字 spring 弹跳 400ms

---

## 7. 实施清单

- [x] tailwind.config.js — 新色彩体系
- [x] index.css — 光球/毛玻璃/光晕/动画
- [x] index.html — Fredoka + DM Sans + Space Grotesk
- [x] App.tsx — 渐变背景 + 光球装饰
- [x] 全部6页面 + 3组件 Glow Pop 改造
- [x] Modal + Toast 新组件
