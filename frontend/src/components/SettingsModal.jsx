import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { fetchSettings, saveSettings } from '../api';

const SettingsModal = ({ isOpen, onClose, onSave }) => {
    const [keys, setKeys] = useState({ openai_key: '', gemini_key: '', openrouter_key: '', provider: 'gemini' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadKeys();
        }
    }, [isOpen]);

    const loadKeys = async () => {
        try {
            const settings = await fetchSettings();
            setKeys(settings);
        } catch (error) {
            console.error("Failed to load settings", error);
        }
    };

    const handleChange = (e) => {
        setKeys({ ...keys, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await saveSettings(keys);
            onSave(keys); // Update parent state
            onClose();
        } catch (error) {
            console.error("Failed to save settings", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <div className="glass-panel" style={{ width: '500px', padding: '30px' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Settings</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#a3a3a3' }}>AI Provider</label>
                        <select
                            name="provider"
                            value={keys.provider}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--glass-border)', fontFamily: 'inherit', fontSize: '0.95rem' }}
                        >
                            <option value="openai">OpenAI (GPT-3.5)</option>
                            <option value="gemini">Google Gemini</option>
                            <option value="openrouter">OpenRouter</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#a3a3a3' }}>OpenAI API Key</label>
                        <input
                            type="password"
                            name="openai_key"
                            value={keys.openai_key}
                            onChange={handleChange}
                            placeholder="sk-..."
                            className="input-field"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#a3a3a3' }}>Gemini API Key</label>
                        <input
                            type="password"
                            name="gemini_key"
                            value={keys.gemini_key}
                            onChange={handleChange}
                            placeholder="AIza..."
                            className="input-field"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#a3a3a3' }}>OpenRouter API Key</label>
                        <input
                            type="password"
                            name="openrouter_key"
                            value={keys.openrouter_key}
                            onChange={handleChange}
                            placeholder="sk-or-..."
                            className="input-field"
                        />
                    </div>

                </div>

                {/* Footer */}
                <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onClose} className="btn btn-secondary">Cancel</button>
                    <button onClick={handleSave} className="btn btn-primary" disabled={loading}>
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save Keys'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SettingsModal;
