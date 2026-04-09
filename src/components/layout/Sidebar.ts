import feather from "feather-icons";
import { Toast } from "../toast";
import { StorageManager } from "../../core/storage";
import { UI } from "../../ui";
import { ApiModule } from "../../api/chatService";

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

      if (data.sessions && data.sessions.length > 0) {
        if (emptyMsg) emptyMsg.style.display = "none";

        data.sessions.forEach((s: any) => {
          const li = document.createElement("li");
          li.className = "history-item";
          li.dataset.sessionId = s.id;

          const dateStr = new Date(s.last_active).toLocaleDateString("pt-BR");

          li.innerHTML = `
            <i data-feather="message-circle" class="item-icon"></i>
            <span class="history-title item-title">Sessão de ${dateStr}</span>
            <div class="item-actions">
              <button class="action-icon" aria-label="Opções" tabindex="-1">
                <i data-feather="more-horizontal"></i>
              </button>
              <div class="history-dropdown">
                <button class="dropdown-item action-rename" tabindex="-1">
                  <i data-feather="edit-2"></i>
                  <span>Renomear</span>
                </button>
                <button class="dropdown-item action-trash delete-text" tabindex="-1">
                  <i data-feather="trash-2"></i>
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          `;

          list.appendChild(li);
        });

        feather.replace();

        // Re-query and bind items
        this.historyItems = document.querySelectorAll(".history-item");
        this.bindHistoryItems();
      } else {
        if (emptyMsg) emptyMsg.style.display = "block";
      }
    } catch (e) {
      console.error("Erro ao carregar sessões.", e);
    }
  }

  private bindEvents() {
    // Event Listeners: Sidebar Toggles
    this.openSidebarBtn.addEventListener("click", UI.toggleSidebar);

    // Event Listeners: New Chat
    this.newChatBtn.addEventListener("click", () => this.handleNewChat());

    // Event Listeners: Logo Home
    if (this.appTitle) {
      this.appTitle.addEventListener("click", () => this.handleNewChat());
    }

    // Event Listeners: Theme
    this.themeToggleBtn.addEventListener("click", () => {
      const currentTheme =
        document.documentElement.getAttribute("data-theme") || "dark";
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", newTheme);

      const icon = document.getElementById("theme-icon");
      if (icon) {
        if (newTheme === "light") {
          icon.setAttribute("data-feather", "moon");
        } else {
          icon.setAttribute("data-feather", "sun");
        }
        feather.replace();
      }
    });

    // Event Listeners: Settings and Feedback
    this.settingsItems.forEach((setting) => {
      setting.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        const title = (e.currentTarget as HTMLElement).querySelector(
          ".item-title",
        )?.textContent;
        if (title === "Feedback") {
          // Use requestAnimationFrame to decouple from current click event cycle
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

    // Event Listeners: Feedback Modal specific
    UI.closeFeedbackBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      UI.feedbackModal.classList.add("hidden");
    });

    UI.feedbackModal.addEventListener("click", (e) => {
      if (e.target === UI.feedbackModal) {
        e.stopPropagation();
        UI.feedbackModal.classList.add("hidden");
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

        UI.feedbackModal.classList.add("hidden");
        Toast.show("Feedback enviado com sucesso! Obrigado.", "success");
      } catch (err: any) {
        Toast.show("Erro ao enviar feedback. Tente novamente.", "error");
      } finally {
        const btnText = UI.submitFeedbackBtn.querySelector(".btn-text");
        const spinner = UI.submitFeedbackBtn.querySelector(".spinner");

        if (btnText) btnText.classList.remove("hidden");
        if (spinner) spinner.classList.add("hidden");
        UI.submitFeedbackBtn.disabled = false;
      }
    });

    // Event Listeners: Sidebar API Key directly
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

    // Pre-popula o input se já houver uma chave salva
    const savedKey = StorageManager.getApiKey();
    if (savedKey) {
      UI.sidebarApiKeyInput.value = savedKey;
      updateApiKeyVisuals(savedKey);
    }

    // Remova os efeitos visuais enquanto estiver digitando
    UI.sidebarApiKeyInput.addEventListener("input", () => {
      UI.sidebarApiKeyInput.style.borderColor = "var(--border-color)";
      UI.sidebarApiKeyInput.style.background = "var(--surface-light)";
      if (statusIcon) statusIcon.style.display = "none";
    });

    // Usamos 'change' ou 'blur' para salvar imediatamente quando o usuário preencher
    UI.sidebarApiKeyInput.addEventListener("change", () => {
      const newKey = UI.sidebarApiKeyInput.value.trim();
      if (newKey) {
        StorageManager.setApiKey(newKey);
        updateApiKeyVisuals(newKey);
        Toast.show("API Key salva localmente! Pronta para uso.", "success");
      } else {
        StorageManager.removeApiKey();
        updateApiKeyVisuals(null);
      }
    });

    // Global click to close all dropdowns
    document.addEventListener("click", () => {
      document
        .querySelectorAll(".history-dropdown.show")
        .forEach((dropdown) => {
          dropdown.classList.remove("show");
        });
    });

    // History Items Click (Loading state & Actions)
    this.bindHistoryItems();
  }

  private bindHistoryItems() {
    this.historyItems.forEach((item) => {
      // Opening a Chat
      item.addEventListener("click", (e) => {
        if (
          (e.target as HTMLElement).closest(".item-actions") ||
          (e.target as HTMLElement).tagName.toLowerCase() === "input"
        )
          return;

        const sid = (item as HTMLElement).dataset.sessionId;
        if (sid) {
          StorageManager.setSessionId(sid);
        }

        this.historyItems.forEach((hi) => hi.classList.remove("active"));
        item.classList.add("active");
        UI.chatHistory.classList.remove("empty-mode");

        UI.chatHistory.innerHTML = `
          <div class="message system-message fade-in-up">
            <div class="message-avatar system-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" fill="none">
                <path d="M20 75 L50 25 L80 75" stroke="url(#zenith-glow-avatar)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M35 75 L50 50 L65 75" stroke="url(#zenith-glow-avatar)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.35"/>
                <circle cx="50" cy="12" r="6" fill="#14b8a6" />
                <defs>
                  <linearGradient id="zenith-glow-avatar" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#4f46e5" />
                    <stop offset="50%" stop-color="#8b5cf6" />
                    <stop offset="100%" stop-color="#67e8f9" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div class="message-content">
              <p>Carregando memória da sessão...</p>
            </div>
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

        setTimeout(() => {
          UI.chatHistory.innerHTML = `
            <div class="message system-message fade-in-up">
              <div class="message-avatar system-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" fill="none">
                  <path d="M20 75 L50 25 L80 75" stroke="url(#zenith-glow-avatar)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M35 75 L50 50 L65 75" stroke="url(#zenith-glow-avatar)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.35"/>
                  <circle cx="50" cy="12" r="6" fill="#14b8a6" />
                  <defs>
                    <linearGradient id="zenith-glow-avatar" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stop-color="#4f46e5" />
                      <stop offset="50%" stop-color="#8b5cf6" />
                      <stop offset="100%" stop-color="#67e8f9" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div class="message-content">
                <p>Sessão recuperada. Prontos para continuar.</p>
              </div>
            </div>
          `;
        }, 800);

        if (window.innerWidth <= 768) {
          this.sidebar.classList.add("collapsed");
        }
      });

      // Action Dots: Toggle Dropdown
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

      // Pin Action
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

      // Rename Action
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
            input.className = "rename-input";

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
            input.addEventListener("keydown", (e) => {
              if (e.key === "Enter") saveRename();
              if (e.key === "Escape") {
                input.value = currentTitle;
                saveRename();
              }
            });
          }
        });
      }

      // Delete Action
      const deleteBtn = item.querySelector(".action-trash");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const title = item.querySelector(".item-title")?.textContent;
          if (confirm(`Excluir bate-papo: ${title}?`)) {
            // Remove DOM item
            item.remove();
            Toast.show(`Chat "${title}" movido para lixeira.`, "info");
            this.handleNewChat();
          }
        });
      }
    });
  }

  private handleNewChat() {
    UI.clearChat();
    StorageManager.resetSessionId();

    const navCenter = document.getElementById("nav-center");
    if (navCenter) {
      navCenter.style.display = "none";
    }

    if (window.innerWidth <= 768) {
      this.sidebar.classList.add("collapsed");
    }
  }
}
