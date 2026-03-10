import { config } from './config';
import { StorageManager } from './storage';

export const ApiModule = {
  sendChatStream: async (
    message: string, 
    sessionId: string, 
    onChunk: (text: string) => void, 
    onError: (errorMsg: string) => void, 
    onFinish: () => void
  ) => {
    const token = StorageManager.getToken();
    
    try {
      const response = await fetch(`${config.apiBaseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: message
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
             throw new Error("UNAUTHORIZED");
        }
        throw new Error(`API Error: ${response.status}`);
      }

      if (!response.body) throw new Error('ReadableStream not supported');

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
             } catch(e) { /* ignore remainder parsing errors */ }
          }
          onFinish();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n');
        buffer = parts.pop() || ''; // Keep the incomplete part in the buffer

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
            console.warn("Recovering from corrupted NDJSON chunk in stream...", line);
            // Priority 6 Fix: Non-fatal, stream continues skipping the broken chunk
          }
        }
      }

    } catch (err: any) {
        onError(err.message === "UNAUTHORIZED" ? "UNAUTHORIZED" : "Erro de Conexão: Não foi possível alcançar o Motor Zenith.");
        onFinish();
    }
  }
}
