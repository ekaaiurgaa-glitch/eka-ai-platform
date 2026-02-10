const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class APIService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async login(email: string, password: string) {
    return this.request('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async chat(message: string, sessionId?: string) {
    return this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, session_id: sessionId }),
    });
  }

  async getJobCards(workshopId: string) {
    return this.request(`/api/job-cards?workshop_id=${workshopId}`);
  }

  async calculateMG(data: any) {
    return this.request('/api/mg/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new APIService();
