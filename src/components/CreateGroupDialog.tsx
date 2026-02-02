import { useMemo, useState } from "react";
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
import { TrackGroup } from "@/types/trackGroup";
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
  groups: TrackGroup[];
}

export const CreateGroupDialog = ({ open, onOpenChange, onCreate, existingGroupNames, tracks, groups }: CreateGroupDialogProps) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const { t } = useTranslation();

  const selectedTrackIdSet = useMemo(() => {
    return new Set(selectedTrackIds);
  }, [selectedTrackIds]);

  const groupNameById = useMemo(() => {
    const map: Record<string, string> = {};
    groups.forEach((group) => {
      map[group.id] = group.name;
    });
    return map;
  }, [groups]);

  const selectedTracks = useMemo(() => {
    return tracks.filter(track => selectedTrackIdSet.has(track.id));
  }, [tracks, selectedTrackIdSet]);

  const availableTracks = useMemo(() => {
    return tracks.filter(track => !selectedTrackIdSet.has(track.id));
  }, [tracks, selectedTrackIdSet]);

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
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("group.tracksInGroup") || "Pistes dans ce groupe"}</Label>
                <div
                  className="rounded-lg border border-border p-2 min-h-[60px]"
                  style={{ backgroundColor: panelColors.inputBackground() }}
                >
                  {selectedTracks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      {t("group.noTracksInGroup")}
                    </p>
                  ) : (
                    <ScrollArea className="max-h-[240px]">
                      <div className="space-y-1">
                        {selectedTracks.map(track => (
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
                                  ({groupNameById[track.groupId] || t("group.otherGroup") || "autre groupe"})
                                </span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => toggleTrackSelection(track.id)}
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

              <div className="space-y-2">
                <Label>{t("group.availableTracks") || "Pistes disponibles"}</Label>
                <div
                  className="rounded-lg border border-border p-2"
                  style={{ backgroundColor: panelColors.inputBackground() }}
                >
                  <ScrollArea className="max-h-[240px]">
                    <div className="space-y-1">
                      {availableTracks.map(track => (
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
                                ({groupNameById[track.groupId] || t("group.otherGroup") || "autre groupe"})
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-primary/10 hover:text-primary"
                            onClick={() => toggleTrackSelection(track.id)}
                            title={t("group.addToGroup") || "Ajouter au groupe"}
                          >
                            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
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
