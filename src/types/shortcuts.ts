export interface Shortcut {
  id: string;
  nameKey: string; // Clé de traduction pour le nom
  descriptionKey: string; // Clé de traduction pour la description
  defaultKey: string;
  currentKey: string;
  modifiable: boolean;
  category: 'editor' | 'selection' | 'navigation' | 'window';
}

export const DEFAULT_SHORTCUTS: Shortcut[] = [
  // Raccourcis immodifiables
  {
    id: 'copy',
    nameKey: 'shortcuts.copy',
    descriptionKey: 'shortcuts.copyDesc',
    defaultKey: 'Ctrl+C',
    currentKey: 'Ctrl+C',
    modifiable: false,
    category: 'selection',
  },
  {
    id: 'paste',
    nameKey: 'shortcuts.paste',
    descriptionKey: 'shortcuts.pasteDesc',
    defaultKey: 'Ctrl+V',
    currentKey: 'Ctrl+V',
    modifiable: false,
    category: 'selection',
  },
  {
    id: 'cut',
    nameKey: 'shortcuts.cut',
    descriptionKey: 'shortcuts.cutDesc',
    defaultKey: 'Ctrl+X',
    currentKey: 'Ctrl+X',
    modifiable: false,
    category: 'selection',
  },
  {
    id: 'duplicate',
    nameKey: 'shortcuts.duplicate',
    descriptionKey: 'shortcuts.duplicateDesc',
    defaultKey: 'Ctrl+D',
    currentKey: 'Ctrl+D',
    modifiable: false,
    category: 'selection',
  },
  {
    id: 'delete',
    nameKey: 'shortcuts.delete',
    descriptionKey: 'shortcuts.deleteDesc',
    defaultKey: 'Delete',
    currentKey: 'Delete',
    modifiable: false,
    category: 'selection',
  },
  // Raccourcis modifiables
  {
    id: 'merge',
    nameKey: 'shortcuts.merge',
    descriptionKey: 'shortcuts.mergeDesc',
    defaultKey: 'f',
    currentKey: 'f',
    modifiable: true,
    category: 'selection',
  },
  {
    id: 'editMode',
    nameKey: 'shortcuts.editMode',
    descriptionKey: 'shortcuts.editModeDesc',
    defaultKey: 'e',
    currentKey: 'e',
    modifiable: true,
    category: 'editor',
  },
  {
    id: 'selectMode',
    nameKey: 'shortcuts.selectMode',
    descriptionKey: 'shortcuts.selectModeDesc',
    defaultKey: 's',
    currentKey: 's',
    modifiable: true,
    category: 'editor',
  },
  {
    id: 'undo',
    nameKey: 'shortcuts.undo',
    descriptionKey: 'shortcuts.undoDesc',
    defaultKey: 'Ctrl+Z',
    currentKey: 'Ctrl+Z',
    modifiable: true,
    category: 'editor',
  },
  {
    id: 'redo',
    nameKey: 'shortcuts.redo',
    descriptionKey: 'shortcuts.redoDesc',
    defaultKey: 'Ctrl+Y',
    currentKey: 'Ctrl+Y',
    modifiable: true,
    category: 'editor',
  },
  // Raccourcis de lecture audio
  {
    id: 'playPause',
    nameKey: 'shortcuts.playPause',
    descriptionKey: 'shortcuts.playPauseDesc',
    defaultKey: 'Space',
    currentKey: 'Space',
    modifiable: true,
    category: 'editor',
  },
  {
    id: 'stop',
    nameKey: 'shortcuts.stop',
    descriptionKey: 'shortcuts.stopDesc',
    defaultKey: 'Escape',
    currentKey: 'Escape',
    modifiable: true,
    category: 'editor',
  },
  {
    id: 'seekBackward',
    nameKey: 'shortcuts.seekBackward',
    descriptionKey: 'shortcuts.seekBackwardDesc',
    defaultKey: 'ArrowLeft',
    currentKey: 'ArrowLeft',
    modifiable: true,
    category: 'editor',
  },
  {
    id: 'seekForward',
    nameKey: 'shortcuts.seekForward',
    descriptionKey: 'shortcuts.seekForwardDesc',
    defaultKey: 'ArrowRight',
    currentKey: 'ArrowRight',
    modifiable: true,
    category: 'editor',
  },
  // Raccourcis de fenêtre
  {
    id: 'toggleMaximize',
    nameKey: 'shortcuts.toggleMaximize',
    descriptionKey: 'shortcuts.toggleMaximizeDesc',
    defaultKey: 'Ctrl+Shift+M',
    currentKey: 'Ctrl+Shift+M',
    modifiable: true,
    category: 'window',
  },
  {
    id: 'toggleFullscreen',
    nameKey: 'shortcuts.toggleFullscreen',
    descriptionKey: 'shortcuts.toggleFullscreenDesc',
    defaultKey: 'F11',
    currentKey: 'F11',
    modifiable: true,
    category: 'window',
  },
];
