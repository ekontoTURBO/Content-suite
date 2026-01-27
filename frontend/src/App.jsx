import React, { useState } from 'react';
import { Settings, Search, Play, Download, Zap } from 'lucide-react';
import { fetchVideos, fetchTranscript } from './api';
import VideoList from './components/VideoList';
import SettingsModal from './components/SettingsModal';
import VideoDetail from './components/VideoDetail';
import './index.css';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState([]);
  const [collectionTitle, setCollectionTitle] = useState('');
  const [universalTags, setUniversalTags] = useState('finanse, inwestowanie, pieniądze, giełda');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd, setRangeEnd] = useState(0);

  const [processingIds, setProcessingIds] = useState([]);
  const [completedIds, setCompletedIds] = useState([]);

  const handleFetchVideos = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const data = await fetchVideos(url);
      setVideos(data.videos);
      setCollectionTitle(data.title);
      // Reset Range to full
      setRangeStart(0);
      setRangeEnd(data.videos.length > 0 ? data.videos.length - 1 : 0);
    } catch (error) {
      alert("Error fetching videos: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleBatchProcessor = async () => {
    // Get videos in range
    const videosToProcess = videos.filter((_, idx) => idx >= rangeStart && idx <= rangeEnd);
    if (!videosToProcess.length) return;

    // We process them one by one or in small batches to avoid rate limits? 
    // The user said "program performs transcribe fetchy for each video in the list".

    for (const video of videosToProcess) {
      if (completedIds.includes(video.id)) continue;

      setProcessingIds(prev => [...prev, video.id]);
      try {
        await fetchTranscript(video.id);
        setCompletedIds(prev => [...prev, video.id]);
      } catch (error) {
        console.error(`Failed to fetch for ${video.id}`, error);
        // Maybe mark as error?
      } finally {
        setProcessingIds(prev => prev.filter(id => id !== video.id));
      }
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="container flex-center" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Zap color="var(--accent-color)" size={24} fill="var(--accent-color)" />
            <h1 style={{ fontSize: '1.2rem', fontWeight: '700' }}>TranscriptGenius</h1>
          </div>
          <button onClick={() => setIsSettingsOpen(true)} className="btn btn-secondary">
            <Settings size={18} /> Settings
          </button>
        </div>
      </nav>

      <main className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>

        {/* Search Hero */}
        <div className="glass-panel" style={{ padding: '30px', marginBottom: '40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '20px', background: 'linear-gradient(to right, #fff, #aaa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Fetch Metadata & Transcripts
          </h2>
          <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Paste YouTube Playlist, Channel, or Video URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetchVideos()}
            />
            <button className="btn btn-primary" onClick={handleFetchVideos} disabled={loading}>
              <Search size={18} /> {loading ? 'Fetching...' : 'Fetch'}
            </button>
          </div>

          {/* Universal Tags Input */}
          <div style={{ textAlign: 'left', marginTop: '15px', maxWidth: '600px', margin: '15px auto 0' }}>
            <label style={{ fontSize: '0.8rem', color: '#aaa', marginLeft: '5px', marginBottom: '5px', display: 'block' }}>Universal Tags (included in every generation)</label>
            <input
              type="text"
              className="input-field"
              style={{ fontSize: '0.9rem' }}
              value={universalTags}
              onChange={(e) => setUniversalTags(e.target.value)}
              placeholder="Enter universal tags (e.g., finanse, giełda)..."
            />
          </div>
        </div>

        {/* Controls & List */}
        {videos.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem' }}>{collectionTitle}</h3>
                <p style={{ color: '#aaa' }}>{videos.length} videos found</p>
              </div>

              {/* Range Selector & Actions */}
              <div className="glass-panel" style={{ padding: '15px 25px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: '#aaa' }}>Range:</span>
                  <input
                    type="number"
                    className="input-field"
                    style={{ width: '70px', padding: '5px' }}
                    value={rangeStart}
                    min="0"
                    max={videos.length - 1}
                    onChange={(e) => setRangeStart(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                  <span style={{ color: '#aaa' }}>to</span>
                  <input
                    type="number"
                    className="input-field"
                    style={{ width: '70px', padding: '5px' }}
                    value={rangeEnd}
                    min="0"
                    max={videos.length - 1}
                    onChange={(e) => setRangeEnd(Math.min(videos.length - 1, parseInt(e.target.value) || 0))}
                  />
                </div>

                <div style={{ height: '30px', width: '1px', background: '#444' }}></div>

                <button className="btn btn-primary" onClick={handleBatchProcessor}>
                  <Download size={16} /> Fetch Transcripts ({rangeEnd - rangeStart + 1})
                </button>
              </div>
            </div>

            <VideoList
              videos={videos}
              selectedRange={[rangeStart, rangeEnd]}
              onVideoClick={setSelectedVideo}
              processingIds={processingIds}
              completedIds={completedIds}
            />
          </div>
        )}

      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={() => { }}
      />

      <VideoDetail
        video={selectedVideo}
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        universalTags={universalTags}
      />

    </div>
  );
}

export default App;
