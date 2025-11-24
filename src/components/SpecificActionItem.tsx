import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SpecificAction } from "@/types/specificAction";
import { useTranslation } from "@/hooks/useTranslation";
import { panelColors } from "@/lib/panelColors";
import * as Icons from "lucide-react";

interface SpecificActionItemProps {
  action: SpecificAction;
  onEdit: () => void;
  onDelete: () => void;
}

export const SpecificActionItem = ({
  action,
  onEdit,
  onDelete,
}: SpecificActionItemProps) => {
  const { t } = useTranslation();

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.Zap;
  };

  const IconComponent = getIconComponent(action.icon);

  return (
    <div 
      className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-secondary/50 transition-colors border-l-2 border-primary/30"
    >
      {/* Action icon */}
      <div 
        className="h-6 w-6 flex items-center justify-center rounded-md flex-shrink-0" 
        style={{ backgroundColor: panelColors.iconBackground() }}
      >
        <IconComponent className="h-3.5 w-3.5" />
      </div>

      {/* Action name */}
      <span className="flex-1 text-sm font-medium truncate">
        {action.name}
      </span>

      {/* Actions menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            {t("actions.edit")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            {t("actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
