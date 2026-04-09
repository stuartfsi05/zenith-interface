import { config } from "../core/config";
import { StorageManager } from "../core/storage";

export const ApiModule = {
  sendChatStream: async (
    message: string,
    sessionId: string,
    onChunk: (text: string) => void,
    onError: (errorMsg: string) => void,
    onFinish: () => void,
  ) => {
    const token = StorageManager.getToken();
    const apiKey = StorageManager.getApiKey();

    // Configura os headers base
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // Só anexa o header se a chave existir
    if (apiKey) {
      headers["x-google-api-key"] = apiKey;
    }

    try {
      const response = await fetch(`${config.apiBaseUrl}/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          session_id: sessionId,
          message: message,
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
        } catch (e) {}
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
              if (parsed.content) onChunk(parsed.content);
            } catch (e) {
              /* ignore remainder parsing errors */
            }
          }
          onFinish();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n");
        buffer = parts.pop() || ""; // Keep the incomplete part in the buffer

        for (const line of parts) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.error) {
              onError(parsed.error);
              onFinish();
              return;
            }
            if (parsed.content) {
              onChunk(parsed.content);
            }
          } catch (e) {
            console.warn(
              "Recovering from corrupted NDJSON chunk in stream...",
              line,
            );
            // Priority 6 Fix: Non-fatal, stream continues skipping the broken chunk
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
    const token = StorageManager.getToken();
    const response = await fetch(`${config.apiBaseUrl}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
    const token = StorageManager.getToken();
    const response = await fetch(`${config.apiBaseUrl}/sessions`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("UNAUTHORIZED");
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  },
};
