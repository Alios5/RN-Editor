import { Track } from "@/types/track";
import { TrackGroup } from "@/types/trackGroup";
import { TrackLabel } from "./TrackLabel";
import { RhythmGrid } from "./RhythmGrid";
import { AudioCalculations } from "@/utils/audioCalculations";
import { PreviewNote } from "@/hooks/useRealtimeNoteCreation";
import { useSortable } from "@dnd-kit/sortable";

import { Note } from "@/types/note";

interface TrackRowProps {
  track: Track;
  trackGroup?: TrackGroup;
  audioMetrics: AudioCalculations;
  rhythmSync: number;
  subRhythmSync: number;
  startOffset: number;
  bpm: number;
  musicDuration: number;
  currentTime: number;
  editorMode: 'edit' | 'select';
  selectedNotes?: Set<string>;
  overlappingNotes?: Set<string>;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  onAssignToGroup: () => void;
  onCreateNote?: (trackId: string, note: Omit<Note, 'id' | 'trackId' | 'trackName'>) => void;
  onDeleteNote?: (trackId: string, noteId: string) => void;
  onDeleteNotes?: (trackId: string, noteIds: string[]) => void;
  onMoveNotes?: (trackId: string, notePositions: { noteId: string; newGridPosition: number }[]) => void;
  onResizeNote?: (trackId: string, noteId: string, newGridWidth: number, newDuration: number) => void;
  onDeleteSelected?: () => void;
  onDuplicate?: (trackId: string, noteId: string) => void;
  onDuplicateSelected?: () => void;
  onMergeSelected?: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onAssignActionToNote?: (trackId: string, noteId: string) => void;
  onAssignActionToSelected?: () => void;
  onNoteClick?: (trackId: string, noteId: string, ctrlKey: boolean) => void;
  onContextMenuOpenChange?: (isOpen: boolean) => void;
  isDraggingNotes?: boolean;
  dragOffset?: number;
  onStartDrag?: (cellPosition: number, clickOffsetInCells: number) => void;
  onDragMove?: (cellPosition: number) => void;
  onDragEnd?: () => void;
  onGridMouseMove?: (trackId: string, cellPosition: number) => void;
  hasCopiedNotes?: boolean;
  previewNote?: PreviewNote;
  showMouseIndicator?: boolean;
}

export const TrackRow = ({
  track,
  trackGroup,
  audioMetrics,
  rhythmSync,
  subRhythmSync,
  startOffset,
  bpm,
  musicDuration,
  currentTime,
  editorMode,
  selectedNotes,
  overlappingNotes,
  scrollContainerRef,
  onEdit,
  onToggleVisibility,
  onDelete,
  onAssignToGroup,
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
  isDraggingNotes,
  dragOffset,
  onStartDrag,
  onDragMove,
  onDragEnd,
  onGridMouseMove,
  hasCopiedNotes,
  previewNote,
  showMouseIndicator
}: TrackRowProps) => {
  // The grid is visible if the track is visible AND if the group (if it exists) is visible
  const isGridVisible = track.visible && (!trackGroup || trackGroup.visible);
  // The label is disabled if the group exists and is hidden
  const isLabelDisabled = trackGroup && !trackGroup.visible;

  // dnd-kit sortable hook for the entire row
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id, disabled: isLabelDisabled });

  // Only apply Y translation to avoid deformation when grid is hidden
  const style = {
    transform: transform ? `translateY(${transform.y}px)` : undefined,
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`${isDragging ? 'opacity-50 z-50' : ''}`}
    >
      <TrackLabel
        track={track}
        trackGroup={trackGroup}
        isDisabled={isLabelDisabled}
        onEdit={onEdit}
        onToggleVisibility={onToggleVisibility}
        onDelete={onDelete}
        onAssignToGroup={onAssignToGroup}
        dragHandleProps={{ attributes, listeners }}
      />
      {isGridVisible && (
        <RhythmGrid
          width={audioMetrics.waveformWidth}
          totalTime={audioMetrics.totalTime}
          rhythmSync={rhythmSync}
          subRhythmSync={subRhythmSync}
          totalMeasures={audioMetrics.totalMeasures}
          startOffset={startOffset}
          notes={track.notes}
          trackId={track.id}
          trackName={track.name}
          trackColor={track.color}
          bpm={bpm}
          musicDuration={musicDuration}
          currentTime={currentTime}
          editorMode={editorMode}
          selectedNotes={selectedNotes}
          overlappingNotes={overlappingNotes}
          scrollContainerRef={scrollContainerRef}
          onCreateNote={(note) => onCreateNote?.(track.id, note)}
          onDeleteNote={(noteId) => onDeleteNote?.(track.id, noteId)}
          onDeleteNotes={(noteIds) => onDeleteNotes?.(track.id, noteIds)}
          onMoveNotes={(notePositions) => {
            onMoveNotes?.(track.id, notePositions);
          }}
          onResizeNote={(noteId, newGridWidth, newDuration) => {
            onResizeNote?.(track.id, noteId, newGridWidth, newDuration);
          }}
          onDeleteSelected={onDeleteSelected}
          onDuplicate={(noteId) => onDuplicate?.(track.id, noteId)}
          onDuplicateSelected={onDuplicateSelected}
          onMergeSelected={onMergeSelected}
          onCopy={onCopy}
          onCut={onCut}
          onPaste={onPaste}
          onAssignActionToNote={(noteId) => onAssignActionToNote?.(track.id, noteId)}
          onAssignActionToSelected={onAssignActionToSelected}
          onNoteClick={(noteId, ctrlKey) => onNoteClick?.(track.id, noteId, ctrlKey)}
          onContextMenuOpenChange={onContextMenuOpenChange}
          isDraggingNotes={isDraggingNotes}
          dragOffset={dragOffset}
          onStartDrag={onStartDrag}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          onGridMouseMove={(cellPosition) => onGridMouseMove?.(track.id, cellPosition)}
          hasCopiedNotes={hasCopiedNotes}
          previewNote={previewNote}
          showMouseIndicator={showMouseIndicator}
        />
      )}
    </div>
  );
};
