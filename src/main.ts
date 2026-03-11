import './style.css';
import { AuthModule } from './api/authService';
import { ApiModule } from './api/chatService';
import { UI } from './ui';
import { MarkdownProcessor } from './markdown';
import { StorageManager } from './core/storage';
import { events, EVENTS } from './core/eventBus';
import { ChatInputComponent } from './components/chat/ChatInput';
import { ChatWindowComponent } from './components/chat/ChatWindow';
import { SidebarComponent } from './components/layout/Sidebar';
import { HeaderComponent } from './components/layout/Header';
import { Toast } from './components/toast';
import feather from 'feather-icons';

let chatInputComponent: ChatInputComponent | null = null;

function initializeChatComponents() {
  if (!chatInputComponent) {
    chatInputComponent = new ChatInputComponent();
    new ChatWindowComponent();
    new SidebarComponent();
    new HeaderComponent();

    // Wire Chat submission to Engine API
    events.subscribe(EVENTS.MESSAGE_SENT, async (message: string) => {
      let isFirstChunk = true;
      let accumulatedText = "";
      
      await ApiModule.sendChatStream(
        message,
        StorageManager.getSessionId(),
        (chunkContent: string) => {
          accumulatedText += chunkContent;
          events.emit(EVENTS.CHUNK_RECEIVED, { isFirst: isFirstChunk, accumulatedText });
          isFirstChunk = false;
        },
        (errorMsg: string) => {
          if (errorMsg === 'UNAUTHORIZED') {
            Toast.show('Sessão expirada. Redirecionando...', 'error');
            AuthModule.logout();
            UI.showLoginView();
          } else {
            const errorHtml = `<p class="error-msg">${MarkdownProcessor.escapeHTML(errorMsg)}</p>`;
            events.emit(EVENTS.STREAM_ERROR, errorHtml);
            Toast.show('Erro de comunicação com o motor.', 'error');
          }
        },
        () => {}
      );
    });
  }
}

// Initialize Icons
feather.replace();

// Pre-flight check & Initialization
function init() {
  if (AuthModule.isAuthenticated()) {
    UI.showChatView();
    initializeChatComponents();
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
    initializeChatComponents();
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

// Event Listeners: Password Toggle
const togglePasswordBtn = document.getElementById('toggle-password');
if (togglePasswordBtn) {
  togglePasswordBtn.addEventListener('click', () => {
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    if (passwordInput) {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      
      const icon = togglePasswordBtn.querySelector('i');
      if (icon) {
        icon.setAttribute('data-feather', type === 'password' ? 'eye' : 'eye-off');
        feather.replace();
      }
    }
  });
}

// Sidebar, Header, History and Theme logic have been componentized into SidebarComponent and HeaderComponent

// Star init logic moved to bottom
init();
