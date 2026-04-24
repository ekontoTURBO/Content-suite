import React from 'react';
import { Play, Clock, CheckCircle, Loader, Tag, Eye } from 'lucide-react';

const VideoList = ({ videos, selectedRange, onVideoClick, processingIds, completedIds, tagProcessingIds, tagCompletedIds }) => {
    if (!videos.length) {
        return (
            <div className="flex-center" style={{ height: '300px', flexDirection: 'column', color: 'var(--text-secondary)' }}>
                <p>No videos found. Paste a URL to get started.</p>
            </div>
        );
    }

    // Helper to check if video is in selected range
    // Assuming list is ordered, index is enough?
    // User said "0 to 30", likely referring to index.
    const isInRange = (index) => {
        return index >= selectedRange[0] && index <= selectedRange[1];
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', padding: '20px' }}>
            {videos.map((video, index) => {
                const inRange = isInRange(index);
                const isProcessing = processingIds.includes(video.id);
                const isCompleted = completedIds.includes(video.id);
                const isTagProcessing = tagProcessingIds?.includes(video.id);
                const isTagCompleted = tagCompletedIds?.includes(video.id);

                return (
                    <div
                        key={video.id}
                        onClick={() => onVideoClick(video)}
                        className="glass-panel"
                        style={{
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: inRange ? '1px solid var(--accent-color)' : '1px solid var(--glass-border)',
                            opacity: inRange ? 1 : 0.6,
                            transform: inRange ? 'scale(1)' : 'scale(0.98)',
                            transition: 'all 0.3s ease',
                            position: 'relative'
                        }}
                    >
                        {/* Thumbnail */}
                        <div style={{ position: 'relative', height: '180px', width: '100%' }}>
                            <img
                                src={video.thumbnail}
                                alt={video.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{
                                position: 'absolute',
                                bottom: '10px',
                                right: '10px',
                                background: 'rgba(0,0,0,0.8)',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '0.8rem'
                            }}>
                                {video.duration_string || '00:00'}
                            </div>

                            {/* Status Overlays */}
                            <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                                {(isProcessing || isCompleted) && (
                                    <div style={{
                                        background: isCompleted ? 'var(--success)' : 'var(--accent-color)',
                                        borderRadius: '50%',
                                        width: '30px',
                                        height: '30px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                                    }} title="Transcript">
                                        {isProcessing ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                    </div>
                                )}
                                {(isTagProcessing || isTagCompleted) && (
                                    <div style={{
                                        background: isTagCompleted ? '#f59e0b' : 'var(--accent-color)',
                                        borderRadius: '50%',
                                        width: '30px',
                                        height: '30px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                                    }} title="Tags">
                                        {isTagProcessing ? <Loader size={16} className="animate-spin" /> : <Tag size={16} />}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '15px' }}>
                            <div style={{
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)',
                                marginBottom: '5px',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}>
                                <span>#{index + 1}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {video.view_count != null && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <Eye size={12} />
                                            {video.view_count >= 1000000 ? (video.view_count / 1000000).toFixed(1) + 'M' : video.view_count >= 1000 ? (video.view_count / 1000).toFixed(1) + 'K' : video.view_count}
                                        </span>
                                    )}
                                    <span>{video.uploader}</span>
                                </span>
                            </div>
                            <h3 style={{
                                fontSize: '1rem',
                                fontWeight: '600',
                                marginBottom: '10px',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                            }} title={video.title}>
                                {video.title}
                            </h3>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default VideoList;
