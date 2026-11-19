type EventCallback = (data?: any) => void;

class EventBus {
  private listeners: Record<string, EventCallback[]> = {};

  subscribe(event: string, callback: EventCallback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback,
      );
    };
  }

  emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
}

export const events = new EventBus();

export const EVENTS = {
  // Auth
  AUTH_STATE_CHANGED: "AUTH_STATE_CHANGED",
  USER_LOGGED_IN: "USER_LOGGED_IN",
  USER_LOGGED_OUT: "USER_LOGGED_OUT",

  // Chat
  MESSAGE_SENT: "MESSAGE_SENT",
  CHUNK_RECEIVED: "CHUNK_RECEIVED",
  META_RECEIVED: "META_RECEIVED",
  QUALITY_RECEIVED: "QUALITY_RECEIVED",
  STREAM_FINISHED: "STREAM_FINISHED",
  STREAM_ERROR: "STREAM_ERROR",
  REFINE_REQUESTED: "REFINE_REQUESTED",

  // Sidebar / History
  HISTORY_UPDATED: "HISTORY_UPDATED",
  CHAT_SELECTED: "CHAT_SELECTED",
  SESSION_LOADED: "SESSION_LOADED",
  NEW_CHAT_REQUESTED: "NEW_CHAT_REQUESTED",
  QUOTA_UPDATED: "QUOTA_UPDATED",

  // Settings
  SETTINGS_TOGGLED: "SETTINGS_TOGGLED",
} as const;
