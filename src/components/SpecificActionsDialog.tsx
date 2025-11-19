import { useState } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { SpecificAction } from "@/types/specificAction";
import { CreateActionDialog } from "./CreateActionDialog";
import { EditActionDialog } from "./EditActionDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { panelColors } from "@/lib/panelColors";
import * as Icons from "lucide-react";

interface SpecificActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: SpecificAction[];
  onCreateAction: (name: string, icon: string) => void;
  onEditAction: (actionId: string, name: string, icon: string) => void;
  onDeleteAction: (actionId: string) => void;
}

export const SpecificActionsDialog = ({
  open,
  onOpenChange,
  actions,
  onCreateAction,
  onEditAction,
  onDeleteAction,
}: SpecificActionsDialogProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<SpecificAction | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [actionToDelete, setActionToDelete] = useState<SpecificAction | null>(null);
  const { t } = useTranslation();

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.Zap;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("action.title")}</DialogTitle>
            <DialogDescription>
              {t("action.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-end">
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("action.newAction")}
              </Button>
            </div>

            {actions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {t("action.noActions")}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                {actions.map((action) => {
                  const IconComponent = getIconComponent(action.icon);
                  return (
                    <div
                      key={action.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="h-10 w-10 flex items-center justify-center rounded-md" style={{ backgroundColor: panelColors.iconBackground() }}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <span className="flex-1 font-medium truncate">
                        {action.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingAction(action);
                          setIsEditDialogOpen(true);
                        }}
                        title={t("actions.edit")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setActionToDelete(action);
                          setIsDeleteDialogOpen(true);
                        }}
                        title={t("actions.delete")}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CreateActionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreate={onCreateAction}
        existingActionNames={actions.map((a) => a.name)}
      />
      
      <EditActionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        actionId={editingAction?.id || null}
        currentName={editingAction?.name || ''}
        currentIcon={editingAction?.icon || ''}
        onSave={(name, icon) => {
          if (editingAction) {
            onEditAction(editingAction.id, name, icon);
          }
        }}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("action.deleteAction") || "Supprimer l'action"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("action.deleteConfirm") || "Cette action sera retir\u00e9e de toutes les notes li\u00e9es. Continuer ?"}
              {actionToDelete && (
                <span className="block mt-2 font-semibold">Action : {actionToDelete.name}</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("actions.cancel") || "Annuler"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (actionToDelete) {
                  onDeleteAction(actionToDelete.id);
                  setActionToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("actions.delete") || "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
