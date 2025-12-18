import { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/useTranslation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AVAILABLE_ICONS } from '@/lib/faIconMap';
import { STYLES, VALIDATION, getIconButtonClasses } from '@/lib/designTokens';

interface EditActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionId: string | null;
  currentName: string;
  currentIcon: string;
  onSave: (name: string, icon: string) => void;
}


export const EditActionDialog = ({
  open,
  onOpenChange,
  actionId,
  currentName,
  currentIcon,
  onSave
}: EditActionDialogProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('');

  useEffect(() => {
    if (open) {
      setName(currentName);
      setSelectedIcon(currentIcon);
    }
  }, [open, currentName, currentIcon]);

  const handleSave = () => {
    if (name.trim() && selectedIcon) {
      onSave(name.trim(), selectedIcon);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('action.editAction') || 'Modifier l\'action'}</DialogTitle>
          <DialogDescription>
            {t('action.editActionDescription') || 'Modifiez le nom et l\'icône de l\'action'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Champ Nom */}
          <div className="space-y-2">
            <Label htmlFor="action-name">{t('action.actionName') || 'Nom de l\'action'}</Label>
            <Input
              id="action-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('action.actionNamePlaceholder') || 'Entrez le nom de l\'action...'}
              maxLength={50}
            />
          </div>

          {/* Sélecteur d'Icône */}
          <div className="space-y-2">
            <Label>{t('action.actionIcon') || 'Icône de l\'Action'}</Label>
            <div className={STYLES.iconGrid + " grid grid-cols-8 gap-2"}>
              {AVAILABLE_ICONS.map((iconEntry) => (
                <button
                  key={iconEntry.name}
                  type="button"
                  onClick={() => setSelectedIcon(iconEntry.name)}
                  className={getIconButtonClasses(selectedIcon === iconEntry.name)}
                  title={iconEntry.name}
                >
                  <FontAwesomeIcon icon={iconEntry.icon} className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Prévisualisation */}
          {selectedIcon && name && (
            <div className={STYLES.previewContainer}>
              <p className="text-sm text-muted-foreground mb-2">
                {t('action.preview') || 'Prévisualisation'}
              </p>
              <div className="flex items-center gap-2">
                {(() => {
                  const iconEntry = AVAILABLE_ICONS.find(i => i.name === selectedIcon);
                  return iconEntry ? <FontAwesomeIcon icon={iconEntry.icon} className="h-5 w-5" /> : null;
                })()}
                <span className="font-medium">{name}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('actions.cancel') || 'Annuler'}
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || !selectedIcon}>
            {t('actions.confirm') || 'Confirmer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
