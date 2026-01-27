import React, { useState } from 'react';
import { X, FileText, Tag, Loader, Copy } from 'lucide-react';
import { fetchTranscript, generateTags } from '../api';

const VideoDetail = ({ video, isOpen, onClose, universalTags }) => {
    const [activeTab, setActiveTab] = useState('details'); // details, transcript, tags
    const [transcript, setTranscript] = useState(null);
    const [transcriptText, setTranscriptText] = useState('');
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [provider, setProvider] = useState('openai'); // 'openai' | 'gemini'

    // Fetch transcript on open if not fetched
    // Actually, we should probably fetch only on demand or if auto-process ran.
    // For now, let's allow manual fetch.

    const handleFetchTranscript = async () => {
        setLoading(true);
        try {
            const data = await fetchTranscript(video.id);
            setTranscript(data.transcript_data);
            setTranscriptText(data.transcript_text);
            setActiveTab('transcript');
        } catch (error) {
            alert("Failed to fetch transcript: " + (error.response?.data?.detail || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateTags = async () => {
        if (!transcriptText) {
            alert("Please fetch transcript first!");
            return;
        }
        setLoading(true);
        // Get stored API keys to decide visible options? 
        // Ideally user selects provider here.
        try {
            const stored = JSON.parse(await fetchSettings());
            // Wait, we can't await async in synchronous flow easily without state or passing props.
            // We'll trust the user selected provider has a key or backend will error.
        } catch (e) { }

        try {
            // Need API keys... API function handles sending keys? 
            // api.js `generateTags` expects apiKey.
            // We need to fetch settings or assume backend handles it?
            // My backend implementation expects `api_key` in request body.
            // So frontend must read it.
            // I'll assume parent passes settings or we fetch them here.
            // Let's simplified: fetch settings right before calling.
            const settings = await import('../api').then(m => m.fetchSettings());
            const apiKey = provider === 'openai' ? settings.openai_key : settings.gemini_key;

            const data = await generateTags(transcriptText, provider, apiKey, universalTags);
            setTags(data.tags);
            setActiveTab('tags');
        } catch (error) {
            alert("Failed to generate tags: " + (error.response?.data?.detail || error.message));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !video) return null;

    return (
        <div className="fixed inset-0 z-50 flex-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}>
            <div className="glass-panel" style={{ width: '90%', maxWidth: '1000px', height: '85vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%' }}>{video.title}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X /></button>
                </div>

                {/* Content Container */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                    {/* Sidebar / Tabs */}
                    <div style={{ width: '250px', borderRight: '1px solid var(--glass-border)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0,0,0,0.2)' }}>
                        <img src={video.thumbnail} alt="" style={{ width: '100%', borderRadius: '8px', marginBottom: '10px' }} />

                        <button
                            className={`btn ${activeTab === 'details' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ justifyContent: 'flex-start' }}
                            onClick={() => setActiveTab('details')}
                        >
                            Details
                        </button>
                        <button
                            className={`btn ${activeTab === 'transcript' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ justifyContent: 'flex-start' }}
                            onClick={() => transcriptText ? setActiveTab('transcript') : handleFetchTranscript()}
                            disabled={loading}
                        >
                            {loading && !transcriptText ? <Loader className="animate-spin" size={16} /> : <FileText size={16} />}
                            {transcriptText ? 'View Transcript' : 'Fetch Transcript'}
                        </button>
                        <button
                            className={`btn ${activeTab === 'tags' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ justifyContent: 'flex-start' }}
                            onClick={() => tags.length ? setActiveTab('tags') : handleGenerateTags()}
                            disabled={!transcriptText || loading}
                        >
                            {loading && transcriptText ? <Loader className="animate-spin" size={16} /> : <Tag size={16} />}
                            {tags.length > 0 ? 'View Tags' : 'Generate Tags'}
                        </button>

                        {/* Provider Selection */}
                        {transcriptText && !tags.length && (
                            <div style={{ marginTop: 'auto', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '5px' }}>AI Provider</label>
                                <select
                                    value={provider}
                                    onChange={(e) => setProvider(e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', background: '#222', color: 'white', border: '1px solid #444' }}
                                >
                                    <option value="openai">OpenAI</option>
                                    <option value="gemini">Gemini</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Main Area */}
                    <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>

                        {activeTab === 'details' && (
                            <div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Video Details</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="glass-panel" style={{ padding: '20px' }}>
                                        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Channel</p>
                                        <p style={{ fontSize: '1.1rem' }}>{video.uploader}</p>
                                    </div>
                                    <div className="glass-panel" style={{ padding: '20px' }}>
                                        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Duration</p>
                                        <p style={{ fontSize: '1.1rem' }}>{video.duration_string || video.duration}</p>
                                    </div>
                                    <div className="glass-panel" style={{ padding: '20px', gridColumn: 'span 2' }}>
                                        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Video ID</p>
                                        <p style={{ fontFamily: 'monospace' }}>{video.id}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'transcript' && (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <h3>Transcript</h3>
                                    <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '0.8rem' }} onClick={() => navigator.clipboard.writeText(transcriptText)}>
                                        <Copy size={14} /> Copy
                                    </button>
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', lineHeight: '1.8' }}>
                                    {transcriptText}
                                </div>
                            </div>
                        )}

                        {activeTab === 'tags' && (
                            <div>
                                <h3>Generated Tags</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' }}>
                                    {tags.map((tag, i) => (
                                        <span key={i} style={{
                                            background: 'var(--accent-color)',
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            fontSize: '0.9rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            # {tag}
                                        </span>
                                    ))}
                                </div>
                                <button className="btn btn-secondary" style={{ marginTop: '30px' }} onClick={() => navigator.clipboard.writeText(tags.join(', '))}>
                                    Copy All
                                </button>
                            </div>
                        )}

                    </div>

                </div>

            </div>
        </div>
    );
};

export default VideoDetail;
