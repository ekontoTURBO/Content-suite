<div align="center">

# Content Suite

**YouTube transcript & SEO tag generator** for videos, playlists, and channels.
Fetch metadata, pull captions in bulk, generate AI-optimized tags in one place.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Node 16+](https://img.shields.io/badge/node-16+-339933.svg)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React + Vite](https://img.shields.io/badge/React-Vite-61DAFB.svg)](https://vitejs.dev/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--3.5-412991.svg)](https://platform.openai.com/)
[![Gemini](https://img.shields.io/badge/Gemini-API-4285F4.svg)](https://aistudio.google.com/)

</div>

---

## What it does

| Capability | How |
|---|---|
| **Fetch metadata** | Videos, playlists, and channels via `yt-dlp` |
| **Pull transcripts** | Manual or auto-generated captions via `youtube-transcript-api` |
| **Batch transcripts** | Process ranges (e.g. videos 1–50) in bulk |
| **AI tag generation** | SEO-optimized tags via OpenAI GPT-3.5 or Google Gemini |
| **Premium UI** | Dark-mode React interface with glassmorphism |

---

## Stack

```
┌────────────────────┐         ┌────────────────────┐
│  React + Vite      │ ◄─────► │  FastAPI (Python)  │
│  Tailwind / glass  │  REST   │  yt-dlp + transcr. │
│  :5173             │         │  OpenAI / Gemini   │
└────────────────────┘         └────────────────────┘
```

- **Frontend** — React + Vite + Tailwind, glassmorphism dark mode
- **Backend** — FastAPI + `yt-dlp` + `youtube-transcript-api`
- **AI** — OpenAI GPT-3.5 or Google Gemini for tag synthesis
- **Settings** — keys stored locally in `backend/settings.json`

---

## Quick start

### Prerequisites

- Python 3.8+
- Node.js 16+

### One-shot launcher (Windows)

```powershell
.\start_app.ps1
```

Spawns two terminals: FastAPI backend on `:8000`, Vite frontend on `:5173`.

### Manual setup

**Backend:**

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate     # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

---

## Usage

1. **Configure API keys** — Settings button (top right) → paste OpenAI or Gemini key → Save. Keys stored in `backend/settings.json` (local only).
2. **Fetch videos** — paste a YouTube URL (video / playlist / channel) → **Fetch**. The scrollable list populates with metadata.
3. **Get transcripts**
   - Single: click **Details** → **Fetch Transcript**
   - Bulk: enter a range (e.g. 0–10) above the list → **Fetch Transcripts**
4. **Generate tags** — open a video's details (transcript required) → **Generate Tags** → pick provider → copy to clipboard.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| **Transcript Not Found** | Video has no captions. The app tries every available language + auto-gen; if none exist, it fails for that video only. |
| **API errors** | Verify the key is valid and the account has credits / quota. |
| **`yt-dlp` outdated** | `pip install -U yt-dlp` — YouTube changes frequently. |

---

## License

MIT. Use, fork, ship.
