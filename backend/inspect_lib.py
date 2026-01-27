from youtube_transcript_api import YouTubeTranscriptApi
import json

video_id = "smvwrEPc_6U" # The ID that failed

print(f"Fetching for {video_id} using Instance Method...")
try:
    api = YouTubeTranscriptApi()
    # Try list first
    transcripts = api.list(video_id)
    print("List success!")
    
    # Try to find english or generated
    # The return type seems to be 'FetchedTranscript' or similar iterable?
    # Signatue said -> youtube_transcript_api._transcripts.FetchedTranscript...
    
    # Let's just print what we get
    # print(transcripts) 
    
    # Try fetch directly
    print("Trying fetch direct...")
    content = api.fetch(video_id)
    print("Fetch success!")
    print(f"Content length: {len(content)}")
    
except Exception as e:
    print(f"Error: {e}")
