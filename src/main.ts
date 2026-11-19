import "./style.css";
import feather from "feather-icons";
import { AuthModule } from "./api/authService";
import {
  ApiModule,
  type MetaMetadata,
  type QualityMetadata,
} from "./api/chatService";
import { UI } from "./ui";
import { MarkdownProcessor } from "./markdown";
import { StorageManager } from "./core/storage";
import { events, EVENTS } from "./core/eventBus";
import { ChatInputComponent } from "./components/chat/ChatInput";
import { ChatWindowComponent } from "./components/chat/ChatWindow";
import { SidebarComponent } from "./components/layout/Sidebar";
import { HeaderComponent } from "./components/layout/Header";
import { Toast } from "./components/toast";

let isChatInitialized = false;

function updateModeQuotaBadge(
  mode: string,
  model: string,
  remaining: number | null,
  dailyLimit?: number,
): void {
  const badge = document.getElementById("mode-quota-badge");
  if (!badge) return;

  if (mode === "byok") {
    badge.textContent = `Modo Pro • ${model}`;
    badge.classList.add("byok-active");
    badge.title = "Usando sua Google API Key pessoal em todos os módulos";
  } else {
    const quotaText =
      typeof remaining === "number"
        ? typeof dailyLimit === "number"
          ? `${remaining}/${dailyLimit} hoje`
          : `${remaining} restantes hoje`
        : "Grátis";
    badge.textContent = `Modo Demo • ${quotaText}`;
    badge.classList.remove("byok-active");
    badge.title =
      "Modo Demo gratuito com Gemini 3.5 Flash-Lite. Adicione sua API Key opcional na barra lateral para liberar Gemini 3.8 Flash.";
  }
}

async function refreshQuotaBadge(): Promise<void> {
  try {
    const quota = await ApiModule.getQuota();
    updateModeQuotaBadge(
      quota.mode,
      quota.model,
      quota.remaining,
      quota.daily_limit,
    );
  } catch {
    /* Non-fatal if backend is still waking up */
  }
}

function initializeComponents(): void {
  if (isChatInitialized) return;

  new ChatInputComponent();
  new ChatWindowComponent();
  new SidebarComponent();
  new HeaderComponent();

  events.subscribe(EVENTS.QUOTA_UPDATED, () => {
    refreshQuotaBadge();
  });

  events.subscribe(EVENTS.META_RECEIVED, (meta: MetaMetadata) => {
    if (meta) {
      updateModeQuotaBadge(meta.mode, meta.model, meta.remaining_quota);
    }
  });

  events.subscribe(EVENTS.MESSAGE_SENT, async (message: string) => {
    let isFirstChunk = true;
    let accumulatedText = "";

    try {
      await ApiModule.sendChatStream(message, StorageManager.getSessionId(), {
        onChunk: (chunkContent: string) => {
          accumulatedText += chunkContent;
          events.emit(EVENTS.CHUNK_RECEIVED, {
            isFirst: isFirstChunk,
            accumulatedText,
          });
          isFirstChunk = false;
        },
        onMeta: (meta: MetaMetadata) => {
          events.emit(EVENTS.META_RECEIVED, meta);
        },
        onQuality: (quality: QualityMetadata) => {
          events.emit(EVENTS.QUALITY_RECEIVED, quality);
        },
        onError: async (errorMsg: string) => {
          if (errorMsg === "UNAUTHORIZED") {
            Toast.show("Sessão expirada. Redirecionando...", "error");
            setTimeout(() => {
              AuthModule.logout();
              UI.showLoginView();
            }, 1800);
          } else {
            const errorHtml = `<p class="error-msg">${MarkdownProcessor.escapeHTML(errorMsg)}</p>`;
            events.emit(EVENTS.STREAM_ERROR, errorHtml);
            Toast.show(errorMsg, "error");
          }
        },
        onFinish: () => {
          events.emit(EVENTS.STREAM_FINISHED);
          events.emit(EVENTS.HISTORY_UPDATED);
        },
      });
    } catch (err) {
      console.error("Fatal Stream Error:", err);
      Toast.show("Erro crítico na transmissão.", "error");
    }
  });

  isChatInitialized = true;
}

function setupGlobalListeners(): void {
  UI.loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = UI.loginEmailInput.value;
    const password = UI.loginPasswordInput.value;

    UI.setLoginLoading(true);

    try {
      if (UI.authMode === "login") {
        await AuthModule.login(email, password);
        Toast.show("Autenticado com sucesso", "success");
      } else {
        await AuthModule.register(email, password);
        Toast.show("Conta criada com sucesso!", "success");
      }
      UI.showChatView();
      initializeComponents();
      refreshQuotaBadge();
    } catch (err: any) {
      console.error("Auth failure:", err);
      if (err.message === "VERIFICATION_REQUIRED") {
        const msg =
          "Conta criada! Verifique a caixa de entrada do seu e-mail (incluindo SPAM) para confirmar o cadastro antes de entrar.";
        UI.showLoginError(msg);
        Toast.show(msg, "info");
        UI.setAuthMode("login");
      } else {
        const msg = err.message || "Credenciais inválidas. Tente novamente.";
        UI.showLoginError(msg);
        Toast.show(msg, "error");
      }
    } finally {
      UI.setLoginLoading(false);
    }
  });

  if (UI.authToggleBtn) {
    UI.authToggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const newMode = UI.authMode === "login" ? "register" : "login";
      UI.setAuthMode(newMode);
    });
  }

  UI.logoutBtn.addEventListener("click", () => {
    AuthModule.logout();
    UI.showLoginView();
    Toast.show("Sessão encerrada", "info");
  });

  const togglePasswordBtn = document.getElementById("toggle-password");
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", () => {
      const passwordInput = document.getElementById(
        "password",
      ) as HTMLInputElement;
      if (passwordInput) {
        const isPassword = passwordInput.type === "password";
        passwordInput.type = isPassword ? "text" : "password";

        const icon = togglePasswordBtn.querySelector("i");
        if (icon) {
          icon.setAttribute("data-feather", isPassword ? "eye-off" : "eye");
          feather.replace();
        }
      }
    });
  }
}

function boot(): void {
  // Warm up serverless backend (e.g. Render Free cold start) early
  ApiModule.checkHealth();

  setupGlobalListeners();

  if (AuthModule.isAuthenticated()) {
    UI.showChatView();
    initializeComponents();
    refreshQuotaBadge();
  } else {
    UI.showLoginView();
  }

  feather.replace();
}

boot();
