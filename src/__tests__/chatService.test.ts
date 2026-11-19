import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiModule } from "../api/chatService";
import { StorageManager } from "../core/storage";

function makeStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

describe("ApiModule.sendChatStream", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  it("parses split NDJSON lines for meta, chunk, and quality events and ignores malformed lines", async () => {
    StorageManager.setToken("jwt-abc");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const stream = makeStream([
      '{"type":"meta","content":"","metadata":{"mode":"demo","model":"gemini-3.5-flash-lite","remaining_quota":4}}\n',
      '{"type":"chunk","content":"Olá "}\n{broken-json}\n{"type":"ch',
      'unk","content":"Zenith"}\n{"type":"quality","content":"","metadata":{"score":95,"feedback":"Muito bom!"}}\n',
    ]);

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(stream, { status: 200 }),
    );

    const chunks: string[] = [];
    const metas: any[] = [];
    const qualities: any[] = [];
    const errors: string[] = [];
    let finished = false;

    await ApiModule.sendChatStream("Teste", "sess-1", {
      onChunk: (t) => chunks.push(t),
      onMeta: (m) => metas.push(m),
      onQuality: (q) => qualities.push(q),
      onError: (e) => errors.push(e),
      onFinish: () => {
        finished = true;
      },
    });

    expect(errors).toEqual([]);
    expect(finished).toBe(true);
    expect(chunks.join("")).toBe("Olá Zenith");
    expect(metas[0]).toMatchObject({ mode: "demo", remaining_quota: 4 });
    expect(qualities[0]).toMatchObject({ score: 95, feedback: "Muito bom!" });

    warnSpy.mockRestore();
  });

  it("forwards HTTP 429 friendly detail message to onError", async () => {
    StorageManager.setToken("jwt-abc");

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ detail: "Limite diário atingido no Modo Demo." }),
        { status: 429 },
      ),
    );

    const errors: string[] = [];
    let finished = false;

    await ApiModule.sendChatStream("Teste", "sess-1", {
      onChunk: () => {},
      onError: (e) => errors.push(e),
      onFinish: () => {
        finished = true;
      },
    });

    expect(finished).toBe(true);
    expect(errors).toEqual(["Limite diário atingido no Modo Demo."]);
  });
});
