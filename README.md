# 囚徒博弈：对决

> 双人回合制策略博弈游戏 — 信任还是背叛？每一次选择都至关重要。

## 游戏简介

以囚徒困境博弈论为核心的联机对战游戏。双方各持5张手牌（2张合作卡 + 2张背叛卡 + 1张万能牌），在5轮×5回合的同步出牌中斗智斗勇。

- 🤝 **合作卡** — 双方合作各得3分
- ⚔️ **背叛卡** — 背叛合作者得5分，对方0分
-  **万能牌** — 根据剩余手牌自动判定

## 快速开始

```bash
# 安装依赖
cd server && npm install
cd ../client && npm install

# 构建前端
cd client && npx vite build

# 启动服务
cd ../server && npm start
```

打开 `http://localhost:3001`，用两个浏览器窗口即可对战。

## 局域网联机

启动服务后，同一WiFi下的设备访问 `http://你的IP:3001` 即可加入。

## 技术栈

- **前端** React + TypeScript + Tailwind CSS + Zustand
- **后端** Node.js + Express + Socket.io
- **部署** Railway / Vercel

## 游戏规则

5轮 × 5回合 = 25次出牌。每轮结束后手牌重置，5轮后总分高者获胜。

详细规则见游戏内"规则"页面。
