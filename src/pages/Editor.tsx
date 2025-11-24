import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Home, Save, Download, Music, RotateCcw, RotateCw, PanelLeftClose, PanelLeftOpen, FolderOpen } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useVisibleTracks } from "@/hooks/useVisibleTracks";
import { panelColors } from "@/lib/panelColors";
import { ShortcutsDialog } from "@/components/ShortcutsDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { getProjects, updateProjectMetadata } from "@/utils/localStorage";
import { saveProjectToFile, loadProjectFromFile, saveProjectAs } from "@/utils/fileSystem";
import { selectAudioFile, isMusicInProjectFolder, copyMusicToProjectFolder, convertFilePathToAudioUrl } from "@/utils/musicManager";
import { dirname, basename } from "@tauri-apps/api/path";
import { Project } from "@/types/project";
import { Track } from "@/types/track";
import { TrackGroup } from "@/types/trackGroup";
import { SpecificAction } from "@/types/specificAction";
import { Note } from "@/types/note";
import { toast } from "sonner";
import { AudioPanel } from "@/components/AudioPanel";
import { Waveform } from "@/components/Waveform";
import { AudioPlayer, AudioPlayerRef } from "@/components/AudioPlayer";
import { useShortcuts } from "@/hooks/useShortcuts";
import { useRealtimeNoteCreation } from "@/hooks/useRealtimeNoteCreation";
import { useMetronome } from "@/hooks/useMetronome";

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { calculateAudioMetrics } from "@/utils/audioCalculations";
import { exportToJson, exportToJsonFile } from "@/utils/exportJson";
import { gridPositionToTime } from "@/utils/gridPositionCalculator";
import { CloseHandler } from "@/utils/closeHandler";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { CreateTrackDialog } from "@/components/CreateTrackDialog";
import { EditTrackDialog } from "@/components/EditTrackDialog";
import { AssignTrackToGroupDialog } from "@/components/AssignTrackToGroupDialog";
import { SelectActionDialog } from "@/components/SelectActionDialog";
import { TrackRow } from "@/components/TrackRow";
import { PlayheadLine } from "@/components/PlayheadLine";
import { CopyMusicDialog } from "@/components/CopyMusicDialog";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import { LassoSelection } from "@/components/LassoSelection";
import { TracksPanel } from "@/components/TracksPanel";
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

interface EditorState {
  tracks: Track[];
  trackGroups: TrackGroup[];
  specificActions: SpecificAction[];
  bpm: number;
  rhythmSync: number;
  subRhythmSync: number;
  volume: number;
  pitch: number;
  startOffset: number;
  audioUrl: string;
  audioFileName: string;
}

const MAX_HISTORY_SIZE = 50;

