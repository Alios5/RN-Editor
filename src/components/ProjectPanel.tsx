import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faBolt, faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TrackGroup } from "@/types/trackGroup";
import { Track } from "@/types/track";
import { SpecificAction } from "@/types/specificAction";
import { TrackGroupItem } from "./TrackGroupItem";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { EditGroupDialog } from "./EditGroupDialog";
import { SpecificActionsDialog } from "./SpecificActionsDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { panelColors } from "@/lib/panelColors";
import { IconDoc } from "./PanelIcons";
import { invoke } from "@tauri-apps/api/core";

interface ProjectPanelProps {
  projectName: string;
  groups: TrackGroup[];
  tracks: Track[];
  specificActions: SpecificAction[];
  onCreateGroup: (name: string, selectedTrackIds: string[]) => void;
  onUpdateGroup: (groupId: string, updates: Partial<TrackGroup>) => void;
  onDeleteGroup: (groupId: string) => void;
  onCreateAction: (name: string, icon: string) => void;
  onEditAction: (actionId: string, name: string, icon: string) => void;
  onDeleteAction: (actionId: string) => void;
  onAssignTrackToGroup: (trackId: string, groupId: string | null) => void;
}

export const ProjectPanel = ({
  projectName,
  groups,
  tracks,
  specificActions,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onCreateAction,
  onEditAction,
  onDeleteAction,
  onAssignTrackToGroup
}: ProjectPanelProps) => {
  const { t } = useTranslation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TrackGroup | null>(null);
  const [isActionsDialogOpen, setIsActionsDialogOpen] = useState(false);

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
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center">
                <IconDoc className="h-6 w-6" />
              </div>
              {t("project.title")}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full hover:bg-primary/20"
              title="Help"
              onClick={() => invoke("open_url", { url: "https://docs.rhythmnator.com/guide-launch.html#guide-project-launch" })}
            >
              <FontAwesomeIcon icon={faCircleQuestion} className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Project Name Section */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("project.projectName")}
            </Label>
            <Input
              value={projectName}
              readOnly
              className="text-sm h-9"
              style={{ backgroundColor: panelColors.inputBackground() }}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-border/50" />

          {/* Track Groups Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">
                {t("group.title")}
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCreateDialogOpen(true)}
                className="h-7 text-xs -mr-2"
              >
                <FontAwesomeIcon icon={faPlus} className="h-3 w-3 mr-1" />
                {t("actions.create")}
              </Button>
            </div>

            {groups.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-xs">
                {t("group.noGroups")}
              </div>
            ) : (
              <div className="space-y-1">
                {groups.map(group => (
                  <TrackGroupItem
                    key={group.id}
                    group={group}
                    tracks={tracks}
                    onToggleVisibility={() => handleToggleVisibility(group.id)}
                    onEdit={() => handleEditGroup(group.id)}
                    onDelete={() => onDeleteGroup(group.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border/50" />

          {/* Actions Section */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground block">
              {t("action.title")}
            </Label>
            <Button
              variant="outline"
              className="w-full justify-start h-9 text-sm"
              onClick={() => setIsActionsDialogOpen(true)}
            >
              <FontAwesomeIcon icon={faBolt} className="h-4 w-4 mr-2" />
              {t("action.manageActions")}
              <span className="ml-auto text-xs text-muted-foreground">
                ({specificActions.length})
              </span>
            </Button>
          </div>
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

      <SpecificActionsDialog
        open={isActionsDialogOpen}
        onOpenChange={setIsActionsDialogOpen}
        actions={specificActions}
        onCreateAction={onCreateAction}
        onEditAction={onEditAction}
        onDeleteAction={onDeleteAction}
      />
    </>
  );
};
