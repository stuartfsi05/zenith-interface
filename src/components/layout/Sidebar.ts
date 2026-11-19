import feather from "feather-icons";
import { ApiModule } from "../../api/chatService";
import { events, EVENTS } from "../../core/eventBus";
import { StorageManager } from "../../core/storage";
import { UI, ZENITH_LOGO_SVG } from "../../ui";
import { Toast } from "../toast";

export class SidebarComponent {
  private sidebar: HTMLElement;
  private openSidebarBtn: HTMLElement;
  private newChatBtn: HTMLElement;
  private themeToggleBtn: HTMLElement;
  private settingsItems: NodeListOf<HTMLElement>;
  private historyItems: NodeListOf<HTMLElement>;
  private appTitle: HTMLElement | null;

  constructor() {
    this.sidebar = document.getElementById("sidebar")!;
    this.openSidebarBtn = document.getElementById("open-sidebar-btn")!;
    this.newChatBtn = document.getElementById("new-chat-btn")!;
    this.themeToggleBtn = document.getElementById("theme-toggle-btn")!;
    this.settingsItems = document.querySelectorAll(
      ".sidebar-bottom .settings-item",
    );
    this.historyItems = document.querySelectorAll(".history-item");
    this.appTitle = document.querySelector(".app-title");

    this.bindEvents();
    this.loadHistory();
  }

  public async loadHistory() {
    try {
      const data = await ApiModule.getSessions();
      const list = document.querySelector(
        ".chat-history-list",
      ) as HTMLUListElement;
      const emptyMsg = document.getElementById("empty-history-message");

      if (!list) return;
      list.innerHTML = "";

      const activeSid = StorageManager.getSessionId();

      if (data.sessions && data.sessions.length > 0) {
        if (emptyMsg) emptyMsg.style.display = "none";

        data.sessions.forEach((s: any) => {
          const li = document.createElement("li");
          li.className = "history-item";
          if (s.id === activeSid) {
            li.classList.add("active");
          }
          li.dataset.sessionId = s.id;

          const dateStr = new Date(s.last_active).toLocaleDateString("pt-BR");

          li.innerHTML = `
            <i data-feather="message-circle" class="item-icon"></i>
            <span class="history-title item-title">Sessão de ${dateStr}</span>
            <div class="item-actions">
              <button type="button" class="action-icon" aria-label="Opções" tabindex="-1">
                <i data-feather="more-horizontal"></i>
              </button>
              <div class="history-dropdown">
                <button type="button" class="dropdown-item action-rename" tabindex="-1">
                  <i data-feather="edit-2"></i>
                  <span>Renomear</span>
                </button>
                <button type="button" class="dropdown-item action-trash delete-text" tabindex="-1">
                  <i data-feather="trash-2"></i>
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          `;

          list.appendChild(li);
        });

        feather.replace();

        this.historyItems = document.querySelectorAll(".history-item");
        this.bindHistoryItems();
      } else {
        if (emptyMsg) emptyMsg.style.display = "block";
      }
    } catch (e) {
      console.error("Erro ao carregar sessões.", e);
    }
  }

  private closeFeedbackModal() {
    if (!UI.feedbackModal.classList.contains("hidden")) {
      UI.feedbackModal.classList.add("hidden");
      UI.feedbackBtn?.focus();
    }
  }

