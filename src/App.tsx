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
    // Retirer le splash screen une fois que React est monté
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
    
    // Attendre un peu pour que tout soit bien chargé
    setTimeout(removeSplash, 100);
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

  useEffect(() => {
    // Restore window state on startup
    restoreWindowState();

    // Setup automatic window state persistence
    let cleanup: (() => void) | undefined;
    setupWindowStatePersistence().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
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
