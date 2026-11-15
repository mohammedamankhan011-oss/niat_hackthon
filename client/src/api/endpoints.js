import { apiClient, isMockMode, delay } from './client.js';
import { mockBackend } from './mocks.js';

export const api = {
  // Auth endpoints
  auth: {
    signup: async (data) => {
      if (isMockMode) {
        await delay();
        return mockBackend.signup(data);
      }
      const res = await apiClient.post('/api/auth/signup', data);
      return res.data;
    },

    login: async (data) => {
      if (isMockMode) {
        await delay();
        return mockBackend.login(data);
      }
      const res = await apiClient.post('/api/auth/login', data);
      return res.data;
    },

    getMe: async () => {
      if (isMockMode) {
        await delay();
        return mockBackend.getMe();
      }
      const res = await apiClient.get('/api/auth/me');
      return res.data;
    },

    updateMe: async (data) => {
      if (isMockMode) {
        await delay();
        return mockBackend.updateMe(data);
      }
      const res = await apiClient.patch('/api/users/me', data);
      return res.data;
    }
  },

  // Scans endpoints
  scans: {
    create: async ({ imageFile, text, language = 'en' }) => {
      if (isMockMode) {
        await delay(350);
        return mockBackend.createScan({ text, image: !!imageFile, language });
      }
      const formData = new FormData();
      if (imageFile) formData.append('image', imageFile);
      if (text) formData.append('text', text);
      if (language) formData.append('language', language);

      const res = await apiClient.post('/api/scans', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    },

    getAll: async () => {
      if (isMockMode) {
        await delay();
        return mockBackend.getScans();
      }
      const res = await apiClient.get('/api/scans');
      return res.data;
    },

    getById: async (id) => {
      if (isMockMode) {
        await delay();
        return mockBackend.getScanById(id);
      }
      const res = await apiClient.get(`/api/scans/${id}`);
      return res.data;
    },

    delete: async (id) => {
      if (isMockMode) {
        await delay();
        return mockBackend.deleteScan(id);
      }
      const res = await apiClient.delete(`/api/scans/${id}`);
      return res.data;
    },

    explain: async (id, language) => {
      if (isMockMode) {
        await delay(200);
        return mockBackend.explainScan(id, language);
      }
      const res = await apiClient.post(`/api/scans/${id}/explain`, { language });
      return res.data;
    }
  },

  // Calls endpoints (Live Call Guard)
  calls: {
    transcribeAudio: async ({ audioBlob, language = 'en' }) => {
      if (isMockMode) {
        await delay(200);
        return mockBackend.transcribeAudio({ audioBlob, language });
      }
      const formData = new FormData();
      formData.append('audio', audioBlob, 'chunk.webm');
      if (language) formData.append('language', language);

      const res = await apiClient.post('/api/calls/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    },

    analyzeAudio: async ({ audioFile, language = 'en', save = false }) => {
      if (isMockMode) {
        await delay(350);
        return mockBackend.analyzeAudio({ audioFile, language, save });
      }
      const formData = new FormData();
      formData.append('audio', audioFile, audioFile.name || 'recording.mp3');
      if (language) formData.append('language', language);
      if (save) formData.append('save', 'true');

      const res = await apiClient.post('/api/calls/analyze-audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    },

    analyze: async ({ transcript, language = 'en' }) => {
      if (isMockMode) {
        await delay(150);
        return mockBackend.analyzeCall({ transcript, language });
      }
      const res = await apiClient.post('/api/calls/analyze', { transcript, language });
      return res.data;
    },

    save: async ({ transcript, language = 'en' }) => {
      if (isMockMode) {
        await delay(300);
        return mockBackend.saveCall({ transcript, language });
      }
      const res = await apiClient.post('/api/calls', { transcript, language });
      return res.data;
    }
  },

  // Lookup endpoint (Check before you pay)
  lookup: {
    check: async (value) => {
      if (isMockMode) {
        await delay(200);
        return mockBackend.lookup(value);
      }
      const res = await apiClient.get('/api/lookup', {
        params: { value }
      });
      return res.data;
    }
  },

  // Reports
  reports: {
    create: async ({ value, scam_type }) => {
      if (isMockMode) {
        await delay(250);
        return mockBackend.createReport({ value, scam_type });
      }
      const res = await apiClient.post('/api/reports', { value, scam_type });
      return res.data;
    }
  },

  // Guardians
  guardians: {
    getAll: async () => {
      if (isMockMode) {
        await delay();
        return mockBackend.getGuardians();
      }
      const res = await apiClient.get('/api/guardians');
      return res.data;
    },

    invite: async (email) => {
      if (isMockMode) {
        await delay();
        return mockBackend.inviteGuardian({ email });
      }
      const res = await apiClient.post('/api/guardians/invite', { email });
      return res.data;
    },

    accept: async (id) => {
      if (isMockMode) {
        await delay();
        return mockBackend.acceptGuardian(id);
      }
      const res = await apiClient.post(`/api/guardians/${id}/accept`);
      return res.data;
    },

    delete: async (id) => {
      if (isMockMode) {
        await delay();
        return mockBackend.deleteGuardian(id);
      }
      const res = await apiClient.delete(`/api/guardians/${id}`);
      return res.data;
    }
  },

  // Alerts
  alerts: {
    getAll: async () => {
      if (isMockMode) {
        await delay();
        return mockBackend.getAlerts();
      }
      const res = await apiClient.get('/api/alerts');
      return res.data;
    },

    markRead: async (id) => {
      if (isMockMode) {
        await delay(100);
        return mockBackend.markAlertRead(id);
      }
      const res = await apiClient.patch(`/api/alerts/${id}/read`);
      return res.data;
    }
  },

  // Trends
  trends: {
    get: async () => {
      if (isMockMode) {
        await delay();
        return mockBackend.getTrends();
      }
      const res = await apiClient.get('/api/trends');
      return res.data;
    }
  }
};
