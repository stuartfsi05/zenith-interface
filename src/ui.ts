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
  toggleSidebarBtn: document.getElementById('toggle-sidebar')!,
  openSidebarBtn: document.getElementById('open-sidebar-btn')!,
  newChatBtn: document.getElementById('new-chat-btn')!,
  themeToggleBtn: document.getElementById('theme-toggle-btn')!,
  historyItems: document.querySelectorAll('.history-item'),
  actionIcons: document.querySelectorAll('.action-icon'),
  settingsItems: document.querySelectorAll('.sidebar-bottom .settings-item:not(#theme-toggle-btn)'),

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
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}-message fade-in-up`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? 'U' : 'Z';

    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = htmlContent;

    msgDiv.appendChild(avatar);
    msgDiv.appendChild(content);

    UI.chatHistory.appendChild(msgDiv);
    UI.chatHistory.scrollTop = UI.chatHistory.scrollHeight;
    return content;
  },

  clearChat: () => {
    UI.chatHistory.innerHTML = `
      <div class="message system-message fade-in-up">
        <div class="message-avatar system-avatar">Z</div>
        <div class="message-content">
          <p>Bem-vindo ao Zenith. O Roteador Cognitivo está online. O que construiremos hoje?</p>
        </div>
      </div>
    `;
  },
  
  toggleSidebar: () => {
    UI.sidebar.classList.toggle('collapsed');
  }
};
