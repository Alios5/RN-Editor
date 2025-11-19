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
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface EditActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionId: string | null;
  currentName: string;
  currentIcon: string;
  onSave: (name: string, icon: string) => void;
}

const iconList: { name: string; Icon: LucideIcon }[] = [
  { name: 'Play', Icon: Icons.Play },
  { name: 'Pause', Icon: Icons.Pause },
  { name: 'Stop', Icon: Icons.Square },
  { name: 'Music', Icon: Icons.Music },
  { name: 'Volume', Icon: Icons.Volume2 },
  { name: 'Heart', Icon: Icons.Heart },
  { name: 'Star', Icon: Icons.Star },
  { name: 'Circle', Icon: Icons.Circle },
  { name: 'Square', Icon: Icons.Square },
  { name: 'Triangle', Icon: Icons.Triangle },
  { name: 'Zap', Icon: Icons.Zap },
  { name: 'Bell', Icon: Icons.Bell },
  { name: 'Flag', Icon: Icons.Flag },
  { name: 'Bookmark', Icon: Icons.Bookmark },
  { name: 'Target', Icon: Icons.Target },
  { name: 'Award', Icon: Icons.Award },
  { name: 'Crown', Icon: Icons.Crown },
  { name: 'Flame', Icon: Icons.Flame },
  { name: 'Sparkles', Icon: Icons.Sparkles },
  { name: 'Sun', Icon: Icons.Sun },
  { name: 'Moon', Icon: Icons.Moon },
  { name: 'Cloud', Icon: Icons.Cloud },
  { name: 'Umbrella', Icon: Icons.CloudRain },
  { name: 'Snowflake', Icon: Icons.Snowflake },
  { name: 'Wind', Icon: Icons.Wind },
  { name: 'Smile', Icon: Icons.Smile },
  { name: 'Meh', Icon: Icons.Meh },
  { name: 'Frown', Icon: Icons.Frown },
  { name: 'AlertCircle', Icon: Icons.AlertCircle },
  { name: 'CheckCircle', Icon: Icons.CheckCircle2 },
  { name: 'XCircle', Icon: Icons.XCircle },
  { name: 'Info', Icon: Icons.Info },
  { name: 'HelpCircle', Icon: Icons.HelpCircle },
  { name: 'Eye', Icon: Icons.Eye },
  { name: 'EyeOff', Icon: Icons.EyeOff },
  { name: 'Lock', Icon: Icons.Lock },
  { name: 'Unlock', Icon: Icons.Unlock },
  { name: 'Key', Icon: Icons.Key },
  { name: 'Shield', Icon: Icons.Shield },
  { name: 'Home', Icon: Icons.Home },
  { name: 'User', Icon: Icons.User },
  { name: 'Users', Icon: Icons.Users },
  { name: 'Settings', Icon: Icons.Settings },
  { name: 'Tool', Icon: Icons.Wrench },
  { name: 'Activity', Icon: Icons.Activity },
];

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
            <div className="grid grid-cols-8 gap-2 p-4 border rounded-lg bg-muted/30 max-h-64 overflow-y-auto">
              {iconList.map(({ name: iconName, Icon }) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setSelectedIcon(iconName)}
                  className={`p-3 rounded-lg border transition-all hover:bg-accent ${
                    selectedIcon === iconName 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-background border-border'
                  }`}
                  title={iconName}
                >
                  <Icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Prévisualisation */}
          {selectedIcon && name && (
            <div className="p-4 border rounded-lg bg-accent/50">
              <p className="text-sm text-muted-foreground mb-2">
                {t('action.preview') || 'Prévisualisation'}
              </p>
              <div className="flex items-center gap-2">
                {(() => {
                  const IconComponent = iconList.find(i => i.name === selectedIcon)?.Icon;
                  return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
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
