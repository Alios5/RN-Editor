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
import { 
  TRACK_PRESET_COLORS, 
  STYLES, 
  VALIDATION,
  getColorButtonClasses,
  truncateToMaxLength 
} from "@/lib/designTokens";

interface CreateTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, color: string, assignedKey?: string) => void;
  existingTrackNames: string[];
  usedKeys?: string[];
}

export const CreateTrackDialog = ({ open, onOpenChange, onCreate, existingTrackNames, usedKeys = [] }: CreateTrackDialogProps) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#FFFFFF");
  const [assignedKey, setAssignedKey] = useState<string>("");
  const [isCapturingKey, setIsCapturingKey] = useState(false);
  const [error, setError] = useState("");
  const { t } = useTranslation();

  const handleCreate = () => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError(t("track.errorNameRequired"));
      return;
    }
    
    if (existingTrackNames.includes(trimmedName)) {
      setError(t("track.errorNameExists"));
      return;
    }
    
    onCreate(trimmedName, color, assignedKey || undefined);
    setName("");
    setColor("#FFFFFF");
    setAssignedKey("");
    setError("");
    onOpenChange(false);
  };

  const handleNameChange = (value: string) => {
    setName(truncateToMaxLength(value, VALIDATION.maxNameLength));
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("track.create")}</DialogTitle>
          <DialogDescription>
            {t("track.noTracksDescription")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="track-name">{t("track.trackName")}</Label>
            <Input
              id="track-name"
              placeholder={t("track.trackNamePlaceholder")}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className={error ? "border-destructive" : ""}
            />
            {error && (
              <p className={STYLES.errorMessage}>{error}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="assigned-key">{t("track.assignedKey")}</Label>
            <div className="flex gap-2">
              <Input
                id="assigned-key"
                placeholder={t("track.assignedKeyPlaceholder")}
                value={assignedKey ? assignedKey.toUpperCase() : (isCapturingKey ? t("track.pressAnyKey") : "")}
                readOnly
                onClick={() => setIsCapturingKey(true)}
                onKeyDown={(e) => {
                  if (isCapturingKey) {
                    e.preventDefault();
                    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
                    if (usedKeys.includes(key)) {
                      setError(t("track.errorKeyAlreadyUsed"));
                      setIsCapturingKey(false);
                    } else {
                      setAssignedKey(key);
                      setIsCapturingKey(false);
                      setError("");
                    }
                  }
                }}
                className="flex-1 cursor-pointer"
              />
              {assignedKey && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAssignedKey("");
                    setIsCapturingKey(false);
                  }}
                >
                  {t("actions.clear")}
                </Button>
              )}
            </div>
            <p className={STYLES.helpText}>
              {t("track.assignedKeyDescription")}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>{t("track.trackColor")}</Label>
            <div className="grid grid-cols-5 gap-2">
              {TRACK_PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  className={getColorButtonClasses(color === presetColor)}
                  style={{ backgroundColor: presetColor }}
                  onClick={() => setColor(presetColor)}
                />
              ))}
            </div>
          </div>
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
