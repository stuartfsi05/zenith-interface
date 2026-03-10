// Priority 1: XSS Vulnerability Mitigation
// Moved sensitive tokens from localStorage to sessionStorage.
// SessionStorage is cleared when the tab is closed, reducing the attack surface.

export interface User {
  id: string;
  email: string;
  role?: string;
}

export const StorageManager = {
  getToken: (): string => {
    return sessionStorage.getItem('zenith_token') || '';
  },
  
  setToken: (token: string): void => {
    sessionStorage.setItem('zenith_token', token);
  },
  
  removeToken: (): void => {
    sessionStorage.removeItem('zenith_token');
  },

  getUser: (): User | null => {
    const userStr = localStorage.getItem('zenith_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setUser: (user: User): void => {
    // Basic user info is safer in localStorage than a JWT
    localStorage.setItem('zenith_user', JSON.stringify(user));
  },

  removeUser: (): void => {
    localStorage.removeItem('zenith_user');
  },

  getSessionId: (): string => {
    let id = sessionStorage.getItem('zenith_session');
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem('zenith_session', id);
    }
    return id;
  },

  resetSessionId: (): void => {
    sessionStorage.setItem('zenith_session', crypto.randomUUID());
  },

  clearAll: (): void => {
    sessionStorage.removeItem('zenith_token');
    sessionStorage.removeItem('zenith_session');
    localStorage.removeItem('zenith_user');
  }
};
