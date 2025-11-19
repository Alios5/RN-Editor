import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/useTranslation";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";

const AVAILABLE_ICONS: { name: string; component: LucideIcon }[] = [
  { name: 'Play', component: Icons.Play },
  { name: 'Pause', component: Icons.Pause },
  { name: 'Stop', component: Icons.Square },
  { name: 'Music', component: Icons.Music },
  { name: 'Volume', component: Icons.Volume2 },
  { name: 'Heart', component: Icons.Heart },
  { name: 'Star', component: Icons.Star },
  { name: 'Circle', component: Icons.Circle },
  { name: 'Square', component: Icons.Square },
  { name: 'Triangle', component: Icons.Triangle },
  { name: 'Zap', component: Icons.Zap },
  { name: 'Bell', component: Icons.Bell },
  { name: 'Flag', component: Icons.Flag },
  { name: 'Bookmark', component: Icons.Bookmark },
  { name: 'Target', component: Icons.Target },
  { name: 'Award', component: Icons.Award },
  { name: 'Crown', component: Icons.Crown },
  { name: 'Flame', component: Icons.Flame },
  { name: 'Sparkles', component: Icons.Sparkles },
  { name: 'Sun', component: Icons.Sun },
  { name: 'Moon', component: Icons.Moon },
  { name: 'Cloud', component: Icons.Cloud },
  { name: 'Umbrella', component: Icons.CloudRain },
  { name: 'Snowflake', component: Icons.Snowflake },
  { name: 'Wind', component: Icons.Wind },
  { name: 'Smile', component: Icons.Smile },
  { name: 'Meh', component: Icons.Meh },
  { name: 'Frown', component: Icons.Frown },
  { name: 'AlertCircle', component: Icons.AlertCircle },
  { name: 'CheckCircle', component: Icons.CheckCircle2 },
  { name: 'XCircle', component: Icons.XCircle },
  { name: 'Info', component: Icons.Info },
  { name: 'HelpCircle', component: Icons.HelpCircle },
  { name: 'Eye', component: Icons.Eye },
  { name: 'EyeOff', component: Icons.EyeOff },
  { name: 'Lock', component: Icons.Lock },
  { name: 'Unlock', component: Icons.Unlock },
  { name: 'Key', component: Icons.Key },
  { name: 'Shield', component: Icons.Shield },
  { name: 'Home', component: Icons.Home },
  { name: 'User', component: Icons.User },
  { name: 'Users', component: Icons.Users },
  { name: 'Settings', component: Icons.Settings },
  { name: 'Tool', component: Icons.Wrench },
  { name: 'Activity', component: Icons.Activity },
];

interface CreateActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, icon: string) => void;
  existingActionNames: string[];
}

export const CreateActionDialog = ({
  open,
  onOpenChange,
  onCreate,
  existingActionNames,
}: CreateActionDialogProps) => {
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Zap");
  const [error, setError] = useState("");
  const { t } = useTranslation();

  const handleCreate = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError(t("action.errorNameRequired"));
      return;
    }

    if (existingActionNames.includes(trimmedName)) {
      setError(t("action.errorNameExists"));
      return;
    }

    onCreate(trimmedName, selectedIcon);
    setName("");
    setSelectedIcon("Zap");
    setError("");
    onOpenChange(false);
  };

  const handleNameChange = (value: string) => {
    setName(value.slice(0, 50));
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("action.createAction")}</DialogTitle>
          <DialogDescription>
            {t("action.createActionDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="action-name">{t("action.actionName")}</Label>
            <Input
              id="action-name"
              placeholder={t("action.actionNamePlaceholder")}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t("action.actionIcon")}</Label>
            <div className="grid grid-cols-8 gap-2 p-4 border rounded-lg bg-muted/30 max-h-64 overflow-y-auto">
              {AVAILABLE_ICONS.map((icon) => {
                const IconComponent = icon.component;
                return (
                  <button
                    key={icon.name}
                    type="button"
                    onClick={() => setSelectedIcon(icon.name)}
                    className={`p-3 rounded-lg border transition-all hover:bg-accent ${
                      selectedIcon === icon.name
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border"
                    }`}
                    title={icon.name}
                  >
                    <IconComponent className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prévisualisation */}
          {selectedIcon && name && (
            <div className="p-4 border rounded-lg bg-accent/50">
              <p className="text-sm text-muted-foreground mb-2">
                {t("action.preview") || "Prévisualisation"}
              </p>
              <div className="flex items-center gap-2">
                {(() => {
                  const IconComponent = AVAILABLE_ICONS.find(i => i.name === selectedIcon)?.component;
                  return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
                })()}
                <span className="font-medium">{name}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("actions.cancel")}
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>
            {t("actions.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