const Editor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [project, setProject] = useState<Project | null>(null);

  // Audio controls state
  const [audioUrl, setAudioUrl] = useState<string>(""); // URL for playback
  const [musicFilePath, setMusicFilePath] = useState<string>(""); // File path for saving
  const [audioFileName, setAudioFileName] = useState<string>("");
  const [bpm, setBpm] = useState(120);
  const [rhythmSync, setRhythmSync] = useState(4);
  const [subRhythmSync, setSubRhythmSync] = useState(4);
  const [volume, setVolume] = useState(70);
  const [pitch, setPitch] = useState(1);
  const [startOffset, setStartOffset] = useState(0);

  // Playback state for synchronization
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [seekTime, setSeekTime] = useState<number | undefined>(undefined);
  const [audioDuration, setAudioDuration] = useState(0);
  const [dragSeekTime, setDragSeekTime] = useState<number | null>(null);
  const [autoFollowPlayback, setAutoFollowPlayback] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);



  // UI state
  const [showMouseIndicator, setShowMouseIndicator] = useState(true);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [metronomeVolume, setMetronomeVolume] = useState(0.5);

  // Tracks state
  const [tracks, setTracks] = useState<Track[]>([]);
  const [showCreateTrackDialog, setShowCreateTrackDialog] = useState(false);
  const [showEditTrackDialog, setShowEditTrackDialog] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [trackToDelete, setTrackToDelete] = useState<Track | null>(null);
  const [showCopyMusicDialog, setShowCopyMusicDialog] = useState(false);
  const [pendingMusicPath, setPendingMusicPath] = useState<string | null>(null);
  const [pendingMusicFileName, setPendingMusicFileName] = useState<string | null>(null);
  const [showChangeMusicWarning, setShowChangeMusicWarning] = useState(false);
  const [dontShowMusicWarning, setDontShowMusicWarning] = useState(false);
  const [showMissingMusicDialog, setShowMissingMusicDialog] = useState(false);

  // Track groups state
  const [trackGroups, setTrackGroups] = useState<TrackGroup[]>([]);
  const [showAssignGroupDialog, setShowAssignGroupDialog] = useState(false);
  const [trackToAssign, setTrackToAssign] = useState<Track | null>(null);

  // Specific actions state
  const [specificActions, setSpecificActions] = useState<SpecificAction[]>([]);
  const [showSelectActionDialog, setShowSelectActionDialog] = useState(false);
  const [noteToAssignAction, setNoteToAssignAction] = useState<{ trackId: string; noteId: string } | null>(null);

  // Editor mode state
  const [editorMode, setEditorMode] = useState<'edit' | 'select'>('edit');

  // Selection state
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set()); // Format: "trackId:noteId"
  const [isLassoActive, setIsLassoActive] = useState(false);
  const [lassoStart, setLassoStart] = useState<{ x: number; y: number } | null>(null);
  const [lassoEnd, setLassoEnd] = useState<{ x: number; y: number } | null>(null);
  const [lassoWithCtrl, setLassoWithCtrl] = useState(false);
  const lassoContainerRef = useRef<HTMLDivElement | null>(null);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [hasModifiedSelectedNotes, setHasModifiedSelectedNotes] = useState(false);

  // Global drag state for multi-track dragging
  const [isDraggingNotes, setIsDraggingNotes] = useState(false);
  const [dragStartCell, setDragStartCell] = useState(0);
  const [dragClickOffset, setDragClickOffset] = useState(0); // Offset du clic dans la note
  const [dragOffset, setDragOffset] = useState(0);

  // Sidebar visibility
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isShortcutsDialogOpen, setIsShortcutsDialogOpen] = useState(false);

  // Ref pour l'AudioPlayer
  const audioPlayerRef = useRef<AudioPlayerRef>(null);

  // Ref pour le conteneur scrollable
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Hook de raccourcis
  const { matchesShortcut } = useShortcuts();

  // Copy/Paste state
  const [copiedNotes, setCopiedNotes] = useState<{ trackId: string; notes: Note[] }[]>([]);
  const [mouseGridPosition, setMouseGridPosition] = useState<{ trackId: string; cellPosition: number } | null>(null);
  const [isDetectingBPM, setIsDetectingBPM] = useState(false);

  // History state for undo/redo
  const [history, setHistory] = useState<EditorState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [skipHistoryUpdate, setSkipHistoryUpdate] = useState(false);
  const debounceTimerRef = useRef<number | null>(null);

  // State for save and export paths
  const [lastExportPath, setLastExportPath] = useState<string | undefined>(undefined);

  // State to track unsaved changes (for navigation only)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(false);
  const isInitialLoadRef = useRef(true); // Track if we're loading a project for the first time

  // Calculate audio metrics based on parameters
  const audioMetrics = useMemo(() => {
    if (audioDuration === 0) {
      return {
        totalBeats: 0,
        totalMeasures: 0,
        totalTime: 0,
        waveformWidth: 800 // Default width
      };
    }

    return calculateAudioMetrics(bpm, audioDuration, rhythmSync, subRhythmSync);
  }, [bpm, audioDuration, rhythmSync, subRhythmSync]);

  // Calculate which tracks are visible in the viewport (with 300px buffer)
  const visibleTrackIds = useVisibleTracks({
    tracks,
    scrollContainerRef,
    trackHeight: 131, // TrackLabel (35px + 8px mb) + RhythmGrid (80px) + space-y-2 (8px)
    bufferSize: 300,
  });

  // Display only visible tracks for performance optimization
  const displayedTracks = useMemo(() => {
    return tracks.filter(track => visibleTrackIds.has(track.id));
  }, [tracks, visibleTrackIds]);

  // Calculate notes that overlap with other notes
  const overlappingNotes = useMemo(() => {
    const overlaps = new Set<string>();

    tracks.forEach(track => {
      const selectedNotesInTrack = Array.from(selectedNotes)
        .filter(key => key.startsWith(`${track.id}:`))
        .map(key => key.split(':')[1]);

      track.notes?.forEach(note => {
        // Check only for selected notes
        if (!selectedNotesInTrack.includes(note.id)) return;

        // Check if it overlaps with unselected notes
        const hasOverlap = track.notes?.some(n => {
          if (selectedNotesInTrack.includes(n.id)) return false;
          const noteEnd = note.gridPosition + note.gridWidth;
          const otherEnd = n.gridPosition + n.gridWidth;
          return (note.gridPosition < otherEnd && noteEnd > n.gridPosition);
        });

        if (hasOverlap) {
          overlaps.add(`${track.id}:${note.id}`);
        }
      });
    });

    return overlaps;
  }, [tracks, selectedNotes]);

  // Recalculate note times dynamically based on startOffset
  // Keyboard shortcuts management
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // CTRL+S to save (only if there are unsaved changes)
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        if (hasUnsavedChanges) {
          handleSave();
        }
      }

      // CTRL+E to export
      if (event.ctrlKey && event.key === 'e') {
        event.preventDefault();
        handleExportJson();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [project, bpm, tracks, audioUrl, audioFileName, pitch, startOffset, lastExportPath, hasUnsavedChanges]);

  useEffect(() => {
    if (audioDuration === 0) return;

    // Convert startOffset (pixels) to time (seconds) using BPM
    const cellWidth = 24; // pixels per cell
    const offsetInCells = startOffset / cellWidth;
    const offsetTime = gridPositionToTime(offsetInCells, bpm, subRhythmSync);

    setTracks(prevTracks =>
      prevTracks.map(track => ({
        ...track,
        notes: track.notes?.map(note => {
          // Calculate time using standardized functions from gridPositionCalculator
          // This guarantees perfect consistency and avoids drift accumulation on long tracks
          const noteTime = gridPositionToTime(note.gridPosition, bpm, subRhythmSync);
          const noteDuration = note.gridWidth === 1 ? 0 : gridPositionToTime(note.gridWidth, bpm, subRhythmSync);

          return {
            ...note,
            startTime: noteTime + offsetTime, // Add offset time to all notes
            duration: noteDuration
          };
        })
      }))
    );
  }, [startOffset, audioDuration, bpm, subRhythmSync]);

  // Automatic history save with debounce (500ms)
  useEffect(() => {
    // Skip if we're currently restoring from history
    if (skipHistoryUpdate) {
      return;
    }

    // Skip if no project loaded yet (initial load)
    if (!project) {
      return;
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer to save state after 500ms of inactivity
    debounceTimerRef.current = window.setTimeout(() => {
      const currentState: EditorState = {
        tracks,
        trackGroups,
        specificActions,
        bpm,
        rhythmSync,
        subRhythmSync,
        volume,
        pitch,
        startOffset,
        audioUrl,
        audioFileName,
      };

      setHistory(prevHistory => {
        // Don't save if state hasn't changed
        const lastState = prevHistory[historyIndex];
        if (lastState && JSON.stringify(lastState) === JSON.stringify(currentState)) {
          return prevHistory;
        }

        // Remove all states after current index (discard redo states)
        const newHistory = prevHistory.slice(0, historyIndex + 1);
        // Add new state
        newHistory.push(currentState);
        // Limit history size
        if (newHistory.length > MAX_HISTORY_SIZE) {
          newHistory.shift();
          setHistoryIndex(prev => prev - 1);
          return newHistory;
        }
        setHistoryIndex(prev => prev + 1);
        return newHistory;
      });

      // Only mark as unsaved if this is not the initial load
      if (!isInitialLoadRef.current) {
        setHasUnsavedChanges(true);
      } else {
        // After first history save, consider future changes as real modifications
        isInitialLoadRef.current = false;
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [tracks, trackGroups, specificActions, bpm, rhythmSync, subRhythmSync, volume, pitch, startOffset, audioUrl, audioFileName, skipHistoryUpdate, historyIndex]);

  // Restore state from history
  const restoreState = useCallback((state: EditorState) => {
    setSkipHistoryUpdate(true);
    setTracks(state.tracks);
    setTrackGroups(state.trackGroups);
    setSpecificActions(state.specificActions);
    setBpm(state.bpm);
    setRhythmSync(state.rhythmSync);
    setSubRhythmSync(state.subRhythmSync);
    setVolume(state.volume);
    setPitch(state.pitch);
    setStartOffset(state.startOffset);
    setAudioUrl(state.audioUrl);
    setAudioFileName(state.audioFileName);
    // Re-enable history updates after state restoration
    setTimeout(() => setSkipHistoryUpdate(false), 100);
  }, []);

  // Undo function
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      restoreState(history[newIndex]);
    }
  }, [historyIndex, history, restoreState]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      restoreState(history[newIndex]);
    }
  }, [historyIndex, history, restoreState]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'z' || e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Auto-follow playback - scroll automatique pendant la lecture
  useEffect(() => {
    if (autoFollowPlayback && isPlaying && scrollContainerRef.current && audioDuration > 0) {
      const container = scrollContainerRef.current;
      const waveformWidth = audioMetrics.waveformWidth;
      const progress = currentTime / audioDuration;
      const targetScrollLeft = progress * waveformWidth - container.clientWidth / 2;

      // Instant scroll (auto) to avoid stuttering on low-end devices
      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: 'auto'
      });
    }
  }, [currentTime, autoFollowPlayback, isPlaying, audioDuration, audioMetrics.waveformWidth]);

  // Fonction pour remettre le scroll au début
  const handleResetScroll = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: 0,
        behavior: 'smooth'
      });
    }
  };

  // Track scroll position for reset button state
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollPosition(container.scrollLeft);
    };

    container.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, [tracks, audioUrl]); // Re-attach when content changes

  // Keyboard shortcuts for selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if typing in a field
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // E : switch to Edit mode
      if (e.key === 'e' && !isTyping && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();

        // Save if notes have been modified before changing mode
        if (hasModifiedSelectedNotes && selectedNotes.size > 0) {
          // History is now automatic via useEffect with debounce
          setHasModifiedSelectedNotes(false);
        }

        setEditorMode('edit');
        setSelectedNotes(new Set()); // Deselect all when switching to Edit mode
      }

      // S : switch to Select mode
      if (e.key === 's' && !isTyping && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setEditorMode('select');
      }

      // Delete : delete selected notes
      if (e.key === 'Delete' && editorMode === 'select' && selectedNotes.size > 0) {
        e.preventDefault();
        setTracks(tracks.map(track => {
          const notesToDelete = Array.from(selectedNotes)
            .filter(key => key.startsWith(`${track.id}:`))
            .map(key => key.split(':')[1]);

          if (notesToDelete.length > 0) {
            return {
              ...track,
              notes: (track.notes || []).filter(note => !notesToDelete.includes(note.id))
            };
          }
          return track;
        }));
        setSelectedNotes(new Set());
        // History is now automatic via useEffect with debounce
      }

      // Escape : deselect all
      if (e.key === 'Escape' && selectedNotes.size > 0) {
        e.preventDefault();
        setSelectedNotes(new Set());
      }

      // Ctrl+A : select all notes
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && editorMode === 'select') {
        e.preventDefault();
        const allNotes = new Set<string>();
        tracks.forEach(track => {
          track.notes?.forEach(note => {
            allNotes.add(`${track.id}:${note.id}`);
          });
        });
        setSelectedNotes(allNotes);
      }


      // Left/right arrows : move selected notes
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && editorMode === 'select' && selectedNotes.size > 0 && !isTyping) {
        e.preventDefault(); // Prevent scrolling

        const direction = e.key === 'ArrowLeft' ? -1 : 1;
        const step = e.shiftKey ? 4 : 1; // Shift to move faster (4 cells)
        const moveAmount = direction * step;

        // Constants for time calculation
        const cellWidth = 24;
        const trackWidth = audioMetrics.waveformWidth;

        setTracks(tracks.map(track => {
          const selectedNotesInTrack = Array.from(selectedNotes)
            .filter(key => key.startsWith(`${track.id}:`))
            .map(key => key.split(':')[1]);

          if (selectedNotesInTrack.length === 0) return track;

          return {
            ...track,
            notes: track.notes?.map(note => {
              if (selectedNotesInTrack.includes(note.id)) {
                const newPosition = Math.max(0, note.gridPosition + moveAmount);

                // Recalculate startTime and duration based on new position
                const notePosition = newPosition * cellWidth;
                const noteWidth = note.gridWidth * cellWidth;
                const newStartTime = (notePosition / trackWidth) * audioDuration;
                const newDuration = note.gridWidth === 1 ? 0 : (noteWidth / trackWidth) * audioDuration;

                return {
                  ...note,
                  gridPosition: newPosition,
                  startTime: newStartTime,
                  duration: newDuration
                };
              }
              return note;
            })
          };
        }));

        // Mark that notes have been modified
        setHasModifiedSelectedNotes(true);

        // Do not save to history during movement
        // History will be updated on deselection
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editorMode, selectedNotes, tracks, audioMetrics, audioDuration, startOffset, hasModifiedSelectedNotes]);

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;

      console.log('=== CHARGEMENT DU PROJET ===');
      console.log('ID du projet:', id);

      const projects = getProjects();
      console.log('Projets dans localStorage:', projects);

      const found = projects.find((p) => p.id === id);
      console.log('Projet trouvé:', found);

      if (!found) {
        console.error('Projet non trouvé dans localStorage');
        toast.error(t("project.notFound"));
        navigate("/");
        return;
      }

      // If the project has a filePath, load from file
      if (found.filePath) {
        console.log('Le projet a un filePath:', found.filePath);
        try {
          // Check if the file exists
          const { exists } = await import('@tauri-apps/plugin-fs');
          console.log('Vérification existence du fichier...');
          const fileExists = await exists(found.filePath);
          console.log('Fichier existe:', fileExists);

          if (!fileExists) {
            console.error("Fichier introuvable:", found.filePath);
            toast.error(t("project.fileNotFound", { name: found.name }));
            navigate("/");
            return;
          }

          console.log('Chargement du projet depuis le fichier...');
          const loadedProject = await loadProjectFromFile(found.filePath);
          console.log('Projet chargé:', loadedProject);

          if (loadedProject) {
            setProject(loadedProject);
            loadProjectData(loadedProject);
            console.log('Projet chargé avec succès !');
          } else {
            console.error('loadProjectFromFile a retourné null');
            toast.error(t("project.loadError"));
            navigate("/");
          }
        } catch (error) {
          console.error("Erreur lors du chargement:", error);
          toast.error(t("project.openError"));
          navigate("/");
        }
      } else {
        console.log('Projet sans fichier (ancien système)');
        // Project without file (legacy system)
        setProject(found);
        loadProjectData(found);
      }
    };

    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  // Override the dialog callback when Editor mounts
  useEffect(() => {
    CloseHandler.setOnShowDialog(() => {
      setShowUnsavedChangesDialog(true);
    });

    return () => {
      CloseHandler.setOnShowDialog(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update close handler when unsaved changes state changes
  useEffect(() => {
    CloseHandler.setHasUnsavedChanges(hasUnsavedChanges);
  }, [hasUnsavedChanges]);

  const loadProjectData = (project: Project) => {
    // Reset unsaved changes state for new project load
    isInitialLoadRef.current = true;
    setHasUnsavedChanges(false);

    // Load saved audio parameters
    if (project.bpm) setBpm(project.bpm);
    if (project.rhythmSync) setRhythmSync(project.rhythmSync);
    if (project.subRhythmSync) setSubRhythmSync(project.subRhythmSync);
    if (project.volume !== undefined) setVolume(project.volume);
    if (project.pitchShift !== undefined) setPitch(project.pitchShift);
    if (project.musicPath) {
      // Check if music file exists before loading
      import('@tauri-apps/plugin-fs').then(async ({ exists }) => {
        try {
          const musicExists = await exists(project.musicPath!);

          if (musicExists) {
            setMusicFilePath(project.musicPath!);
            setAudioUrl(convertFilePathToAudioUrl(project.musicPath!));
          } else {
            console.warn('Music file not found:', project.musicPath);
            setShowMissingMusicDialog(true);
          }
        } catch (error) {
          console.error('Error checking music file:', error);
          setShowMissingMusicDialog(true);
        }
      });
    }
    if (project.musicFileName) setAudioFileName(project.musicFileName);
    if (project.startOffset !== undefined) setStartOffset(project.startOffset);
    // Load tracks
    if (project.tracks) setTracks(project.tracks);
    // Load track groups
    if (project.trackGroups) setTrackGroups(project.trackGroups);
    // Load specific actions
    if (project.specificActions) setSpecificActions(project.specificActions);

    // Initialize history with loaded state
    setTimeout(() => {
      const initialState: EditorState = {
        tracks: project.tracks || [],
        trackGroups: project.trackGroups || [],
        specificActions: project.specificActions || [],
        bpm: project.bpm || 120,
        rhythmSync: project.rhythmSync || 4,
        subRhythmSync: project.subRhythmSync || 4,
        volume: project.volume !== undefined ? project.volume : 70,
        pitch: project.pitchShift !== undefined ? project.pitchShift : 1,
        startOffset: project.startOffset !== undefined ? project.startOffset : 0,
        audioUrl: project.musicPath ? convertFilePathToAudioUrl(project.musicPath) : "",
        audioFileName: project.musicFileName || "",
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    }, 100);
  };

  const handleSave = async () => {
    if (project) {
      const updatedProject: Project = {
        ...project,
        bpm,
        rhythmSync,
        subRhythmSync,
        volume,
        pitchShift: pitch,
        musicPath: musicFilePath,
        musicFileName: audioFileName,
        startOffset,
        tracks,
        trackGroups,
        specificActions,
      };

      try {
        if (project.filePath) {
          // Save to existing file
          await saveProjectToFile(updatedProject, project.filePath);
          setHasUnsavedChanges(false); // Reset after save
          const dirPath = await dirname(project.filePath);
          toast.success(t("project.saveSuccess"), {
            action: {
              label: t("project.showPath") || "Voir le chemin",
              onClick: () => {
                navigator.clipboard.writeText(dirPath);
                toast.info(t("project.pathCopied") || "Chemin copié dans le presse-papiers");
              }
            }
          });
        } else {
          // First save - ask where to save
          const filePath = await saveProjectToFile(updatedProject);
          if (filePath) {
            setProject({ ...updatedProject, filePath });
            setHasUnsavedChanges(false); // Reset after save
            const dirPath = await dirname(filePath);
            toast.success(t("project.saveAsSuccess", { path: filePath }), {
              action: {
                label: t("project.showPath") || "Voir le chemin",
                onClick: () => {
                  navigator.clipboard.writeText(dirPath);
                  toast.info(t("project.pathCopied") || "Chemin copié dans le presse-papiers");
                }
              }
            });
          }
        }
      } catch (error) {
        console.error("Error saving:", error);
        toast.error(t("project.saveError"));
      }
    }
  };

  const handleSaveAs = async () => {
    if (project) {
      const updatedProject: Project = {
        ...project,
        bpm,
        rhythmSync,
        subRhythmSync,
        volume,
        pitchShift: pitch,
        musicPath: musicFilePath,
        musicFileName: audioFileName,
        startOffset,
        tracks,
        trackGroups,
        specificActions,
      };

      try {
        const filePath = await saveProjectAs(updatedProject);
        if (filePath) {
          setProject({ ...updatedProject, filePath });
          setHasUnsavedChanges(false); // Reset after save
          toast.success(t("project.saveAsSuccess", { path: filePath }));
        }
      } catch (error) {
        console.error("Error saving:", error);
        toast.error(t("project.saveError"));
      }
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setPendingNavigation(true);
      setShowUnsavedChangesDialog(true);
    } else {
      navigate("/");
    }
  };

  const handleConfirmQuit = async () => {
    setShowUnsavedChangesDialog(false);
    setHasUnsavedChanges(false);
    const wasPendingNavigation = pendingNavigation;
    setPendingNavigation(false);

    // Check if we're trying to close the window or just navigate back
    if (wasPendingNavigation) {
      navigate("/");
    } else {
      // Close the window without saving
      await CloseHandler.forceClose();
    }
  };

  const handleCancelQuit = () => {
    setShowUnsavedChangesDialog(false);
    setPendingNavigation(false);
    // User cancelled, no action needed
  };

  const handleSaveAndQuit = async () => {
    setShowUnsavedChangesDialog(false);
    const wasPendingNavigation = pendingNavigation;
    setPendingNavigation(false);

    // Save the project first
    await handleSave();

    // Then close window or navigate
    if (wasPendingNavigation) {
      navigate("/");
    } else {
      // Close the window after saving
      await CloseHandler.forceClose();
    }
  };

  const handleLoadAudio = () => {
    // If music is already loaded, check if the user wants to see the warning
    if (audioDuration > 0) {
      const hideWarning = localStorage.getItem('hideChangeMusicWarning') === 'true';
      if (hideWarning) {
        proceedWithMusicSelection();
      } else {
        setShowChangeMusicWarning(true);
      }
    } else {
      // Otherwise, proceed directly to selection
      proceedWithMusicSelection();
    }
  };

  const proceedWithMusicSelection = async () => {
    try {
      // Select audio file
      const filePath = await selectAudioFile();
      if (!filePath) return;

      const fileName = await basename(filePath);

      // Proceed with loading
      // Check if the project has a defined save folder
      if (project?.filePath) {
        const projectFolder = await dirname(project.filePath);
        const isInProjectFolder = await isMusicInProjectFolder(filePath, project.filePath);

        if (!isInProjectFolder) {
          // Music is not in the project folder, offer to copy it
          setPendingMusicPath(filePath);
          setPendingMusicFileName(fileName);
          setShowCopyMusicDialog(true);
        } else {
          // Music is already in the project folder
          setMusicFilePath(filePath);
          setAudioUrl(convertFilePathToAudioUrl(filePath));
          setAudioFileName(fileName);
          toast.success(t("audio.loadSuccess", { name: fileName }));
          // History is now automatic via useEffect with debounce
        }
      } else {
        // No RNE file yet, load directly
        setMusicFilePath(filePath);
        setAudioUrl(convertFilePathToAudioUrl(filePath));
        setAudioFileName(fileName);
        toast.success(t("audio.loadSuccess", { name: fileName }));
        // History is now automatic via useEffect with debounce
      }
    } catch (error) {
      console.error("Error loading audio:", error);
      toast.error(t("audio.loadError"));
    }
  };

  const handleConfirmChangeMusic = () => {
    if (dontShowMusicWarning) {
      localStorage.setItem('hideChangeMusicWarning', 'true');
    }
    setShowChangeMusicWarning(false);
    setDontShowMusicWarning(false);
    proceedWithMusicSelection();
  };

  const handleCancelChangeMusic = () => {
    setShowChangeMusicWarning(false);
    setDontShowMusicWarning(false);
  };

  const handleConfirmCopyMusic = async () => {
    if (!pendingMusicPath || !project?.filePath) return;

    try {
      const projectFolder = await dirname(project.filePath);
      const copiedPath = await copyMusicToProjectFolder(pendingMusicPath, projectFolder);

      if (copiedPath) {
        const fileName = await basename(copiedPath);
        setMusicFilePath(copiedPath);
        setAudioUrl(convertFilePathToAudioUrl(copiedPath));
        setAudioFileName(fileName);
        toast.success(t("audio.copyAndLoadSuccess", { name: fileName }));
        // History is now automatic via useEffect with debounce
      } else {
        toast.error(t("audio.copyError"));
      }
    } catch (error) {
      console.error("Error copying:", error);
      toast.error(t("audio.copyError"));
    } finally {
      setShowCopyMusicDialog(false);
      setPendingMusicPath(null);
      setPendingMusicFileName(null);
    }
  };

  const handleDeclineCopyMusic = () => {
    if (pendingMusicPath && pendingMusicFileName) {
      setMusicFilePath(pendingMusicPath);
      setAudioUrl(convertFilePathToAudioUrl(pendingMusicPath));
      setAudioFileName(pendingMusicFileName);
      toast.warning(t("audio.loadWithAbsolutePath", { name: pendingMusicFileName }));
      // History is now automatic via useEffect with debounce
    }
    setShowCopyMusicDialog(false);
    setPendingMusicPath(null);
    setPendingMusicFileName(null);
  };

  // Calculate used keys from all tracks
  const usedKeys = useMemo(() => {
    return tracks
      .filter(t => t.assignedKey)
      .map(t => t.assignedKey!.toLowerCase());
  }, [tracks]);

  // Track management
  const handleCreateTrack = (name: string, color: string, assignedKey?: string) => {
    const newTrack: Track = {
      id: crypto.randomUUID(),
      name,
      color,
      visible: true,
      order: tracks.length,
      createdAt: new Date().toISOString(),
      assignedKey,
    };
    setTracks([...tracks, newTrack]);
    toast.success(t("track.createSuccess"));
    // History is now automatic via useEffect with debounce
  };

  const handleEditTrack = (trackId: string, name: string, color: string, assignedKey?: string) => {
    setTracks(tracks.map(track => {
      if (track.id === trackId) {
        // Mettre à jour le nom de la piste ET le trackName de toutes ses notes
        return {
          ...track,
          name,
          color,
          assignedKey,
          notes: track.notes?.map(note => ({
            ...note,
            trackName: name
          }))
        };
      }
      return track;
    }));
    toast.success(t("track.editSuccess"));
    // History is now automatic via useEffect with debounce
  };

  const handleToggleTrackVisibility = (trackId: string) => {
    setTracks(tracks.map(track =>
      track.id === trackId ? { ...track, visible: !track.visible } : track
    ));
    // History is now automatic via useEffect with debounce
  };

  const handleDeleteTrack = (trackId: string) => {
    setTracks(tracks.filter(track => track.id !== trackId));
    setTrackToDelete(null);
    toast.success(t("track.deleteSuccess"));
    // History is now automatic via useEffect with debounce
  };

  // Track Groups Management
  const handleCreateGroup = (name: string) => {
    const newGroup: TrackGroup = {
      id: crypto.randomUUID(),
      name,
      visible: true,
      collapsed: false,
    };
    setTrackGroups([...trackGroups, newGroup]);
    toast.success(t("group.createSuccess"));
    // History is now automatic via useEffect with debounce
  };

  const handleUpdateGroup = (groupId: string, updates: Partial<TrackGroup>) => {
    setTrackGroups(trackGroups.map(group =>
      group.id === groupId ? { ...group, ...updates } : group
    ));

    // History is now automatic via useEffect with debounce
  };

  const handleDeleteGroup = (groupId: string) => {
    const group = trackGroups.find(g => g.id === groupId);

    // Remove groupId from all tracks in this group
    setTracks(tracks.map(track =>
      track.groupId === groupId ? { ...track, groupId: undefined } : track
    ));

    setTrackGroups(trackGroups.filter(g => g.id !== groupId));
    toast.success(t("group.deleteSuccess"));
    // History is now automatic via useEffect with debounce
  };

  // Specific Actions Management
  const handleCreateAction = (name: string, icon: string) => {
    const newAction: SpecificAction = {
      id: crypto.randomUUID(),
      name,
      icon,
    };
    setSpecificActions([...specificActions, newAction]);
    toast.success(t("action.createSuccess"));
    // History is now automatic via useEffect with debounce
  };

  const handleEditAction = (actionId: string, name: string, icon: string) => {
    // Find the old action name for notes update
    const oldAction = specificActions.find(a => a.id === actionId);
    if (!oldAction) return;

    // Update the action
    setSpecificActions(specificActions.map(action =>
      action.id === actionId ? { ...action, name, icon } : action
    ));

    // Update all notes using this action
    setTracks(tracks.map(track => ({
      ...track,
      notes: track.notes?.map(note =>
        note.specificAction?.name === oldAction.name
          ? { ...note, specificAction: { name, icon } }
          : note
      )
    })));

    toast.success(t("action.editSuccess") || "Action modifiée avec succès");
    // History is now automatic via useEffect with debounce
  };

  const handleDeleteAction = (actionId: string) => {
    // Remove the action from all notes using it
    setTracks(tracks.map(track => ({
      ...track,
      notes: track.notes?.map(note =>
        note.specificAction?.name === specificActions.find(a => a.id === actionId)?.name
          ? { ...note, specificAction: undefined }
          : note
      )
    })));

    setSpecificActions(specificActions.filter(a => a.id !== actionId));
    toast.success(t("action.deleteSuccess"));
    // History is now automatic via useEffect with debounce
  };

  const handleAssignTrackToGroup = (trackId: string, groupId: string | null) => {
    setTracks(tracks.map(track => {
      if (track.id === trackId) {
        return { ...track, groupId: groupId || undefined };
      }
      return track;
    }));
    // History is now automatic via useEffect with debounce
  };

  const handleCreateNote = useCallback((trackId: string, noteData: Omit<Note, 'id' | 'trackId' | 'trackName'>) => {
    setTracks(prevTracks => prevTracks.map(track => {
      if (track.id === trackId) {
        const newNote = {
          id: crypto.randomUUID(),
          trackId: track.id,
          trackName: track.name,
          ...noteData
        };
        return {
          ...track,
          notes: [...(track.notes || []), newNote]
        };
      }
      return track;
    }));
    // History is now automatic via useEffect with debounce
  }, []);

  // Realtime note creation during auto-playback
  const { isRealtimeMode, previewNotes } = useRealtimeNoteCreation({
    tracks,
    isAutoFollowPlayback: autoFollowPlayback,
    isPlaying,
    currentTime,
    audioDuration,
    waveformWidth: audioMetrics.waveformWidth,
    bpm,
    subRhythmSync,
    onCreateNote: handleCreateNote,
  });

  // Metronome
  useMetronome({
    bpm,
    isPlaying,
    enabled: metronomeEnabled,
    volume: metronomeVolume,
    currentTime,
  });

  const handleDeleteNote = (trackId: string, noteId: string) => {
    setTracks(tracks.map(track => {
      if (track.id === trackId) {
        return {
          ...track,
          notes: (track.notes || []).filter(note => note.id !== noteId)
        };
      }
      return track;
    }));
    // History is now automatic via useEffect with debounce
  };

  const handleDeleteNotes = (trackId: string, noteIds: string[]) => {
    setTracks(tracks.map(track => {
      if (track.id === trackId) {
        return {
          ...track,
          notes: (track.notes || []).filter(note => !noteIds.includes(note.id))
        };
      }
      return track;
    }));
    // History is now automatic via useEffect with debounce
  };

  const handleMoveNotes = (trackId: string, notePositions: { noteId: string; newGridPosition: number }[]) => {
    const cellWidth = 24;
    const trackWidth = audioMetrics.waveformWidth;

    setTracks(tracks.map(track => {
      if (track.id === trackId) {
        return {
          ...track,
          notes: (track.notes || []).map(note => {
            const newPos = notePositions.find(p => p.noteId === note.id);
            if (newPos) {
              // Recalculer startTime et duration
              const notePosition = newPos.newGridPosition * cellWidth;
              const noteWidth = note.gridWidth * cellWidth;
              const newStartTime = (notePosition / trackWidth) * audioDuration;
              const newDuration = note.gridWidth === 1 ? 0 : (noteWidth / trackWidth) * audioDuration;

              return {
                ...note,
                gridPosition: newPos.newGridPosition,
                startTime: newStartTime,
                duration: newDuration
              };
            }
            return note;
          })
        };
      }
      return track;
    }));

    // History is now automatic via useEffect with debounce
  };

  const handleResizeNote = (trackId: string, noteId: string, newGridWidth: number, newDuration: number) => {
    setTracks(tracks.map(track => {
      if (track.id === trackId) {
        return {
          ...track,
          notes: (track.notes || []).map(note => {
            if (note.id === noteId) {
              return {
                ...note,
                gridWidth: newGridWidth,
                duration: newDuration
              };
            }
            return note;
          })
        };
      }
      return track;
    }));

    // History is now automatic via useEffect with debounce
  };

  const handleGlobalMoveNotes = (offset: number) => {
    if (offset === 0) return;

    const cellWidth = 24;
    const trackWidth = audioMetrics.waveformWidth;

    setTracks(tracks.map(track => {
      return {
        ...track,
        notes: (track.notes || []).map(note => {
          const noteKey = `${track.id}:${note.id}`;
          if (selectedNotes.has(noteKey)) {
            const newPosition = Math.max(0, note.gridPosition + offset);
            const notePosition = newPosition * cellWidth;
            const noteWidth = note.gridWidth * cellWidth;
            const newStartTime = (notePosition / trackWidth) * audioDuration;
            const newDuration = note.gridWidth === 1 ? 0 : (noteWidth / trackWidth) * audioDuration;

            return {
              ...note,
              gridPosition: newPosition,
              startTime: newStartTime,
              duration: newDuration
            };
          }
          return note;
        })
      };
    }));

    // History is now automatic via useEffect with debounce
  };

  const handleAssignActionToNote = (trackId: string, noteId: string) => {
    setNoteToAssignAction({ trackId, noteId });
    setShowSelectActionDialog(true);
  };

  const handleAssignActionToSelectedNotes = () => {
    // Use a dummy note to open the selection dialog
    // The action will be applied to all selected notes
    setNoteToAssignAction({ trackId: 'selected', noteId: 'all' });
    setShowSelectActionDialog(true);
  };

  const handleSelectActionForNote = (action: SpecificAction | null) => {
    if (noteToAssignAction) {
      // Special case: apply to all selected notes
      if (noteToAssignAction.trackId === 'selected' && noteToAssignAction.noteId === 'all') {
        setTracks(tracks.map(track => {
          const notesInTrack = Array.from(selectedNotes)
            .filter(key => key.startsWith(`${track.id}:`))
            .map(key => key.split(':')[1]);

          if (notesInTrack.length > 0) {
            return {
              ...track,
              notes: track.notes?.map(note =>
                notesInTrack.includes(note.id)
                  ? {
                    ...note,
                    specificAction: action ? { name: action.name, icon: action.icon } : undefined
                  }
                  : note
              )
            };
          }
          return track;
        }));
      } else {
        // Normal case: apply to a single note
        setTracks(tracks.map(track => {
          if (track.id === noteToAssignAction.trackId) {
            return {
              ...track,
              notes: track.notes?.map(note =>
                note.id === noteToAssignAction.noteId
                  ? {
                    ...note,
                    specificAction: action ? { name: action.name, icon: action.icon } : undefined
                  }
                  : note
              )
            };
          }
          return track;
        }));
      }
      setShowSelectActionDialog(false);
      setNoteToAssignAction(null);
      // History is now automatic via useEffect with debounce
    }
  };

  // Selection Management
  const handleNoteClick = (trackId: string, noteId: string, ctrlKey: boolean) => {
    if (editorMode !== 'select') return;

    const noteKey = `${trackId}:${noteId}`;
    const newSelection = new Set(selectedNotes);

    if (ctrlKey) {
      // Ctrl+click: add/remove from selection
      if (newSelection.has(noteKey)) {
        newSelection.delete(noteKey);
      } else {
        newSelection.add(noteKey);
      }
    } else {
      // Simple click: select only this note
      newSelection.clear();
      newSelection.add(noteKey);
    }

    setSelectedNotes(newSelection);
  };

  const clearSelection = () => {
    // Push back selected notes that overlap before deselecting
    if (selectedNotes.size > 0) {
      const cellWidth = 24;
      const trackWidth = audioMetrics.waveformWidth;

      setTracks(tracks.map(track => {
        const selectedNotesInTrack = Array.from(selectedNotes)
          .filter(key => key.startsWith(`${track.id}:`))
          .map(key => key.split(':')[1]);

        if (selectedNotesInTrack.length === 0) return track;

        return {
          ...track,
          notes: track.notes?.map(note => {
            if (!selectedNotesInTrack.includes(note.id)) return note;

            // Vérifier si cette note chevauche une note non sélectionnée
            const overlappingNotes = track.notes?.filter(n => {
              if (selectedNotesInTrack.includes(n.id)) return false;
              const noteEnd = note.gridPosition + note.gridWidth;
              const otherEnd = n.gridPosition + n.gridWidth;
              return (note.gridPosition < otherEnd && noteEnd > n.gridPosition);
            }) || [];

            if (overlappingNotes.length === 0) return note;

            // Trouver le côté le plus proche pour repousser
            let bestPosition = note.gridPosition;
            let minDistance = Infinity;

            overlappingNotes.forEach(overlap => {
              // Essayer à gauche
              const leftPos = overlap.gridPosition - note.gridWidth;
              if (leftPos >= 0) {
                const distLeft = Math.abs(note.gridPosition - leftPos);
                if (distLeft < minDistance) {
                  minDistance = distLeft;
                  bestPosition = leftPos;
                }
              }

              // Essayer à droite
              const rightPos = overlap.gridPosition + overlap.gridWidth;
              const distRight = Math.abs(note.gridPosition - rightPos);
              if (distRight < minDistance) {
                minDistance = distRight;
                bestPosition = rightPos;
              }
            });

            // Recalculer les propriétés temporelles
            const notePosition = bestPosition * cellWidth;
            const noteWidth = note.gridWidth * cellWidth;
            const newStartTime = (notePosition / trackWidth) * audioDuration;
            const newDuration = note.gridWidth === 1 ? 0 : (noteWidth / trackWidth) * audioDuration;

            return {
              ...note,
              gridPosition: bestPosition,
              startTime: newStartTime,
              duration: newDuration
            };
          })
        };
      }));

      // Sauvegarder dans l'historique uniquement si les notes ont été modifiées
      if (hasModifiedSelectedNotes) {
        // History is now automatic via useEffect with debounce
        setHasModifiedSelectedNotes(false);
      }
    }

    setSelectedNotes(new Set());
  };

  const deleteSelectedNotes = () => {
    if (selectedNotes.size === 0) return;

    // Capturer les notes à supprimer immédiatement pour éviter les problèmes de closure
    const notesToDeleteByTrack = new Map<string, string[]>();

    Array.from(selectedNotes).forEach(noteKey => {
      const [trackId, noteId] = noteKey.split(':');
      if (!notesToDeleteByTrack.has(trackId)) {
        notesToDeleteByTrack.set(trackId, []);
      }
      notesToDeleteByTrack.get(trackId)!.push(noteId);
    });

    // Désélectionner immédiatement
    setSelectedNotes(new Set());

    // Supprimer les notes
    setTracks(tracks.map(track => {
      const notesToDelete = notesToDeleteByTrack.get(track.id);

      if (notesToDelete && notesToDelete.length > 0) {
        return {
          ...track,
          notes: (track.notes || []).filter(note => !notesToDelete.includes(note.id))
        };
      }
      return track;
    }));

    // History is now automatic via useEffect with debounce
  };

  const duplicateSelectedNotes = (notesSet?: Set<string>) => {
    // Utiliser le paramètre ou le state actuel
    const currentNotes = notesSet || selectedNotes;
    if (currentNotes.size === 0) return;

    // Capturer les notes sélectionnées immédiatement pour éviter les problèmes de closure
    const notesToDuplicate = Array.from(currentNotes);

    const cellWidth = 24;
    const trackWidth = audioMetrics.waveformWidth;

    // Trouver la position de fin la plus à droite parmi toutes les notes sélectionnées
    let maxEndPosition = 0;
    tracks.forEach(track => {
      const selectedNotesInTrack = notesToDuplicate
        .filter(key => key.startsWith(`${track.id}:`))
        .map(key => key.split(':')[1]);

      track.notes?.forEach(note => {
        if (selectedNotesInTrack.includes(note.id)) {
          const endPosition = note.gridPosition + note.gridWidth;
          if (endPosition > maxEndPosition) {
            maxEndPosition = endPosition;
          }
        }
      });
    });

    // Position de départ pour les duplicatas (1 cellule après la note la plus à droite)
    const duplicateStartPosition = maxEndPosition + 1;

    // Trouver la position minimale parmi les notes sélectionnées (pour calculer l'offset relatif)
    let minPosition = Infinity;
    tracks.forEach(track => {
      const selectedNotesInTrack = notesToDuplicate
        .filter(key => key.startsWith(`${track.id}:`))
        .map(key => key.split(':')[1]);

      track.notes?.forEach(note => {
        if (selectedNotesInTrack.includes(note.id)) {
          if (note.gridPosition < minPosition) {
            minPosition = note.gridPosition;
          }
        }
      });
    });

    const newSelectedNotes = new Set<string>();

    setTracks(tracks.map(track => {
      const selectedNotesInTrack = notesToDuplicate
        .filter(key => key.startsWith(`${track.id}:`))
        .map(key => key.split(':')[1]);

      if (selectedNotesInTrack.length === 0) return track;

      const duplicates: Note[] = [];

      track.notes?.forEach(note => {
        if (selectedNotesInTrack.includes(note.id)) {
          // Calculer l'offset relatif par rapport à la position minimale
          const relativeOffset = note.gridPosition - minPosition;
          const newPosition = duplicateStartPosition + relativeOffset;

          // Recalculer startTime et duration
          const notePosition = newPosition * cellWidth;
          const noteWidth = note.gridWidth * cellWidth;
          const newStartTime = (notePosition / trackWidth) * audioDuration;
          const newDuration = note.gridWidth === 1 ? 0 : (noteWidth / trackWidth) * audioDuration;

          const duplicateNote: Note = {
            ...note,
            id: crypto.randomUUID(),
            gridPosition: newPosition,
            startTime: newStartTime,
            duration: newDuration
          };

          duplicates.push(duplicateNote);
          newSelectedNotes.add(`${track.id}:${duplicateNote.id}`);
        }
      });

      return {
        ...track,
        notes: [...(track.notes || []), ...duplicates]
      };
    }));

    // Sélectionner les duplicatas
    setSelectedNotes(newSelectedNotes);
    // History is now automatic via useEffect with debounce
  };

  const handleDuplicate = (trackId: string, noteId: string) => {
    // Sélectionner uniquement cette note et la dupliquer
    const noteKey = `${trackId}:${noteId}`;
    setSelectedNotes(new Set([noteKey]));

    // Utiliser setTimeout pour permettre à l'état de se mettre à jour avant la duplication
    setTimeout(() => {
      duplicateSelectedNotes();
    }, 0);
  };

  const handleDuplicateSelected = () => {
    // Vérifier qu'il y a des notes sélectionnées
    if (selectedNotes.size === 0) return;

    // Capturer immédiatement l'état actuel pour éviter la perte lors de la fermeture du menu
    const notesToDuplicateNow = new Set(selectedNotes);

    // Exécuter la duplication de manière asynchrone pour éviter les conflits avec la fermeture du menu
    requestAnimationFrame(() => {
      duplicateSelectedNotes(notesToDuplicateNow);
    });
  };

  const mergeSelectedNotes = () => {
    if (selectedNotes.size === 0) return;

    const cellWidth = 24;
    const trackWidth = audioMetrics.waveformWidth;

    // Regrouper les notes sélectionnées par piste
    const notesByTrack = new Map<string, string[]>();
    Array.from(selectedNotes).forEach(noteKey => {
      const [trackId, noteId] = noteKey.split(':');
      if (!notesByTrack.has(trackId)) {
        notesByTrack.set(trackId, []);
      }
      notesByTrack.get(trackId)!.push(noteId);
    });

    // Désélectionner immédiatement
    setSelectedNotes(new Set());

    // Pour chaque piste, fusionner les notes sélectionnées
    setTracks(tracks.map(track => {
      const selectedNoteIds = notesByTrack.get(track.id);

      if (!selectedNoteIds || selectedNoteIds.length === 0) {
        return track;
      }

      // Ne fusionner que s'il y a au moins 2 notes
      if (selectedNoteIds.length < 2) {
        return track;
      }

      // Récupérer les notes sélectionnées
      const selectedNotesInTrack = (track.notes || []).filter(note =>
        selectedNoteIds.includes(note.id)
      );

      // Trouver la note avec le plus petit startTime
      const firstNote = selectedNotesInTrack.reduce((min, note) =>
        note.startTime < min.startTime ? note : min
      );

      // Trouver la note avec le plus grand temps de fin (startTime + duration)
      const lastNote = selectedNotesInTrack.reduce((max, note) => {
        const noteEnd = note.startTime + note.duration;
        const maxEnd = max.startTime + max.duration;
        return noteEnd > maxEnd ? note : max;
      });

      // Calculer les propriétés de la note fusionnée
      const mergedStartTime = firstNote.startTime;
      const mergedEndTime = lastNote.startTime + lastNote.duration;
      const mergedDuration = mergedEndTime - mergedStartTime;

      // Calculer gridPosition et gridWidth
      const mergedGridPosition = firstNote.gridPosition;
      const lastNoteEndPosition = lastNote.gridPosition + lastNote.gridWidth;
      const mergedGridWidth = lastNoteEndPosition - mergedGridPosition;

      // Créer la note fusionnée (garder les propriétés de la première note sauf les dimensions)
      const mergedNote = {
        ...firstNote,
        id: crypto.randomUUID(),
        startTime: mergedStartTime,
        duration: mergedDuration,
        gridPosition: mergedGridPosition,
        gridWidth: mergedGridWidth,
      };

      // Supprimer TOUTES les notes qui se trouvent entre la première et la dernière note
      // (y compris les notes non sélectionnées)
      const remainingNotes = (track.notes || []).filter(note => {
        // Si c'est une note sélectionnée, la supprimer
        if (selectedNoteIds.includes(note.id)) {
          return false;
        }

        // Sinon, vérifier si la note se trouve dans l'intervalle de fusion
        const noteStart = note.startTime;
        const noteEnd = note.startTime + note.duration;

        // Supprimer si la note commence entre mergedStartTime et mergedEndTime
        // OU si la note se chevauche avec l'intervalle de fusion
        const isInMergeRange = (
          (noteStart >= mergedStartTime && noteStart < mergedEndTime) ||
          (noteEnd > mergedStartTime && noteEnd <= mergedEndTime) ||
          (noteStart <= mergedStartTime && noteEnd >= mergedEndTime)
        );

        return !isInMergeRange; // Garder la note seulement si elle n'est PAS dans l'intervalle
      });

      return {
        ...track,
        notes: [...remainingNotes, mergedNote]
      };
    }));

    // History is now automatic via useEffect with debounce
  };

  // Copy/Paste handlers
  const handleCopy = useCallback(() => {
    if (selectedNotes.size === 0) return;

    const notesToCopy: { trackId: string; notes: Note[] }[] = [];

    tracks.forEach(track => {
      const trackNotes: Note[] = [];
      track.notes?.forEach(note => {
        const noteKey = `${track.id}:${note.id}`;
        if (selectedNotes.has(noteKey)) {
          trackNotes.push({ ...note });
        }
      });

      if (trackNotes.length > 0) {
        notesToCopy.push({ trackId: track.id, notes: trackNotes });
      }
    });

    setCopiedNotes(notesToCopy);
    toast.success(t("clipboard.copied", { count: selectedNotes.size.toString() }));
  }, [selectedNotes, tracks, t]);

  const handleCut = useCallback(() => {
    if (selectedNotes.size === 0) return;

    handleCopy();
    deleteSelectedNotes();
    toast.success(t("clipboard.cut", { count: selectedNotes.size.toString() }));
  }, [selectedNotes, handleCopy]);

  const handlePaste = useCallback(() => {
    if (copiedNotes.length === 0) {
      toast.error(t("clipboard.nothingToPaste"));
      return;
    }

    if (!mouseGridPosition) {
      toast.error(t("clipboard.noPosition"));
      return;
    }

    const cellWidth = 24;
    const trackWidth = audioMetrics.waveformWidth;
    let totalPasted = 0;

    // Trouver la position minimale parmi toutes les notes copiées
    let minPosition = Infinity;
    copiedNotes.forEach(({ notes }) => {
      notes.forEach(note => {
        if (note.gridPosition < minPosition) {
          minPosition = note.gridPosition;
        }
      });
    });

    // Calculer l'offset pour coller à la position de la souris
    const offset = mouseGridPosition.cellPosition - minPosition;

    setTracks(tracks.map(track => {
      const copiedTrack = copiedNotes.find(ct => ct.trackId === track.id);
      if (!copiedTrack) return track;

      const newNotes = copiedTrack.notes.map(note => {
        const newGridPosition = note.gridPosition + offset;
        const notePosition = newGridPosition * cellWidth;
        const noteWidth = note.gridWidth * cellWidth;
        const newStartTime = (notePosition / trackWidth) * audioDuration;
        const newDuration = note.gridWidth === 1 ? 0 : (noteWidth / trackWidth) * audioDuration;

        totalPasted++;
        return {
          ...note,
          id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          gridPosition: newGridPosition,
          startTime: newStartTime,
          duration: newDuration
        };
      });

      return {
        ...track,
        notes: [...(track.notes || []), ...newNotes]
      };
    }));

    toast.success(t("clipboard.pasted", { count: totalPasted.toString() }));
    // History is now automatic via useEffect with debounce
  }, [copiedNotes, mouseGridPosition, tracks, audioMetrics.waveformWidth, startOffset, audioDuration, t]);

  // BPM Detection handler
  const handleDetectBPM = async () => {
    if (!musicFilePath) {
      toast.error(t("audio.noAudioLoaded"));
      return;
    }

    setIsDetectingBPM(true);
    try {
      const { detectBPM } = await import('@/utils/bpmDetector');
      const detectedBPM = await detectBPM(musicFilePath);
      setBpm(detectedBPM);
      toast.success(t("audio.bpmDetected", { bpm: detectedBPM.toString() }));
      // History is now automatic via useEffect with debounce
    } catch (error) {
      console.error('Erreur détection BPM:', error);
      toast.error(t("audio.bpmDetectionError"));
    } finally {
      setIsDetectingBPM(false);
    }
  };

  // Mode change handler
  const handleModeChange = (mode: 'edit' | 'select') => {
    // Si on passe en mode Edit, désélectionner toutes les notes
    if (mode === 'edit' && selectedNotes.size > 0) {
      // Sauvegarder si les notes ont été modifiées
      if (hasModifiedSelectedNotes) {
        // History is now automatic via useEffect with debounce
        setHasModifiedSelectedNotes(false);
      }
      setSelectedNotes(new Set());
    }
    setEditorMode(mode);
  };

  // Global drag handlers
  const handleStartDrag = (cellPosition: number, clickOffsetInCells: number) => {
    setIsDraggingNotes(true);
    setDragStartCell(cellPosition);
    setDragClickOffset(clickOffsetInCells); // Mémoriser où l'utilisateur a cliqué
    setDragOffset(0);
  };

  const handleDragMove = (cellPosition: number) => {
    if (isDraggingNotes) {
      // Ajuster l'offset en fonction de l'endroit où l'utilisateur a cliqué dans la note
      const offset = cellPosition - dragStartCell - dragClickOffset;
      setDragOffset(offset);
    }
  };

  const handleDragEnd = () => {
    if (isDraggingNotes && dragOffset !== 0) {
      handleGlobalMoveNotes(dragOffset);
    }
    setIsDraggingNotes(false);
    setDragClickOffset(0);
    setDragOffset(0);
  };

  const handleGridMouseMove = (trackId: string, cellPosition: number) => {
    setMouseGridPosition({ trackId, cellPosition });
  };

  // Keyboard shortcuts for copy/paste and duplication
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Ctrl+C : copier les notes sélectionnées
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && editorMode === 'select' && selectedNotes.size > 0 && !isTyping) {
        e.preventDefault();
        handleCopy();
      }

      // Ctrl+X : couper les notes sélectionnées
      if ((e.ctrlKey || e.metaKey) && e.key === 'x' && editorMode === 'select' && selectedNotes.size > 0 && !isTyping) {
        e.preventDefault();
        handleCut();
      }

      // Ctrl+V : coller les notes copiées
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && editorMode === 'select' && !isTyping) {
        e.preventDefault();
        handlePaste();
      }

      // Ctrl+D : dupliquer les notes sélectionnées
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && editorMode === 'select' && selectedNotes.size > 0 && !isTyping) {
        e.preventDefault();
        duplicateSelectedNotes();
      }

      // F : fusionner les notes sélectionnées
      if (e.key === 'f' && editorMode === 'select' && selectedNotes.size >= 2 && !isTyping && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        mergeSelectedNotes();
      }

      // Raccourcis audio
      if (!isTyping) {
        // Space : Play/Pause
        if (matchesShortcut('playPause', e)) {
          e.preventDefault();
          audioPlayerRef.current?.togglePlay();
        }

        // Escape : Stop
        if (matchesShortcut('stop', e)) {
          e.preventDefault();
          audioPlayerRef.current?.stop();
        }

        // ArrowLeft : Reculer de 5s
        if (matchesShortcut('seekBackward', e) && editorMode !== 'select') {
          e.preventDefault();
          audioPlayerRef.current?.seekBackward(5);
        }

        // ArrowRight : Avancer de 5s
        if (matchesShortcut('seekForward', e) && editorMode !== 'select') {
          e.preventDefault();
          audioPlayerRef.current?.seekForward(5);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editorMode, selectedNotes, handleCopy, handleCut, handlePaste, duplicateSelectedNotes, mergeSelectedNotes, matchesShortcut]);

  // Lasso Selection Handler - MouseUp (défini avant le useEffect qui l'utilise)
  const handleLassoMouseUp = useCallback(() => {
    if (!isLassoActive || !lassoStart || !lassoEnd) return;

    // Calculer le rectangle de sélection en coordonnées relatives
    const minX = Math.min(lassoStart.x, lassoEnd.x);
    const maxX = Math.max(lassoStart.x, lassoEnd.x);
    const minY = Math.min(lassoStart.y, lassoEnd.y);
    const maxY = Math.max(lassoStart.y, lassoEnd.y);

    // Rectangle du lasso trop petit ? Pas de sélection (c'est un clic simple)
    if (maxX - minX < 5 && maxY - minY < 5) {
      // Clic simple sur zone vide sans Ctrl : désélectionner tout
      if (!lassoWithCtrl) {
        clearSelection();
      }
      setIsLassoActive(false);
      setLassoStart(null);
      setLassoEnd(null);
      setLassoWithCtrl(false);
      lassoContainerRef.current = null;
      return;
    }

    const notesInLasso = new Set<string>();

    // Obtenir le conteneur pour conversion des coordonnées
    const container = document.querySelector('[data-lasso-container]');
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const scrollLeft = (container as HTMLElement).scrollLeft;
    const scrollTop = (container as HTMLElement).scrollTop;

    // Détecter les notes dans le lasso
    const noteElements = document.querySelectorAll('[data-note-block]');

    noteElements.forEach((element) => {
      const rect = element.getBoundingClientRect();

      // Convertir les positions viewport des notes en coordonnées relatives au conteneur
      const noteLeft = rect.left - containerRect.left + scrollLeft;
      const noteRight = rect.right - containerRect.left + scrollLeft;
      const noteTop = rect.top - containerRect.top + scrollTop;
      const noteBottom = rect.bottom - containerRect.top + scrollTop;

      // Vérifier si la note intersecte le rectangle de lasso
      const intersects = !(noteRight < minX || noteLeft > maxX || noteBottom < minY || noteTop > maxY);

      if (intersects) {
        // Extraire trackId et noteId des attributs data
        const noteData = element.getAttribute('data-note-id');
        if (noteData) {
          notesInLasso.add(noteData);
        }
      }
    });

    // Si Ctrl était pressé, ajouter à la sélection existante
    if (lassoWithCtrl) {
      const combinedSelection = new Set([...selectedNotes, ...notesInLasso]);
      setSelectedNotes(combinedSelection);
    } else {
      setSelectedNotes(notesInLasso);
    }

    setIsLassoActive(false);
    setLassoStart(null);
    setLassoEnd(null);
    setLassoWithCtrl(false);
    lassoContainerRef.current = null;
  }, [isLassoActive, lassoStart, lassoEnd, lassoWithCtrl, selectedNotes]);

  // Lasso global mouse events
  useEffect(() => {
    if (!isLassoActive || !lassoContainerRef.current) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!lassoContainerRef.current) return;

      const container = lassoContainerRef.current;
      const rect = container.getBoundingClientRect();
      const relativeX = e.clientX - rect.left + container.scrollLeft;
      const relativeY = e.clientY - rect.top + container.scrollTop;

      setLassoEnd({ x: relativeX, y: relativeY });
    };

    const handleGlobalMouseUp = () => {
      handleLassoMouseUp();
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isLassoActive, handleLassoMouseUp]);

  // Lasso Selection Handlers
  const handleLassoMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (editorMode !== 'select' || e.button !== 0) return;

    // Ignorer si un menu contextuel est ouvert
    if (isContextMenuOpen) return;

    // Ignorer si on clique sur une note (elle gérera son propre clic)
    const target = e.target as HTMLElement;
    if (target.closest('[data-note-block]')) return;

    const isCtrlPressed = e.ctrlKey || e.metaKey;
    setLassoWithCtrl(isCtrlPressed);

    // Si Ctrl n'est pas pressé, désélectionner tout avant de commencer le lasso
    if (!isCtrlPressed) {
      clearSelection();
    }

    // Stocker la référence au conteneur
    lassoContainerRef.current = e.currentTarget;

    // Obtenir les coordonnées relatives au conteneur
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const relativeX = e.clientX - rect.left + container.scrollLeft;
    const relativeY = e.clientY - rect.top + container.scrollTop;

    setLassoStart({ x: relativeX, y: relativeY });
    setLassoEnd({ x: relativeX, y: relativeY });
    setIsLassoActive(true);
  };

  const handleLassoMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isLassoActive || !lassoStart || !lassoContainerRef.current) return;

    // Obtenir les coordonnées relatives au conteneur
    const container = lassoContainerRef.current;
    const rect = container.getBoundingClientRect();
    const relativeX = e.clientX - rect.left + container.scrollLeft;
    const relativeY = e.clientY - rect.top + container.scrollTop;

    setLassoEnd({ x: relativeX, y: relativeY });
  };

  const handleExportJson = async () => {
    if (project) {
      try {
        if (lastExportPath) {
          // Exporter vers le chemin existant
          const result = await exportToJsonFile(bpm, tracks, trackGroups, project.name, audioDuration, lastExportPath);
          if (result.success) {
            toast.success(t("editor.exportSuccess", { count: String(result.count), path: lastExportPath }), {
              action: {
                label: t("editor.openExportFolder") || "Ouvrir le dossier",
                onClick: () => handleOpenExportFolder(lastExportPath)
              }
            });
          } else {
            toast.error(t("editor.exportError"));
          }
        } else {
          // Première export - demander le chemin
          const result = await exportToJsonFile(bpm, tracks, trackGroups, project.name, audioDuration);
          if (result.success && result.filePath) {
            setLastExportPath(result.filePath);
            toast.success(t("editor.exportSuccess", { count: String(result.count), path: result.filePath }), {
              action: {
                label: t("editor.openExportFolder") || "Ouvrir le dossier",
                onClick: () => handleOpenExportFolder(result.filePath!)
              }
            });
          } else if (!result.success && result.count > 0) {
            toast.info(t("editor.exportCancelled"));
          } else {
            toast.error(t("editor.exportError"));
          }
        }
      } catch (error) {
        console.error("Erreur lors de l'export:", error);
        toast.error(t("editor.exportError"));
      }
    }
  };

  const handleOpenProjectFolder = async () => {
    if (project?.filePath) {
      try {
        const folderPath = await dirname(project.filePath);

        // Ouvrir le dossier via la commande Tauri personnalisée
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('open_folder', { folderPath });

        toast.success(t("project.folderOpened") || "Dossier ouvert");
      } catch (error) {
        console.error("Error opening project folder:", error);
        toast.error(t("project.folderOpenError") || "Erreur lors de l'ouverture du dossier");
      }
    } else {
      toast.error(t("project.noProjectPath") || "Aucun chemin de projet disponible");
    }
  };

  const handleOpenExportFolder = async (filePath: string) => {
    try {
      const folderPath = await dirname(filePath);
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('open_folder', { folderPath });
    } catch (error) {
      console.error("Error opening export folder:", error);
      toast.error(t("project.folderOpenError") || "Erreur lors de l'ouverture du dossier");
    }
  };

  const handleExportJsonAs = async () => {
    if (project) {
      try {
        const result = await exportToJsonFile(bpm, tracks, trackGroups, project.name, audioDuration);
        if (result.success && result.filePath) {
          setLastExportPath(result.filePath);
          toast.success(t("editor.exportSuccess", { count: String(result.count), path: result.filePath }), {
            action: {
              label: t("editor.openExportFolder") || "Ouvrir le dossier",
              onClick: () => handleOpenExportFolder(result.filePath!)
            }
          });
        } else if (!result.success && result.count > 0) {
          toast.info(t("editor.exportCancelled"));
        } else {
          toast.error(t("editor.exportError"));
        }
      } catch (error) {
        console.error("Erreur lors de l'export:", error);
        toast.error(t("editor.exportError"));
      }
    }
  };

  if (!project) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full gradient-primary">
            <Music className="h-8 w-8 text-primary-foreground animate-pulse" />
          </div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden">
      {/* Header */}
      <header className="border-b border-border backdrop-blur-md relative z-50" style={{ backgroundColor: panelColors.background() }}>
        <div className="w-full px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left side - Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-primary p-0.5">
                <div className="w-full h-full bg-background rounded-md overflow-hidden flex items-center justify-center">
                  <img src="/logo.png" alt="RhythmNator Logo" className="w-8 h-8 object-cover" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold leading-tight" style={{ fontFamily: 'Audiowide, sans-serif' }}>RhythmNator Editor</h1>
                <p className="text-xs text-muted-foreground">{project?.name}</p>
              </div>
            </div>

            {/* Right side - All buttons */}
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-lg">
                      <Home className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{t("editor.backToProjectsTooltip")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleOpenProjectFolder}
                      className="rounded-lg"
                      disabled={!project?.filePath}
                    >
                      <FolderOpen className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{t("editor.openProjectFolderTooltip") || "Ouvrir le dossier du projet"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Separator orientation="vertical" className="h-8" />

              <DropdownMenu>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`rounded-lg transition-opacity ${!hasUnsavedChanges ? 'opacity-40 cursor-not-allowed' : ''}`}
                          disabled={!hasUnsavedChanges}
                        >
                          <Save className={`h-5 w-5 ${hasUnsavedChanges ? 'text-primary' : 'text-muted-foreground'}`} />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{hasUnsavedChanges ? t("editor.saveTooltip") : t("editor.noChangesToSave")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleSave} disabled={!hasUnsavedChanges}>
                    {t("actions.save")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSaveAs}>
                    {t("actions.saveAs")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-lg"
                        >
                          <Download className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{t("editor.exportTooltip")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportJson}>
                    {t("actions.export")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportJsonAs}>
                    {t("actions.exportAs")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* History controls group */}
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: panelColors.sectionBackground() }}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md"
                        onClick={handleUndo}
                        disabled={historyIndex <= 0}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{t("actions.undo")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md"
                        onClick={handleRedo}
                        disabled={historyIndex >= history.length - 1}
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{t("actions.redo")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg"
                      onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                    >
                      {isSidebarVisible ? (
                        <PanelLeftClose className="h-5 w-5" />
                      ) : (
                        <PanelLeftOpen className="h-5 w-5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{t("editor.toggleSidebarTooltip")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </header>

      {/* Main Editor Layout */}
      <div className="flex flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Center Editor Area */}
          <ResizablePanel defaultSize={75} minSize={50} maxSize={80}>
            <div className="flex flex-col h-full">
              {/* Waveform Area - Zone de travail avec scroll horizontal */}
              <div ref={scrollContainerRef} className="flex-1 p-6 overflow-x-auto overflow-y-auto">
                {/* Conteneur interne avec largeur dynamique */}
                <div
                  data-lasso-container
                  style={{ width: `${audioMetrics.waveformWidth}px`, minWidth: '100%' }}
                  className="relative"
                  onMouseDown={handleLassoMouseDown}
                  onMouseMove={handleLassoMouseMove}
                >
                  {/* Ligne de lecture synchronisée */}
                  {audioUrl && audioDuration > 0 && (
                    <PlayheadLine
                      currentTime={dragSeekTime ?? currentTime}
                      audioDuration={audioDuration}
                      waveformWidth={audioMetrics.waveformWidth}
                      startOffset={startOffset}
                      bpm={bpm}
                      subRhythmSync={subRhythmSync}
                    />
                  )}

                  {/* Lasso Selection */}
                  {isLassoActive && lassoStart && lassoEnd && (
                    <LassoSelection startPoint={lassoStart} endPoint={lassoEnd} />
                  )}

                  <div className="space-y-6">
                    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pb-4">
                      <div className="sticky left-0 h-[32px] w-fit px-4 py-1 flex items-center mb-3 rounded-lg border border-border/30" style={{ backgroundColor: panelColors.sectionBackground() }}>
                        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">{t("editor.waveform")}</h2>
                      </div>
                      <Waveform
                        audioUrl={audioUrl}
                        currentTime={currentTime}
                        isPlaying={isPlaying}
                        onDragSeek={setDragSeekTime}
                        onSeek={(time) => {
                          setSeekTime(time);
                          setDragSeekTime(null);
                        }}
                        width={audioMetrics.waveformWidth}
                      />
                    </div>

                    {/* Système de pistes */}
                    <div className="space-y-4">
                      <div className="sticky left-0 h-[32px] w-fit px-4 py-1 flex items-center mb-3 rounded-lg border border-border/30" style={{ backgroundColor: panelColors.sectionBackground() }}>
                        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">{t("track.title")}</h2>
                      </div>

                      {displayedTracks.length > 0 ? (
                        <div className="space-y-2">
                          {displayedTracks.map(track => {
                            const trackGroup = track.groupId
                              ? trackGroups.find(g => g.id === track.groupId)
                              : undefined;

                            // Trouver la preview note pour cette piste
                            const trackPreviewNote = previewNotes.find(pn => pn.trackId === track.id);

                            return (
                              <TrackRow
                                key={track.id}
                                track={track}
                                trackGroup={trackGroup}
                                audioMetrics={audioMetrics}
                                rhythmSync={rhythmSync}
                                subRhythmSync={subRhythmSync}
                                startOffset={startOffset}
                                bpm={bpm}
                                musicDuration={audioDuration}
                                currentTime={currentTime}
                                editorMode={editorMode}
                                selectedNotes={selectedNotes}
                                overlappingNotes={overlappingNotes}
                                scrollContainerRef={scrollContainerRef}
                                onEdit={() => {
                                  setEditingTrack(track);
                                  setShowEditTrackDialog(true);
                                }}
                                onToggleVisibility={() => handleToggleTrackVisibility(track.id)}
                                onDelete={() => setTrackToDelete(track)}
                                onAssignToGroup={() => {
                                  setTrackToAssign(track);
                                  setShowAssignGroupDialog(true);
                                }}
                                onCreateNote={handleCreateNote}
                                onDeleteNote={handleDeleteNote}
                                onDeleteNotes={handleDeleteNotes}
                                onMoveNotes={handleMoveNotes}
                                onResizeNote={handleResizeNote}
                                onDeleteSelected={deleteSelectedNotes}
                                onDuplicate={handleDuplicate}
                                onDuplicateSelected={handleDuplicateSelected}
                                onMergeSelected={mergeSelectedNotes}
                                onCopy={handleCopy}
                                onCut={handleCut}
                                onPaste={handlePaste}
                                onAssignActionToNote={handleAssignActionToNote}
                                onAssignActionToSelected={handleAssignActionToSelectedNotes}
                                onNoteClick={handleNoteClick}
                                onContextMenuOpenChange={setIsContextMenuOpen}
                                isDraggingNotes={isDraggingNotes}
                                dragOffset={dragOffset}
                                onStartDrag={handleStartDrag}
                                onDragMove={handleDragMove}
                                onDragEnd={handleDragEnd}
                                onGridMouseMove={handleGridMouseMove}
                                hasCopiedNotes={copiedNotes.length > 0}
                                previewNote={trackPreviewNote}
                                showMouseIndicator={showMouseIndicator}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div className="min-h-[200px] rounded-lg border-2 border-dashed border-border bg-secondary/10 flex items-center justify-center">
                          <div className="text-center text-muted-foreground">
                            <Music className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>{t("editor.noTracks")}</p>
                            <p className="text-sm">{t("editor.noTracksDescription")}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Audio Player */}
              <AudioPlayer
                ref={audioPlayerRef}
                audioUrl={audioUrl}
                volume={volume}
                pitch={pitch}
                onTimeUpdate={setCurrentTime}
                onPlayStateChange={setIsPlaying}
                externalSeek={seekTime}
                onDurationChange={setAudioDuration}
                autoFollowPlayback={autoFollowPlayback}
                onAutoFollowChange={setAutoFollowPlayback}
                onResetScroll={handleResetScroll}
                scrollPosition={scrollPosition}
              />
            </div>
          </ResizablePanel>

          {isSidebarVisible && <ResizableHandle withHandle />}

          {/* Right Panel */}
          {isSidebarVisible && (
            <ResizablePanel defaultSize={20} minSize={20} maxSize={35}>
              <div className="h-full overflow-y-auto">
                <TracksPanel
                  onCreateTrack={() => {
                    if (audioDuration === 0) {
                      toast.error(t("track.noMusicError"));
                    } else {
                      setShowCreateTrackDialog(true);
                    }
                  }}
                  editorMode={editorMode}
                  onModeChange={handleModeChange}
                  groups={trackGroups}
                  tracks={tracks}
                  specificActions={specificActions}
                  onCreateGroup={handleCreateGroup}
                  onUpdateGroup={handleUpdateGroup}
                  onDeleteGroup={handleDeleteGroup}
                  onCreateAction={handleCreateAction}
                  onEditAction={handleEditAction}
                  onDeleteAction={handleDeleteAction}
                />
                <AudioPanel
                  audioFile={audioFileName || project.musicFileName || t("audio.noAudio")}
                  bpm={bpm}
                  setBpm={(value) => {
                    setBpm(value);
                    // History is now automatic via useEffect with debounce
                  }}
                  rhythmSync={rhythmSync}
                  setRhythmSync={(value) => {
                    setRhythmSync(value);
                    // History is now automatic via useEffect with debounce
                  }}
                  subRhythmSync={subRhythmSync}
                  setSubRhythmSync={(value) => {
                    setSubRhythmSync(value);
                    // History is now automatic via useEffect with debounce
                  }}
                  volume={volume}
                  setVolume={(value) => {
                    setVolume(value);
                    // History is now automatic via useEffect with debounce
                  }}
                  pitch={pitch}
                  setPitch={(value) => {
                    setPitch(value);
                    // History is now automatic via useEffect with debounce
                  }}
                  startOffset={startOffset}
                  setStartOffset={(value) => {
                    setStartOffset(value);
                    // History is now automatic via useEffect with debounce
                  }}
                  onLoadAudio={handleLoadAudio}
                  showMouseIndicator={showMouseIndicator}
                  setShowMouseIndicator={setShowMouseIndicator}
                />
              </div>
            </ResizablePanel>
          )}
        </ResizablePanelGroup>
      </div>

      {/* Dialogs */}
      <CreateTrackDialog
        open={showCreateTrackDialog}
        onOpenChange={setShowCreateTrackDialog}
        onCreate={handleCreateTrack}
        existingTrackNames={tracks.map(t => t.name)}
        usedKeys={usedKeys}
      />

      <EditTrackDialog
        open={showEditTrackDialog}
        onOpenChange={setShowEditTrackDialog}
        onEdit={(name, color, assignedKey) => {
          if (editingTrack) {
            handleEditTrack(editingTrack.id, name, color, assignedKey);
          }
        }}
        track={editingTrack}
        existingTrackNames={tracks.map(t => t.name)}
        usedKeys={usedKeys}
      />

      <AlertDialog open={!!trackToDelete} onOpenChange={() => setTrackToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la piste ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la piste "{trackToDelete?.name}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => trackToDelete && handleDeleteTrack(trackToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CopyMusicDialog
        open={showCopyMusicDialog}
        onOpenChange={setShowCopyMusicDialog}
        musicFileName={pendingMusicFileName || ""}
        onConfirm={handleConfirmCopyMusic}
        onDecline={handleDeclineCopyMusic}
      />

      <UnsavedChangesDialog
        open={showUnsavedChangesDialog}
        onConfirm={handleConfirmQuit}
        onCancel={handleCancelQuit}
        onSaveAndQuit={handleSaveAndQuit}
      />

      <ShortcutsDialog
        open={isShortcutsDialogOpen}
        onOpenChange={setIsShortcutsDialogOpen}
      />

      <AlertDialog open={showMissingMusicDialog} onOpenChange={setShowMissingMusicDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("audio.missingMusicTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("audio.missingMusicDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowMissingMusicDialog(false)}>
              {t("actions.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowMissingMusicDialog(false);
              handleLoadAudio();
            }}>
              {t("audio.reloadMusic")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showChangeMusicWarning} onOpenChange={setShowChangeMusicWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("audio.changeMusicTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("audio.changeMusicWarning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <Checkbox
              id="dont-show-warning"
              checked={dontShowMusicWarning}
              onCheckedChange={(checked) => setDontShowMusicWarning(checked === true)}
            />
            <Label
              htmlFor="dont-show-warning"
              className="text-sm font-normal cursor-pointer"
            >
              {t("audio.dontShowAgain")}
            </Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelChangeMusic}>
              {t("actions.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmChangeMusic}>
              {t("actions.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AssignTrackToGroupDialog
        open={showAssignGroupDialog}
        onOpenChange={setShowAssignGroupDialog}
        groups={trackGroups}
        currentGroupId={trackToAssign?.groupId}
        trackName={trackToAssign?.name || ""}
        onAssign={(groupId) => {
          if (trackToAssign) {
            handleAssignTrackToGroup(trackToAssign.id, groupId);
          }
          setShowAssignGroupDialog(false);
          setTrackToAssign(null);
        }}
      />

      <SelectActionDialog
        open={showSelectActionDialog}
        onOpenChange={setShowSelectActionDialog}
        actions={specificActions}
        currentActionName={
          noteToAssignAction
            ? tracks
              .find((t) => t.id === noteToAssignAction.trackId)
              ?.notes?.find((n) => n.id === noteToAssignAction.noteId)?.specificAction?.name
            : undefined
        }
        onSelect={handleSelectActionForNote}
      />
    </div>
  );
};

export default Editor;
