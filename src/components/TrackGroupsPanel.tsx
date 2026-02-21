import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrackGroup } from "@/types/trackGroup";
import { Track } from "@/types/track";
import { TrackGroupItem } from "./TrackGroupItem";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { EditGroupDialog } from "./EditGroupDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { panelColors } from "@/lib/panelColors";
import { IconLayers } from "./PanelIcons";

interface TrackGroupsPanelProps {
  groups: TrackGroup[];
  tracks: Track[];
  onCreateGroup: (name: string, selectedTrackIds: string[]) => void;
  onUpdateGroup: (groupId: string, updates: Partial<TrackGroup>) => void;
  onDeleteGroup: (groupId: string) => void;
  onAssignTrackToGroup: (trackId: string, groupId: string | null) => void;
}

export const TrackGroupsPanel = ({
  groups,
  tracks,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAssignTrackToGroup,
}: TrackGroupsPanelProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TrackGroup | null>(null);
  const { t } = useTranslation();

  const handleEditGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setEditingGroup(group);
      setIsEditDialogOpen(true);
    }
  };

  const handleEditGroupSubmit = (name: string) => {
    if (editingGroup) {
      onUpdateGroup(editingGroup.id, { name });
      setIsEditDialogOpen(false);
      setEditingGroup(null);
    }
  };

  const handleToggleVisibility = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      onUpdateGroup(groupId, { visible: !group.visible });
    }
  };

  return (
    <>
      <Card className="m-4 border-0 hover:scale-100 transition-none">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center">
                <IconLayers className="h-6 w-6" />
              </div>
              {t("group.title")}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <FontAwesomeIcon icon={faPlus} className="h-4 w-4 mr-1" />
              {t("group.createGroup")}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {groups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {t("group.noGroups")}
            </div>
          ) : (
            groups.map(group => (
              <TrackGroupItem
                key={group.id}
                group={group}
                tracks={tracks}
                onToggleVisibility={() => handleToggleVisibility(group.id)}
                onEdit={() => handleEditGroup(group.id)}
                onDelete={() => onDeleteGroup(group.id)}
              />
            ))
          )}
        </CardContent>
      </Card>

      <CreateGroupDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreate={onCreateGroup}
        existingGroupNames={groups.map(g => g.name)}
        tracks={tracks}
        groups={groups}
      />

      <EditGroupDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onEdit={handleEditGroupSubmit}
        group={editingGroup}
        existingGroupNames={groups.map(g => g.name)}
        tracks={tracks}
        onAssignTrackToGroup={onAssignTrackToGroup}
      />
    </>
  );
};
