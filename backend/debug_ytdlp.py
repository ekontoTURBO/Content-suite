import yt_dlp
import json

urls = [
    "https://www.youtube.com/watch?v=4bjywOkQAA4",
    "https://www.youtube.com/@FxMag"
]

ydl_opts = {
    'extract_flat': True,
    'dump_single_json': True,
    'quiet': True,
    'ignoreerrors': True,
}

for url in urls:
    print(f"\n--- Testing URL: {url} ---")
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            result = ydl.extract_info(url, download=False)
            
            if not result:
                print("Result is None")
                continue

            print(f"Keys: {list(result.keys())}")
            if 'entries' in result:
                print(f"Entries found: {len(result['entries'])}")
                if len(result['entries']) > 0:
                    print(f"First entry keys: {list(result['entries'][0].keys())}")
                    print(f"First entry sample: {result['entries'][0]}")
            else:
                print("No 'entries' key found (Single video?)")
                print(f"ID: {result.get('id')}")
                print(f"Title: {result.get('title')}")
                
    except Exception as e:
        print(f"Error: {e}")
