import React, { useState } from 'react';
import { Settings, Search, Play, Download, Zap, Tag, Filter } from 'lucide-react';
import { fetchVideos, fetchTranscript, fetchSettings, generateTags } from './api';
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
  const [transcripts, setTranscripts] = useState({}); // { videoId: { text, data } }
  const [generatedTags, setGeneratedTags] = useState({}); // { videoId: string[] }
  const [tagProcessingIds, setTagProcessingIds] = useState([]);
  const [tagCompletedIds, setTagCompletedIds] = useState([]);

  // Filters
  const [minViews, setMinViews] = useState('');
  const [maxViews, setMaxViews] = useState('');
  const [minDuration, setMinDuration] = useState('');
  const [maxDuration, setMaxDuration] = useState('');
  const [titleSearch, setTitleSearch] = useState('');

  const applyFilters = (videoList) => {
    return videoList.filter(v => {
      if (minViews && (v.view_count == null || v.view_count < parseInt(minViews))) return false;
      if (maxViews && v.view_count != null && v.view_count > parseInt(maxViews)) return false;
      if (minDuration && (v.duration == null || v.duration < parseInt(minDuration))) return false;
      if (maxDuration && v.duration != null && v.duration > parseInt(maxDuration)) return false;
      if (titleSearch && !v.title?.toLowerCase().includes(titleSearch.toLowerCase())) return false;
      return true;
    });
  };

  const filteredVideos = applyFilters(videos);
  const hasActiveFilters = minViews || maxViews || minDuration || maxDuration || titleSearch;

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
      // Reset filters
      setMinViews(''); setMaxViews(''); setMinDuration(''); setMaxDuration(''); setTitleSearch('');
    } catch (error) {
      alert("Error fetching videos: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleBatchProcessor = async () => {
    const videosToProcess = filteredVideos.filter((_, idx) => idx >= rangeStart && idx <= rangeEnd);
    if (!videosToProcess.length) return;

    for (const video of videosToProcess) {
      if (completedIds.includes(video.id)) continue;

      setProcessingIds(prev => [...prev, video.id]);
      try {
        const result = await fetchTranscript(video.id);
        setTranscripts(prev => ({ ...prev, [video.id]: { text: result.transcript_text, data: result.transcript_data } }));
        setCompletedIds(prev => [...prev, video.id]);
      } catch (error) {
        console.error(`Failed to fetch for ${video.id}`, error);
        // Maybe mark as error?
      } finally {
        setProcessingIds(prev => prev.filter(id => id !== video.id));
      }
    }
  };

  const handleBatchTagGeneration = async () => {
    const videosInRange = filteredVideos.filter((_, idx) => idx >= rangeStart && idx <= rangeEnd);
    const videosWithTranscripts = videosInRange.filter(v => transcripts[v.id]?.text);

    if (!videosWithTranscripts.length) {
      alert("No transcripts available in selected range. Fetch transcripts first.");
      return;
    }

    let settings;
    try {
      settings = await fetchSettings();
    } catch {
      alert("Failed to load settings. Check that the backend is running.");
      return;
    }

    const provider = settings.provider || 'gemini';
    const keyMap = { openai: settings.openai_key, gemini: settings.gemini_key, openrouter: settings.openrouter_key };
    const apiKey = keyMap[provider] || '';

    if (!apiKey) {
      alert(`No API key set for ${provider}. Go to Settings to add one.`);
      return;
    }

    for (const video of videosWithTranscripts) {
      if (tagCompletedIds.includes(video.id)) continue;

      setTagProcessingIds(prev => [...prev, video.id]);
      try {
        const data = await generateTags(transcripts[video.id].text, provider, apiKey, universalTags);
        setGeneratedTags(prev => ({ ...prev, [video.id]: data.tags }));
        setTagCompletedIds(prev => [...prev, video.id]);
      } catch (error) {
        console.error(`Failed to generate tags for ${video.id}`, error);
      } finally {
        setTagProcessingIds(prev => prev.filter(id => id !== video.id));
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
            {/* Filter Bar */}
            <div className="glass-panel" style={{ padding: '15px 25px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Filter size={16} color={hasActiveFilters ? 'var(--accent-color)' : '#aaa'} />
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: hasActiveFilters ? 'var(--accent-color)' : '#aaa' }}>
                  Filters {hasActiveFilters ? `(${filteredVideos.length} / ${videos.length} videos)` : ''}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.8rem', color: '#aaa', whiteSpace: 'nowrap' }}>Views:</label>
                  <input type="number" className="input-field" style={{ width: '100px', padding: '6px 10px', fontSize: '0.85rem' }} placeholder="Min" value={minViews} onChange={(e) => setMinViews(e.target.value)} />
                  <span style={{ color: '#555' }}>-</span>
                  <input type="number" className="input-field" style={{ width: '100px', padding: '6px 10px', fontSize: '0.85rem' }} placeholder="Max" value={maxViews} onChange={(e) => setMaxViews(e.target.value)} />
                </div>
                <div style={{ height: '24px', width: '1px', background: '#333' }}></div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.8rem', color: '#aaa', whiteSpace: 'nowrap' }}>Duration (sec):</label>
                  <input type="number" className="input-field" style={{ width: '80px', padding: '6px 10px', fontSize: '0.85rem' }} placeholder="Min" value={minDuration} onChange={(e) => setMinDuration(e.target.value)} />
                  <span style={{ color: '#555' }}>-</span>
                  <input type="number" className="input-field" style={{ width: '80px', padding: '6px 10px', fontSize: '0.85rem' }} placeholder="Max" value={maxDuration} onChange={(e) => setMaxDuration(e.target.value)} />
                </div>
                <div style={{ height: '24px', width: '1px', background: '#333' }}></div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flex: 1, minWidth: '150px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#aaa', whiteSpace: 'nowrap' }}>Title:</label>
                  <input type="text" className="input-field" style={{ padding: '6px 10px', fontSize: '0.85rem' }} placeholder="Search title..." value={titleSearch} onChange={(e) => setTitleSearch(e.target.value)} />
                </div>
                {hasActiveFilters && (
                  <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '0.8rem' }} onClick={() => { setMinViews(''); setMaxViews(''); setMinDuration(''); setMaxDuration(''); setTitleSearch(''); }}>
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem' }}>{collectionTitle}</h3>
                <p style={{ color: '#aaa' }}>{filteredVideos.length} videos {hasActiveFilters ? `(filtered from ${videos.length})` : 'found'}</p>
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
                    max={filteredVideos.length - 1}
                    onChange={(e) => setRangeStart(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                  <span style={{ color: '#aaa' }}>to</span>
                  <input
                    type="number"
                    className="input-field"
                    style={{ width: '70px', padding: '5px' }}
                    value={rangeEnd}
                    min="0"
                    max={filteredVideos.length - 1}
                    onChange={(e) => setRangeEnd(Math.min(filteredVideos.length - 1, parseInt(e.target.value) || 0))}
                  />
                </div>

                <div style={{ height: '30px', width: '1px', background: '#444' }}></div>

                <button className="btn btn-primary" onClick={handleBatchProcessor}>
                  <Download size={16} /> Fetch Transcripts ({Math.min(rangeEnd, filteredVideos.length - 1) - rangeStart + 1})
                </button>

                <div style={{ height: '30px', width: '1px', background: '#444' }}></div>

                <button className="btn btn-primary" onClick={handleBatchTagGeneration} style={{ background: 'var(--success)', boxShadow: '0 0 15px rgba(34,197,94,0.3)' }}>
                  <Tag size={16} /> Generate Tags ({filteredVideos.filter((v, i) => i >= rangeStart && i <= rangeEnd && transcripts[v.id]?.text).length})
                </button>
              </div>
            </div>

            <VideoList
              videos={filteredVideos}
              selectedRange={[rangeStart, rangeEnd]}
              onVideoClick={setSelectedVideo}
              processingIds={processingIds}
              completedIds={completedIds}
              tagProcessingIds={tagProcessingIds}
              tagCompletedIds={tagCompletedIds}
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
        cachedTranscripts={transcripts}
        cachedTags={generatedTags}
        onTranscriptFetched={(videoId, text, data) => setTranscripts(prev => ({ ...prev, [videoId]: { text, data } }))}
        onTagsGenerated={(videoId, tags) => setGeneratedTags(prev => ({ ...prev, [videoId]: tags }))}
      />

    </div>
  );
}

export default App;
