import { useState, memo } from "react";
import { Note } from "@/types/note";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faLink, faCopy, faScissors, faClipboard, faCodeMerge, faLinkSlash } from "@fortawesome/free-solid-svg-icons";
import { getIconByName } from "@/lib/faIconMap";
import { useTranslation } from "@/hooks/useTranslation";

interface NoteBlockProps {
  note: Note;
  trackId: string;
  cellWidth: number;
  trackColor: string;
  startOffset: number;
  isRightClickDeleting: boolean;
  isMarkedForDeletion?: boolean;
  isDragging?: boolean;
  draggedPosition?: number;
  isResizing?: boolean;
  resizedWidth?: number;
  currentTime: number;
  editorMode: 'edit' | 'select';
  isSelected?: boolean;
  isOverlapping?: boolean;
  selectedCount?: number;
  onDelete?: () => void;
  onDeleteSelected?: () => void;
  onDuplicate?: () => void;
  onDuplicateSelected?: () => void;
  onMergeSelected?: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onAssignAction?: () => void;
  onAssignActionToSelected?: () => void;
  onUnlinkAction?: () => void;
  onUnlinkActionFromSelected?: () => void;
  onMenuOpenChange?: (open: boolean) => void;
  onNoteClick?: (ctrlKey: boolean) => void;
  onDeleteOnHover?: () => void;
  onStartDrag?: (cellPosition: number, clickOffsetInCells: number) => void;
  onStartResize?: (e: React.MouseEvent) => void;
}

