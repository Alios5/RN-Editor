import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { restoreWindowState, setupWindowStatePersistence } from "@/utils/windowState";
import { CloseHandler } from "@/utils/closeHandler";
import { CustomTitleBar } from "@/components/CustomTitleBar";
import { CloseHandlerTranslations } from "@/components/CloseHandlerTranslations";
import { useWindowShortcuts } from "@/hooks/useWindowShortcuts";
import { loadTheme, applyTheme } from "@/utils/themeManager";
import Projects from "./pages/Projects";
import Editor from "./pages/Editor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Enable global window shortcuts
  useWindowShortcuts();

  useEffect(() => {
    // Remove splash screen once React is mounted
    const removeSplash = () => {
      const splash = document.getElementById('splash-screen');
      if (splash) {
        splash.style.opacity = '0';
        setTimeout(() => {
          splash.remove();
          // Restaurer l'overflow du body
          document.body.style.overflow = 'auto';
        }, 300);
      }
    };
    
    // Wait a bit for everything to be loaded
    setTimeout(removeSplash, 100);
  }, []);

  useEffect(() => {
    // Restore window state on startup and setup persistence
    const initWindowState = async () => {
      try {
        await restoreWindowState();
        const cleanup = await setupWindowStatePersistence();
        (window as any).__windowStateCleanup = cleanup;
      } catch (error) {
        console.error('Error initializing window state:', error);
      }
    };

    initWindowState();

    return () => {
      const cleanup = (window as any).__windowStateCleanup;
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  useEffect(() => {
    // Initialize global close interception. Editor will override the dialog callback.
    let cleanupClose: (() => void) | undefined;
    
    const init = async () => {
      cleanupClose = await CloseHandler.initialize({
        onShowDialog: () => {
          // Let any mounted Editor react to this event
          window.dispatchEvent(new CustomEvent('rn-show-unsaved-dialog'));
        },
      });
    };
    
    init();

    return () => {
      if (cleanupClose) cleanupClose();
    };
  }, []);

  useEffect(() => {
    // Désactiver le menu contextuel système de Chromium/Tauri
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  useEffect(() => {
    // Apply saved theme on startup
    const savedTheme = loadTheme();
    applyTheme(savedTheme);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <CloseHandlerTranslations />
        <TooltipProvider>
          <CustomTitleBar />
          <div className="fixed inset-0 top-8 overflow-hidden">
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Projects />} />
                <Route path="/editor/:id" element={<Editor />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
