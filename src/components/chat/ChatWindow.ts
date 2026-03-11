import feather from 'feather-icons';
import { MarkdownProcessor } from '../../markdown';
import { events, EVENTS } from '../../core/eventBus';

export class ChatWindowComponent {
  private historyContainer: HTMLElement;
  private currentSystemNode: HTMLElement | null = null;

  constructor() {
    this.historyContainer = document.getElementById('chat-history')!;
    this.bindEvents();
  }

  private bindEvents() {
    // Listens for external clicks on suggestion cards
    this.historyContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const card = target.closest('.suggestion-card');
      if (card) {
        const prompt = card.getAttribute('data-prompt');
        if (prompt) {
          // Tell ChatInput to populate and focus
          events.emit(EVENTS.NEW_CHAT_REQUESTED, prompt);
        }
      }
    });

    events.subscribe(EVENTS.MESSAGE_SENT, (message: string) => {
      this.appendUserMessage(message);
      this.currentSystemNode = this.appendSystemPlaceholder();
    });

    events.subscribe(EVENTS.CHUNK_RECEIVED, (chunk: { isFirst: boolean; accumulatedText: string }) => {
      if (this.currentSystemNode) {
        if (chunk.isFirst) {
          this.currentSystemNode.innerHTML = ''; // Clear typing indicator
        }
        this.currentSystemNode.innerHTML = MarkdownProcessor.parse(chunk.accumulatedText);
        
        // Smart scroll
        const threshold = 150;
        const isNearBottom = this.historyContainer.scrollHeight - this.historyContainer.scrollTop - this.historyContainer.clientHeight < threshold;
        if (isNearBottom) {
          this.historyContainer.scrollTop = this.historyContainer.scrollHeight;
        }
      }
    });

    events.subscribe(EVENTS.STREAM_ERROR, (errorHtml: string) => {
       if (this.currentSystemNode) {
          this.currentSystemNode.innerHTML = errorHtml;
       }
    });
  }

  // Same logic migrated from ui.ts
  public appendUserMessage(text: string) {
    const safeHtml = `<p>${MarkdownProcessor.escapeHTML(text).replace(/\n/g, '<br>')}</p>`;
    this.appendMessage('user', safeHtml);
  }

  public appendSystemPlaceholder(): HTMLElement {
    const zenithThinkingHtml = `
      <div class="zenith-thinking">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="28" height="28" fill="none">
          <path d="M20 75 L50 25 L80 75" stroke="url(#zenith-glow-thinking)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M35 75 L50 50 L65 75" stroke="url(#zenith-glow-thinking)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.35"/>
          <circle cx="50" cy="12" r="6" fill="#14b8a6" />
          <defs>
            <linearGradient id="zenith-glow-thinking" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#4f46e5" />
              <stop offset="50%" stop-color="#8b5cf6" />
              <stop offset="100%" stop-color="#67e8f9" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    `;
    return this.appendMessage('system', zenithThinkingHtml);
  }

  private appendMessage(role: 'user' | 'system', htmlContent: string): HTMLElement {
    // Remove welcome state if present
    const welcomeState = document.getElementById('welcome-state');
    if (welcomeState) {
      welcomeState.remove();
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

    // AI Actions (Copy)
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
      
      const contentWrapper = document.createElement('div');
      contentWrapper.style.width = '100%';
      
      msgDiv.replaceChild(contentWrapper, content);
      contentWrapper.appendChild(content);
      contentWrapper.appendChild(actionsDiv);
      
      setTimeout(() => feather.replace(), 10);
    }

    this.historyContainer.appendChild(msgDiv);
    this.historyContainer.scrollTop = this.historyContainer.scrollHeight;
    
    // Replace icons for user avatars if any
    if (role === 'user') feather.replace();
    
    return content;
  }
}