  private bindEvents() {
    this.openSidebarBtn.addEventListener("click", UI.toggleSidebar);
    this.newChatBtn.addEventListener("click", () => this.handleNewChat());

    if (this.appTitle) {
      this.appTitle.addEventListener("click", () => this.handleNewChat());
    }

    events.subscribe(EVENTS.HISTORY_UPDATED, () => {
      this.loadHistory();
    });

    this.themeToggleBtn.addEventListener("click", () => {
      const currentTheme =
        document.documentElement.getAttribute("data-theme") || "dark";
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", newTheme);

      const icon = document.getElementById("theme-icon");
      if (icon) {
        icon.setAttribute(
          "data-feather",
          newTheme === "light" ? "moon" : "sun",
        );
        feather.replace();
      }
    });

    this.settingsItems.forEach((setting) => {
      setting.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        const title = (e.currentTarget as HTMLElement).querySelector(
          ".item-title",
        )?.textContent;
        if (title === "Feedback") {
          requestAnimationFrame(() => {
            UI.feedbackModal.classList.remove("hidden");
            UI.feedbackInput.value = "";
            UI.feedbackInput.focus();
          });
        } else {
          Toast.show(`⚡ Módulo: ${title} em fase de integração.`, "info");
        }
      });
    });

    UI.closeFeedbackBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.closeFeedbackModal();
    });

    UI.feedbackModal.addEventListener("click", (e) => {
      if (e.target === UI.feedbackModal) {
        e.stopPropagation();
        this.closeFeedbackModal();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeFeedbackModal();
      }
    });

    UI.submitFeedbackBtn.addEventListener("click", async () => {
      const feedbackText = UI.feedbackInput.value.trim();
      if (!feedbackText) {
        Toast.show("Por favor, digite seu feedback.", "error");
        return;
      }

      try {
        const btnText = UI.submitFeedbackBtn.querySelector(".btn-text");
        const spinner = UI.submitFeedbackBtn.querySelector(".spinner");

        if (btnText) btnText.classList.add("hidden");
        if (spinner) spinner.classList.remove("hidden");
        UI.submitFeedbackBtn.disabled = true;

        await ApiModule.sendFeedback(feedbackText);

        this.closeFeedbackModal();
        Toast.show("Feedback enviado com sucesso! Obrigado.", "success");
      } catch {
        Toast.show("Erro ao enviar feedback. Tente novamente.", "error");
      } finally {
        const btnText = UI.submitFeedbackBtn.querySelector(".btn-text");
        const spinner = UI.submitFeedbackBtn.querySelector(".spinner");

        if (btnText) btnText.classList.remove("hidden");
        if (spinner) spinner.classList.add("hidden");
        UI.submitFeedbackBtn.disabled = false;
      }
    });

    const statusIcon = document.getElementById("api-key-status-icon");

    const updateApiKeyVisuals = (key: string | null) => {
      if (key) {
        UI.sidebarApiKeyInput.style.borderColor = "#10b981";
        UI.sidebarApiKeyInput.style.background = "rgba(16, 185, 129, 0.05)";
        if (statusIcon) statusIcon.style.display = "block";
      } else {
        UI.sidebarApiKeyInput.style.borderColor = "var(--border-color)";
        UI.sidebarApiKeyInput.style.background = "var(--surface-light)";
        if (statusIcon) statusIcon.style.display = "none";
      }
    };

    const savedKey = StorageManager.getApiKey();
    if (savedKey) {
      UI.sidebarApiKeyInput.value = savedKey;
      updateApiKeyVisuals(savedKey);
    }

    UI.sidebarApiKeyInput.addEventListener("input", () => {
      UI.sidebarApiKeyInput.style.borderColor = "var(--border-color)";
      UI.sidebarApiKeyInput.style.background = "var(--surface-light)";
      if (statusIcon) statusIcon.style.display = "none";
    });

    UI.sidebarApiKeyInput.addEventListener("change", () => {
      const newKey = UI.sidebarApiKeyInput.value.trim();
      if (newKey) {
        StorageManager.setApiKey(newKey);
        updateApiKeyVisuals(newKey);
        Toast.show("API Key salva! Gemini 3.8 Flash ativado.", "success");
      } else {
        StorageManager.removeApiKey();
        updateApiKeyVisuals(null);
        Toast.show("API Key removida. Voltando ao Modo Demo grátis.", "info");
      }
      events.emit(EVENTS.QUOTA_UPDATED);
    });

    document.addEventListener("click", () => {
      document
        .querySelectorAll(".history-dropdown.show")
        .forEach((dropdown) => {
          dropdown.classList.remove("show");
        });
    });

    this.bindHistoryItems();
  }

  private bindHistoryItems() {
    this.historyItems.forEach((item) => {
      item.addEventListener("click", async (e) => {
        if (
          (e.target as HTMLElement).closest(".item-actions") ||
          (e.target as HTMLElement).tagName.toLowerCase() === "input"
        ) {
          return;
        }

        const sid = (item as HTMLElement).dataset.sessionId;
        if (!sid) return;

        StorageManager.setSessionId(sid);
        this.historyItems.forEach((hi) => hi.classList.remove("active"));
        item.classList.add("active");
        UI.chatHistory.classList.remove("empty-mode");

        UI.chatHistory.innerHTML = `
          <div class="message system-message fade-in-up">
            <div class="message-avatar system-avatar">${ZENITH_LOGO_SVG}</div>
            <div class="message-content"><p>Carregando histórico da sessão...</p></div>
          </div>
        `;

        const navCenter = document.getElementById("nav-center");
        if (navCenter) {
          navCenter.style.display = "flex";
        }
        const titleSpan = item.querySelector(".item-title");
        const modelSelectorText = document.querySelector(
          ".model-selector span",
        );
        if (titleSpan && modelSelectorText) {
          modelSelectorText.textContent = titleSpan.textContent;
        }

        try {
          const data = await ApiModule.getSessionMessages(sid);
          events.emit(EVENTS.SESSION_LOADED, data.messages || []);
        } catch (err) {
          console.error("Failed to fetch session messages:", err);
          Toast.show("Não foi possível carregar o histórico da sessão.", "error");
        }

        if (window.innerWidth <= 768) {
          this.sidebar.classList.add("collapsed");
        }
      });

      const actionIcon = item.querySelector(".action-icon");
      const dropdown = item.querySelector(".history-dropdown");

      if (actionIcon && dropdown) {
        actionIcon.addEventListener("click", (e) => {
          e.stopPropagation();
          document.querySelectorAll(".history-dropdown.show").forEach((d) => {
            if (d !== dropdown) d.classList.remove("show");
          });
          dropdown.classList.toggle("show");
        });
      }

      const pinBtn = item.querySelector(".action-pin");
      if (pinBtn) {
        pinBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          dropdown?.classList.remove("show");
          const list = item.parentElement;
          if (list) {
            const htmlItem = item as HTMLElement;
            const isPinned = htmlItem.dataset.pinned === "true";
            if (isPinned) {
              htmlItem.dataset.pinned = "false";
              const icon = item.querySelector(".item-icon");
              if (icon) icon.setAttribute("data-feather", "message-square");
            } else {
              htmlItem.dataset.pinned = "true";
              list.prepend(item);
              const icon = item.querySelector(".item-icon");
              if (icon) icon.setAttribute("data-feather", "map-pin");
            }
            feather.replace();
          }
        });
      }

      const renameBtn = item.querySelector(".action-rename");
      if (renameBtn) {
        renameBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          dropdown?.classList.remove("show");

          const titleSpan = item.querySelector(".item-title") as HTMLElement;
          if (titleSpan) {
            const currentTitle = titleSpan.textContent || "";
            const input = document.createElement("input");
            input.type = "text";
            input.value = currentTitle;
            input.className = "item-title-edit";

            titleSpan.style.display = "none";
            titleSpan.parentElement?.insertBefore(input, titleSpan);
            input.focus();

            const saveRename = () => {
              const newTitle = input.value.trim();
              if (newTitle) {
                titleSpan.textContent = newTitle;
              }
              input.remove();
              titleSpan.style.display = "";
            };

            input.addEventListener("blur", saveRename);
            input.addEventListener("keydown", (ev) => {
              if (ev.key === "Enter") saveRename();
              if (ev.key === "Escape") {
                input.value = currentTitle;
                saveRename();
              }
            });
          }
        });
      }

      const deleteBtn = item.querySelector(".action-trash");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const sid = (item as HTMLElement).dataset.sessionId;
          const title = item.querySelector(".item-title")?.textContent;
          if (!confirm(`Excluir bate-papo: ${title}?`)) {
            return;
          }
          try {
            if (sid) {
              await ApiModule.deleteSession(sid);
            }
            item.remove();
            Toast.show(`Sessão "${title}" excluída.`, "info");
            this.handleNewChat();
          } catch {
            Toast.show("Falha ao excluir a sessão no servidor.", "error");
          }
        });
      }
    });
  }

  private handleNewChat() {
    UI.clearChat();
    StorageManager.resetSessionId();
    this.historyItems.forEach((hi) => hi.classList.remove("active"));

    const navCenter = document.getElementById("nav-center");
    if (navCenter) {
      navCenter.style.display = "none";
    }

    if (window.innerWidth <= 768) {
      this.sidebar.classList.add("collapsed");
    }
  }
}