const NoteBlockComponent = ({ 
  note, 
  trackId,
  cellWidth, 
  trackColor, 
  startOffset, 
  isRightClickDeleting,
  isMarkedForDeletion = false,
  isDragging = false,
  draggedPosition,
  isResizing = false,
  resizedWidth,
  currentTime, 
  editorMode,
  isSelected = false,
  isOverlapping = false,
  selectedCount = 0,
  onDelete,
  onDeleteSelected,
  onDuplicate,
  onDuplicateSelected,
  onMergeSelected,
  onCopy,
  onCut,
  onPaste,
  onAssignAction,
  onAssignActionToSelected,
  onUnlinkAction,
  onUnlinkActionFromSelected,
  onMenuOpenChange,
  onNoteClick,
  onDeleteOnHover,
  onStartDrag,
  onStartResize
}: NoteBlockProps) => {
  const { t } = useTranslation();
  // Use resizedWidth during resize, otherwise normal width
  const width = resizedWidth !== undefined ? resizedWidth : note.gridWidth * cellWidth;
  // Use draggedPosition during drag, otherwise normal position
  // Add startOffset because position:absolute ignores parent's paddingLeft
  const left = (draggedPosition !== undefined ? draggedPosition : note.gridPosition) * cellWidth + startOffset;
  
  // Determine if the playhead is on this note
  // For notes with duration 0, use a small tolerance window for visual effect
  const effectiveDuration = note.duration === 0 ? 0.1 : note.duration;
  const isActive = currentTime >= note.startTime && currentTime <= note.startTime + effectiveDuration;
  
  const formatTime = (seconds: number) => seconds.toFixed(2) + 's';

  const handleMouseEnter = () => {
    // Delete note immediately if right click is held and dragged over it
    if (isRightClickDeleting && onDeleteOnHover) {
      onDeleteOnHover();
    }
  };

  const getActionIcon = (iconName: string) => {
    const icon = getIconByName(iconName);
    return icon;
  };

  const actionIcon = note.specificAction ? getActionIcon(note.specificAction.icon) : null;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const handleMenuOpenChange = (open: boolean) => {
    setIsMenuOpen(open);
    onMenuOpenChange?.(open);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (editorMode === 'edit') {
      // En mode édition : clic droit supprime directement la note
      if (onDelete) {
        onDelete();
      }
    } else {
      // En mode sélection : clic droit ouvre le menu contextuel
      
      // Capturer la position du clic pour positionner le menu
      setMenuPosition({ x: e.clientX, y: e.clientY });
      
      // Si la note n'est pas déjà sélectionnée, la sélectionner exclusivement
      if (!isSelected && onNoteClick) {
        onNoteClick(false); // false = pas de Ctrl, donc sélection exclusive
        
        // Attendre que le state soit mis à jour avant d'ouvrir le menu
        setTimeout(() => {
          handleMenuOpenChange(true);
        }, 0);
      } else {
        // Si déjà sélectionnée, ouvrir le menu immédiatement
        handleMenuOpenChange(true);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (editorMode === 'select' && e.button === 0) {
      // Vérifier si le clic est dans la zone de resize (2px à droite)
      if (onStartResize) {
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const noteWidth = rect.width;
        
        // Si le clic est dans les 2 derniers pixels à droite, c'est pour le resize
        if (clickX > noteWidth - 2) {
          return; // Ne rien faire, la poignée va gérer
        }
      }
      
      // Mode sélection avec clic gauche
      e.preventDefault();
      e.stopPropagation();
      
      // Calculer l'offset du clic par rapport au début de la note
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickOffsetInPixels = clickX;
      const clickOffsetInCells = Math.floor(clickOffsetInPixels / cellWidth);
      const cellPosition = note.gridPosition;
      
      // Si la note n'est pas sélectionnée, la sélectionner d'abord
      if (!isSelected && onNoteClick) {
        // Sélectionner la note (avec Ctrl pour ajouter à la sélection existante)
        onNoteClick(e.ctrlKey || e.metaKey);
      }
      
      // Démarrer le drag immédiatement (que la note soit déjà sélectionnée ou non)
      if (onStartDrag) {
        onStartDrag(cellPosition, clickOffsetInCells);
      }
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    // En mode sélection, empêcher la propagation pour éviter le drag
    e.preventDefault();
    e.stopPropagation();
    
    if (onStartResize) {
      onStartResize(e);
    }
  };

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              data-note-block
              data-note-id={`${trackId}:${note.id}`}
              className={`absolute top-0 bottom-0 rounded ${
                isDragging || isResizing 
                  ? 'cursor-grabbing transition-none' 
                  : editorMode === 'select' 
                    ? 'cursor-grab transition-all' 
                    : 'transition-all'
              } ${
                isDragging 
                  ? 'border-4 border-dashed border-blue-400 ring-2 ring-blue-200'
                  : isResizing
                    ? 'border-4 border-dashed border-green-400 ring-2 ring-green-200'
                    : isSelected 
                      ? 'border-4 border-blue-500 ring-2 ring-blue-300' 
                      : 'border-2 hover:border-primary'
              }`}
              style={{
                left: `${left}px`,
                width: `${width}px`,
                boxSizing: 'border-box',
                backgroundColor: trackColor,
                opacity: isMarkedForDeletion ? 0.2 : isDragging || isResizing ? 0.6 : isOverlapping ? 0.5 : 1,
                filter: isActive ? 'brightness(1.5)' : isSelected ? 'brightness(1.2)' : 'brightness(1)',
                transform: isActive ? 'scale(1.05)' : isSelected ? 'scale(1.02)' : 'scale(1)',
                transition: 'filter 0.15s ease-out, transform 0.15s ease-out, border 0.15s ease-out, opacity 0.2s ease-out',
                boxShadow: isActive 
                  ? `0 0 20px ${trackColor}` 
                  : isSelected 
                    ? '0 0 10px rgba(59, 130, 246, 0.5)' 
                    : 'none',
                zIndex: isActive || isSelected || isResizing ? 10 : 1,
              }}
              onMouseEnter={handleMouseEnter}
              onMouseDown={handleMouseDown}
              onContextMenu={handleContextMenu}
            >
              {/* Icône de l'action en haut à gauche */}
              {actionIcon && (
                <div className="absolute top-0.5 left-0.5 bg-background/90 rounded p-0.5 shadow-sm flex items-center justify-center w-4 h-4">
                  <FontAwesomeIcon icon={actionIcon} className="h-3 w-3" style={{ width: '12px', height: '12px' }} />
                </div>
              )}
              
              {/* Poignée de redimensionnement en mode sélection */}
              {editorMode === 'select' && onStartResize && (
                <div
                  className="absolute top-0 bottom-0 right-0 w-0.5 cursor-ew-resize hover:bg-primary/50 transition-all"
                  onMouseDown={handleResizeMouseDown}
                  onMouseEnter={(e) => e.stopPropagation()}
                  title={t("note.dragToResize")}
                  style={{
                    zIndex: 30,
                    pointerEvents: 'auto',
                  }}
                />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-popover text-popover-foreground">
            <div className="space-y-1 text-xs">
              <div><strong>{t("note.name")}:</strong> {note.trackName}</div>
              <div><strong>{t("note.time")}:</strong> {formatTime(note.startTime)}</div>
              <div><strong>{t("note.duration")}:</strong> {formatTime(note.duration)}</div>
              {note.specificAction && (
                <div><strong>{t("note.action")}:</strong> {note.specificAction.name}</div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Menu contextuel séparé, ouvert seulement programmatiquement */}
      <DropdownMenu open={isMenuOpen} onOpenChange={handleMenuOpenChange}>
        <DropdownMenuTrigger asChild>
          <div style={{ position: 'fixed', left: `${menuPosition.x}px`, top: `${menuPosition.y}px`, width: 0, height: 0, pointerEvents: 'none', zIndex: 9999 }} />
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start"
          side="right"
          sideOffset={5}
          alignOffset={-5}
          avoidCollisions={true}
          collisionPadding={10}
        >
          {/* Lier action */}
          <DropdownMenuItem onClick={selectedCount > 1 ? onAssignActionToSelected : onAssignAction}>
            <FontAwesomeIcon icon={faLink} className="mr-2 h-4 w-4" />
            {selectedCount > 1 
              ? t("action.linkActionCount", { count: String(selectedCount) })
              : t("action.selectAction")}
          </DropdownMenuItem>
          
          {/* Délier action (seulement si au moins une note a une action) */}
          {note.specificAction && (
            <DropdownMenuItem onClick={selectedCount > 1 ? onUnlinkActionFromSelected : onUnlinkAction}>
              <FontAwesomeIcon icon={faLinkSlash} className="mr-2 h-4 w-4" />
              {selectedCount > 1 
                ? t("action.unlinkActionCount", { count: String(selectedCount) })
                : t("action.unlinkAction")}
            </DropdownMenuItem>
          )}
          
          <div className="h-px bg-border my-1" />
          
          {/* Duplication */}
          <DropdownMenuItem onClick={selectedCount > 1 ? onDuplicateSelected : onDuplicate}>
            <FontAwesomeIcon icon={faCopy} className="mr-2 h-4 w-4" />
            <span className="flex-1">
              {selectedCount > 1 
                ? t("actions.duplicateCount", { count: String(selectedCount) })
                : t("actions.duplicate")}
            </span>
            <span className="ml-auto pl-4 text-xs text-muted-foreground">Ctrl+D</span>
          </DropdownMenuItem>
          
          {/* Fusionner (seulement si plusieurs notes sélectionnées) */}
          {selectedCount > 1 && (
            <DropdownMenuItem onClick={onMergeSelected}>
              <FontAwesomeIcon icon={faCodeMerge} className="mr-2 h-4 w-4" />
              <span className="flex-1">
                {t("actions.mergeCount", { count: String(selectedCount) })}
              </span>
              <span className="ml-auto pl-4 text-xs text-muted-foreground">F</span>
            </DropdownMenuItem>
          )}
          
          <div className="h-px bg-border my-1" />
          
          {/* Copier */}
          <DropdownMenuItem onClick={onCopy}>
            <FontAwesomeIcon icon={faCopy} className="mr-2 h-4 w-4" />
            <span className="flex-1">{t("actions.copy")}</span>
            <span className="ml-auto pl-4 text-xs text-muted-foreground">Ctrl+C</span>
          </DropdownMenuItem>
          
          {/* Couper */}
          <DropdownMenuItem onClick={onCut}>
            <FontAwesomeIcon icon={faScissors} className="mr-2 h-4 w-4" />
            <span className="flex-1">{t("actions.cut")}</span>
            <span className="ml-auto pl-4 text-xs text-muted-foreground">Ctrl+X</span>
          </DropdownMenuItem>
          
          {/* Coller */}
          <DropdownMenuItem onClick={onPaste}>
            <FontAwesomeIcon icon={faClipboard} className="mr-2 h-4 w-4" />
            <span className="flex-1">{t("actions.paste")}</span>
            <span className="ml-auto pl-4 text-xs text-muted-foreground">Ctrl+V</span>
          </DropdownMenuItem>
          
          <div className="h-px bg-border my-1" />
          
          {/* Suppression */}
          <DropdownMenuItem 
            onClick={selectedCount > 1 ? onDeleteSelected : onDelete} 
            className="text-destructive"
          >
            <FontAwesomeIcon icon={faTrash} className="mr-2 h-4 w-4" />
            <span className="flex-1">
              {selectedCount > 1 
                ? t("actions.deleteCount", { count: String(selectedCount) })
                : t("actions.delete")}
            </span>
            <span className="ml-auto pl-4 text-xs text-muted-foreground">Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

// Fonction de comparaison personnalisée pour optimiser les re-renders
const arePropsEqual = (prevProps: NoteBlockProps, nextProps: NoteBlockProps) => {
  // Vérifier si isActive a changé
  const prevEffectiveDuration = prevProps.note.duration === 0 ? 0.1 : prevProps.note.duration;
  const nextEffectiveDuration = nextProps.note.duration === 0 ? 0.1 : nextProps.note.duration;
  
  const prevIsActive = prevProps.currentTime >= prevProps.note.startTime && 
                       prevProps.currentTime <= prevProps.note.startTime + prevEffectiveDuration;
  const nextIsActive = nextProps.currentTime >= nextProps.note.startTime && 
                       nextProps.currentTime <= nextProps.note.startTime + nextEffectiveDuration;

  // Si l'état actif change, on doit re-render
  if (prevIsActive !== nextIsActive) return false;

  // Comparer les autres props importantes
  return prevProps.note === nextProps.note &&
         prevProps.trackId === nextProps.trackId &&
         prevProps.trackColor === nextProps.trackColor &&
         prevProps.isSelected === nextProps.isSelected &&
         prevProps.isOverlapping === nextProps.isOverlapping &&
         prevProps.isMarkedForDeletion === nextProps.isMarkedForDeletion &&
         prevProps.isDragging === nextProps.isDragging &&
         prevProps.draggedPosition === nextProps.draggedPosition &&
         prevProps.isResizing === nextProps.isResizing &&
         prevProps.resizedWidth === nextProps.resizedWidth &&
         prevProps.selectedCount === nextProps.selectedCount &&
         prevProps.editorMode === nextProps.editorMode &&
         prevProps.isRightClickDeleting === nextProps.isRightClickDeleting;
};

export const NoteBlock = memo(NoteBlockComponent, arePropsEqual);
