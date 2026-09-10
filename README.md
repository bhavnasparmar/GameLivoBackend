# GameLivo Backend 🎮⚡

Professional, scalable, feature-based **Node.js + TypeScript** backend server for the **GameLivo Multi-Game Platform** (Ludo, Chess, Uno, Snakes & Ladders, Chidiya Udd, and Esto).

---

## 🏗️ Architecture & Tech Stack

- **Runtime:** Node.js 22 LTS
- **Language:** TypeScript 5.7+
- **HTTP Framework:** Express.js 4
- **Real-Time Communication:** Socket.io 4 (Bidirectional game rooms & state synchronization)
- **Database:** MySQL + Sequelize ORM
- **In-Memory Cache & Session:** Redis (with fallback in-memory store for instant dev setup)
- **Authentication:** JWT Access (15m) + Refresh Tokens (7d) + Phone OTP
- **Validation:** Zod schemas
- **Logging:** Winston + Morgan HTTP Logger
- **Security:** Helmet, CORS, Express Rate Limiting, Bcrypt password hashing

---

## 📁 Directory Structure

```text
GameLivoBackEnd/
├── src/
│   ├── config/             # Environment, Database, Redis, Socket configurations
│   ├── constants/          # Games metadata, Socket event keys, HTTP status codes
│   ├── middleware/         # Auth, Error handling, Zod validation, Rate limiters, Morgan logger
│   ├── modules/            # Feature-based modular business logic
│   │   ├── auth/           # OTP, Register, Login, Refresh tokens, Logout
│   │   ├── user/           # Profile, Avatars, Level/XP, Statistics
│   │   ├── game/           # Game catalog & rules for 6 games
│   │   ├── lobby/          # Room creation, Matchmaking, Seat allocation, Private codes
│   │   ├── match/          # Live game states, Turns, Moves, Dice rolls, Results
│   │   ├── friends/        # Friend requests, Social list, Search players
│   │   ├── chat/           # Room & match live messaging, Typing indicators
│   │   ├── notification/   # In-app push notifications & alerts
│   │   ├── reward/         # Daily login rewards, Referral system, Coin transactions
│   │   ├── leaderboard/    # Global, Game-specific, and Friends rankings
│   │   └── support/        # Help tickets & Player reports
│   ├── routes/             # Central v1 API routes aggregator
│   ├── socket/             # Socket.io server lifecycle & modular event routing
│   ├── types/              # TypeScript typings & Express extensions
│   ├── utils/              # ApiResponse, ApiError, AsyncHandler, JWT, OTP, Pagination
│   ├── app.ts              # Express application factory
│   └── server.ts           # Server bootstrap & graceful shutdown
├── .env                    # Local environment config
├── .env.example            # Environment template
├── nodemon.json            # Live-reload configuration
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Build & Run in Production
```bash
npm run build
npm start
```

---

## 📡 API Endpoints Overview (`/api/v1`)

| Module | Route | Method | Description |
|---|---|---|---|
| **Health** | `/health` | GET | System status & uptime |
| **Auth** | `/auth/otp/send` | POST | Generate & send phone OTP |
| **Auth** | `/auth/otp/verify` | POST | Verify OTP & issue JWT |
| **Auth** | `/auth/register` | POST | Register with username/password |
| **Auth** | `/auth/login` | POST | Login with username/email/phone |
| **Auth** | `/auth/refresh` | POST | Issue new access token |
| **Auth** | `/auth/logout` | POST | Revoke refresh token |
| **User** | `/user/profile` | GET / PUT | Fetch or update user profile |
| **User** | `/user/stats` | GET | Get win/loss stats across games |
| **Games** | `/games` | GET | List 6 supported games |
| **Lobby** | `/lobby/create` | POST | Create public/private game room |
| **Lobby** | `/lobby/join` | POST | Join room by code |
| **Lobby** | `/lobby/public` | GET | List public active lobbies |
| **Match** | `/match/history` | GET | Paginated match history |
| **Friends** | `/friends` | GET | User friends list |
| **Friends** | `/friends/request` | POST | Send friend request |
| **Leaderboard** | `/leaderboard/global` | GET | Global top coin rankings |
| **Leaderboard** | `/leaderboard/:gameId` | GET | Game specific leaderboard |
| **Rewards** | `/rewards/daily` | GET | Daily claim status |
| **Rewards** | `/rewards/daily/claim` | POST | Claim daily reward coins |
| **Rewards** | `/rewards/transactions` | GET | Coin transaction history |
| **Support** | `/support/ticket` | POST | Submit support ticket |
| **Support** | `/support/report-player` | POST | Report abusive player |

---

## ⚡ Socket.io Real-Time Events

- **Lobby Events:** `lobby:create`, `lobby:join`, `lobby:leave`, `lobby:update`, `lobby:player_ready`, `lobby:start_game`
- **Game Play:** `game:start`, `game:state`, `game:dice_roll`, `game:move`, `game:turn_change`, `game:emote`, `game:over`
- **Social & Chat:** `chat:join_room`, `chat:send_message`, `chat:typing`, `friend:status_change`
