import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { panelColors, trackColors } from '@/lib/panelColors';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Clipboard } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Note } from "@/types/note";
import { NoteBlock } from "./NoteBlock";
import { PreviewNote } from "@/hooks/useRealtimeNoteCreation";
import { gridPositionToTime } from '@/utils/gridPositionCalculator';
import { useVisibleNotes } from '@/hooks/useVisibleNotes';

interface RhythmGridProps {
  width: number; // waveformWidth in pixels
  totalTime: number;
  rhythmSync: number;
  subRhythmSync: number;
  totalMeasures: number;
  startOffset: number;
  notes?: Note[];
  trackId: string;
  trackName: string;
  trackColor: string;
  bpm: number;
  musicDuration: number;
  currentTime: number;
  editorMode: 'edit' | 'select';
  selectedNotes?: Set<string>;
  overlappingNotes?: Set<string>;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
  onCreateNote?: (note: Omit<Note, 'id' | 'trackId' | 'trackName'>) => void;
  onDeleteNote?: (noteId: string) => void;
  onDeleteNotes?: (noteIds: string[]) => void;
  onMoveNotes?: (notePositions: { noteId: string; newGridPosition: number }[]) => void;
  onResizeNote?: (noteId: string, newGridWidth: number, newDuration: number) => void;
  onDeleteSelected?: () => void;
  onDuplicate?: (noteId: string) => void;
  onDuplicateSelected?: () => void;
  onMergeSelected?: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onAssignActionToNote?: (noteId: string) => void;
  onAssignActionToSelected?: () => void;
  onNoteClick?: (noteId: string, ctrlKey: boolean) => void;
  onContextMenuOpenChange?: (isOpen: boolean) => void;
  isDraggingNotes?: boolean;
  dragOffset?: number;
  onStartDrag?: (cellPosition: number, clickOffsetInCells: number) => void;
  onDragMove?: (cellPosition: number) => void;
  onDragEnd?: () => void;
  onGridMouseMove?: (cellPosition: number) => void;
  hasCopiedNotes?: boolean;
  previewNote?: PreviewNote;
}

