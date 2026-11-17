import { apiClient, isMockMode, delay } from './client.js';
import { mockBackend } from './mocks.js';

export const api = {
  // Silent health check to wake up server on app load
  health: {
    check: async () => {
      if (isMockMode) {
        return { status: 'ok' };
      }
      const res = await apiClient.get('/api/health', { timeout: 30000 });
      return res.data;
    }
  },

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
        await delay(650);
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

    getById: async (id, options = {}) => {
      if (isMockMode) {
        await delay(150);
        return mockBackend.getScanById(id);
      }
      const res = await apiClient.get(`/api/scans/${id}`, {
        timeout: options.timeout || 20000,
        signal: options.signal
      });
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

    explain: async (id, language, options = {}) => {
      if (isMockMode) {
        await delay(200);
        return mockBackend.explainScan(id, language);
      }
      const res = await apiClient.post(
        `/api/scans/${id}/explain`,
        { language },
        { signal: options.signal }
      );
      return res.data;
    }
  },

  // Calls endpoints (Live Call Guard)
  calls: {
    transcribe: async ({ audioBlob, language = 'en', signal } = {}) => {
      if (isMockMode) {
        await delay(120);
        return { text: '', transcript: '' };
      }
      const localeLanguage =
        language === 'hi' || language === 'hi-IN'
          ? 'hi-IN'
          : language === 'kn' || language === 'kn-IN'
          ? 'kn-IN'
          : 'en-IN';

      const formData = new FormData();
      const ext = audioBlob?.type?.includes('mp4')
        ? 'mp4'
        : audioBlob?.type?.includes('ogg')
        ? 'ogg'
        : 'webm';
      formData.append('audio', audioBlob, `chunk.${ext}`);
      formData.append('language', localeLanguage);

      const res = await apiClient.post('/api/calls/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 15000,
        signal
      });
      return res.data;
    },

    analyze: async ({ transcript, language = 'en', signal } = {}) => {
      if (isMockMode) {
        await delay(150);
        return mockBackend.analyzeCall({ transcript, language });
      }
      const res = await apiClient.post(
        '/api/calls/analyze',
        { transcript, language },
        { signal }
      );
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
