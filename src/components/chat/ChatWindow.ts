import feather from "feather-icons";
import type { QualityMetadata, SessionMessage } from "../../api/chatService";
import { events, EVENTS } from "../../core/eventBus";
import { MarkdownProcessor } from "../../markdown";
import { UI, ZENITH_LOGO_SVG } from "../../ui";

export class ChatWindowComponent {
  private historyContainer: HTMLElement;
  private currentSystemNode: HTMLElement | null = null;
  private currentSystemWrapper: HTMLElement | null = null;
  private latestAccumulatedText = "";
  private renderScheduled = false;
  private slowStartTimer: number | null = null;

  constructor() {
    this.historyContainer = document.getElementById("chat-history")!;
    this.bindEvents();
  }

  private bindEvents() {
    // Starter suggestion cards inside welcome state
    this.historyContainer.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const card = target.closest(".suggestion-card");
      if (card) {
        const prompt = card.getAttribute("data-prompt");
        if (prompt) {
          events.emit(EVENTS.NEW_CHAT_REQUESTED, prompt);
        }
      }
    });

    events.subscribe(EVENTS.MESSAGE_SENT, (message: string) => {
      this.latestAccumulatedText = "";
      this.renderScheduled = false;
      this.appendUserMessage(message);
      this.currentSystemNode = this.appendSystemPlaceholder();
      this.currentSystemWrapper = this.currentSystemNode.parentElement;

      this.clearSlowStartTimer();
      this.slowStartTimer = window.setTimeout(() => {
        if (this.currentSystemNode && !this.latestAccumulatedText) {
          const hint = this.currentSystemNode.querySelector(".stream-status-hint");
          if (hint) {
            hint.textContent =
              "Acordando o motor e analisando sua intenção (pode levar alguns segundos)...";
          }
        }
      }, 3000);
    });

    events.subscribe(
      EVENTS.CHUNK_RECEIVED,
      (chunk: { isFirst: boolean; accumulatedText: string }) => {
        if (!this.currentSystemNode) return;

        if (chunk.isFirst) {
          this.clearSlowStartTimer();
          this.currentSystemNode.innerHTML = "";
        }

        this.latestAccumulatedText = chunk.accumulatedText;
        if (!this.renderScheduled) {
          this.renderScheduled = true;
          requestAnimationFrame(() => {
            this.renderScheduled = false;
            if (!this.currentSystemNode) return;
            this.currentSystemNode.innerHTML = MarkdownProcessor.parse(
              this.latestAccumulatedText,
            );
            this.scrollToBottomIfNear();
          });
        }
      },
    );

    events.subscribe(EVENTS.STREAM_FINISHED, () => {
      this.clearSlowStartTimer();
      this.renderScheduled = false;
      if (this.currentSystemNode && this.latestAccumulatedText) {
        this.currentSystemNode.innerHTML = MarkdownProcessor.parse(
          this.latestAccumulatedText,
        );
        UI._applyCodeBlockActions(this.currentSystemNode);
        this.scrollToBottomIfNear();
      }
      feather.replace();
    });

    events.subscribe(EVENTS.QUALITY_RECEIVED, (quality: QualityMetadata) => {
      if (this.currentSystemWrapper && quality) {
        this.appendQualityPanel(this.currentSystemWrapper, quality);
      }
    });

    events.subscribe(EVENTS.STREAM_ERROR, (errorHtml: string) => {
      this.clearSlowStartTimer();
      if (this.currentSystemNode) {
        this.currentSystemNode.innerHTML = errorHtml;
      }
    });

    events.subscribe(EVENTS.SESSION_LOADED, (messages: SessionMessage[]) => {
      this.clearSlowStartTimer();
      this.currentSystemNode = null;
      this.currentSystemWrapper = null;
      this.historyContainer.innerHTML = "";
      this.historyContainer.classList.remove("empty-mode");

      if (!messages || messages.length === 0) {
        this.appendMessage(
          "system",
          "<p>Sessão iniciada sem mensagens anteriores. Envie sua primeira instrução abaixo.</p>",
        );
        return;
      }

      for (const msg of messages) {
        const text = (msg.parts || []).join("\n");
        if (msg.role === "user") {
          this.appendUserMessage(text);
        } else {
          const contentEl = this.appendMessage(
            "system",
            MarkdownProcessor.parse(text),
          );
          UI._applyCodeBlockActions(contentEl);
          const meta = msg.metadata || {};
          if (typeof meta.score === "number" && contentEl.parentElement) {
            this.appendQualityPanel(contentEl.parentElement, {
              score: meta.score,
              feedback: meta.judge_feedback || "",
              needs_refinement: Boolean(meta.needs_refinement),
            });
          }
        }
      }
      feather.replace();
    });
  }

  private clearSlowStartTimer() {
    if (this.slowStartTimer !== null) {
      clearTimeout(this.slowStartTimer);
      this.slowStartTimer = null;
    }
  }

  private scrollToBottomIfNear() {
    const threshold = 150;
    const isNearBottom =
      this.historyContainer.scrollHeight -
        this.historyContainer.scrollTop -
        this.historyContainer.clientHeight <
      threshold;
    if (isNearBottom) {
      this.historyContainer.scrollTop = this.historyContainer.scrollHeight;
    }
  }

  public appendUserMessage(text: string) {
    const safeHtml = `<p>${MarkdownProcessor.escapeHTML(text).replace(/\n/g, "<br>")}</p>`;
    this.appendMessage("user", safeHtml);
  }

  public appendSystemPlaceholder(): HTMLElement {
    const zenithThinkingHtml = `
      <div class="zenith-thinking">
        ${ZENITH_LOGO_SVG}
        <span class="stream-status-hint">Analisando sua intenção...</span>
      </div>
    `;
    return this.appendMessage("system", zenithThinkingHtml);
  }

  private appendQualityPanel(wrapper: HTMLElement, quality: QualityMetadata) {
    if (wrapper.querySelector(".quality-panel-card")) {
      return;
    }

    const score = Number(quality.score ?? 0);
    const tierClass =
      score >= 85 ? "score-high" : score >= 70 ? "score-mid" : "score-low";

    const card = document.createElement("div");
    card.className = "quality-panel-card fade-in-up";

    const header = document.createElement("div");
    header.className = "quality-panel-header";

    const title = document.createElement("span");
    title.className = "quality-panel-title";
    title.textContent = "Auditoria de Qualidade (The Judge)";

    const badge = document.createElement("span");
    badge.className = `quality-score-badge ${tierClass}`;
    badge.textContent = `${score}/100`;

    header.appendChild(title);
    header.appendChild(badge);
    card.appendChild(header);

    if (quality.feedback) {
      const feedbackEl = document.createElement("p");
      feedbackEl.className = "quality-panel-feedback";
      feedbackEl.textContent = quality.feedback;
      card.appendChild(feedbackEl);
    }

    const refineBtn = document.createElement("button");
    refineBtn.type = "button";
    refineBtn.className = "action-chip refine-prompt-btn";
    refineBtn.innerHTML = '<i data-feather="sliders"></i> Refinar Prompt';
    refineBtn.onclick = () => {
      const feedbackContext = quality.feedback
        ? ` Considere especialmente este feedback: "${quality.feedback}".`
        : "";
      events.emit(
        EVENTS.REFINE_REQUESTED,
        `Refine e fortaleça o prompt anterior mantendo a clareza didática e aumentando a precisão dos critérios.${feedbackContext}`,
      );
    };

    card.appendChild(refineBtn);

    const actionsDiv = wrapper.querySelector(".message-actions");
    if (actionsDiv) {
      wrapper.insertBefore(card, actionsDiv);
    } else {
      wrapper.appendChild(card);
    }

    feather.replace();
  }

  private appendMessage(
    role: "user" | "system",
    htmlContent: string,
  ): HTMLElement {
    const welcomeState = document.getElementById("welcome-state");
    if (welcomeState) {
      welcomeState.remove();
    }
    this.historyContainer.classList.remove("empty-mode");

    const navCenter = document.getElementById("nav-center");
    if (navCenter && navCenter.style.display === "none") {
      navCenter.style.display = "flex";
    }

    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${role}-message fade-in-up`;

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.innerHTML =
      role === "system" ? ZENITH_LOGO_SVG : '<i data-feather="user"></i>';

    const content = document.createElement("div");
    content.className = "message-content";
    content.innerHTML = htmlContent;

    msgDiv.appendChild(avatar);
    msgDiv.appendChild(content);

    if (role === "system") {
      const actionsDiv = document.createElement("div");
      actionsDiv.className = "message-actions";

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "action-chip";
      copyBtn.innerHTML = '<i data-feather="copy"></i> Copiar Resposta';
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

      const contentWrapper = document.createElement("div");
      contentWrapper.className = "system-content-wrapper";
      contentWrapper.style.width = "100%";

      msgDiv.replaceChild(contentWrapper, content);
      contentWrapper.appendChild(content);
      contentWrapper.appendChild(actionsDiv);

      setTimeout(() => feather.replace(), 10);
    }

    this.historyContainer.appendChild(msgDiv);
    this.historyContainer.scrollTop = this.historyContainer.scrollHeight;

    if (role === "user") feather.replace();

    return content;
  }
}
