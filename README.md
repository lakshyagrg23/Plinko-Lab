# 🎰 Plinko Lab - Provably Fair Gaming

An interactive **Plinko game** with a cryptographically secure **commit-reveal protocol** for provable fairness. Built with Next.js 14, TypeScript, and HTML5 Canvas.

🔗 **[Live Demo](https://your-deployment-url.vercel.app)** | 🔍 **[Verifier Page](https://your-deployment-url.vercel.app/verify)**

---

## ✨ Features

### Core Functionality
- ✅ **Provably Fair Gaming** - Commit-reveal protocol with SHA-256 hashing
- ✅ **Deterministic Engine** - 100% reproducible outcomes using xorshift32 PRNG
- ✅ **Public Verifier** - Anyone can verify round fairness with seeds
- ✅ **Smooth Animations** - Canvas-based ball physics with peg collisions
- ✅ **Sound Effects** - Peg collision sounds and celebration audio (with mute toggle)
- ✅ **Confetti Celebrations** - Particle effects for big wins
- ✅ **Responsive Design** - Works on desktop and mobile

### Accessibility
- ♿ **Keyboard Controls** - Arrow keys for column selection, Space to drop
- ♿ **Reduced Motion Support** - Respects `prefers-reduced-motion` with faster animations
- ♿ **Visual Indicators** - Shows accessibility status in UI

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
- **GitHub Copilot** (VS Code extension)
- **ChatGPT-4** for architecture planning

### Where AI Was Used

1. **Initial Boilerplate** (~10%)
   - Generated Next.js project structure
   - Basic Prisma schema setup

2. **Fairness Protocol Implementation** (~30%)
   - Prompted: *"Implement commit-reveal protocol with SHA-256"*
   - Kept: Core hashing logic
   - Modified: Added test vector validation

3. **Canvas Animation** (~40%)
   - Prompted: *"Create smooth ball animation following discrete path"*
   - Kept: RequestAnimationFrame loop structure
   - Modified: Fixed ball positioning to travel between pegs (not through them)
   - Fixed: Animation ghosting bug (added proper canvas clearing)

4. **Sound Effects** (~60%)
   - Prompted: *"Add peg collision and landing sounds with mute toggle"*
   - Kept: Audio Web API implementation
   - Modified: Adjusted volume levels and timing

5. **Accessibility Features** (~50%)
   - Prompted: *"Implement prefers-reduced-motion support"*
   - Kept: Media query detection hook
   - Modified: Animation speed adjustments

### What I Implemented Manually
- Peg layout fix (changed from `r+1` to `r+3` pegs per row for visual accuracy)
- Ball gap positioning logic (traveling between pegs)
- Animation cleanup to prevent overlapping animations
- Easter egg interactions (TILT + Debug modes)
- Debug grid overlay rendering
- All business logic validation

### Key Decisions & Tradeoffs

**Why Xorshift32?**
- Simple, fast, deterministic
- Good enough for non-crypto randomness
- Easy to verify (vs. Mersenne Twister complexity)

**Why SQLite?**
- Assignment allowed it
- Simpler for demo/evaluation
- Production would use PostgreSQL

**Canvas vs. WebGL?**
- Canvas: Simpler, sufficient for 60fps
- WebGL would be overkill for this board size

---

## ⏱️ Time Log

| Phase | Time | Notes |
|-------|------|-------|
| **Planning & Setup** | 1.5h | Architecture, DB schema, boilerplate |
| **Fairness Protocol** | 2h | Hashing, PRNG, test vectors |
| **Game Engine** | 2.5h | Peg map, path simulation, deterministic logic |
| **Frontend - Board** | 2h | Canvas rendering, peg layout fixes |
| **Frontend - Animation** | 2.5h | Ball physics, timing, bug fixes |
| **API Routes** | 1h | Commit/Start/Reveal endpoints |
| **Verifier Page** | 1h | Public verification UI |
| **Sound System** | 1h | Audio effects, mute toggle |
| **Accessibility** | 0.5h | Reduced motion, keyboard controls |
| **Easter Eggs** | 1h | TILT mode, Debug grid |
| **Testing & Debugging** | 1.5h | Test vectors, bug fixes |
| **Documentation** | 1h | README, code comments |
| **TOTAL** | **~18h** | *Exceeded 8h timebox but complete* |

---

## 🚧 What I'd Do Next (Given More Time)

### High Priority
- [ ] **Real Physics** - Integrate Matter.js for true ball physics while keeping discrete decisions
- [ ] **Session History** - Display recent rounds in a table
- [ ] **CSV Export** - Download round data for external verification
- [ ] **Mobile Touch Controls** - Better UX for mobile
- [ ] **Performance** - Optimize canvas redrawing (dirty rectangles)

### Nice to Have
- [ ] **More Easter Eggs** - Golden ball (3x center), secret themes
- [ ] **Multiplayer** - Real-time drops with WebSockets
- [ ] **Leaderboard** - Biggest wins tracking
- [ ] **Sound Themes** - Different audio packs
- [ ] **Dark/Light Mode** - Theme switcher

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

### Environment Variables

Create `.env` file:
```bash
DATABASE_URL="file:./dev.db"
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect GitHub repo to Vercel for auto-deployment.

---

## 📜 License

This project was created as a take-home assignment. All code is original or properly attributed.

### Sound Assets
- Peg collision sounds: Generated using Web Audio API
- Landing sounds: Synthesized tones

---

## 🏆 Assignment Completion Checklist

### Functional Requirements
- ✅ 12 rows, 13 bins, triangular peg layout
- ✅ Drop column selection (0-12) with bet amount
- ✅ Smooth ball animation with peg collisions
- ✅ Bin pulse + confetti on landing
- ✅ Peg tick sounds + celebration SFX with mute toggle
- ✅ Keyboard controls (arrows + space)
- ✅ Reduced motion support
- ✅ Responsive (mobile + desktop)

### Provably Fair
- ✅ Commit-reveal protocol (SHA-256)
- ✅ Server seed + client seed + nonce
- ✅ Deterministic PRNG (xorshift32)
- ✅ Public verifier page with replay

### Deterministic Engine
- ✅ Peg map with leftBias ∈ [0.4, 0.6]
- ✅ Drop column influence
- ✅ Stable pegMapHash
- ✅ Test vector validation

### API & Data
- ✅ POST /api/rounds/commit
- ✅ POST /api/rounds/:id/start
- ✅ POST /api/rounds/:id/reveal
- ✅ GET /api/rounds/:id
- ✅ GET /api/verify
- ✅ Prisma schema with Round model

### Non-Functional
- ✅ 60fps animations
- ✅ Unit tests with test vectors
- ✅ Clear documentation
- ✅ AI usage documented

### Easter Eggs (2 required)
- ✅ TILT mode (press T)
- ✅ Debug grid (press G)

---

## 📧 Contact

For questions about this implementation, please refer to the inline code comments or open an issue.

**Built with ❤️ for the Plinko Lab assignment**
