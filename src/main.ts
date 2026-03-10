import './style.css';
import { AuthModule } from './auth';
import { ApiModule } from './api';
import { UI } from './ui';
import { MarkdownProcessor } from './markdown';
import { StorageManager } from './storage';
import { Toast } from './components/toast';
import feather from 'feather-icons';

// Initialize Icons
feather.replace();

// Pre-flight check & Initialization
function init() {
  if (AuthModule.isAuthenticated()) {
    UI.showChatView();
  }
}

// Event Listeners: Login
UI.loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = UI.loginEmailInput.value;
  const password = UI.loginPasswordInput.value;

  UI.setLoginLoading(true);

  try {
    await AuthModule.login(email, password);
    UI.showChatView();
    Toast.show('Autenticado com sucesso', 'success');
  } catch (err) {
    console.error(err);
    UI.showLoginError();
  } finally {
    UI.setLoginLoading(false);
  }
});

// Event Listeners: Logout
UI.logoutBtn.addEventListener('click', () => {
  AuthModule.logout();
  UI.showLoginView();
  Toast.show('Sessão encerrada', 'info');
});

// Event Listeners: Sidebar Toggles
UI.toggleSidebarBtn.addEventListener('click', UI.toggleSidebar);
UI.openSidebarBtn.addEventListener('click', UI.toggleSidebar);

// Event Listeners: New Chat
UI.newChatBtn.addEventListener('click', () => {
  UI.clearChat();
  StorageManager.resetSessionId();
  if (window.innerWidth <= 768) {
    UI.sidebar.classList.add('collapsed');
  }
});

// Event Listeners: Theme
UI.themeToggleBtn.addEventListener('click', () => {
  Toast.show("🎨 O Tema Claro está em desenvolvimento. A interface Premium Dark é o padrão atual.", "info");
});

// Event Listeners: History Items
UI.historyItems.forEach(item => {
  item.addEventListener('click', (e) => {
    // Ignore if clicking the action dots
    if ((e.target as HTMLElement).closest('.action-icon')) return;

    // Remove active class from all
    UI.historyItems.forEach(hi => hi.classList.remove('active'));
    // Add to clicked
    item.classList.add('active');

    UI.chatHistory.innerHTML = `
      <div class="message system-message fade-in-up">
        <div class="message-avatar system-avatar">Z</div>
        <div class="message-content">
          <p>Carregando memória da sessão...</p>
        </div>
      </div>
    `;
    setTimeout(() => {
        UI.chatHistory.innerHTML = `
        <div class="message system-message fade-in-up">
          <div class="message-avatar system-avatar">Z</div>
          <div class="message-content">
            <p>Sessão recuperada. Prontos para continuar.</p>
          </div>
        </div>
      `;
    }, 800);

    if (window.innerWidth <= 768) {
      UI.sidebar.classList.add('collapsed');
    }
  });
});

UI.actionIcons.forEach(icon => {
  icon.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevents the history item from being clicked
    Toast.show("⚙️ Submenu: Fixar, Renomear, Excluir (Database emulation)", "info");
  });
});

// Event Listeners: Settings
UI.settingsItems.forEach(setting => {
  setting.addEventListener('click', (e) => {
    const title = (e.currentTarget as HTMLElement).querySelector('.item-title')?.textContent;
    Toast.show(`⚡ Módulo: ${title} em fase de integração.`, "info");
  });
});

// Event Listeners: Chat Input
UI.chatInput.addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
  UI.sendBtn.disabled = this.value.trim().length === 0;
});

UI.chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!UI.sendBtn.disabled) UI.chatForm.dispatchEvent(new Event('submit'));
  }
});

// Event Listeners: Chat Submission
UI.chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const message = UI.chatInput.value.trim();
  if (!message) return;

  // 1. Add user message
  UI.appendMessage('user', `<p>${MarkdownProcessor.escapeHTML(message).replace(/\n/g, '<br>')}</p>`);

  // Reset input
  UI.chatInput.value = '';
  UI.chatInput.style.height = 'auto';
  UI.sendBtn.disabled = true;
  UI.sendBtn.classList.add('thinking-pulse');

  // 2. Add System message placeholder
  const systemContentNode = UI.appendMessage('system', '<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>');

  let accumulatedText = "";
  let isFirstChunk = true;

  await ApiModule.sendChatStream(
    message,
    StorageManager.getSessionId(),
    // onChunk
    (chunkContent: string) => {
      if (isFirstChunk) {
        systemContentNode.innerHTML = ''; // Clear typing indicator
        isFirstChunk = false;
      }
      accumulatedText += chunkContent;
      // Convert accumulated markdown to HTML
      systemContentNode.innerHTML = MarkdownProcessor.parse(accumulatedText);
      UI.chatHistory.scrollTop = UI.chatHistory.scrollHeight;
    },
    // onError
    (errorMsg: string) => {
      if (errorMsg === 'UNAUTHORIZED') {
        Toast.show('Sessão expirada. Redirecionando...', 'error');
        AuthModule.logout();
        UI.showLoginView();
      } else {
        systemContentNode.innerHTML = `<p class="error-msg">${MarkdownProcessor.escapeHTML(errorMsg)}</p>`;
        Toast.show('Erro de comunicação com o motor.', 'error');
      }
    },
    // onFinish
    () => {
      UI.sendBtn.classList.remove('thinking-pulse');
    }
  );
});

// Start
init();
