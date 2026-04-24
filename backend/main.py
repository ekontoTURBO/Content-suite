from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data Models
class VideoRequest(BaseModel):
    url: str

class TranscriptRequest(BaseModel):
    video_id: str

class TagGenerationRequest(BaseModel):
    transcript_text: str
    provider: str # "openai" or "gemini"
    api_key: str
    universal_tags: Optional[str] = "finanse, inwestowanie, pieniądze, giełda"

class Settings(BaseModel):
    openai_key: Optional[str] = ""
    gemini_key: Optional[str] = ""
    openrouter_key: Optional[str] = ""
    provider: Optional[str] = "gemini"  # "openai" | "gemini" | "openrouter"

SETTINGS_FILE = "settings.json"

# Helper: Load/Save Settings
def load_settings():
    if os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE, "r") as f:
            return json.load(f)
    return {"openai_key": "", "gemini_key": "", "openrouter_key": "", "provider": "gemini"}

def save_settings(settings: dict):
    with open(SETTINGS_FILE, "w") as f:
        json.dump(settings, f)


@app.get("/")
def read_root():
    return {"message": "YouTube Transcript App Backend is Running"}

@app.get("/api/settings")
def get_settings():
    return load_settings()

@app.post("/api/settings")
def update_settings(settings: Settings):
    save_settings(settings.dict())
    return {"message": "Settings saved"}

