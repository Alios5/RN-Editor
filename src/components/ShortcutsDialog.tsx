import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useShortcuts } from '@/hooks/useShortcuts';
import { useTranslation } from '@/hooks/useTranslation';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft, faLock, faPen } from "@fortawesome/free-solid-svg-icons";
import { Shortcut } from '@/types/shortcuts';

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShortcutsDialog = ({ open, onOpenChange }: ShortcutsDialogProps) => {
  const { t } = useTranslation();
  const { shortcuts, updateShortcut, resetShortcuts, resetShortcut } = useShortcuts();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempKey, setTempKey] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent, shortcut: Shortcut) => {
    e.preventDefault();
    
    if (!shortcut.modifiable) return;

    const modifiers = [];
    if (e.ctrlKey || e.metaKey) modifiers.push('Ctrl');
    if (e.shiftKey) modifiers.push('Shift');
    if (e.altKey) modifiers.push('Alt');

    let key = e.key;
    
    // Normaliser certaines touches
    if (key === ' ') key = 'Space';
    if (key.length === 1) key = key.toLowerCase();

    const newKey = modifiers.length > 0 
      ? `${modifiers.join('+')}+${key}`
      : key;

    setTempKey(newKey);
  };

  const handleSaveShortcut = (id: string) => {
    if (tempKey) {
      updateShortcut(id, tempKey);
    }
    setEditingId(null);
    setTempKey('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTempKey('');
  };

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  const categoryNames: Record<string, string> = {
    editor: t('shortcuts.categoryEditor') || 'Éditeur',
    selection: t('shortcuts.categorySelection') || 'Sélection',
    navigation: t('shortcuts.categoryNavigation') || 'Navigation',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            ⌨️ {t('shortcuts.title') || 'Raccourcis clavier'}
          </DialogTitle>
          <DialogDescription>
            {t('shortcuts.description') || 'Personnalisez vos raccourcis clavier. Les raccourcis système ne peuvent pas être modifiés.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category} className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                {categoryNames[category]}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {t(shortcut.nameKey)}
                        {!shortcut.modifiable && (
                          <FontAwesomeIcon icon={faLock} className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t(shortcut.descriptionKey)}
                      </div>
                    </div>                    
                    <div className="flex items-center gap-2">
                      {editingId === shortcut.id ? (
                        <>
                          <Input
                            value={tempKey || shortcut.currentKey}
                            onKeyDown={(e) => handleKeyDown(e, shortcut)}
                            placeholder="Appuyez sur une touche..."
                            className="w-40 text-center font-mono"
                            autoFocus
                            readOnly
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveShortcut(shortcut.id)}
                          >
                            {t('actions.confirm') || 'OK'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                          >
                            {t('actions.cancel') || 'Annuler'}
                          </Button>
                        </>
                      ) : (
                        <>
                          <kbd className="px-3 py-1 text-sm font-mono bg-muted border rounded">
                            {shortcut.currentKey}
                          </kbd>
                          {shortcut.modifiable && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingId(shortcut.id);
                                  setTempKey('');
                                }}
                              >
                                <FontAwesomeIcon icon={faPen} className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => resetShortcut(shortcut.id)}
                                title={t('shortcuts.reset') || 'Réinitialiser'}
                              >
                                <FontAwesomeIcon icon={faRotateLeft} className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetShortcuts}>
            <FontAwesomeIcon icon={faRotateLeft} className="mr-2 h-4 w-4" />
            {t('shortcuts.resetAll') || 'Tout réinitialiser'}
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            {t('actions.close') || 'Fermer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
