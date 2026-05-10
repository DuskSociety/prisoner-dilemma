# 囚徒博弈：对决

> 双人回合制策略博弈游戏 — 信任还是背叛？每一次选择都至关重要。

## 游戏简介

以囚徒困境博弈论为核心的联机对战游戏。双方各持5张手牌（2张 🤝 合作卡 + 2张 ⚔️ 背叛卡 + 1张  万能牌），在5轮×5回合的同步出牌中斗智斗勇。

回合结算不显示对方出牌——你必须通过得分变化来推测对手的策略。

## 游戏规则

- 5轮 × 5回合 = 共25次出牌
- 每轮结束后手牌重置（2合作 + 2背叛 + 1万能）
- 万能牌根据剩余手牌中哪种牌更多自动判定
- 5轮后累计总分高者获胜
- 详细规则见游戏内"规则"页面

---

## 本地运行

```bash
# 1. 安装后端依赖并启动
cd server
npm install
npm start          # 服务运行在 http://localhost:3001

# 2. 安装前端依赖并构建
cd ../client
npm install
npx vite build     # 构建到 client/dist

# 3. 打开浏览器
# http://localhost:3001
# 开两个窗口即可自己和自己对战
```

## 局域网联机（同一WiFi）

```bash
# 获取本机IP
ipconfig            # 找到 IPv4 地址，例如 192.168.1.5

# 其他人访问
http://192.168.1.5:3001
```

## ngrok 临时公网联机（免费）

适合和朋友临时联机，不需要部署服务器：

```bash
# 1. 下载 ngrok：https://ngrok.com/download
# 2. 注册账号并获取 authtoken：https://dashboard.ngrok.com/get-started/your-authtoken
# 3. 配置 token（仅首次）：
ngrok config add-authtoken 你的token

# 4. 确保本地服务已启动（server 在 3001 端口）
cd server && npm start

# 5. 另开终端，启动 ngrok 隧道：
ngrok http 3001

# 6. 把 ngrok 显示的 https 链接发给朋友
# 例如：https://xxxx.ngrok-free.app
# 朋友打开后输入你的房间码即可对战
```

**注意：** ngrok 方案需要你的电脑保持开机、后端保持运行。链接每次重启 ngrok 会变化。

## Railway 永久部署（免费）

无需开电脑，24小时在线：

1. 将代码上传到 GitHub 仓库
2. 打开 [railway.app](https://railway.app)，用 GitHub 登录
3. New Project → Deploy from GitHub repo → 选择仓库
4. 自动构建部署，获得永久域名如 `xxx.up.railway.app`
5. 把域名发给朋友即可随时对战

---

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React + TypeScript + Tailwind CSS + Zustand |
| 后端 | Node.js + Express + Socket.io |
| 实时通信 | WebSocket（Socket.io） |
| 部署 | Railway / ngrok |
