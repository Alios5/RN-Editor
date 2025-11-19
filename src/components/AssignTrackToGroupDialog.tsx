import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TrackGroup } from "@/types/trackGroup";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

interface AssignTrackToGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: TrackGroup[];
  currentGroupId?: string;
  onAssign: (groupId: string | null) => void;
  trackName: string;
}

export const AssignTrackToGroupDialog = ({
  open,
  onOpenChange,
  groups,
  currentGroupId,
  onAssign,
  trackName,
}: AssignTrackToGroupDialogProps) => {
  const { t } = useTranslation();

  const handleAssign = (groupId: string | null) => {
    onAssign(groupId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("group.assignTrack")}</DialogTitle>
          <DialogDescription>
            {t("group.assignTrackDescription", { trackName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {groups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {t("group.noGroups")}
            </div>
          ) : (
            <>
              {/* Option pour retirer du groupe */}
              {currentGroupId && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleAssign(null)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border-2 border-muted-foreground" />
                    <span>{t("group.removeFromGroup")}</span>
                  </div>
                </Button>
              )}

              {/* Liste des groupes */}
              {groups.map((group) => (
                <Button
                  key={group.id}
                  variant={currentGroupId === group.id ? "default" : "outline"}
                  className={cn(
                    "w-full justify-start",
                    currentGroupId === group.id && "ring-2 ring-primary"
                  )}
                  onClick={() => handleAssign(group.id)}
                >
                  <span>{group.name}</span>
                </Button>
              ))}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("actions.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
