import { Track } from "@/types/track";
import { TrackGroup } from "@/types/trackGroup";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Edit2, Eye, EyeOff, Trash2, FolderInput } from "lucide-react";
import { getContrastColor } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useRef } from "react";

interface TrackLabelProps {
  track: Track;
  trackGroup?: TrackGroup;
  isDisabled?: boolean;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  onAssignToGroup: () => void;
}

export const TrackLabel = ({ track, trackGroup, isDisabled, onEdit, onToggleVisibility, onDelete, onAssignToGroup }: TrackLabelProps) => {
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
    <ContextMenu>
      <ContextMenuTrigger asChild disabled={isDisabled}>
        <div 
          ref={triggerRef}
          onClick={handleClick}
          className={`sticky left-0 z-10 h-[35px] w-[100px] flex items-center justify-center px-2 transition-opacity mb-2 rounded-lg relative ${
            isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'
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
          <Edit2 className="h-4 w-4" />
          {t("track.edit")}
        </ContextMenuItem>
        <ContextMenuItem onClick={onToggleVisibility} className="gap-2">
          {track.visible ? (
            <>
              <EyeOff className="h-4 w-4" />
              {t("actions.hide")}
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              {t("actions.show")}
            </>
          )}
        </ContextMenuItem>
        <ContextMenuItem onClick={onAssignToGroup} className="gap-2">
          <FolderInput className="h-4 w-4" />
          {t("group.assignToGroup")}
        </ContextMenuItem>
        <ContextMenuItem onClick={onDelete} className="gap-2 text-destructive">
          <Trash2 className="h-4 w-4" />
          {t("track.delete")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
