# YouTube Transcript & Tag Generator

A premium web application to fetch metadata, transcripts, and generate AI-powered tags for YouTube videos, playlists, and channels.

## Features
- **Fetch Metadata**: Robust support for Videos, Playlists, and Channels using `yt-dlp`.
- **Transcripts**: Direct integration with `youtube-transcript-api` to fetch manual or auto-generated captions.
- **AI Tag Generation**: Generate SEO-optimized tags using **OpenAI (GPT-3.5)** or **Google Gemini**.
- **Batch Processing**: Select a range of videos (e.g., 1-50) to fetch transcripts in bulk.
- **Premium UI**: Modern, dark-mode React interface with glassmorphism design.

## Installation

### Prerequisites
- **Python 3.8+**
- **Node.js 16+**

### 1. Backend Setup
Open a terminal in the `backend` folder:
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# Install dependencies
pip install -r requirements.txt
```

### 2. Frontend Setup
Open a terminal in the `frontend` folder:
```bash
cd frontend
npm install
```

## How to Run

The easiest way to start the application is using the included PowerShell script:

1.  Open the project root folder in PowerShell.
2.  Run the restart script:
    ```powershell
    .\start_app.ps1
    ```
    *(This will launch two terminal windows: one for the FastAPI backend acting on port 8000, and one for the Vite frontend on port 5173).*

Alternatively, you can run them manually:
- **Backend**: `uvicorn main:app --reload` (inside `backend` folder with venv active)
- **Frontend**: `npm run dev` (inside `frontend` folder)

## Usage Guide

1.  **Configure API Keys**:
    - Click the **Settings** button (top right).
    - Enter your **OpenAI API Key** or **Gemini API Key**.
    - Click Save. Keys are stored locally in `backend/settings.json`.

2.  **Fetch Videos**:
    - Paste a YouTube URL (Video, Playlist, or Channel) into the search bar.
    - Click **Fetch**.
    - The scrollable list will populate with video metadata.

3.  **Get Transcripts**:
    - **Single Video**: Click "Details" on any video card, then click "Fetch Transcript".
    - **Bulk (Range)**:
        - Enter a start and end index (e.g., Range: 0 to 10) above the list.
        - Click the **Fetch Transcripts** button to process them automatically.

4.  **Generate Tags**:
    - Open a video's details (must have transcript fetched).
    - Click **Generate Tags**.
    - Select your provider (OpenAI or Gemini) if prompted.
    - Copy the generated tags to your clipboard.

## Troubleshooting
- **Transcript Not Found**: Some videos do not have captions/transcripts available. The app attempts to find any available language/auto-generated caption, but if none exist, it will fail for that specific video.
- **API Errors**: Ensure your API keys are valid and have credits/quota.
