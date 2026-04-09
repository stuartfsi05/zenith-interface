import { UI } from "../../ui";
import { Toast } from "../toast";

export class HeaderComponent {
  private headerModelSelector: HTMLElement | null;
  private headerChatDropdown: HTMLElement | null;
  private headerActionPin: HTMLElement | null;
  private headerActionRename: HTMLElement | null;
  private headerActionDelete: HTMLElement | null;

  constructor() {
    this.headerModelSelector = document.getElementById("header-model-selector");
    this.headerChatDropdown = document.getElementById("header-chat-dropdown");
    this.headerActionPin = document.getElementById("header-action-pin");
    this.headerActionRename = document.getElementById("header-action-rename");
    this.headerActionDelete = document.getElementById("header-action-delete");

    this.bindEvents();
  }

  private bindEvents() {
    if (!this.headerModelSelector || !this.headerChatDropdown) return;

    this.headerModelSelector.addEventListener("click", (e) => {
      e.stopPropagation();
      const isTransient =
        this.headerModelSelector!.querySelector("span")?.textContent ===
        "Zenith Engine (Transient)";
      if (isTransient) {
        Toast.show(
          "Inicie um chat ou selecione um chat salvo para ver opções",
          "info",
        );
        return;
      }

      document.querySelectorAll(".history-dropdown.show").forEach((d) => {
        if (d !== this.headerChatDropdown) d.classList.remove("show");
      });
      this.headerChatDropdown!.classList.toggle("show");
    });

    this.headerActionPin?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.headerChatDropdown!.classList.remove("show");
      const activeItem = document.querySelector(
        ".history-item.active",
      ) as HTMLElement;
      if (activeItem) {
        const pinBtn = activeItem.querySelector(
          ".action-pin",
        ) as HTMLButtonElement;
        if (pinBtn) pinBtn.click();
      }
    });

    this.headerActionRename?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.headerChatDropdown!.classList.remove("show");
      const activeItem = document.querySelector(
        ".history-item.active",
      ) as HTMLElement;
      if (activeItem) {
        UI.sidebar.classList.remove("collapsed");
        const renameBtn = activeItem.querySelector(
          ".action-rename",
        ) as HTMLButtonElement;
        if (renameBtn) renameBtn.click();
      }
    });

    this.headerActionDelete?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.headerChatDropdown!.classList.remove("show");
      const activeItem = document.querySelector(
        ".history-item.active",
      ) as HTMLElement;
      if (activeItem) {
        const deleteBtn = activeItem.querySelector(
          ".action-delete",
        ) as HTMLButtonElement;
        if (deleteBtn) deleteBtn.click();
      }
    });
  }
}
