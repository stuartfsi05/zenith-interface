import './style.css';
import feather from 'feather-icons';
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

/**
 * Zenith Frontend Entry Point
 * 
 * Orchestrates the lifecycle of the application, including authentication,
 * component initialization, and global event coordination.
 */

let isChatInitialized = false;

/**
 * Initializes visual components andWires core engine events.
 */
function initializeComponents(): void {
  if (isChatInitialized) return;

  // Instantiate layout and functional components
  new ChatInputComponent();
  new ChatWindowComponent();
  new SidebarComponent();
  new HeaderComponent();

  // Wire Chat Message Stream: Connects UI events to API Service
  events.subscribe(EVENTS.MESSAGE_SENT, async (message: string) => {
    let isFirstChunk = true;
    let accumulatedText = "";

    try {
      await ApiModule.sendChatStream(
        message,
        StorageManager.getSessionId(),
        (chunkContent: string) => {
          accumulatedText += chunkContent;
          events.emit(EVENTS.CHUNK_RECEIVED, { isFirst: isFirstChunk, accumulatedText });
          isFirstChunk = false;
        },
        async (errorMsg: string) => {
          if (errorMsg === 'UNAUTHORIZED') {
            Toast.show('Sessão expirada. Redirecionando...', 'error');
            setTimeout(() => {
              AuthModule.logout();
              UI.showLoginView();
            }, 1800);
          } else {
            const errorHtml = `<p class="error-msg">${MarkdownProcessor.escapeHTML(errorMsg)}</p>`;
            events.emit(EVENTS.STREAM_ERROR, errorHtml);
            Toast.show('Erro de comunicação com o motor.', 'error');
          }
        },
        () => {
          // Stream Complete handled in child components
        }
      );
    } catch (err) {
      console.error('Fatal Stream Error:', err);
      Toast.show('Erro crítico na transmissão.', 'error');
    }
  });

  isChatInitialized = true;
}

/**
 * Global Event Setup
 */
function setupGlobalListeners(): void {
  // Handle Auth Form Submission
  UI.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = UI.loginEmailInput.value;
    const password = UI.loginPasswordInput.value;

    UI.setLoginLoading(true);

    try {
      if (UI.authMode === 'login') {
        await AuthModule.login(email, password);
        Toast.show('Autenticado com sucesso', 'success');
      } else {
        await AuthModule.register(email, password);
        Toast.show('Conta criada com sucesso!', 'success');
      }
      UI.showChatView();
      initializeComponents();
    } catch (err: any) {
      console.error('Auth failure:', err);
      // If error message from the backend exists, surface it.
      if (err.message === 'VERIFICATION_REQUIRED') {
        const msg = 'Conta criada! Verifique a caixa de entrada do seu e-mail (incluindo SPAM) para confirmar o cadastro antes de entrar.';
        UI.showLoginError(msg);
        Toast.show(msg, 'info');
        UI.setAuthMode('login'); // Reverte pro login
      } else {
        const msg = err.message || 'Credenciais inválidas. Tente novamente.';
        UI.showLoginError(msg);
        Toast.show(msg, 'error');
      }
    } finally {
      UI.setLoginLoading(false);
    }
  });

  // Handle Auth Toggle (Login <-> Register)
  if (UI.authToggleBtn) {
    UI.authToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const newMode = UI.authMode === 'login' ? 'register' : 'login';
      UI.setAuthMode(newMode);
    });
  }

  // Handle Logout
  UI.logoutBtn.addEventListener('click', () => {
    AuthModule.logout();
    UI.showLoginView();
    Toast.show('Sessão encerrada', 'info');
  });

  // Password Visibility Toggle
  const togglePasswordBtn = document.getElementById('toggle-password');
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      const passwordInput = document.getElementById('password') as HTMLInputElement;
      if (passwordInput) {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';

        const icon = togglePasswordBtn.querySelector('i');
        if (icon) {
          icon.setAttribute('data-feather', isPassword ? 'eye-off' : 'eye');
          feather.replace();
        }
      }
    });
  }
}

/**
 * Application Bootstrapper
 */
function boot(): void {
  // 1. Setup Listeners
  setupGlobalListeners();

  // 2. Perform Session Pre-flight
  if (AuthModule.isAuthenticated()) {
    UI.showChatView();
    initializeComponents();
  } else {
    UI.showLoginView();
  }

  // 3. Render Icons
  feather.replace();
}

// Start application
boot();

