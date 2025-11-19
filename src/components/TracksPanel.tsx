import { useState, memo } from "react";
import { Plus, Pen, MousePointer2, Zap, ListMusic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrackGroup } from "@/types/trackGroup";
import { Track } from "@/types/track";
import { SpecificAction } from "@/types/specificAction";
import { TrackGroupItem } from "./TrackGroupItem";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { EditGroupDialog } from "./EditGroupDialog";
import { SpecificActionsDialog } from "./SpecificActionsDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { panelColors } from "@/lib/panelColors";
import { toast } from "sonner";

interface TracksPanelProps {
  onCreateTrack: () => void;
  editorMode: 'edit' | 'select';
  onModeChange: (mode: 'edit' | 'select') => void;
  groups: TrackGroup[];
  tracks: Track[];
  specificActions: SpecificAction[];
  onCreateGroup: (name: string) => void;
  onUpdateGroup: (groupId: string, updates: Partial<TrackGroup>) => void;
  onDeleteGroup: (groupId: string) => void;
  onCreateAction: (name: string, icon: string) => void;
  onEditAction: (actionId: string, name: string, icon: string) => void;
  onDeleteAction: (actionId: string) => void;
}

export const TracksPanel = memo(({ 
  onCreateTrack, 
  editorMode, 
  onModeChange,
  groups,
  tracks,
  specificActions,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onCreateAction,
  onEditAction,
  onDeleteAction
}: TracksPanelProps) => {
  const { t } = useTranslation();
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false);
  const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TrackGroup | null>(null);
  const [isActionsDialogOpen, setIsActionsDialogOpen] = useState(false);

  const handleEditGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setEditingGroup(group);
      setIsEditGroupDialogOpen(true);
    }
  };

  const handleEditGroupSubmit = (name: string) => {
    if (editingGroup) {
      onUpdateGroup(editingGroup.id, { name });
      toast.success(t("group.editSuccess"));
      setIsEditGroupDialogOpen(false);
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
      <Card className="m-4 backdrop-blur-sm hover:scale-100 transition-none shadow-sm">
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="h-7 w-7 rounded-md flex items-center justify-center" style={{ backgroundColor: panelColors.iconBackground() }}>
              <ListMusic className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-foreground">{t("tracks.title")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
        {/* Track Management Section */}
        <div className="space-y-3">
          <span className="text-xs font-medium text-muted-foreground block">
            {t("tracks.management")}
          </span>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCreateTrack}
                  className="w-full justify-start h-9"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("tracks.createTrack")}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("tracks.createTrackTooltip")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Divider */}
        <div className="border-t border-border/50" />

        {/* Tools Section */}
        <div className="space-y-3">
          <span className="text-xs font-medium text-muted-foreground block">
            {t("tracks.tools")}
          </span>
          
          <div className="grid grid-cols-2 gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={editorMode === 'edit' ? 'default' : 'outline'} 
                    size="sm" 
                    className="h-9 text-xs"
                    onClick={() => onModeChange('edit')}
                  >
                    <Pen className="h-4 w-4 mr-1.5" />
                    {t("tracks.edit")}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("tracks.editTooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={editorMode === 'select' ? 'default' : 'outline'} 
                    size="sm" 
                    className="h-9 text-xs"
                    onClick={() => onModeChange('select')}
                  >
                    <MousePointer2 className="h-4 w-4 mr-1.5" />
                    {t("tracks.select")}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("tracks.selectTooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
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
              onClick={() => setIsCreateGroupDialogOpen(true)}
              className="h-7 text-xs -mr-2"
            >
              <Plus className="h-3 w-3 mr-1" />
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
            <Zap className="h-4 w-4 mr-2" />
            {t("action.manageActions")}
            <span className="ml-auto text-xs text-muted-foreground">
              ({specificActions.length})
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>

    <CreateGroupDialog
      open={isCreateGroupDialogOpen}
      onOpenChange={setIsCreateGroupDialogOpen}
      onCreate={onCreateGroup}
      existingGroupNames={groups.map(g => g.name)}
    />

    <EditGroupDialog
      open={isEditGroupDialogOpen}
      onOpenChange={setIsEditGroupDialogOpen}
      onEdit={handleEditGroupSubmit}
      group={editingGroup}
      existingGroupNames={groups.map(g => g.name)}
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
});