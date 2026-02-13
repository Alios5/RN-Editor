import { Track } from "@/types/track";
import { TrackGroup } from "@/types/trackGroup";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faEye, faEyeSlash, faTrash, faFolderOpen, faGripVertical } from "@fortawesome/free-solid-svg-icons";
import { getContrastColor } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useRef } from "react";
import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

interface DragHandleProps {
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
}

interface TrackLabelProps {
  track: Track;
  trackGroup?: TrackGroup;
  isDisabled?: boolean;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  onAssignToGroup: () => void;
  dragHandleProps?: DragHandleProps;
}

export const TrackLabel = ({
  track,
  trackGroup,
  isDisabled,
  onEdit,
  onToggleVisibility,
  onDelete,
  onAssignToGroup,
  dragHandleProps,
}: TrackLabelProps) => {
  const { t } = useTranslation();
  const textColor = getContrastColor(track.color);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    // Do nothing if the label is disabled
    if (isDisabled) {
      e.preventDefault();
      return;
    }

    // Simulate a right click to open the context menu
    if (e.button === 0) { // Left click
      e.preventDefault();
      const contextMenuEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: e.clientX,
        clientY: e.clientY,
      });
      triggerRef.current?.dispatchEvent(contextMenuEvent);
    }
  };

  return (
    <div
      className="flex items-center z-10 bg-background sticky left-0 top-0 w-fit"
    >
      {/* Drag Handle */}
      <div
        {...dragHandleProps?.attributes}
        {...dragHandleProps?.listeners}
        title={t("track.dragToReorder")}
        className={`h-[35px] w-[20px] flex items-center justify-center rounded-l-lg transition-all touch-none ${isDisabled
            ? 'opacity-40 cursor-not-allowed'
            : 'cursor-grab active:cursor-grabbing hover:brightness-110'
          }`}
        style={{ backgroundColor: track.color }}
      >
        <FontAwesomeIcon icon={faGripVertical}
          className="h-4 w-4"
          style={{ color: textColor }}
        />
      </div>

      {/* Track Label - Context Menu */}
      <ContextMenu>
        <ContextMenuTrigger asChild disabled={isDisabled}>
          <div
            ref={triggerRef}
            onClick={handleClick}
            className={`h-[35px] w-[80px] flex items-center justify-center px-2 transition-opacity rounded-r-lg relative ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'
              }`}
            style={{ backgroundColor: track.color }}
          >
            <span
              className="text-xs font-medium truncate text-center"
              style={{ color: textColor }}
            >
              {track.name}
            </span>
            {track.assignedKey && (
              <span
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-[10px] font-bold rounded-full bg-background border border-border shadow-sm"
                title={t("track.assignedKey") + ": " + track.assignedKey.toUpperCase()}
              >
                {track.assignedKey.toUpperCase()}
              </span>
            )}
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem onClick={onEdit} className="gap-2">
            <FontAwesomeIcon icon={faPen} className="h-4 w-4" />
            {t("track.edit")}
          </ContextMenuItem>
          <ContextMenuItem onClick={onToggleVisibility} className="gap-2">
            {track.visible ? (
              <>
                <FontAwesomeIcon icon={faEyeSlash} className="h-4 w-4" />
                {t("actions.hide")}
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                {t("actions.show")}
              </>
            )}
          </ContextMenuItem>
          <ContextMenuItem onClick={onAssignToGroup} className="gap-2">
            <FontAwesomeIcon icon={faFolderOpen} className="h-4 w-4" />
            {t("group.assignToGroup")}
          </ContextMenuItem>
          <ContextMenuItem onClick={onDelete} className="gap-2 text-destructive">
            <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
            {t("track.delete")}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
};
