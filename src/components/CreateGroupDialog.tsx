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
import { STYLES, VALIDATION, truncateToMaxLength } from "@/lib/designTokens";
import { Track } from "@/types/track";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";
import { panelColors } from "@/lib/panelColors";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, selectedTrackIds: string[]) => void;
  existingGroupNames: string[];
  tracks: Track[];
}

export const CreateGroupDialog = ({ open, onOpenChange, onCreate, existingGroupNames, tracks }: CreateGroupDialogProps) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const { t } = useTranslation();

  const handleCreate = () => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError(t("group.errorNameRequired"));
      return;
    }
    
    if (existingGroupNames.includes(trimmedName)) {
      setError(t("group.errorNameExists"));
      return;
    }
    
    onCreate(trimmedName, selectedTrackIds);
    setName("");
    setError("");
    setSelectedTrackIds([]);
    onOpenChange(false);
  };

  const handleNameChange = (value: string) => {
    setName(truncateToMaxLength(value, VALIDATION.maxNameLength));
    setError("");
  };

  const toggleTrackSelection = (trackId: string) => {
    setSelectedTrackIds(prev => 
      prev.includes(trackId) 
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("group.createGroup")}</DialogTitle>
          <DialogDescription>
            {t("group.createGroupDescription")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">{t("group.groupName")}</Label>
            <Input
              id="group-name"
              placeholder={t("group.groupNamePlaceholder")}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className={error ? "border-destructive" : ""}
            />
            {error && (
              <p className={STYLES.errorMessage}>{error}</p>
            )}
          </div>

          {/* Sélection de pistes à ajouter au groupe */}
          {tracks.length > 0 && (
            <div className="space-y-2">
              <Label>{t("group.selectTracksForGroup")}</Label>
              <div 
                className="rounded-lg border border-border p-2"
                style={{ backgroundColor: panelColors.inputBackground() }}
              >
                <ScrollArea className="max-h-[240px]">
                  <div className="space-y-1">
                    {tracks.map(track => (
                      <div 
                        key={track.id}
                        className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: track.color }}
                          />
                          <span className="text-sm">{track.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-6 w-6 ${selectedTrackIds.includes(track.id) ? 'hover:bg-destructive/10 hover:text-destructive' : 'hover:bg-primary/10 hover:text-primary'}`}
                          onClick={() => toggleTrackSelection(track.id)}
                          title={selectedTrackIds.includes(track.id) ? t("group.removeFromGroup") : t("group.addToGroup")}
                        >
                          <FontAwesomeIcon 
                            icon={selectedTrackIds.includes(track.id) ? faMinus : faPlus} 
                            className="h-3 w-3" 
                          />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              {selectedTrackIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("group.tracksSelected", { count: String(selectedTrackIds.length) })}
                </p>
              )}
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
