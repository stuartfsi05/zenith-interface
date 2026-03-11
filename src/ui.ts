import feather from 'feather-icons';

export const UI = {
  // DOM Elements
  loginView: document.getElementById('login-view')!,
  chatView: document.getElementById('chat-view')!,
  loginForm: document.getElementById('login-form') as HTMLFormElement,
  loginBtn: document.getElementById('login-btn') as HTMLButtonElement,
  loginEmailInput: document.getElementById('email') as HTMLInputElement,
  loginPasswordInput: document.getElementById('password') as HTMLInputElement,
  loginError: document.getElementById('login-error')!,
  
  chatHistory: document.getElementById('chat-history')!,
  chatForm: document.getElementById('chat-form') as HTMLFormElement,
  chatInput: document.getElementById('chat-input') as HTMLTextAreaElement,
  sendBtn: document.getElementById('send-btn') as HTMLButtonElement,
  logoutBtn: document.getElementById('logout-btn')!,
  
  sidebar: document.getElementById('sidebar')!,
  openSidebarBtn: document.getElementById('open-sidebar-btn')!,
  newChatBtn: document.getElementById('new-chat-btn')!,
  themeToggleBtn: document.getElementById('theme-toggle-btn')!,
  historyItems: document.querySelectorAll('.history-item'),
  actionIcons: document.querySelectorAll('.action-icon'),
  settingsItems: document.querySelectorAll('.sidebar-bottom .settings-item'),

  // View States
  showChatView: () => {
    UI.loginView.classList.remove('active');
    UI.loginView.classList.add('hidden');
    UI.chatView.classList.remove('hidden');
    UI.chatView.classList.add('active');
    setTimeout(() => UI.chatInput.focus(), 100);
  },

  showLoginView: () => {
    UI.chatView.classList.remove('active');
    UI.chatView.classList.add('hidden');
    UI.loginView.classList.remove('hidden');
    UI.loginView.classList.add('active');
    UI.loginForm.reset();
  },

  setLoginLoading: (isLoading: boolean) => {
    UI.loginBtn.disabled = isLoading;
    if (isLoading) {
      UI.loginBtn.innerHTML = '<span class="spinner"></span><span class="btn-text hidden">Entrando...</span>';
      UI.loginError.classList.add('hidden');
    } else {
      UI.loginBtn.innerHTML = '<span class="btn-text">Entrar</span>';
    }
  },

  showLoginError: () => {
    UI.loginError.classList.remove('hidden');
  },

  // Message Handling
  appendMessage: (role: 'user' | 'system', htmlContent: string) => {
    // Remove empty state on first message
    if (UI.chatHistory.classList.contains('empty-mode')) {
      UI.chatHistory.classList.remove('empty-mode');
      const welcomeState = document.getElementById('welcome-state');
      if (welcomeState) welcomeState.remove();
      
      const navCenter = document.getElementById('nav-center');
      if (navCenter) {
        navCenter.style.display = 'flex';
        const headerText = navCenter.querySelector('span');
        if (headerText && headerText.textContent === 'Zenith Engine (Transient)') {
          headerText.textContent = 'Nova Conversa';
        }
      }
    }

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}-message fade-in-up`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    if (role === 'system') {
      avatar.innerHTML = `
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
    } else {
      avatar.innerHTML = '<i data-feather="user"></i>';
    }
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = htmlContent;

    msgDiv.appendChild(avatar);
    msgDiv.appendChild(content);

    // Add action buttons for AI messages (Copy to clipboard)
    if (role === 'system') {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'message-actions';
      
      const copyBtn = document.createElement('button');
      copyBtn.className = 'action-chip';
      copyBtn.innerHTML = '<i data-feather="copy"></i> Copiar';
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(content.innerText);
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i data-feather="check"></i> Copiado';
        feather.replace();
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
          feather.replace();
        }, 2000);
      };
      
      actionsDiv.appendChild(copyBtn);
      
      // Need to wrap content and actions together so actions appear below content
      const contentWrapper = document.createElement('div');
      contentWrapper.style.width = '100%';
      contentWrapper.appendChild(content);
      contentWrapper.appendChild(actionsDiv);
      
      msgDiv.replaceChild(contentWrapper, content);
      
      // Make sure new icons are rendered
      setTimeout(() => feather.replace(), 10);
    }

    UI.chatHistory.appendChild(msgDiv);
    UI.chatHistory.scrollTop = UI.chatHistory.scrollHeight;
    return content;
  },

  clearChat: () => {
    UI.chatHistory.innerHTML = `
      <div id="welcome-state" class="welcome-container fade-in-up">
        <div class="welcome-hero">
          <div class="welcome-logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" fill="none">
              <path d="M20 75 L50 25 L80 75" stroke="url(#zenith-glow-hero)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M35 75 L50 50 L65 75" stroke="url(#zenith-glow-hero)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.35"/>
              <circle cx="50" cy="12" r="6" fill="#14b8a6" />
              <defs>
                <linearGradient id="zenith-glow-hero" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#4f46e5" />
                  <stop offset="50%" stop-color="#8b5cf6" />
                  <stop offset="100%" stop-color="#67e8f9" />
                </linearGradient>
              </defs>
            </svg>                  
          </div>
          <h1 class="welcome-title">Olá.</h1>
          <p class="welcome-subtitle">O que vamos projetar hoje?</p>
        </div>
        <div class="empty-state-suggestions">
          <button class="suggestion-card" data-prompt="Quero criar um mega-prompt para estruturar um plano de negócios completo. Quais são os blocos essenciais que devo incluir no prompt?">
            <i data-feather="layers"></i>
            <span>Estruturar Mega-Prompt</span>
          </button>
          <button class="suggestion-card" data-prompt="Me ajude a definir uma persona especialista em engenharia de software sênior. O prompt deve fazê-lo focar em performance e arquitetura limpa.">
            <i data-feather="users"></i>
            <span>Criar Persona Especialista</span>
          </button>
          <button class="suggestion-card" data-prompt="Tenho um script em Python antigo. Quero um prompt que não apenas refatore o código, mas explique as decisões arquiteturais tomadas.">
            <i data-feather="terminal"></i>
            <span>Converter Lógica em Prompt</span>
          </button>
          <button class="suggestion-card" data-prompt="Estou analisando dados de vendas. Como estruturo um prompt para extrair um framework de análise e tirar os melhores insights do modelo?">
            <i data-feather="grid"></i>
            <span>Extrair Framework de Análise</span>
          </button>
        </div>
      </div>
    `;
    UI.chatHistory.classList.add('empty-mode');
    const navCenter = document.getElementById('nav-center');
    if (navCenter) navCenter.style.display = 'none';

    setTimeout(() => feather.replace(), 10);
  },
  
  toggleSidebar: () => {
    UI.sidebar.classList.toggle('collapsed');
  }
};
