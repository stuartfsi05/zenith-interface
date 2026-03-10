import { config } from './config';
import { StorageManager, type User } from './storage';

interface TokenResponse {
  access_token: string;
  token_type: string;
  user_info?: User;
}

export const AuthModule = {
  login: async (email: string, password: string): Promise<void> => {
    const response = await fetch(`${config.apiBaseUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Credenciais inválidas');
    }

    const data: TokenResponse = await response.json();
    StorageManager.setToken(data.access_token);
    StorageManager.setUser(data.user_info || { id: 'unknown', email });
  },

  logout: (): void => {
    StorageManager.clearAll();
  },

  isAuthenticated: (): boolean => {
    return !!(StorageManager.getToken() && StorageManager.getUser());
  }
};
