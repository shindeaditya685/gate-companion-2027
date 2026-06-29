# GATE CSE 2027 Companion

Personal prep companion for **GATE CSE 2027 + BARC / NIC / ISRO** integrated preparation. Built with Next.js 16, TypeScript, Tailwind CSS 4, and shadcn/ui.

## Features

- **Dashboard** — GATE countdown, current phase, today's plan, recent mock score trend
- **Subjects** — 12 GATE CSE subjects with must-master topic checklists, priority tags (P0/P1/P2), self-assessed status (weak/moderate/solid)
- **Timeline** — 4-phase visual timeline with milestones + exam-day 180-minute strategy
- **Spaced Repetition** — Auto-schedules chapter reviews on the 1-3-7-21-60 day cycle
- **Mock Tracker** — Log mock scores, visualize trend on a line chart, categorize mistakes (silly/conceptual/time)
- **Cheat Sheet** — Searchable formula bank organized by subject
- **PSU Tracker** — Side-by-side comparison of GATE / BARC / NIC / ISRO exam patterns + interview strategies
- **Self-Care** — Weekly burnout self-check-in, warning signs reference, recovery protocol

All data is saved in your browser's localStorage (via Zustand persist middleware). No account, no backend, no telemetry.

## Getting Started

### Prerequisites

- Node.js 18+ (or Bun)
- npm / pnpm / bun

### Install & Run

```bash
# Install dependencies
npm install
# or: bun install / pnpm install

# Set up MongoDB connection
cp .env.example .env

# Start the dev server
npm run dev
# or: bun run dev / pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| State | Zustand (persisted to localStorage) |
| Charts | Recharts |
| Icons | lucide-react |
| Database | MongoDB (via Mongoose) |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Single-page tabbed app
│   ├── globals.css           # Tailwind + theme tokens
│   └── api/
│       ├── route.ts          # Health check
│       └── prep/route.ts     # MongoDB sync endpoints
├── components/
│   ├── layout/
│   │   ├── app-header.tsx
│   │   └── app-footer.tsx
│   ├── providers/
│   │   └── MongoSyncProvider.tsx
│   ├── sections/
│   │   ├── dashboard.tsx
│   │   ├── subjects.tsx
│   │   ├── timeline.tsx
│   │   ├── spaced-repetition.tsx
│   │   ├── mock-tracker.tsx
│   │   ├── cheat-sheet.tsx
│   │   ├── psu-tracker.tsx
│   │   └── self-care.tsx
│   └── ui/                    # shadcn/ui components
├── lib/
│   ├── types.ts               # TypeScript interfaces
│   ├── data.ts                # Seed data (subjects, phases, PSU exams, cheat sheet)
│   ├── store.ts               # Zustand store with persist middleware
│   ├── mongodb.ts             # MongoDB connection utility
│   ├── db.ts                  # Re-exports connectDB
│   ├── utils.ts               # cn() helper
│   └── models/
│       └── PrepState.ts       # Mongoose model
├── types/
│   └── global.d.ts            # Global type declarations
└── hooks/                     # Custom hooks
```

## Customization

- **Subjects / topics** — Edit `src/lib/data.ts` (`SEED_SUBJECTS`)
- **Phase milestones** — Edit `src/lib/data.ts` (`PHASES`)
- **PSU exam info** — Edit `src/lib/data.ts` (`PSU_EXAMS`)
- **Formulas** — Edit `src/lib/data.ts` (`CHEAT_SHEET`)
- **Start date / GATE date** — Edit `src/lib/store.ts` (`INITIAL_STATE.startDate` and `gateDate`)

## Reset Your Data

Open the browser DevTools console and run:

```js
localStorage.removeItem('gate-prep-store-v1');
location.reload();
```

## License

Personal use. Built as a study companion.
