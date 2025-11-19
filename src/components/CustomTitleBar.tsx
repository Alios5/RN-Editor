import { Minus, Square, X } from "lucide-react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { CloseHandler } from "@/utils/closeHandler";

export const CustomTitleBar = () => {
  const handleMinimize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const appWindow = getCurrentWebviewWindow();
      await appWindow.minimize();
    } catch (err) {
      console.error("Error minimizing:", err);
    }
  };

  const handleMaximize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const appWindow = getCurrentWebviewWindow();
      await appWindow.toggleMaximize();
    } catch (err) {
      console.error("Error maximizing:", err);
    }
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await CloseHandler.requestClose();
  };

  const handleDragStart = async (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      try {
        const appWindow = getCurrentWebviewWindow();
        await appWindow.startDragging();
      } catch (err) {
        console.error("❌ Error dragging:", err);
      }
    }
  };

  return (
    <div 
      className="fixed top-0 left-0 right-0 h-8 bg-background border-b flex items-center justify-between select-none z-50"
    >
      <div 
        onMouseDown={handleDragStart}
        className="flex items-center gap-2 text-sm font-medium px-2 flex-1 h-full cursor-move"
      >
      </div>
      
      <div className="flex items-center shrink-0">
        <button
          onMouseDown={handleMinimize}
          className="hover:bg-accent h-8 w-10 flex items-center justify-center transition-colors cursor-pointer"
          title="Réduire"
        >
          <Minus className="h-4 w-4" />
        </button>
        
        <button
          onMouseDown={handleMaximize}
          className="hover:bg-accent h-8 w-10 flex items-center justify-center transition-colors cursor-pointer"
          title="Agrandir/Rétrécir"
        >
          <Square className="h-3 w-3" />
        </button>
        
        <button
          onMouseDown={handleClose}
          className="hover:bg-destructive hover:text-destructive-foreground h-8 w-10 flex items-center justify-center transition-colors cursor-pointer"
          title="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
