import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

export const saveSettings = async (settings) => {
  const response = await api.post('/settings', settings);
  return response.data;
};

export const fetchVideos = async (url) => {
  const response = await api.post('/fetch-videos', { url });
  return response.data;
};

export const fetchTranscript = async (videoId) => {
  const response = await api.post('/fetch-transcript', { video_id: videoId });
  return response.data;
};

export const generateTags = async (transcriptText, provider, apiKey, universalTags) => {
  const response = await api.post('/generate-tags', {
    transcript_text: transcriptText,
    provider,
    api_key: apiKey,
    universal_tags: universalTags
  });
  return response.data;
};