export const RhythmGrid = ({
  width,
  totalTime,
  rhythmSync,
  subRhythmSync,
  totalMeasures,
  startOffset,
  notes = [],
  trackId,
  trackName,
  trackColor,
  bpm,
  musicDuration,
  currentTime,
  editorMode,
  selectedNotes = new Set(),
  overlappingNotes = new Set(),
  scrollContainerRef,
  onCreateNote,
  onDeleteNote,
  onDeleteNotes,
  onMoveNotes,
  onResizeNote,
  onDeleteSelected,
  onDuplicate,
  onDuplicateSelected,
  onMergeSelected,
  onCopy,
  onCut,
  onPaste,
  onAssignActionToNote,
  onAssignActionToSelected,
  onNoteClick,
  onContextMenuOpenChange,
  isDraggingNotes = false,
  dragOffset = 0,
  onStartDrag,
  onDragMove,
  onDragEnd,
  onGridMouseMove,
  hasCopiedNotes = false,
  previewNote
}: RhythmGridProps) => {
  const { t } = useTranslation();

  const cellWidth = 24; // Fixed cell width in pixels

  // Calculate visible notes with 300px buffer for performance optimization
  const visibleNoteIds = useVisibleNotes({
    notes,
    cellWidth,
    startOffset,
    containerRef: scrollContainerRef || { current: null },
    bufferSize: 300,
  });

  // Calculate total subdivisions based on BPM and duration
  // This ensures each subdivision gets exactly one cell
  const totalBeats = (bpm * musicDuration) / 60;
  const totalSubdivisions = totalBeats * subRhythmSync;

  // Use exact number of subdivisions (cells) from BPM calculation
  const cells = totalSubdivisions;
  const cellsPerMeasure = rhythmSync * subRhythmSync;

  const [isCreating, setIsCreating] = useState(false);
  const [creationStart, setCreationStart] = useState(0);
  const [currentCell, setCurrentCell] = useState(0);
  const [hoverCell, setHoverCell] = useState<number | null>(null);
  const [isRightClickDeleting, setIsRightClickDeleting] = useState(false);
  const notesToDeleteRef = useRef<Set<string>>(new Set());
  const [markedForDeletion, setMarkedForDeletion] = useState<Set<string>>(new Set());
  const [isNoteMenuOpen, setIsNoteMenuOpen] = useState(false);
  const [isGridMenuOpen, setIsGridMenuOpen] = useState(false);
  const [gridMenuPosition, setGridMenuPosition] = useState<{ x: number; y: number } | null>(null);

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeNoteId, setResizeNoteId] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  const [currentResizedWidth, setCurrentResizedWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Canvas Grid Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = scrollContainerRef?.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;

      // Use full width for the canvas to avoid scroll jitter
      // The browser handles the scrolling naturally
      if (canvas.width !== width * dpr || canvas.height !== 80 * dpr) {
        canvas.width = width * dpr;
        canvas.height = 80 * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = '80px';
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Setup styles
      ctx.lineWidth = 1 * dpr;

      // Resolve CSS variables to actual colors
      const computedStyle = getComputedStyle(container);
      const gridVarName = '--track-grid-line-color';
      const measureVarName = '--track-measure-line-color';
      const sectionBgVarName = '--panel-section-background-color';
      const inputBgVarName = '--panel-input-background-color';

      const gridColor = computedStyle.getPropertyValue(gridVarName).trim() || '#e5e7eb';
      const measureColor = computedStyle.getPropertyValue(measureVarName).trim() || '#9ca3af';
      const sectionBgColor = computedStyle.getPropertyValue(sectionBgVarName).trim() || 'rgba(30, 41, 59, 0.5)';
      const inputBgColor = computedStyle.getPropertyValue(inputBgVarName).trim() || 'rgba(15, 23, 42, 0.5)';

      // Draw backgrounds first (to be behind lines)
      // Draw by beat (subdivision) instead of by measure
      const cellsPerBeat = subRhythmSync;
      const totalBeats = Math.ceil(cells / cellsPerBeat);

      for (let b = 0; b < totalBeats; b++) {
        const beatStartCell = b * cellsPerBeat;

        // Skip if out of bounds
        if (beatStartCell > cells) break;

        const worldX = startOffset + beatStartCell * cellWidth;
        const worldWidth = cellsPerBeat * cellWidth;
        const canvasX = Math.floor(worldX * dpr);
        const canvasWidth = Math.ceil(worldWidth * dpr);

        // Alternating background per beat
        ctx.fillStyle = b % 2 === 0 ? sectionBgColor : inputBgColor;
        ctx.fillRect(canvasX, 0, canvasWidth, 80 * dpr);
      }

      // Draw lines and text
      ctx.font = `${10 * dpr}px Outfit, sans-serif`;
      ctx.textBaseline = 'top';

      for (let i = 0; i <= cells; i++) {
        const isMeasureStart = i % cellsPerMeasure === 0;

        const worldX = startOffset + i * cellWidth;
        const canvasX = Math.floor(worldX * dpr) + 0.5;

        if (isMeasureStart) {
          ctx.strokeStyle = measureColor;
          ctx.beginPath();
          ctx.moveTo(canvasX, 0);
          ctx.lineTo(canvasX, 80 * dpr);
          ctx.stroke();

          // Draw measure number
          const measureNum = Math.floor(i / cellsPerMeasure) + 1;

          ctx.fillStyle = measureColor;
          ctx.fillText(measureNum.toString(), canvasX + 4 * dpr, 4 * dpr);
        } else {
          ctx.strokeStyle = gridColor;
          ctx.beginPath();
          ctx.moveTo(canvasX, 0);
          ctx.lineTo(canvasX, 80 * dpr);
          ctx.stroke();
        }
      }
    };

    draw();

    // Remove scroll listener as we now use full width
    // Keep resize listener in case width/dpr changes
    window.addEventListener('resize', draw);

    return () => {
      window.removeEventListener('resize', draw);
    };
  }, [scrollContainerRef, startOffset, cells, cellsPerMeasure, subRhythmSync, cellWidth, width]);

  // Handler for opening/closing the context menu
  const handleMenuOpenChange = (isOpen: boolean) => {
    setIsNoteMenuOpen(isOpen);
    onContextMenuOpenChange?.(isOpen);
  };

  const handleGridMenuOpenChange = (isOpen: boolean) => {
    setIsGridMenuOpen(isOpen);
    if (!isOpen) {
      setGridMenuPosition(null);
    }
    onContextMenuOpenChange?.(isOpen);
  };

  const getCellFromMouseX = (mouseX: number, containerRect: DOMRect) => {
    const relativeX = mouseX - containerRect.left - startOffset;
    return Math.max(0, Math.min(cells - 1, Math.floor(relativeX / cellWidth)));
  };

  const hasOverlap = (position: number, width: number) => {
    return notes.some(note => {
      const noteEnd = note.gridPosition + note.gridWidth;
      const newEnd = position + width;
      return (position < noteEnd && newEnd > note.gridPosition);
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Block creation if a menu is open
    if (isNoteMenuOpen || isGridMenuOpen) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const cellIndex = getCellFromMouseX(e.clientX, rect);
    const target = e.target as HTMLElement;
    const isClickOnNote = target.closest('[data-note-block]');

    // In select mode: right click on empty area opens paste menu
    if (editorMode === 'select' && e.button === 2 && !isClickOnNote) {
      e.preventDefault();
      setGridMenuPosition({ x: e.clientX, y: e.clientY });
      setIsGridMenuOpen(true);
      return;
    }

    // In select mode, disable creation/deletion
    if (editorMode === 'select') {
      return;
    }

    // In edit mode: right click activates deletion
    if (e.button === 2) {
      e.preventDefault();
      setIsRightClickDeleting(true);
      return;
    }

    // In edit mode: left click creates notes
    if (e.button !== 0) return;

    if (!hasOverlap(cellIndex, 1)) {
      setIsCreating(true);
      setCreationStart(cellIndex);
      setCurrentCell(cellIndex);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cellIndex = getCellFromMouseX(e.clientX, rect);

    // Track hover position
    setHoverCell(cellIndex);

    // Always track mouse position for pasting
    if (onGridMouseMove) {
      onGridMouseMove(cellIndex);
    }

    // Resize mode
    if (isResizing) {
      const deltaX = e.clientX - resizeStartX;
      const newWidth = Math.max(cellWidth, resizeStartWidth + deltaX); // Minimum 24px
      setCurrentResizedWidth(newWidth);
      return;
    }

    // Creation mode
    if (isCreating && !isNoteMenuOpen) {
      setCurrentCell(Math.max(creationStart, cellIndex));
      return;
    }

    // Drag mode in Select - call global handler
    if (isDraggingNotes && editorMode === 'select' && onDragMove) {
      onDragMove(cellIndex);
    }
  };

  const handleStartResize = (noteId: string, note: Note) => (e: React.MouseEvent) => {
    if (editorMode !== 'select') return;

    setIsResizing(true);
    setResizeNoteId(noteId);
    setResizeStartX(e.clientX);
    setResizeStartWidth(note.gridWidth * cellWidth);
    setCurrentResizedWidth(note.gridWidth * cellWidth);
  };

  const handleResizeEnd = () => {
    if (!isResizing || !resizeNoteId) return;

    const note = notes.find(n => n.id === resizeNoteId);
    if (!note) {
      setIsResizing(false);
      setResizeNoteId(null);
      return;
    }

    // Calculate new grid width
    const newGridWidth = Math.max(1, Math.round(currentResizedWidth / cellWidth));

    if (newGridWidth === note.gridWidth) {
      setIsResizing(false);
      setResizeNoteId(null);
      return;
    }

    // Calculate new duration using standardized function for perfect consistency
    const newDuration = newGridWidth === 1 ? 0 : gridPositionToTime(newGridWidth, bpm, subRhythmSync);

    // Find and delete overlapping notes
    const noteEnd = note.gridPosition + newGridWidth;
    const overlappingNoteIds = notes
      .filter(n => n.id !== note.id)
      .filter(n => {
        const nEnd = n.gridPosition + n.gridWidth;
        return (note.gridPosition < nEnd && noteEnd > n.gridPosition);
      })
      .map(n => n.id);

    // Delete overlapping notes
    if (overlappingNoteIds.length > 0 && onDeleteNotes) {
      onDeleteNotes(overlappingNoteIds);
    }

    // Update note dimensions
    if (onResizeNote) {
      onResizeNote(note.id, newGridWidth, newDuration);
    }

    setIsResizing(false);
    setResizeNoteId(null);
  };

  const handleMouseUp = () => {
    if (isNoteMenuOpen) {
      return;
    }

    // Handle resize end
    if (isResizing) {
      handleResizeEnd();
      return;
    }

    if (isCreating) {
      const gridPosition = Math.min(creationStart, currentCell);
      const gridWidth = Math.abs(currentCell - creationStart) + 1;

      if (!hasOverlap(gridPosition, gridWidth) && onCreateNote) {
        // Use standardized function for perfect consistency (no drift accumulation)
        const noteTime = gridPositionToTime(gridPosition, bpm, subRhythmSync);
        // If gridWidth = 1, duration should be 0 (instant note)
        const noteDuration = gridWidth === 1 ? 0 : gridPositionToTime(gridWidth, bpm, subRhythmSync);

        onCreateNote({
          startTime: noteTime,
          duration: noteDuration,
          gridPosition,
          gridWidth,
        });
      }

      setIsCreating(false);
    }

    if (isRightClickDeleting) {
      // Delete all collected notes at once with onDeleteNotes
      const notesToDeleteArray = Array.from(notesToDeleteRef.current);
      if (notesToDeleteArray.length > 0) {
        onDeleteNotes?.(notesToDeleteArray);
      }
      notesToDeleteRef.current.clear();
      setMarkedForDeletion(new Set());
      setIsRightClickDeleting(false);
    }

    // End global drag
    if (isDraggingNotes && onDragEnd) {
      onDragEnd();
    }
  };

  const handleMouseLeave = () => {
    setIsCreating(false);
    setHoverCell(null);
    if (isRightClickDeleting) {
      notesToDeleteRef.current.clear();
      setMarkedForDeletion(new Set());
    }
    setIsRightClickDeleting(false);

    // End resize if leaving the grid
    if (isResizing) {
      handleResizeEnd();
    }

    // End global drag if leaving the grid
    if (isDraggingNotes && onDragEnd) {
      onDragEnd();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Ghost note during creation
  const ghostNote = isCreating ? {
    gridPosition: Math.min(creationStart, currentCell),
    gridWidth: Math.abs(currentCell - creationStart) + 1,
  } : null;

  return (
    <div
      ref={containerRef}
      className={`relative h-[80px] rounded-lg select-none overflow-hidden ${isRightClickDeleting ? 'cursor-not-allowed' : isResizing ? 'cursor-ew-resize' : editorMode === 'edit' ? 'cursor-crosshair' : 'cursor-default'
        }`}
      style={{
        width: `${width}px`,
        paddingLeft: `${startOffset}px`,
        boxSizing: 'border-box',
        backgroundColor: panelColors.sectionBackground(),
        border: `1px solid ${trackColors.border()}`
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
    >
      {/* Canvas Grid - Replaces CSS Grid */}
      <canvas
        ref={canvasRef}
        className="absolute left-0 top-0 pointer-events-none z-0"
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      {/* Notes existantes - Only render notes visible in viewport + buffer */}
      {notes.filter(note => visibleNoteIds.has(note.id)).map((note) => {
        const noteKey = `${trackId}:${note.id}`;
        const isSelected = selectedNotes.has(noteKey);
        const isOverlapping = overlappingNotes.has(noteKey);
        const isMarkedForDeletion = markedForDeletion.has(note.id);

        // Calculer la position ajustée pendant le drag global
        const adjustedPosition = (isDraggingNotes && isSelected)
          ? note.gridPosition + dragOffset
          : note.gridPosition;

        return (
          <NoteBlock
            key={note.id}
            note={note}
            trackId={trackId}
            cellWidth={cellWidth}
            trackColor={trackColor}
            startOffset={startOffset}
            isRightClickDeleting={isRightClickDeleting}
            isMarkedForDeletion={isMarkedForDeletion}
            isDragging={isDraggingNotes && isSelected}
            draggedPosition={adjustedPosition}
            isResizing={isResizing && resizeNoteId === note.id}
            resizedWidth={isResizing && resizeNoteId === note.id ? currentResizedWidth : undefined}
            currentTime={currentTime}
            editorMode={editorMode}
            isSelected={isSelected}
            isOverlapping={isOverlapping}
            selectedCount={selectedNotes.size}
            onDelete={() => onDeleteNote?.(note.id)}
            onDeleteSelected={onDeleteSelected}
            onDuplicate={() => onDuplicate?.(note.id)}
            onDuplicateSelected={onDuplicateSelected}
            onMergeSelected={onMergeSelected}
            onCopy={onCopy}
            onCut={onCut}
            onPaste={onPaste}
            onAssignAction={() => onAssignActionToNote?.(note.id)}
            onAssignActionToSelected={onAssignActionToSelected}
            onMenuOpenChange={handleMenuOpenChange}
            onNoteClick={(ctrlKey) => onNoteClick?.(note.id, ctrlKey)}
            onStartDrag={(cellPosition, clickOffsetInCells) => {
              if (editorMode === 'select' && isSelected && onStartDrag) {
                onStartDrag(cellPosition, clickOffsetInCells);
              }
            }}
            onStartResize={editorMode === 'select' ? handleStartResize(note.id, note) : undefined}
            onDeleteOnHover={() => {
              notesToDeleteRef.current.add(note.id);
              setMarkedForDeletion(new Set(notesToDeleteRef.current));
            }}
          />
        );
      })}

      {/* Note fantôme pendant la création */}
      {ghostNote && (
        <div
          className="absolute top-2 bottom-2 bg-white/50 rounded border border-dashed border-primary pointer-events-none"
          style={{
            left: `${ghostNote.gridPosition * cellWidth + startOffset}px`,
            width: `${ghostNote.gridWidth * cellWidth}px`,
          }}
        />
      )}

      {/* Note de prévisualisation en temps réel */}
      {previewNote && (
        <div
          className="absolute top-2 bottom-2 rounded border-2 border-primary pointer-events-none animate-pulse"
          style={{
            left: `${previewNote.gridPosition * cellWidth + startOffset}px`,
            width: `${previewNote.gridWidth * cellWidth}px`,
            backgroundColor: trackColor,
            opacity: 0.6,
          }}
        />
      )}

      {/* Indicateur de cellule survolée */}
      {hoverCell !== null && !isCreating && !isDraggingNotes && !isResizing && editorMode === 'edit' && !isNoteMenuOpen && !isGridMenuOpen && (
        <div
          className="absolute top-0 bottom-0 pointer-events-none z-40 transition-all duration-100 ease-out"
          style={{
            left: `${hoverCell * cellWidth + startOffset}px`,
            width: `${cellWidth}px`,
            backgroundColor: `hsl(var(--primary) / 0.15)`,
            borderLeft: `2px solid hsl(var(--primary) / 0.5)`,
            borderRight: `2px solid hsl(var(--primary) / 0.5)`,
          }}
        />
      )}

      {/* Menu contextuel pour coller */}
      {gridMenuPosition && (
        <DropdownMenu open={isGridMenuOpen} onOpenChange={handleGridMenuOpenChange}>
          <DropdownMenuTrigger asChild>
            <div
              style={{
                position: 'fixed',
                left: gridMenuPosition.x,
                top: gridMenuPosition.y,
                width: 0,
                height: 0,
                pointerEvents: 'none'
              }}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={onPaste}
              disabled={!hasCopiedNotes}
            >
              <Clipboard className="mr-2 h-4 w-4" />
              <span className="flex-1">{t("actions.paste")}</span>
              <span className="ml-auto pl-4 text-xs text-muted-foreground">Ctrl+V</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
