import { invoke } from "@tauri-apps/api/core";
import { confirm } from "@tauri-apps/plugin-dialog";

/**
 * Centralized window-close handling for Tauri 2
 * Uses closable property (prevent_close/allow_close) instead of onCloseRequested
 */
export class CloseHandler {
  private static hasUnsavedChanges = false;
  private static onShowDialogCallback: (() => void) | null = null;
  private static checkIntervalId: number | null = null;
  private static isProcessingClose = false;

  /**
   * Initialize the close handler
   */
  static async initialize(callbacks: { onShowDialog: () => void }): Promise<() => void> {
    this.onShowDialogCallback = callbacks.onShowDialog;
    return () => this.cleanup();
  }

  static setHasUnsavedChanges(value: boolean) {
    this.hasUnsavedChanges = value;
  }

  static getHasUnsavedChanges(): boolean {
    return this.hasUnsavedChanges;
  }

  /**
   * Allow Editor to override the dialog display (React dialog)
   */
  static setOnShowDialog(callback: (() => void) | null) {
    this.onShowDialogCallback = callback;
  }

  /**
   * Request to close the window (shows dialog if unsaved changes)
   */
  static async requestClose() {
    if (this.isProcessingClose) {
      return;
    }

    this.isProcessingClose = true;

    try {
      if (this.hasUnsavedChanges) {
        // Show custom dialog via callback
        if (this.onShowDialogCallback) {
          this.onShowDialogCallback();
        } else {
          // Fallback: native confirm
          const ok = await confirm("Des modifications non sauvegardées. Quitter ?", {
            title: "Confirmer",
            okLabel: "Quitter",
            cancelLabel: "Annuler",
          });
          if (ok) await this.forceClose();
        }
      } else {
        // No unsaved changes: quick confirm
        const ok = await confirm("Êtes-vous sûr de vouloir quitter ?", {
          title: "Confirmer",
          okLabel: "Quitter",
          cancelLabel: "Annuler",
        });
        if (ok) await this.forceClose();
      }
    } finally {
      this.isProcessingClose = false;
    }
  }

  /**
   * Force close the window
   */
  static async forceClose() {
    try {
      await invoke("close_window", { force: true });
    } catch (e) {
      console.error("Error closing window:", e);
    }
  }

  static cleanup() {
    if (this.checkIntervalId !== null) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
  }
}
