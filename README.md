<div align="center">

# 🏋️ IronStart Trainer

**Your personal AI-powered fitness companion — built as a Progressive Web App**

[![Version](https://img.shields.io/badge/Version-2.0-emerald?style=flat-square)](.)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.1-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa)](.)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)](Dockerfile)
[![Deploy](https://github.com/fire3san/ironstart/actions/workflows/deploy.yml/badge.svg)](https://github.com/fire3san/ironstart/actions/workflows/deploy.yml)

[**📱 Live Demo**](https://fire3san.github.io/ironstart/) · [**🐛 Report Bug**](../../issues) · [**💡 Request Feature**](../../issues)

</div>

---

## 📸 Screenshots

> _Add screenshots here after running the app. Place images in `docs/screenshots/`._

| Home Dashboard | Workout Session | Progress & Stats |
|:-:|:-:|:-:|
| _(screenshot)_ | _(screenshot)_ | _(screenshot)_ |

| Nutrition Tracker | AI Coach | Achievements |
|:-:|:-:|:-:|
| _(screenshot)_ | _(screenshot)_ | _(screenshot)_ |

---

## ✨ What is IronStart?

IronStart Trainer is a **mobile-first PWA** that replaces the gym notebook. It combines structured workout programs, real-time tracking, AI coaching, and nutrition logging into a single installable app — no app store required.

Key highlights:
- 🏋️ **Dual workout modes** — Machine & Free Weight with A/B split programs
- 🤖 **AI Coach (IronCoach)** — powered by Google Gemini, knows your stats
- 🥗 **Protein & nutrition tracker** with visual zone indicators
- 📊 **Progress metrics** — PRs, streaks, XP levelling, body measurements
- 🌐 **Bilingual** — English & Traditional Chinese (繁體中文)
- 📲 **Installable PWA** — works offline, add to home screen

---

## 🚀 Features

### 🏋️ Workout Engine
| Feature | Details |
|---------|---------|
| Dual Modes | Machine Edition & Free Weight/Dumbbell Edition |
| A/B Split | Push/Pull routine for balanced training |
| Warm-up | Guided warm-up with visual exercise animations |
| Exercise Timer | Built-in countdown for timed exercises (planks, etc.) |
| Rest Timer | Auto rest countdown between sets with vibration alerts |
| Set Logging | Log weight + reps per set with inline editing |
| Workout Notes | Attach personal notes to any session |

### 📊 Progress & Analytics
- **Personal Records (PRs)** — auto-detected on every set
- **Workout History** — full log with volume calculations
- **Body Metrics** — weight, body fat %, chest, arms, waist, thighs
- **Weekly Stats** — week-over-week comparison
- **Streak Tracking** — consecutive workout day counter

### 🏆 Gamification
- **XP & Level System** — earn XP for every completed workout
- **Achievement Badges** — First Workout, 5/10-day streaks, Volume Clubs (100kg → 1000kg), PR Breaker
- **Confetti Celebrations** — because you earned it 🎉

### 🥗 Nutrition
- **Protein Tracker** — 120g daily goal with zone indicators (Danger / Maintenance / Growth)
- **Meal Categories** — Morning, Pre-gym, Post-gym, Dinner, Snacks
- **IronChef AI** — generates high-protein snack recipes on demand

### 🤖 AI Integration
- **IronCoach** — conversational AI fitness coach (Gemini 2.5 Flash)
- Knows your profile (165cm, 59kg target)
- Answers questions on form, nutrition, motivation, and programming

### 💧 Wellness
- Water intake tracker (8 glasses/day goal)
- Energy & mood logging
- Sleep hours tracking

### 📲 PWA
- Installable on iOS & Android (Add to Home Screen)
- Offline-first with localStorage persistence
- Responsive design optimised for mobile & desktop

---

## 🛠 Tech Stack

| Technology | Version | Role |
|------------|---------|------|
| [React](https://react.dev/) | 18.2 | UI framework |
| [Vite](https://vitejs.dev/) | 5.1 | Build tool & dev server |
| [Tailwind CSS](https://tailwindcss.com/) | 3.4 | Utility-first styling |
| [Framer Motion](https://www.framer.com/motion/) | 12.x | Animations & transitions |
| [Lucide React](https://lucide.dev/) | 0.344 | Icon library |
| [Canvas Confetti](https://npmjs.com/package/canvas-confetti) | 1.9 | Celebration effects |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | 0.19 | PWA manifest & service worker |
| [Firebase](https://firebase.google.com/) | 10.8 | Auth + Firestore cloud sync _(optional)_ |
| [Google Gemini API](https://ai.google.dev/) | 2.5 Flash | AI coach & chef features _(optional)_ |

---

## 📋 Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **Git**
- _(Optional)_ Docker & Docker Compose for containerised deployment

---

## ⚡ Quick Start

### 1. Clone

```bash
git clone https://github.com/fire3san/ironstart.git
cd ironstart
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment _(optional — for AI features)_

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Required for IronCoach & IronChef AI features
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Required for Docker + Cloudflare Tunnel deployment
TUNNEL_TOKEN=your_cloudflare_tunnel_token_here
```

> **Note:** The app runs fully without any `.env` values — AI features will gracefully disable themselves.

### 4. Start dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🏗 Build

```bash
# Production build
npm run build

# Preview production build locally
npm run preview
```

Output is in `dist/`. Deploy the `dist/` folder to any static host (Netlify, Vercel, Cloudflare Pages, etc.).

---

## 🐳 Docker Deployment

### Using Docker Compose (recommended)

```bash
# Copy and fill in secrets
cp .env.example .env
# Edit .env with your keys

# Start app + Cloudflare Tunnel
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

The stack runs:
- **`ironstart`** — production build served on port 3000
- **`tunnel`** — Cloudflare Tunnel for HTTPS public access

### Manual Docker

```bash
docker build -t ironstart .
docker run -p 3000:3000 --env-file .env ironstart
```

---

## 🔐 Firebase Cloud Sync _(optional)_

IronStart supports optional Google Sign-In + Firestore sync to back up your data across devices.

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication → Google** sign-in
3. Create a **Firestore** database
4. Copy your web app config into `src/firebase-config.js`

Without Firebase configured, the app stores all data in `localStorage` only.

---

## 📁 Project Structure

```
ironstart/
├── public/                    # Static assets (PWA icons, etc.)
├── src/
│   ├── App.jsx                # Main app — all screens & state
│   ├── main.jsx               # Entry point
│   ├── index.css              # Global styles
│   ├── firebase-config.js     # Firebase setup (fill in your keys)
│   ├── components/
│   │   └── MigrationDialog.jsx  # Local → Cloud data migration UI
│   ├── services/
│   │   └── migrationService.js  # Firebase data sync logic
│   └── test/
│       ├── App.test.jsx       # Component tests
│       └── setup.js           # Vitest setup
├── .env.example               # Environment variable template
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── vitest.config.js
└── README.md
```

---

## 🧪 Tests

```bash
npm test
```

Uses [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/).

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GEMINI_API_KEY` | Optional | Google Gemini API key for IronCoach & IronChef AI |
| `TUNNEL_TOKEN` | Docker only | Cloudflare Tunnel token for HTTPS access |

Get a Gemini API key free at [aistudio.google.com](https://aistudio.google.com/app/apikey).

---

## 📱 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot-reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run test suite |

---

## 🗺 Roadmap

- [ ] Cloud sync via Firebase (in progress)
- [ ] Workout plan templates
- [ ] Export data to CSV / PDF
- [ ] Apple Watch / Wear OS companion
- [ ] Nutrition database integration
- [ ] Social sharing & leaderboards
- [ ] Workout comparison charts

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

Please keep PRs focused and include tests where relevant.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Credits

- [Lucide](https://lucide.dev/) — icons
- [Framer Motion](https://www.framer.com/motion/) — animations
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [Google Gemini](https://ai.google.dev/) — AI capabilities
- [Vite](https://vitejs.dev/) — build tooling
- [Cloudflare](https://www.cloudflare.com/) — tunnel & DNS

---

<div align="center">
  <strong>IronStart Trainer</strong> — <em>Train smarter. Track everything. Level up.</em> 💪
</div>