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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AVAILABLE_ICONS } from "@/lib/faIconMap";


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
              {AVAILABLE_ICONS.map((iconEntry) => (
                  <button
                    key={iconEntry.name}
                    type="button"
                    onClick={() => setSelectedIcon(iconEntry.name)}
                    className={`p-3 rounded-lg border transition-all hover:bg-accent ${selectedIcon === iconEntry.name
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border"
                      }`}
                    title={iconEntry.name}
                  >
                    <FontAwesomeIcon icon={iconEntry.icon} className="h-5 w-5" />
                  </button>
                ))}
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
