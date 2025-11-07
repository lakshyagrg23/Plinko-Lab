# 🎰 Plinko Lab - Provably Fair Gaming

An interactive **Plinko game** with a cryptographically secure **commit-reveal protocol** for provable fairness. Built with Next.js 14, TypeScript, and HTML5 Canvas.

🔗 **[Live Demo](https://plinko-9tcjrl6fw-l5grg23-gmailcoms-projects.vercel.app/)**

---

## ✨ Features

### Core Functionality
- ✅ **Provably Fair Gaming** - Commit-reveal protocol with SHA-256 hashing
- ✅ **Deterministic Engine** - 100% reproducible outcomes using xorshift32 PRNG
- ✅ **Public Verifier** - Anyone can verify round fairness with seeds
- ✅ **Smooth Animations** - Canvas-based ball physics with peg collisions
- ✅ **Sound Effects** - Peg collision sounds and celebration audio (with mute toggle)
- ✅ **Confetti Celebrations** - Particle effects for big wins
- ✅ **Responsive Design** - Works on desktop and mobile with touch-friendly controls

### Bonus Features 🎁
- 🎨 **Elegant Theming System** - Dark and Neon themes with CSS variables and localStorage persistence
- 📥 **Downloadable CSV Export** - Export round hashes and data for auditing (GET /api/rounds/export)
- 🔗 **Round Permalinks** - Copy shareable verification links for any round
- 📊 **Session Log API** - GET /api/rounds?limit=20 for recent rounds with verifier links

### Accessibility
- ♿ **Keyboard Controls** - Arrow keys for column selection, Space to drop
- ♿ **Reduced Motion Support** - Respects `prefers-reduced-motion` with faster animations
- ♿ **ARIA Labels** - Comprehensive screen reader support
- ♿ **Touch Targets** - Minimum 44px for mobile accessibility

### Easter Eggs 🥚
- 🎮 **TILT Mode** - Press `T` to activate vintage arcade tilt effect (±5° rotation + sepia filter)
- 🔍 **Debug Grid** - Press `G` to overlay peg positions and RNG values

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd plinko-lab

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Initialize database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play!

---

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Rendering**: HTML5 Canvas for 60fps animations
- **Hashing**: SHA-256 (Node.js crypto)
- **PRNG**: Xorshift32 (deterministic)

### Project Structure
```
plinko-lab/
├── app/
│   ├── page.tsx              # Main game page
│   ├── verify/page.tsx       # Public verifier
│   └── api/
│       ├── rounds/
│       │   ├── commit/       # Step 1: Create round
│       │   └── [id]/
│       │       ├── start/    # Step 2: Start round
│       │       └── reveal/   # Step 3: Reveal seed
│       └── verify/           # Recompute outcomes
├── components/
│   ├── PlinkoBoard.tsx       # Canvas rendering & animation
│   ├── GameControls.tsx      # Betting interface
│   ├── Confetti.tsx          # Particle effects
│   └── MuteToggle.tsx        # Audio controls
├── lib/
│   ├── fairness.ts           # Commit-reveal protocol
│   ├── plinko-engine.ts      # Deterministic game logic
│   ├── payout.ts             # Multiplier calculations
│   └── useSoundEffects.ts    # Audio management
├── prisma/
│   └── schema.prisma         # Database schema
└── __tests__/
    └── fairness.test.ts      # Test vectors validation
```

---

## 🔐 Fairness Specification

### Commit-Reveal Protocol

1. **Commit Phase**
   ```
   Server generates: serverSeed (64-char hex)
   Server generates: nonce (random string)
   Server publishes: commitHex = SHA256(serverSeed + ":" + nonce)
   ```

2. **Play Phase**
   ```
   Client provides: clientSeed (any string)
   Client chooses: dropColumn (0-12), betAmount
   
   combinedSeed = SHA256(serverSeed + ":" + clientSeed + ":" + nonce)
   ```

3. **Reveal Phase**
   ```
   Server reveals: serverSeed
   Client verifies: SHA256(serverSeed + ":" + nonce) === commitHex
   ```

### Deterministic Engine

**Specifications:**
- **Rows**: 12
- **Bins**: 13 (indexed 0-12)
- **Peg Map**: Each row `r` has `r+1` pegs with `leftBias ∈ [0.4, 0.6]`
  - Formula: `leftBias = 0.5 + (rand() - 0.5) * 0.2`
  - Rounded to 6 decimals for stable hashing
- **Drop Column Influence**: 
  - `adj = (dropColumn - 6) * 0.01`
  - `bias' = clamp(leftBias + adj, 0, 1)`
- **PRNG**: Xorshift32 seeded from first 4 bytes of combinedSeed (big-endian)
- **Path Generation**: At row `r`, use peg at `min(pos, r)` where `pos` = count of RIGHT moves

**Replay Guarantee**: Same `(serverSeed, clientSeed, nonce, dropColumn)` → Same outcome

---

## ✅ Test Vectors

Reference implementation validated against provided test vectors:

```typescript
// Inputs
serverSeed  = "b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc"
nonce       = "42"
clientSeed  = "candidate-hello"
dropColumn  = 6

// Derived (verified ✓)
commitHex      = "bb9acdc67f3f18f3345236a01f0e5072596657a9005c7d8a22cff061451a6b34"
combinedSeed   = "e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0"
binIndex       = 6
firstFiveRands = [0.1106166649, 0.7625129214, 0.0439292176, ...]
```

Run tests: `npm test`

---

## 🤖 AI Usage Documentation

### Tools Used
- **GitHub Copilot** (VS Code extension) - Real-time code suggestions
- **ChatGPT-5** - Architecture planning and problem-solving

### Where AI Was Used

1. **Initial Boilerplate** (~15% AI contribution)
   - Generated: Next.js project structure, basic Prisma schema
   - Manual: Custom modifications, routing setup

2. **Fairness Protocol Implementation** (~40% AI contribution)
   - Generated: SHA-256 hashing logic, basic PRNG structure
   - Manual: Test vector validation, commit-reveal flow, xorshift32 implementation

3. **Canvas Animation** (~50% AI contribution)
   - Generated: RequestAnimationFrame loop, basic ball rendering
   - Manual: Fixed ball positioning (gaps between pegs), animation cleanup, timing adjustments

4. **Sound Effects** (~70% AI contribution)
   - Generated: Web Audio API implementation, oscillator tones
   - Manual: Volume balancing, timing coordination with animations

5. **UI Components** (~60% AI contribution)
   - Generated: React component structure, basic styling
   - Manual: Theme system, accessibility features, mobile responsiveness

6. **API Routes** (~50% AI contribution)
   - Generated: Next.js route handlers, Prisma queries
   - Manual: Error handling, validation logic, CSV export endpoint

### What I Implemented Manually (100% Original)

- **Peg Layout Logic** - Changed from specification to 3+ pegs per row for visual clarity and for being a true Plinko board
- **Deterministic Ball Path Simulation** - Full implementation of bias adjustments and path calculation
- **Commit-Reveal Flow** - End-to-end round lifecycle with proper state management
- **Ball Gap Positioning** - Algorithm to position ball between pegs (not through them)
- **Animation Bug Fixes** - Solved ghosting issues with proper cleanup and cancellation
- **Easter Eggs** - TILT mode and Debug Grid overlay implementations
- **Theming System** - Complete CSS variable architecture with localStorage persistence
- **CSV Export** - Round data export endpoint with proper CSV escaping
- **Verification UI** - Auto-population from URL parameters, shareable links
- **All Business Logic Validation** - Test vectors, edge cases, determinism verification

### Key Decisions & Tradeoffs

**Why Xorshift32 over Mersenne Twister?**
- ✅ Simpler implementation (easier to verify)
- ✅ Deterministic and fast
- ✅ Good enough for non-cryptographic randomness

**Why SQLite over PostgreSQL?**
- ✅ Assignment allowed it
- ✅ Simpler for demo/evaluation (no external DB needed)
- ✅ File-based, portable
- ❌ Production should use PostgreSQL for concurrent writes

**Canvas vs WebGL?**
- ✅ Canvas: Simpler, sufficient for 60fps with 12 rows
- ✅ Better browser compatibility
- ❌ WebGL would be overkill for this board size

---

## ⏱️ Time Log

| Phase | Time | Notes |
|-------|------|-------|
| **Planning & Setup** | 1.5h | Architecture, DB schema, boilerplate |
| **Fairness Protocol** | 1.5h | Hashing, PRNG, test vectors |
| **Game Engine** | 1h | Peg map, path simulation, deterministic logic |
| **Frontend - Board** | 1h | Canvas rendering, peg layout fixes |
| **Frontend - Animation** | 2h | Ball physics, timing, ghosting bug fixes |
| **Verifier Page** | 0.5h | Public verification UI, URL params, auto-verify |
| **Easter Eggs** | 0.5h | TILT mode, Debug grid |
| **Testing & Debugging** | 0.5h | Test vectors, bug fixes |
| **Documentation** | 0.5h | README, code comments, deployment guide |
| **TOTAL** | **~9h** | *around 9h: feature-complete + bonuses* |

---

## 🚧 What I'd Do Next (Given More Time)

### High Priority
- [ ] **Real Physics Engine** - Integrate Matter.js for true ball physics while keeping discrete fairness
- [ ] **WebSocket Session Log** - Real-time updates for new rounds
- [ ] **Performance Optimization** - Canvas dirty rectangles, requestIdleCallback
- [ ] **E2E Tests** - Playwright tests for full user flows
- [ ] **Rate Limiting** - Prevent API abuse

### Nice to Have
- [ ] **More Themes** - Retro, Matrix, Synthwave
- [ ] **Multiplayer Mode** - Real-time drops with WebSockets
- [ ] **Leaderboard** - Biggest wins tracking
- [ ] **Sound Packs** - Different audio themes
- [ ] **Golden Ball Easter Egg** - 3x center multiplier for rare event

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

**Test Coverage:**
- ✅ SHA-256 hashing
- ✅ Commit generation & verification
- ✅ PRNG sequence matching test vectors
- ✅ Peg map generation
- ✅ Path simulation determinism
- ✅ Outcome replayability

---

## 📦 Scripts

```bash
npm run dev          # Development server (http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm test             # Run tests
```

---

## 🌐 Deployment

### Quick Deploy to Vercel

1. **Install Vercel CLI** (optional)
   ```bash
   npm install -g vercel
   ```

2. **Deploy via GitHub** (Recommended)
   - Push code to GitHub repository
   - Go to [vercel.com](https://vercel.com) and sign in with GitHub
   - Click "Import Project" → Select your repository
   - Vercel auto-detects Next.js configuration
   - Click "Deploy" - Done! ✅

3. **Deploy via CLI**
   ```bash
   vercel
   ```
   Follow the prompts to deploy.

### Environment Variables

No environment variables required for deployment! The app uses a local SQLite database file which persists in Vercel's filesystem.

**Optional**: If you want to use PostgreSQL in production:

```bash
# Add to Vercel environment variables
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

Then update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

---

## 📜 License

This project was created as a take-home assignment. All code is original or properly attributed.

### Sound Assets
- Peg collision sounds: Generated using Web Audio API
- Landing sounds: Synthesized tones

---

## 🏆 Assignment Completion Checklist

### Functional Requirements ✅
- ✅ 12 rows, 13 bins, triangular peg layout (3+ pegs per row)
- ✅ Drop column selection (0-12) with bet amount
- ✅ Smooth 60fps ball animation with peg collisions
- ✅ Bin pulse + confetti on landing
- ✅ Peg tick sounds + celebration SFX with mute toggle
- ✅ Keyboard controls (arrow keys + space)
- ✅ Reduced motion support with visual indicator
- ✅ Responsive design (mobile + desktop, touch-friendly)

### Provably Fair ✅
- ✅ Commit-reveal protocol (SHA-256)
- ✅ Server seed + client seed + nonce
- ✅ Deterministic PRNG (xorshift32)
- ✅ Public verifier page with automatic verification
- ✅ Shareable verification permalinks

### Deterministic Engine ✅
- ✅ Peg map with leftBias ∈ [0.4, 0.6]
- ✅ Drop column influence on bias
- ✅ Stable pegMapHash for reproducibility
- ✅ Test vector validation (all passing)

### API & Data ✅
- ✅ POST /api/rounds/commit
- ✅ POST /api/rounds/[id]/start
- ✅ POST /api/rounds/[id]/reveal
- ✅ GET /api/verify (public verifier)
- ✅ GET /api/rounds (session log with limit)
- ✅ GET /api/rounds/export (CSV download)
- ✅ Prisma schema with Round model

### Non-Functional ✅
- ✅ 60fps animations (requestAnimationFrame)
- ✅ Unit tests with test vectors (23/23 passing)
- ✅ Clear documentation (README + inline comments)
- ✅ AI usage documented with percentages

### Easter Eggs ✅ (2+ required)
- ✅ **TILT mode** - Press `T` for vintage arcade effect
- ✅ **Debug Grid** - Press `G` to show peg positions and RNG values

### Bonus Features ✅ (4 implemented)
- ✅ **Elegant Theming System** - Dark/Neon themes with CSS variables
- ✅ **Downloadable CSV** - Export round hashes for auditing
- ✅ **Session Log API** - GET /api/rounds?limit=20
- ✅ **Improved Accessibility** - ARIA labels, 44px touch targets, reduced motion

---

## 📧 Contact

For questions about this implementation, please refer to the inline code comments or open an issue.

**Built with ❤️ for the Plinko Lab assignment**