@app.post("/api/fetch-videos")
def fetch_videos(request: VideoRequest):
    """
    Fetches video metadata from a URL (Video, Playlist, or Channel) using yt-dlp.
    """
    url = request.url
    
    # Heuristic: If it looks like a channel root URL, append /videos to get uploads
    # e.g. youtube.com/@Channel -> youtube.com/@Channel/videos
    # This often helps yt-dlp pick the right tab.
    if "/@" in url and not url.endswith("/videos") and not url.endswith("/featured") and not "watch?v=" in url:
        url += "/videos"

    ydl_opts = {
        'extract_flat': True, # Don't download video, just get metadata
        'dump_single_json': True,
        'quiet': True,
        'ignoreerrors': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            result = ydl.extract_info(url, download=False)
            
            videos = []
            
            # Helper to process a single entry
            def process_entry(entry):
                if not entry: return None
                return {
                    'id': entry.get('id'),
                    'title': entry.get('title'),
                    'duration': entry.get('duration'),
                    'uploader': entry.get('uploader'),
                    'view_count': entry.get('view_count'),
                    'thumbnail': entry.get('thumbnail', None) or f"https://img.youtube.com/vi/{entry.get('id')}/mqdefault.jpg"
                }

            if 'entries' in result:
                # Playlist or Channel (result['entries'] might be a generator or list)
                # explicit extract_flat usually returns a list of dicts.
                cnt = 0
                for entry in result['entries']:
                    v = process_entry(entry)
                    if v:
                        videos.append(v)
                        cnt += 1
                        if cnt >= 500: # Limit to 500 videos to prevent hanging
                            break
            else:
                # Single Video
                v = process_entry(result)
                if v:
                    videos.append(v)
                
            return {"videos": videos, "title": result.get('title', 'Unknown Collection')}
            
    except Exception as e:
        print(f"Error fetching URL {url}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

import openai
from google import genai
from google.genai import types

@app.post("/api/fetch-transcript")
def fetch_transcript(request: TranscriptRequest):
    """
    Fetches transcript for a single video using youtube-transcript-api.
    Adapted for v1.2.x API (Instance methods).
    """
    try:
        # Check for cookies.txt
        cookies_file = "cookies.txt"
        if not os.path.exists(cookies_file):
            cookies_file = None

        # Instantiate API (Required for this version)
        yt_api = YouTubeTranscriptApi() 
        
        transcript_obj = None
        text_formatted = ""
        transcript_data = []

        # 1. Try to fetch directly (simplest)
        try:
             transcript_data = yt_api.fetch(request.video_id)
             # If successful, format it
             formatter = TextFormatter()
             text_formatted = formatter.format_transcript(transcript_data)
             return {
                "transcript_data": transcript_data,
                "transcript_text": text_formatted,
                "language": "unknown", 
                "is_generated": False
             }
        except Exception as direct_error:
             print(f"Direct fetch failed: {direct_error}")
             # 2. Try listing to find alternatives
             try:
                 transcript_list = yt_api.list(request.video_id)
                 found = None
                 try:
                     for t in transcript_list:
                         found = t
                         break
                 except:
                     pass
                 
                 if found:
                      transcript_data = found.fetch()
                      formatter = TextFormatter()
                      text_formatted = formatter.format_transcript(transcript_data)
                      return {
                        "transcript_data": transcript_data,
                        "transcript_text": text_formatted,
                        "language": getattr(found, 'language', 'unknown'),
                        "is_generated": getattr(found, 'is_generated', False)
                      }
             except Exception as list_error:
                 print(f"List failed: {list_error}")
             
             # If we are here, everything failed.
             raise direct_error

    except Exception as e:
        print(f"Error fetching transcript for {request.video_id}: {e}")
        # Handle cases where transcript is disabled or not found
        raise HTTPException(status_code=404, detail=f"Transcript not found. Details: {str(e)}")

@app.post("/api/generate-tags")
def generate_tags(request: TagGenerationRequest):
    # Polish System Logic
    user_universal_tags = request.universal_tags or ""
    
    final_prompt = f"""
    Działaj jako ekspert od optymalizacji tagów YouTube, specjalizujący się w zwiększaniu widoczności filmów poprzez precyzyjne dobieranie słów kluczowych na podstawie dostarczonych treści (tekstów, transkrypcji, opisów).

    Twórz listy tagów, które są maksymalnie efektywne, ponadczasowe i ściśle związane z tematyką finansową oraz specyficznym tematem filmu.

    Priorytetem są krótkie, proste frazy (2-4 słowa), które odzwierciedlają naturalne zapytania wpisywane przez użytkowników w wyszukiwarkę (np. "jak kupić akcje" zamiast "akcje").

    LIMIT ZNAKÓW: Cała lista tagów (Tagi uniwersalne + Tagi specyficzne) musi zamknąć się w łącznej liczbie 500 znaków. Jeśli lista przekracza ten limit, usuwaj tagi od końca (najbardziej ogólne), aby zachować te najbardziej precyzyjne.

    Zachowanie i Zasady:

    Analiza i Generowanie:

    a) Rozpocznij od listy tagów uniwersalnych: {user_universal_tags}

    b) Dokładnie przeanalizuj dostarczony poniżej tekst (transkrypcję), aby zidentyfikować główny temat i wątki poboczne.

    c) Generowanie fraz: Twórz wariacje w formie prostych zapytań: "jak...", "czy warto...", "podstawy...", "sposoby na...". Unikaj pojedynczych słów.

    Restrykcje i Filtry:

    a) Zakaz używania dat (np. 2024, 2025) oraz nazw miesięcy.

    b) Zakaz używania określeń czasowych (np. nowy, najnowszy, aktualny, tegoroczny).

    c) Wszystkie tagi muszą być ponadczasowe.

    d) BEZWZGLĘDNY ZAKAZ dodawania jakiegokolwiek tekstu poza tagami. Nie pisz: "Oto Twoje tagi:", "Gotowe", ani żadnych wyjaśnień.

    Formatowanie:

    a) Wynikiem musi być wyłącznie jeden ciąg tekstu oddzielony przecinkami.

    b) Nie stosuj numeracji, punktorów ani spacji po przecinkach, jeśli ma to pomóc w zmieszczeniu się w limicie 500 znaków.

    c) Kolejność: Tagi uniwersalne -> Najbardziej precyzyjne frazy specyficzne dla tekstu -> Wariacje wyszukiwań -> Szerokie terminy branżowe.

    d) SUMARYCZNA KONTROLA: Przed wyświetleniem wyniku upewnij się, że suma znaków tagów uniwersalnych i wygenerowanych fraz nie przekracza 500.

    Ton i Styl:

    Wyłącznie techniczny output. Zero zbędnej komunikacji.

    FINALNY GUARDRAIL TECHNICZNY:

    Twoja odpowiedź musi zawierać TYLKO I WYŁĄCZNIE tagi oddzielone przecinkami.

    Zakaz pisania: "Oto tagi", "Gotowe", "Oto lista".

    Zakaz używania lat (np. 2026) i miesięcy (np. październik).

    Odpowiedź musi zaczynać się od pierwszego tagu i kończyć na ostatnim.

    Każdy znak poza schematem tag,tag,tag jest błędem krytycznym. Podaj listę tagów dla poniższego tekstu:
    
    TRANSKRYPCJA:
    {request.transcript_text[:10000]}
    """

    try:
        if request.provider == "openai":
            if not request.api_key:
                raise HTTPException(status_code=400, detail="OpenAI API Key provided is empty")
            
            client = openai.OpenAI(api_key=request.api_key)
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a specialized YouTube tag generator. Output ONLY csv tags."},
                    {"role": "user", "content": final_prompt}
                ]
            )
            content = response.choices[0].message.content
            tags = [tag.strip() for tag in content.split(',')]
            return {"tags": tags, "provider": "openai"}

        elif request.provider == "gemini":
            if not request.api_key:
                raise HTTPException(status_code=400, detail="Gemini API Key provided is empty")

            client = genai.Client(api_key=request.api_key)
            response = client.models.generate_content(
                model='gemini-3-flash-preview',
                contents=final_prompt
            )

            tags = [tag.strip() for tag in response.text.split(',')]
            return {"tags": tags, "provider": "gemini"}

        elif request.provider == "openrouter":
            if not request.api_key:
                raise HTTPException(status_code=400, detail="OpenRouter API Key provided is empty")

            client = openai.OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=request.api_key,
            )
            response = client.chat.completions.create(
                model="google/gemini-2.5-flash-preview",
                messages=[
                    {"role": "system", "content": "You are a specialized YouTube tag generator. Output ONLY csv tags."},
                    {"role": "user", "content": final_prompt}
                ]
            )
            content = response.choices[0].message.content
            tags = [tag.strip() for tag in content.split(',')]
            return {"tags": tags, "provider": "openrouter"}

        else:
            raise HTTPException(status_code=400, detail="Invalid provider. Choose 'openai', 'gemini', or 'openrouter'.")

    except Exception as e:
        print(f"Error generating tags: {e}")
        raise HTTPException(status_code=500, detail=f"Tag generation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
