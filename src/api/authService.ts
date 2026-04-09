import { config } from "../core/config";
import { StorageManager, type User } from "../core/storage";

interface TokenResponse {
  access_token: string;
  token_type: string;
  user_info?: User;
}

export const AuthModule = {
  login: async (email: string, password: string): Promise<void> => {
    const response = await fetch(`${config.apiBaseUrl}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error("Credenciais inválidas");
    }

    const data: TokenResponse = await response.json();
    StorageManager.setToken(data.access_token);
    StorageManager.setUser(data.user_info || { id: "unknown", email });
  },

  register: async (email: string, password: string): Promise<void> => {
    const response = await fetch(`${config.apiBaseUrl}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Falha ao registrar usuário.");
    }

    const data: TokenResponse = await response.json();
    if (data.access_token) {
      StorageManager.setToken(data.access_token);
      StorageManager.setUser(data.user_info || { id: "unknown", email });
    } else {
      // In case Supabase requires email verification, we wouldn't have a token.
      throw new Error("VERIFICATION_REQUIRED");
    }
  },

  logout: (): void => {
    StorageManager.clearAll();
  },

  isAuthenticated: (): boolean => {
    return !!(StorageManager.getToken() && StorageManager.getUser());
  },
};
