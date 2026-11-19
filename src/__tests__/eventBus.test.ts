import { describe, expect, it, vi } from "vitest";
import { events } from "../core/eventBus";

describe("EventBus", () => {
  it("subscribes, emits, and unsubscribes listeners", () => {
    const handler = vi.fn();
    const unsub = events.subscribe("TEST_EVT_1", handler);

    events.emit("TEST_EVT_1", { ok: true });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ ok: true });

    unsub();
    events.emit("TEST_EVT_1", { ok: false });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("isolates exceptions thrown by one listener from others", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const badListener = vi.fn(() => {
      throw new Error("boom");
    });
    const goodListener = vi.fn();

    const u1 = events.subscribe("TEST_EVT_2", badListener);
    const u2 = events.subscribe("TEST_EVT_2", goodListener);

    events.emit("TEST_EVT_2", "payload");
    expect(badListener).toHaveBeenCalledTimes(1);
    expect(goodListener).toHaveBeenCalledWith("payload");

    u1();
    u2();
    errSpy.mockRestore();
  });
});
