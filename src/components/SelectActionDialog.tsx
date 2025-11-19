import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SpecificAction } from "@/types/specificAction";
import { useTranslation } from "@/hooks/useTranslation";
import { panelColors } from "@/lib/panelColors";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: SpecificAction[];
  currentActionName?: string;
  onSelect: (action: SpecificAction | null) => void;
}

export const SelectActionDialog = ({
  open,
  onOpenChange,
  actions,
  currentActionName,
  onSelect,
}: SelectActionDialogProps) => {
  const { t } = useTranslation();

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.Zap;
  };

  const handleSelect = (action: SpecificAction | null) => {
    onSelect(action);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("action.selectAction")}</DialogTitle>
          <DialogDescription>
            {t("action.selectActionDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4 max-h-[400px] overflow-y-auto">
          {actions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {t("action.noActions")}
            </div>
          ) : (
            <>
              {/* Option pour retirer l'action */}
              {currentActionName && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleSelect(null)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded border-2 border-muted-foreground" />
                    <span>{t("action.removeAction")}</span>
                  </div>
                </Button>
              )}

              {/* Liste des actions */}
              {actions.map((action) => {
                const IconComponent = getIconComponent(action.icon);
                return (
                  <Button
                    key={action.id}
                    variant={
                      currentActionName === action.name ? "default" : "outline"
                    }
                    className={cn(
                      "w-full justify-start",
                      currentActionName === action.name && "ring-2 ring-primary"
                    )}
                    onClick={() => handleSelect(action)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center rounded" style={{ backgroundColor: panelColors.iconBackground() }}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <span>{action.name}</span>
                    </div>
                  </Button>
                );
              })}
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
