import { useState, useEffect } from "react";
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
import { Track } from "@/types/track";
import { useTranslation } from "@/hooks/useTranslation";
import { 
  TRACK_PRESET_COLORS, 
  STYLES, 
  VALIDATION,
  getColorButtonClasses,
  truncateToMaxLength 
} from "@/lib/designTokens";

interface EditTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (name: string, color: string, assignedKey?: string) => void;
  track: Track | null;
  existingTrackNames: string[];
  usedKeys?: string[];
}

export const EditTrackDialog = ({ open, onOpenChange, onEdit, track, existingTrackNames, usedKeys = [] }: EditTrackDialogProps) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#FFFFFF");
  const [assignedKey, setAssignedKey] = useState<string>("");
  const [isCapturingKey, setIsCapturingKey] = useState(false);
  const [error, setError] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    if (track) {
      setName(track.name);
      setColor(track.color);
      setAssignedKey(track.assignedKey || "");
      setError("");
    }
  }, [track]);

  const handleEdit = () => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError(t("track.errorNameRequired"));
      return;
    }
    
    // Vérifier si le nom existe déjà (sauf si c'est le nom actuel de la piste)
    if (existingTrackNames.includes(trimmedName) && trimmedName !== track?.name) {
      setError(t("track.errorNameExists"));
      return;
    }
    
    onEdit(trimmedName, color, assignedKey || undefined);
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
          <DialogTitle>{t("track.edit")}</DialogTitle>
          <DialogDescription>
            {t("track.noTracksDescription")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-track-name">{t("track.trackName")}</Label>
            <Input
              id="edit-track-name"
              placeholder={t("track.trackNamePlaceholder")}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEdit()}
              className={error ? "border-destructive" : ""}
            />
            {error && (
              <p className={STYLES.errorMessage}>{error}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-assigned-key">{t("track.assignedKey")}</Label>
            <div className="flex gap-2">
              <Input
                id="edit-assigned-key"
                placeholder={t("track.assignedKeyPlaceholder")}
                value={assignedKey ? assignedKey.toUpperCase() : (isCapturingKey ? t("track.pressAnyKey") : "")}
                readOnly
                onClick={() => setIsCapturingKey(true)}
                onKeyDown={(e) => {
                  if (isCapturingKey) {
                    e.preventDefault();
                    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
                    // Allow the same key that was already assigned to this track
                    if (usedKeys.includes(key) && key !== track?.assignedKey) {
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
          <Button onClick={handleEdit} disabled={!name.trim()}>
            {t("actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
