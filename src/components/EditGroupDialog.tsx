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
import { TrackGroup } from "@/types/trackGroup";
import { Track } from "@/types/track";
import { useTranslation } from "@/hooks/useTranslation";
import { STYLES, VALIDATION, truncateToMaxLength } from "@/lib/designTokens";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";
import { panelColors } from "@/lib/panelColors";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EditGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (name: string) => void;
  group: TrackGroup | null;
  existingGroupNames: string[];
  tracks: Track[];
  onAssignTrackToGroup: (trackId: string, groupId: string | null) => void;
}

export const EditGroupDialog = ({ open, onOpenChange, onEdit, group, existingGroupNames, tracks, onAssignTrackToGroup }: EditGroupDialogProps) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    if (group) {
      setName(group.name);
      setError("");
    }
  }, [group]);

  const handleEdit = () => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError(t("group.errorNameRequired"));
      return;
    }
    
    // Vérifier si le nom existe déjà (sauf si c'est le nom actuel du groupe)
    if (existingGroupNames.includes(trimmedName) && trimmedName !== group?.name) {
      setError(t("group.errorNameExists"));
      return;
    }
    
    onEdit(trimmedName);
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
          <DialogTitle>{t("group.editGroup")}</DialogTitle>
          <DialogDescription>
            {t("group.editGroupDescription")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-group-name">{t("group.groupName")}</Label>
            <Input
              id="edit-group-name"
              placeholder={t("group.groupNamePlaceholder")}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEdit()}
              className={error ? "border-destructive" : ""}
            />
            {error && (
              <p className={STYLES.errorMessage}>{error}</p>
            )}
          </div>

          {/* Pistes dans ce groupe */}
          <div className="space-y-2">
            <Label>{t("group.tracksInGroup") || "Pistes dans ce groupe"}</Label>
            <div 
              className="rounded-lg border border-border p-2 min-h-[60px]"
              style={{ backgroundColor: panelColors.inputBackground() }}
            >
              {tracks.filter(t => t.groupId === group?.id).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  {t("group.noTracksInGroup")}
                </p>
              ) : (
                <ScrollArea className="max-h-[240px]">
                  <div className="space-y-1">
                    {tracks.filter(t => t.groupId === group?.id).map(track => (
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
                          className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => onAssignTrackToGroup(track.id, null)}
                          title={t("group.removeFromGroup")}
                        >
                          <FontAwesomeIcon icon={faMinus} className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>

          {/* Pistes disponibles à ajouter */}
          {tracks.filter(t => t.groupId !== group?.id).length > 0 && (
            <div className="space-y-2">
              <Label>{t("group.availableTracks") || "Pistes disponibles"}</Label>
              <div 
                className="rounded-lg border border-border p-2"
                style={{ backgroundColor: panelColors.inputBackground() }}
              >
                <ScrollArea className="max-h-[240px]">
                  <div className="space-y-1">
                    {tracks.filter(t => t.groupId !== group?.id).map(track => (
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
                          {track.groupId && (
                            <span className="text-xs text-muted-foreground">
                              ({tracks.find(g => g.id === track.groupId)?.name || t("group.otherGroup") || "autre groupe"})
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-primary/10 hover:text-primary"
                          onClick={() => group && onAssignTrackToGroup(track.id, group.id)}
                          title={t("group.addToGroup") || "Ajouter au groupe"}
                        >
                          <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
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
