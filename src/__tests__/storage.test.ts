import { beforeEach, describe, expect, it } from "vitest";
import { StorageManager } from "../core/storage";

describe("StorageManager", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("stores JWT token in sessionStorage and user in localStorage", () => {
    StorageManager.setToken("jwt-123");
    StorageManager.setUser({ id: "u1", email: "dev@example.com" });

    expect(sessionStorage.getItem("zenith_token")).toBe("jwt-123");
    expect(StorageManager.getToken()).toBe("jwt-123");
    expect(StorageManager.getUser()).toEqual({
      id: "u1",
      email: "dev@example.com",
    });
  });

  it("preserves optional user API key across clearAll logout", () => {
    StorageManager.setToken("jwt-123");
    StorageManager.setApiKey("AIzaOptionalKey");
    StorageManager.clearAll();

    expect(StorageManager.getToken()).toBe("");
    expect(StorageManager.getUser()).toBeNull();
    expect(StorageManager.getApiKey()).toBe("AIzaOptionalKey");
  });

  it("generates and resets UUID session identifiers", () => {
    const sid1 = StorageManager.getSessionId();
    expect(sid1).toBeTruthy();
    expect(StorageManager.getSessionId()).toBe(sid1);

    StorageManager.resetSessionId();
    const sid2 = StorageManager.getSessionId();
    expect(sid2).toBeTruthy();
    expect(sid2).not.toBe(sid1);
  });
});
