import feather from "feather-icons";

/**
 * Shared SVG Template for the Zenith Agent Logo.
 */
const ZENITH_LOGO_SVG = `
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
`;

/**
 * UI Controller: Manages DOM interactions, view states, and dynamic elements.
 */
export const UI = {
  // --- DOM Registry ---
  loginView: document.getElementById("login-view")!,
  chatView: document.getElementById("chat-view")!,
  loginForm: document.getElementById("login-form") as HTMLFormElement,
  loginBtn: document.getElementById("login-btn") as HTMLButtonElement,
  authToggleBtn: document.getElementById(
    "auth-toggle-btn",
  ) as HTMLAnchorElement,
  loginEmailInput: document.getElementById("email") as HTMLInputElement,
  loginPasswordInput: document.getElementById("password") as HTMLInputElement,
  loginError: document.getElementById("login-error")!,

  chatHistory: document.getElementById("chat-history")!,
  chatForm: document.getElementById("chat-form") as HTMLFormElement,
  chatInput: document.getElementById("chat-input") as HTMLTextAreaElement,
  sendBtn: document.getElementById("send-btn") as HTMLButtonElement,
  logoutBtn: document.getElementById("logout-btn")!,

  sidebar: document.getElementById("sidebar")!,
  openSidebarBtn: document.getElementById("open-sidebar-btn")!,
  newChatBtn: document.getElementById("new-chat-btn")!,
  themeToggleBtn: document.getElementById("theme-toggle-btn")!,
  feedbackBtn: document.getElementById("feedback-sidebar-btn")!,
  feedbackModal: document.getElementById("feedback-modal")!,
  closeFeedbackBtn: document.getElementById("close-feedback-btn")!,
  submitFeedbackBtn: document.getElementById(
    "submit-feedback-btn",
  ) as HTMLButtonElement,
  feedbackInput: document.getElementById(
    "feedback-input",
  ) as HTMLTextAreaElement,

  sidebarApiKeyInput: document.getElementById(
    "sidebar-api-key",
  ) as HTMLInputElement,

  // --- View State Management ---
  authMode: "login" as "login" | "register",

  setAuthMode(mode: "login" | "register"): void {
    this.authMode = mode;
    const btnText = this.loginBtn.querySelector(".btn-text");
    const title = document.getElementById("auth-title");
    const desc = document.getElementById("auth-desc");
    const container = document.querySelector(".login-container");

    if (this.authMode === "register") {
      if (btnText) btnText.textContent = "Criar Conta";
      this.authToggleBtn.textContent = "Já possui uma conta? Entre aqui.";
      this.loginError.classList.add("hidden");
      if (title) title.textContent = "Zenith | Nova Credencial";
      if (desc)
        desc.innerHTML =
          "Junte-se à plataforma de Engenharia de Prompts.<br>Insira um e-mail válido e crie uma <b>senha forte com no mínimo 6 caracteres</b>.";
      if (container) container.classList.add("register-mode");
    } else {
      if (btnText) btnText.textContent = "Entrar";
      this.authToggleBtn.textContent = "Não possui uma conta? Crie uma aqui.";
      this.loginError.classList.add("hidden");
      if (title) title.textContent = "Zenith | O Arquiteto de Prompts";
      if (desc)
        desc.textContent =
          "Analisa, otimiza e refina seus prompts para máxima qualidade, clareza e segurança. Zenith atua como seu especialista em engenharia de prompt, aplicando um processo estruturado para transformar ideias em instruções de IA de nível profissional. Use-o para: criar prompts complexos do zero, depurar falhas em prompts existentes e aprender as melhores práticas de interação com IA.";
      if (container) container.classList.remove("register-mode");
    }
  },

  /** Transitions the interface to the Chat View. */
  showChatView(): void {
    UI.loginView.classList.replace("active", "hidden");
    UI.chatView.classList.replace("hidden", "active");
    setTimeout(() => UI.chatInput.focus(), 150);
  },

  /** Transitions the interface to the Login/Auth View. */
  showLoginView(): void {
    UI.chatView.classList.replace("active", "hidden");
    UI.loginView.classList.replace("hidden", "active");
    UI.loginForm.reset();
  },

  /** Updates the login button state to reflect an ongoing auth request. */
  setLoginLoading(isLoading: boolean): void {
    UI.loginBtn.disabled = isLoading;
    const actionText =
      UI.authMode === "register" ? "Criando conta..." : "Entrando...";
    const defaultText = UI.authMode === "register" ? "Criar Conta" : "Entrar";

    if (isLoading) {
      UI.loginBtn.innerHTML = `<span class="spinner"></span><span class="btn-text hidden">${actionText}</span>`;
      UI.loginError.classList.add("hidden");
    } else {
      UI.loginBtn.innerHTML = `<span class="btn-text">${defaultText}</span>`;
    }
  },

  /** Displays the authentication error banner. */
  showLoginError(msg?: string): void {
    if (msg) {
      UI.loginError.textContent = msg;
    } else {
      UI.loginError.textContent = "Credenciais inválidas. Tente novamente.";
    }
    UI.loginError.classList.remove("hidden");
  },

  // --- Chat Lifecycle Management ---

  /**
   * Appends a new message to the conversation history.
   *
   * @param role The source of the message ('user' or 'system').
   * @param htmlContent The processed HTML to display.
   * @returns The HTML element containing the content.
   */
  appendMessage(role: "user" | "system", htmlContent: string): HTMLElement {
    // 1. Exit empty mode on first interaction
    if (UI.chatHistory.classList.contains("empty-mode")) {
      this._teardownEmptyState();
    }

    // 2. Create Message Container
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${role}-message fade-in-up`;

    // 3. Render Avatar
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.innerHTML =
      role === "system" ? ZENITH_LOGO_SVG : '<i data-feather="user"></i>';

    // 4. Render Content
    const content = document.createElement("div");
    content.className = "message-content";
    content.innerHTML = htmlContent;

    // 4b. Apply Code Block Copy Buttons
    this._applyCodeBlockActions(content);

    msgDiv.appendChild(avatar);
    msgDiv.appendChild(content);

    // 5. Apply AI-Specific Actions (Copy to Clipboard)
    if (role === "system") {
      this._applyMessageActions(msgDiv, content);
    }

    // 6. Push to DOM & Scroll
    UI.chatHistory.appendChild(msgDiv);
    UI.chatHistory.scrollTop = UI.chatHistory.scrollHeight;

    // Refresh icons
    setTimeout(() => feather.replace(), 10);

    return content;
  },

  /**
   * Resets the conversation history to the welcome state.
   */
  clearChat(): void {
    UI.chatHistory.innerHTML = `
      <div id="welcome-state" class="welcome-container fade-in-up">
        <div class="welcome-hero">
          <div class="welcome-logo">${ZENITH_LOGO_SVG}</div>
          <h1 class="welcome-title">Olá.</h1>
          <p class="welcome-subtitle">O que vamos projetar hoje?</p>
        </div>
      </div>
    `;
    UI.chatHistory.classList.add("empty-mode");

    const navCenter = document.getElementById("nav-center");
    if (navCenter) navCenter.style.display = "none";

    setTimeout(() => feather.replace(), 10);
  },

  /** Toggles the collapsed state of the navigation sidebar. */
  toggleSidebar(): void {
    UI.sidebar.classList.toggle("collapsed");
  },

  // --- Internal Helpers ---

  /** Internal: Removes welcome screen and updates header state. */
  _teardownEmptyState(): void {
    UI.chatHistory.classList.remove("empty-mode");
    document.getElementById("welcome-state")?.remove();

    const navCenter = document.getElementById("nav-center");
    if (navCenter) {
      navCenter.style.display = "flex";
      const headerText = navCenter.querySelector("span");
      if (
        headerText &&
        headerText.textContent === "Zenith Engine (Transient)"
      ) {
        headerText.textContent = "Conversa Ativa";
      }
    }
  },

  /** Internal: Attaches interactive action buttons to a message. */
  _applyMessageActions(
    container: HTMLElement,
    contentElement: HTMLElement,
  ): void {
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "message-actions";

    const copyBtn = document.createElement("button");
    copyBtn.className = "action-chip";
    copyBtn.innerHTML = '<i data-feather="copy"></i> Copiar';
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(contentElement.innerText);
      copyBtn.innerHTML = '<i data-feather="check"></i> Copiado';
      feather.replace();
      setTimeout(() => {
        copyBtn.innerHTML = '<i data-feather="copy"></i> Copiar';
        feather.replace();
      }, 2000);
    };

    actionsDiv.appendChild(copyBtn);

    const wrapper = document.createElement("div");
    wrapper.style.width = "100%";
    wrapper.appendChild(contentElement.cloneNode(true));
    wrapper.appendChild(actionsDiv);

    container.replaceChild(wrapper, contentElement);
  },

  /** Internal: Adds a copy button to all code blocks (<pre> elements) within the content. */
  _applyCodeBlockActions(contentElement: HTMLElement): void {
    const preElements = contentElement.querySelectorAll("pre");
    preElements.forEach((pre) => {
      // Create wrapper
      const wrapper = document.createElement("div");
      wrapper.className = "code-block-wrapper";

      // Insert wrapper before pre, then move pre into wrapper
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      // Create copy button
      const copyBtn = document.createElement("button");
      copyBtn.className = "code-block-copy-btn";
      copyBtn.innerHTML = '<i data-feather="copy"></i> Copiar Código';

      copyBtn.onclick = () => {
        // Extract text from the code element inside if it exists, otherwise use pre's text
        const codeElement = pre.querySelector("code");
        const textToCopy = codeElement ? codeElement.innerText : pre.innerText;

        navigator.clipboard.writeText(textToCopy);
        copyBtn.innerHTML = '<i data-feather="check"></i> Copiado';
        feather.replace();

        // Reset after 2 seconds
        setTimeout(() => {
          copyBtn.innerHTML = '<i data-feather="copy"></i> Copiar Código';
          feather.replace();
        }, 2000);
      };

      // Append copy button to wrapper
      wrapper.appendChild(copyBtn);
    });
  },
};
