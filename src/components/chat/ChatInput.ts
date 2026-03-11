import { events, EVENTS } from '../../core/eventBus';

export class ChatInputComponent {
  private form: HTMLFormElement;
  private input: HTMLTextAreaElement;
  private sendBtn: HTMLButtonElement;

  constructor() {
    this.form = document.getElementById('chat-form') as HTMLFormElement;
    this.input = document.getElementById('chat-input') as HTMLTextAreaElement;
    this.sendBtn = document.getElementById('send-btn') as HTMLButtonElement;

    this.bindEvents();
  }

  private bindEvents() {
    // Auto-resize logic and disable/enable Send button
    this.input.addEventListener('input', () => {
      this.input.style.height = 'auto';
      this.input.style.height = this.input.scrollHeight + 'px';
      this.sendBtn.disabled = this.input.value.trim().length === 0;
    });

    // Enter to submit (Shift+Enter for newline)
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!this.sendBtn.disabled) {
          this.form.dispatchEvent(new Event('submit'));
        }
      }
    });

    // Form submission
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const message = this.input.value.trim();
      if (!message) return;

      // Emit event through EventBus
      events.emit(EVENTS.MESSAGE_SENT, message);

      // Reset UI state locally
      this.resetInput();
    });
  }

  private resetInput() {
    this.input.value = '';
    this.input.style.height = 'auto';
    this.sendBtn.disabled = true;
  }

  // Exposed API for other components to force input entry
  public setQuery(text: string) {
    this.input.value = text;
    this.input.style.height = 'auto';
    this.input.style.height = this.input.scrollHeight + 'px';
    this.sendBtn.disabled = false;
    this.input.focus();
  }
}
