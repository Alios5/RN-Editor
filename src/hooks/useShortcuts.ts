import { useState, useEffect } from 'react';
import { Shortcut, DEFAULT_SHORTCUTS } from '@/types/shortcuts';

const SHORTCUTS_STORAGE_KEY = 'rn-editor-shortcuts';

export const useShortcuts = () => {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(DEFAULT_SHORTCUTS);

  // Charger les raccourcis depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setShortcuts(parsed);
      } catch (error) {
        console.error('Error loading shortcuts:', error);
      }
    }
  }, []);

  // Sauvegarder les raccourcis dans localStorage
  const saveShortcuts = (newShortcuts: Shortcut[]) => {
    setShortcuts(newShortcuts);
    localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(newShortcuts));
  };

  // Mettre à jour un raccourci
  const updateShortcut = (id: string, newKey: string) => {
    const updated = shortcuts.map(shortcut =>
      shortcut.id === id ? { ...shortcut, currentKey: newKey } : shortcut
    );
    saveShortcuts(updated);
  };

  // Réinitialiser tous les raccourcis
  const resetShortcuts = () => {
    saveShortcuts(DEFAULT_SHORTCUTS);
  };

  // Réinitialiser un raccourci spécifique
  const resetShortcut = (id: string) => {
    const updated = shortcuts.map(shortcut =>
      shortcut.id === id ? { ...shortcut, currentKey: shortcut.defaultKey } : shortcut
    );
    saveShortcuts(updated);
  };

  // Obtenir un raccourci par ID
  const getShortcut = (id: string): Shortcut | undefined => {
    return shortcuts.find(s => s.id === id);
  };

  // Vérifier si une touche correspond à un raccourci
  const matchesShortcut = (id: string, event: KeyboardEvent): boolean => {
    const shortcut = getShortcut(id);
    if (!shortcut) return false;

    const key = shortcut.currentKey.toLowerCase();
    const eventKey = event.key.toLowerCase();

    // Normaliser les touches spéciales de l'événement
    let normalizedEventKey = eventKey;
    if (event.key === ' ') normalizedEventKey = 'space';
    if (event.key === 'Escape') normalizedEventKey = 'escape';
    if (event.key === 'ArrowLeft') normalizedEventKey = 'arrowleft';
    if (event.key === 'ArrowRight') normalizedEventKey = 'arrowright';
    if (event.key === 'ArrowUp') normalizedEventKey = 'arrowup';
    if (event.key === 'ArrowDown') normalizedEventKey = 'arrowdown';
    if (event.key === 'Delete') normalizedEventKey = 'delete';

    // Gérer les raccourcis avec combinaisons de modificateurs (ex: Ctrl+Shift+M)
    if (key.includes('ctrl+') && key.includes('shift+')) {
      const mainKey = key.replace('ctrl+', '').replace('shift+', '');
      return (event.ctrlKey || event.metaKey) && event.shiftKey && normalizedEventKey === mainKey && !event.altKey;
    }

    if (key.includes('ctrl+') && key.includes('alt+')) {
      const mainKey = key.replace('ctrl+', '').replace('alt+', '');
      return (event.ctrlKey || event.metaKey) && event.altKey && normalizedEventKey === mainKey && !event.shiftKey;
    }

    if (key.includes('shift+') && key.includes('alt+')) {
      const mainKey = key.replace('shift+', '').replace('alt+', '');
      return event.shiftKey && event.altKey && normalizedEventKey === mainKey && !event.ctrlKey && !event.metaKey;
    }

    // Gérer les raccourcis avec un seul modificateur
    if (key.includes('ctrl+')) {
      const mainKey = key.replace('ctrl+', '');
      return (event.ctrlKey || event.metaKey) && normalizedEventKey === mainKey && !event.shiftKey && !event.altKey;
    }
    
    if (key.includes('shift+')) {
      const mainKey = key.replace('shift+', '');
      return event.shiftKey && normalizedEventKey === mainKey && !event.ctrlKey && !event.metaKey && !event.altKey;
    }
    
    if (key.includes('alt+')) {
      const mainKey = key.replace('alt+', '');
      return event.altKey && normalizedEventKey === mainKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
    }

    // Raccourci simple (sans modificateur)
    return normalizedEventKey === key && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
  };

  return {
    shortcuts,
    updateShortcut,
    resetShortcuts,
    resetShortcut,
    getShortcut,
    matchesShortcut,
  };
};
