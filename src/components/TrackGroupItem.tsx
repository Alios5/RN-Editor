import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faEllipsisVertical, faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TrackGroup } from "@/types/trackGroup";
import { Track } from "@/types/track";
import { useTranslation } from "@/hooks/useTranslation";

interface TrackGroupItemProps {
  group: TrackGroup;
  tracks: Track[];
  onToggleVisibility: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const TrackGroupItem = ({
  group,
  tracks,
  onToggleVisibility,
  onEdit,
  onDelete,
}: TrackGroupItemProps) => {
  const { t } = useTranslation();
  const tracksInGroup = tracks.filter(track => track.groupId === group.id);

  return (
    <div
      className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-secondary/50 transition-colors border-l-2 border-primary/30"
    >
      {/* Visibility toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={onToggleVisibility}
      >
        {group.visible ? (
          <FontAwesomeIcon icon={faEye} className="h-5 w-5" />
        ) : (
          <FontAwesomeIcon icon={faEyeSlash} className="h-5 w-5 text-muted-foreground" />
        )}
      </Button>

      {/* Group name and track count */}
      <span className="flex-1 text-sm font-medium truncate">
        {group.name} ({tracksInGroup.length})
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
