const API_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('accessToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  private async request<T>(method: string, path: string, body?: any): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'خطأ في الاتصال' }));
      throw new Error(error.message || 'خطأ غير متوقع');
    }

    return res.json();
  }

  get<T>(path: string) { return this.request<T>('GET', path); }
  post<T>(path: string, body?: any) { return this.request<T>('POST', path, body); }
  patch<T>(path: string, body?: any) { return this.request<T>('PATCH', path, body); }
  delete<T>(path: string) { return this.request<T>('DELETE', path); }
}

export const api = new ApiClient();

// ─── Auth API ───────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ user: any; accessToken: string; refreshToken: string }>('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post<{ user: any; accessToken: string; refreshToken: string }>('/auth/register', { name, email, password }),
  getProfile: () => api.get<any>('/auth/profile'),
};

// ─── Content API ────────────────────────────
export const contentApi = {
  getUnit: () => api.get<any>('/content/unit'),
  getNodes: () => api.get<any[]>('/content/nodes'),
  getNode: (id: string) => api.get<any>(`/content/nodes/${id}`),
  getNodeContent: (id: string) => api.get<any[]>(`/content/nodes/${id}/content`),
  getTables: (id: string) => api.get<any[]>(`/content/nodes/${id}/tables`),
  getExamples: (id: string) => api.get<any[]>(`/content/nodes/${id}/examples`),
  getMiniGames: () => api.get<any[]>('/content/mini-games'),
};

// ─── Questions API ──────────────────────────
export const questionsApi = {
  getNodeQuestions: (nodeId: string, level?: string) =>
    api.get<any[]>(`/questions/node/${nodeId}${level ? `?level=${level}` : ''}`),
  submitAnswer: (questionId: string, selectedOptionId: any, timeSeconds: number) =>
    api.post<any>('/questions/submit', { questionId, selectedOptionId, timeSeconds }),
  getHints: (nodeId: string, level?: string) =>
    api.get<any[]>(`/questions/hints/${nodeId}${level ? `?level=${level}` : ''}`),
  useHint: (nodeId: string, hintId: string) =>
    api.post<any>('/questions/hints/use', { nodeId, hintId }),
  getRemediation: (nodeId: string, level?: string) =>
    api.get<any[]>(`/questions/remediation/${nodeId}${level ? `?level=${level}` : ''}`),
};

// ─── Adaptive API ───────────────────────────
export const adaptiveApi = {
  evaluate: (nodeId: string, understanding: boolean, application: boolean, reasoning: boolean) =>
    api.post<any>('/adaptive/evaluate', { nodeId, understanding, application, reasoning }),
  getMasteryMap: () => api.get<any[]>('/adaptive/mastery-map'),
  initialize: () => api.post('/adaptive/initialize'),
};

// ─── Progress API ───────────────────────────
export const progressApi = {
  getUserProgress: () => api.get<any>('/progress'),
  getNodeProgress: (nodeId: string) => api.get<any>(`/progress/node/${nodeId}`),
  updateTimeSpent: (nodeId: string, seconds: number) =>
    api.post('/progress/time', { nodeId, seconds }),
  useHint: (nodeId: string) => api.post('/progress/hint', { nodeId }),
  getAchievements: () => api.get<any[]>('/progress/achievements'),
};

// ─── AI Teacher API ─────────────────────────
export const aiTeacherApi = {
  chat: (message: string, sessionId?: string, nodeId?: string) =>
    api.post<{ sessionId: string; message: string; isAiAvailable: boolean }>('/ai-teacher/chat', { message, sessionId, nodeId }),
  getSessions: () => api.get<any[]>('/ai-teacher/sessions'),
  getHistory: (sessionId: string) => api.get<any[]>(`/ai-teacher/sessions/${sessionId}/history`),
};

// ─── Calculator API ─────────────────────────
export const calculatorApi = {
  bondEnergy: (brokenBonds: any[], formedBonds: any[], mode?: string) =>
    api.post<any>('/calculator/bond-energy', { brokenBonds, formedBonds, mode }),
  thermalEquation: (data: any) => api.post<any>('/calculator/thermal-equation', data),
  combustionHeat: (fuel: string) => api.post<any>('/calculator/combustion-heat', { fuel }),
  foodCalories: (items: any[]) => api.post<any>('/calculator/food-calories', { items }),
  getReferenceTables: () => api.get<any>('/calculator/tables'),
};

// ─── Analytics API ──────────────────────────
export const analyticsApi = {
  getTeacherStats: () => api.get<any>('/analytics/teacher/stats'),
  getClassProgressList: () => api.get<any[]>('/analytics/teacher/class-progress'),
  // Admin-only
  getAdminOverview: () => api.get<any>('/analytics/admin/overview'),
  getAdminUsers: () => api.get<any[]>('/analytics/admin/users'),
  getAdminAiStats: () => api.get<any>('/analytics/admin/ai-stats'),
};

// ─── Admin API ──────────────────────────────
export const adminApi = {
  getApiKeys: () => api.get<any[]>('/admin/api-keys'),
  addApiKey: (label: string, apiKey: string, priority?: number) =>
    api.post<any>('/admin/api-keys', { label, apiKey, priority }),
  updateApiKey: (id: string, data: { label?: string; apiKey?: string; isActive?: boolean; priority?: number }) =>
    api.patch<any>(`/admin/api-keys/${id}`, data),
  deleteApiKey: (id: string) => api.delete<any>(`/admin/api-keys/${id}`),
  testApiKey: (id: string) => api.post<any>(`/admin/api-keys/${id}/test`),
};
