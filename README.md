# BridgeCare — AI-Powered Welfare Assistance Platform

BridgeCare is a conversational AI application designed to help vulnerable populations in Hong Kong — particularly the elderly, low-income families, and persons with disabilities — navigate and apply for government welfare programs. It replaces confusing bureaucratic processes with a guided, step-by-step digital workflow.

---

## Problem

Hong Kong's social welfare system offers dozens of aid programs, but the application process is fragmented, document-heavy, and difficult for those who need it most. Many eligible residents miss out simply because the system is too hard to navigate.

## Solution

BridgeCare provides:

- **Conversational intake** — users describe their situation in plain language; the AI determines eligibility and collects missing information via dynamic forms.
- **Automated document preparation** — generates pre-filled PDF documents and bundles them into a downloadable ZIP archive.
- **Application tracking** — a journey dashboard with checklists, progress bars, and cycle archival so users can manage multiple applications over time.

---

## User Flow (5 Steps)

| Step | Name | Description |
|------|------|-------------|
| 1 | **Discovery** | User describes their situation; AI analyzes intent and eligibility |
| 2 | **Profile** | Dynamic forms collect missing personal/financial data |
| 3 | **Selection** | AI recommends matching welfare programs with resource links |
| 4 | **Action** | Guided document preparation (image upload → PDF generation) |
| 5 | **Journey** | Track application progress, checklists, and archive past cycles |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript 5, Vite 5 |
| Styling | Tailwind CSS v3, shadcn/ui component library |
| State Management | React Context API (`WelfareContext`) |
| AI — Eligibility Analysis | DeepSeek API (proxied via Supabase Edge Function) |
| AI — Resource Search | Exa Search API (proxied via Supabase Edge Function) |
| Document Generation | jsPDF (image-to-PDF conversion) |
| Document Packaging | JSZip (flat ZIP archive bundling) |
| Backend / Edge Functions | Supabase Edge Functions (Deno runtime) |
| Hosting | Lovable Cloud |

---

## Architecture Overview

```
┌─────────────────────────────────┐
│         React Frontend          │
│  ChatInterface ← WelfareContext │
│  DynamicForm / DocPrepChat      │
│  JourneyPanel / TerminalConsole │
└──────────┬──────────────────────┘
           │ supabase.functions.invoke()
           ▼
┌─────────────────────────────────┐
│    Supabase Edge Functions      │
│  ┌─────────────┐ ┌───────────┐ │
│  │deepseek-proxy│ │exa-search │ │
│  └──────┬──────┘ └─────┬─────┘ │
│         ▼              ▼       │
│    DeepSeek API    Exa Search  │
└─────────────────────────────────┘
```

### Key Components

- **`ChatInterface`** — Main conversational UI; sends user messages to the DeepSeek agent and renders responses, forms, and welfare cards.
- **`DynamicForm`** — Auto-generated forms based on AI-detected missing fields (age, income, household size, etc.).
- **`WelfareCardList`** — Displays matched welfare programs with Exa-sourced resource links.
- **`DocPrepChat`** — Step-by-step document preparation wizard (user info collection → image upload → PDF generation).
- **`JourneyPanel`** — Application tracker with per-program checklists and progress visualization.
- **`TerminalConsole`** — Developer-facing log panel showing agent reasoning, API calls, and state transitions.
- **`BreadcrumbStepper`** — Visual step indicator for the 5-step workflow.

### State Management

`WelfareContext` manages the entire application lifecycle:

- **Step navigation** with completion tracking and back-navigation (resets subsequent steps)
- **Chat message history** including text, form requests, and welfare card responses
- **Journey applications** with checklist items, progress percentages, and status transitions
- **Document preparation sessions** with multi-document support and user info collection
- **Cycle archival** — archives current applications and resets the workflow for a new inquiry

---

## Project Structure

```
src/
├── components/
│   ├── ChatInterface.tsx      # Main chat UI
│   ├── DynamicForm.tsx        # AI-driven form generation
│   ├── WelfareCardList.tsx    # Program recommendation cards
│   ├── DocPrepChat.tsx        # Document preparation wizard
│   ├── JourneyPanel.tsx       # Application tracking dashboard
│   ├── TerminalConsole.tsx    # Agent reasoning logs
│   ├── BreadcrumbStepper.tsx  # Step progress indicator
│   └── ui/                   # shadcn/ui primitives
├── context/
│   └── WelfareContext.tsx     # Global state provider
├── services/
│   ├── deepseek.ts            # DeepSeek API client
│   └── exa.ts                 # Exa Search API client
├── types/
│   └── welfare.ts             # TypeScript interfaces
├── data/
│   └── mockData.ts            # Initial messages & sample programs
└── pages/
    └── Index.tsx              # Main page layout

supabase/functions/
├── deepseek-proxy/index.ts    # DeepSeek API proxy
└── exa-search/index.ts        # Exa Search API proxy
```

---

## Getting Started

This project is built and deployed on [Lovable](https://lovable.dev). To run locally:

```bash
npm install
npm run dev
```

Ensure the required API keys (`DEEPSEEK_API_KEY`, `EXA_API_KEY`) are configured as Supabase Edge Function secrets.

---

## License

MIT