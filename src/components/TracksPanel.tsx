import { useState, memo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPen, faArrowPointer, faListUl } from "@fortawesome/free-solid-svg-icons";
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
import { SpecificActionItem } from "./SpecificActionItem";
import { CreateActionDialog } from "./CreateActionDialog";
import { EditActionDialog } from "./EditActionDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [isCreateActionDialogOpen, setIsCreateActionDialogOpen] = useState(false);
  const [isEditActionDialogOpen, setIsEditActionDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<SpecificAction | null>(null);
  const [isDeleteActionDialogOpen, setIsDeleteActionDialogOpen] = useState(false);
  const [actionToDelete, setActionToDelete] = useState<SpecificAction | null>(null);

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

  const handleEditAction = (actionId: string) => {
    const action = specificActions.find(a => a.id === actionId);
    if (action) {
      setEditingAction(action);
      setIsEditActionDialogOpen(true);
    }
  };

  const handleEditActionSubmit = (name: string, icon: string) => {
    if (editingAction) {
      onEditAction(editingAction.id, name, icon);
      setIsEditActionDialogOpen(false);
      setEditingAction(null);
    }
  };

  const handleDeleteAction = (actionId: string) => {
    const action = specificActions.find(a => a.id === actionId);
    if (action) {
      setActionToDelete(action);
      setIsDeleteActionDialogOpen(true);
    }
  };

  const handleConfirmDeleteAction = () => {
    if (actionToDelete) {
      onDeleteAction(actionToDelete.id);
      setActionToDelete(null);
      setIsDeleteActionDialogOpen(false);
    }
  };

  return (
    <>
      <Card className="m-4 backdrop-blur-sm hover:scale-100 transition-none shadow-sm">
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="h-7 w-7 rounded-md flex items-center justify-center" style={{ backgroundColor: panelColors.iconBackground() }}>
              <FontAwesomeIcon icon={faListUl} className="h-3.5 w-3.5 text-primary" />
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
                  <FontAwesomeIcon icon={faPlus} className="h-4 w-4 mr-2" />
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
                    <FontAwesomeIcon icon={faPen} className="h-4 w-4 mr-1.5" />
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
                    <FontAwesomeIcon icon={faArrowPointer} className="h-4 w-4 mr-1.5" />
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
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("action.title")}
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateActionDialogOpen(true)}
              className="h-7 text-xs -mr-2"
            >
              <FontAwesomeIcon icon={faPlus} className="h-3 w-3 mr-1" />
              {t("actions.create")}
            </Button>
          </div>

          {specificActions.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-xs">
              {t("action.noActions")}
            </div>
          ) : (
            <div className="space-y-1">
              {specificActions.map(action => (
                <SpecificActionItem
                  key={action.id}
                  action={action}
                  onEdit={() => handleEditAction(action.id)}
                  onDelete={() => handleDeleteAction(action.id)}
                />
              ))}
            </div>
          )}
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

    <CreateActionDialog
      open={isCreateActionDialogOpen}
      onOpenChange={setIsCreateActionDialogOpen}
      onCreate={onCreateAction}
      existingActionNames={specificActions.map(a => a.name)}
    />

    <EditActionDialog
      open={isEditActionDialogOpen}
      onOpenChange={setIsEditActionDialogOpen}
      actionId={editingAction?.id || null}
      currentName={editingAction?.name || ''}
      currentIcon={editingAction?.icon || ''}
      onSave={handleEditActionSubmit}
    />

    <AlertDialog open={isDeleteActionDialogOpen} onOpenChange={setIsDeleteActionDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("action.deleteAction")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("action.deleteConfirm")}
            {actionToDelete && (
              <span className="block mt-2 font-semibold">Action : {actionToDelete.name}</span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("actions.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmDeleteAction}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t("actions.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
});