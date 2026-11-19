import { config } from "../core/config";
import { StorageManager } from "../core/storage";

export interface QualityMetadata {
  score: number;
  feedback: string;
  needs_refinement?: boolean;
}

export interface MetaMetadata {
  mode: "demo" | "byok" | string;
  model: string;
  nature?: string;
  complexity?: string;
  remaining_quota: number | null;
}

export interface QuotaStatus {
  mode: "demo" | "byok" | string;
  model: string;
  daily_limit: number;
  remaining: number | null;
}

export interface SessionMessage {
  role: "user" | "model" | string;
  parts: string[];
  metadata?: Record<string, any>;
}

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onMeta?: (meta: MetaMetadata) => void;
  onQuality?: (quality: QualityMetadata) => void;
  onError: (errorMsg: string) => void;
  onFinish: () => void;
}

function buildAuthHeaders(includeApiKey = false): Record<string, string> {
  const token = StorageManager.getToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (includeApiKey) {
    const apiKey = StorageManager.getApiKey();
    if (apiKey && apiKey.trim()) {
      headers["x-google-api-key"] = apiKey.trim();
    }
  }
  return headers;
}

export const ApiModule = {
  checkHealth: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/health`, {
        method: "GET",
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  getQuota: async (): Promise<QuotaStatus> => {
    const response = await fetch(`${config.apiBaseUrl}/quota`, {
      method: "GET",
      headers: buildAuthHeaders(true),
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("UNAUTHORIZED");
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  },

  sendChatStream: async (
    message: string,
    sessionId: string,
    callbacks: StreamCallbacks,
  ) => {
    const { onChunk, onMeta, onQuality, onError, onFinish } = callbacks;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...buildAuthHeaders(true),
    };

    const dispatchEvent = (parsed: any): boolean => {
      const eventType = parsed.type;
      if (eventType === "error" || parsed.error) {
        onError(parsed.content || parsed.error || "Erro interno no motor.");
        onFinish();
        return false;
      }
      if (eventType === "meta" && parsed.metadata) {
        onMeta?.(parsed.metadata as MetaMetadata);
        return true;
      }
      if (eventType === "quality" && parsed.metadata) {
        onQuality?.(parsed.metadata as QualityMetadata);
        return true;
      }
      if (parsed.content) {
        onChunk(parsed.content);
      }
      return true;
    };

    try {
      const response = await fetch(`${config.apiBaseUrl}/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          session_id: sessionId,
          message,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("UNAUTHORIZED");
        }
        let errMsg = `API Error: ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.detail) errMsg = errData.detail;
        } catch {
          /* ignore non-JSON error body */
        }
        throw new Error(errMsg);
      }

      if (!response.body) throw new Error("ReadableStream not supported");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          if (buffer.trim()) {
            try {
              const parsed = JSON.parse(buffer);
              if (!dispatchEvent(parsed)) return;
            } catch {
              /* ignore remainder parsing errors */
            }
          }
          onFinish();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n");
        buffer = parts.pop() || "";

        for (const line of parts) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (!dispatchEvent(parsed)) return;
          } catch {
            console.warn(
              "Recovering from corrupted NDJSON chunk in stream...",
              line,
            );
          }
        }
      }
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        onError("UNAUTHORIZED");
      } else {
        onError(
          err.message ||
            "Erro de Conexão: Não foi possível alcançar o Motor Zenith.",
        );
      }
      onFinish();
    }
  },

  sendFeedback: async (message: string) => {
    const response = await fetch(`${config.apiBaseUrl}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...buildAuthHeaders(false),
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("UNAUTHORIZED");
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  },

  getSessions: async () => {
    const response = await fetch(`${config.apiBaseUrl}/sessions`, {
      method: "GET",
      headers: buildAuthHeaders(false),
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("UNAUTHORIZED");
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  },

  getSessionMessages: async (
    sessionId: string,
  ): Promise<{ status: string; session_id: string; messages: SessionMessage[] }> => {
    const response = await fetch(
      `${config.apiBaseUrl}/sessions/${encodeURIComponent(sessionId)}/messages`,
      {
        method: "GET",
        headers: buildAuthHeaders(false),
      },
    );

    if (!response.ok) {
      if (response.status === 401) throw new Error("UNAUTHORIZED");
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    const response = await fetch(
      `${config.apiBaseUrl}/sessions/${encodeURIComponent(sessionId)}`,
      {
        method: "DELETE",
        headers: buildAuthHeaders(false),
      },
    );

    if (!response.ok && response.status !== 404) {
      if (response.status === 401) throw new Error("UNAUTHORIZED");
      throw new Error(`API Error: ${response.status}`);
    }
  },
};
