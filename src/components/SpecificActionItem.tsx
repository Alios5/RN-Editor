import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisVertical, faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
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
import { getIconByName } from "@/lib/faIconMap";

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

  const actionIcon = getIconByName(action.icon);

  return (
    <div 
      className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-secondary/50 transition-colors border-l-2 border-primary/30"
    >
      {/* Action icon */}
      <div 
        className="h-6 w-6 flex items-center justify-center rounded-md flex-shrink-0" 
        style={{ backgroundColor: panelColors.iconBackground() }}
      >
        {actionIcon && <FontAwesomeIcon icon={actionIcon} className="h-3.5 w-3.5" />}
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
            <FontAwesomeIcon icon={faEllipsisVertical} className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <FontAwesomeIcon icon={faPen} className="mr-2 h-4 w-4" />
            {t("actions.edit")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <FontAwesomeIcon icon={faTrash} className="mr-2 h-4 w-4" />
            {t("actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
