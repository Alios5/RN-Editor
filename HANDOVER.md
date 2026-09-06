# RN-Editor — Handover Document

> **Purpose** : Allow any AI (or developer) to resume work on this project without losing context.
> **Last updated** : 2026-07-19
> **Stack** : React 18 + TypeScript + Vite · Tauri 2 (desktop) · TailwindCSS + shadcn/ui · Radix UI · lucide-react

---

## 1. Project Overview

**RhythmNator Editor** (`RN-Editor`) is a **desktop rhythm-game beatmap editor** built with Tauri + React.

The editor lets users:
- Create/edit projects (`.rne` files — custom JSON)
- Define **tracks** (lanes), assign notes with timing and duration
- Load an audio file and edit notes in sync
- Export a JSON beatmap consumed by the rhythm game engine
- Use an AI-powered **Beat Mapper** to auto-generate notes from audio

Key concepts:
| Term | Meaning |
|---|---|
| **Project** | `.rne` file containing tracks, notes, BPM, audio path, groups, actions |
| **Track** | A lane in the editor (e.g. "Top", "Right") — has `id`, `name`, `color`, `notes[]` |
| **Note** | `startTime` + `duration` (seconds) + `gridPosition` / `gridWidth` |
| **TrackGroup** | Optional grouping of tracks (collapse/hide) |
| **SpecificAction** | Named + icon action that can be linked to a note |
| **Beat Mapper** | Modal that decomposes audio → detects beats → generates notes |

---

## 2. Folder Structure

```
src/
├── beatMapper/          ← Audio analysis pipeline (all TypeScript, no external AI)
│   ├── audioAnalyzer.ts     FFT + RMS + spectral flux (Cooley-Tukey O(N log N))
│   ├── beatDetector.ts      BPM, phase alignment, onset detection, grid quantisation
│   ├── sectionDetector.ts   Section segmentation (intro/verse/chorus/drop/bridge/outro)
│   ├── stemSeparator.ts     Frequency-band stem separation via BiquadFilters
│   ├── patternEngine.ts     Note generation: patterns, chords, measure-awareness
│   ├── difficultyFilter.ts  Filters notes by difficulty + metrical priority
│   └── beatMapExporter.ts   Converts LaneNote[] → AIImportData
├── components/
│   └── BeatMapperModal.tsx  ← Main modal (2-step flow: Decompose → Analyse)
├── pages/
│   └── Editor.tsx           ← Main editor page (3100+ lines)
├── types/
│   ├── aiImport.ts          AIImportData, AIImportNote, AIImportSettings
│   ├── project.ts           Project interface
│   ├── track.ts             Track interface
│   ├── note.ts              Note interface
│   └── ...
├── utils/
│   └── applyAIImport.ts     Applies AIImportData to current editor state
└── locales/
    ├── en.json
    └── fr.json
```

---

## 3. Core Data Types

```typescript
// src/types/note.ts
interface Note {
  id: string;
  trackId: string;
  trackName: string;
  startTime: number;   // seconds
  duration: number;    // seconds (0 = tap, >0 = hold)
  gridPosition: number;
  gridWidth: number;
  specificAction?: NoteAction;
}

// src/types/track.ts
interface Track {
  id: string; name: string; color: string; visible: boolean; order: number;
  createdAt: string; notes?: Note[]; groupId?: string; assignedKey?: string;
}

// src/types/aiImport.ts — what the Beat Mapper produces
interface AIImportData {
  addTracks?: { name: string; color?: string; groupName?: string }[];
  addNotes?:  { trackName: string; startTime: number; duration?: number; action?: string }[];
  updateSettings?: { bpm?: number; rhythmSync?: number; subRhythmSync?: number; volume?: number; pitch?: number; startOffset?: number };
}
```

---

## 4. Beat Mapper Pipeline

### 4.1 Flow overview

```
Modal open
  └─ Phase "initial" : show project info + button "Décomposer la musique"

[User clicks Decompose]
  └─ Phase "decomposing"
       1. fetch(audioUrl) → arrayBuffer
       2. audioAnalyzer.analyzeAudio()   → AudioAnalysisResult (RMS frames, spectral flux)
       3. stemSeparator.separateStems()  → StemData[4] (drums, bass, vocals, other)
       → Phase "decomposed" : show stems with mini-waveforms + playback controls

[User adjusts stem toggles, listens]
  └─ Phase "analyzing" (triggered by "Générer les notes" button)
       4. beatDetector.detectBeats()     → BeatDetectionResult (bpm, beats, quantizedOnsets, beatPhaseOffset)
       5. sectionDetector.detectSections() → Section[]
       6. patternEngine.generateNotes()  → LaneNote[]
       7. difficultyFilter.filterByDifficulty() → LaneNote[]
       → Phase "done" : show canvas waveform, section list, note count

[User clicks Appliquer]
  └─ exportBeatMap() → AIImportData
     onApply(data, clearExisting) → Editor.tsx applies notes
```

### 4.2 Module details

#### `audioAnalyzer.ts`
- `FRAME_SIZE = HOP_SIZE = 2048` → ~46ms resolution at 44100Hz
- Hann-windowed in-place Cooley-Tukey FFT
- Outputs: `rmsFrames`, `spectralFluxFrames`, `audioBuffer`, `framesPerSecond`
- Entry: `analyzeAudio(file, onProgress?): Promise<AudioAnalysisResult>`

#### `beatDetector.ts` _(recently refactored with BeatLearning-inspired improvements)_

Key exports:
```typescript
interface BeatInfo {
  time: number; strength: number; isBeat: boolean; isOnset: boolean;
  subdivisionIndex?: number;  // 1/16-note position (0-indexed from phase offset)
}

interface BeatDetectionResult {
  bpm: number;
  beats: BeatInfo[];           // beat grid (aligned to phase)
  onsets: BeatInfo[];          // raw onsets (parabolic-interpolated)
  quantizedOnsets: BeatInfo[]; // onsets snapped to 1/16-note grid ← USE THIS
  beatInterval: number;
  beatPhaseOffset: number;     // seconds: where beat 1 actually falls
}

export function quantizeOnsets(onsets, bpm, phaseOffset): BeatInfo[]
// Exported so stemSeparator can also quantize its onsets
```

**Improvements (2026-07-19) inspired by BeatLearning tokenisation:**
1. **Phase alignment** (`estimateBeatPhase`): 32 candidates → maximise flux at beat positions
2. **Parabolic interpolation**: refines onset time ±46ms → ~±2ms sub-frame accuracy
3. **`quantizeOnsets()`**: snaps onsets to nearest 1/16-note slot; strongest onset wins per slot
4. **`buildBeatGrid()`**: now uses `phaseOffset`, adds `subdivisionIndex` to each beat

`subdivisionIndex` encoding (in 1/16-note units):
- `% 16 === 0` → measure downbeat
- `% 8  === 0` → half-measure (beat 3)
- `% 4  === 0` → any quarter-note beat
- `% 2  === 0` → eighth note
- else         → sixteenth note

#### `stemSeparator.ts`

```typescript
// 4 stems via BiquadFilter chains on Web Audio API
type StemType = "drums" | "bass" | "vocals" | "other";
interface StemData { type, label, color, filters, rmsFrames, miniWaveform }

separateStems(arrayBuffer, onProgress?): Promise<StemData[]>

computeOnsetsFromStems(
  activeStems, hopSize, sampleRate, framesPerSecond,
  bpm?,        // if provided → applies quantizeOnsets()
  phaseOffset? // phase from beatDetector
): BeatInfo[]
```

Stem frequency bands:
- **drums**: lowpass 200Hz
- **bass**: bandpass 200–2000Hz
- **vocals**: bandpass 2000–8000Hz
- **other**: highpass 8000Hz

#### `patternEngine.ts`

```typescript
interface LaneNote { time, duration, laneIndex, strength, subdivisionIndex? }

interface PatternEngineOptions {
  laneCount: number;
  pattern: "zigzag" | "mirror" | "stairs" | "circle" | "random";
  allowHolds: boolean;
  minHoldStrength: number;
  enableChords: boolean;  // ← NEW: chord on measure downbeats (hard/expert)
}

generateNotes(onsets, beats, sections, options?): LaneNote[]
```

**Improvements (2026-07-19):**
- **Pattern reset per measure**: `patternCursor` resets to 0 at each `subdivisionIndex % 16 === 0`
- **Chords at downbeats**: when `enableChords=true` + `subdivisionIndex % 16 === 0`, places a 2nd note on `(lane + ceil(laneCount/2)) % laneCount`
- `subdivisionIndex` is carried from `BeatInfo` into `LaneNote`

#### `difficultyFilter.ts`

```typescript
filterByDifficulty(notes: LaneNote[], difficulty: Difficulty): LaneNote[]
```

**Improvement (2026-07-19) — metrical priority scoring:**
```
score = onset.strength × subdivisionPriority(subdivisionIndex)
// % 16 → ×4.0 | % 8 → ×3.0 | % 4 → ×2.0 | % 2 → ×1.4 | else → ×1.0
```
Notes with higher metrical importance are retained even if their raw strength is lower.

Difficulty configs:
| Level | Retention | Max NPS | Holds | Min spacing |
|---|---|---|---|---|
| easy   | 30%  | 2  | ✗ | 500ms |
| normal | 55%  | 4  | ✓ | 250ms |
| hard   | 75%  | 6  | ✓ | 150ms |
| expert | 100% | 10 | ✓ | 80ms  |

#### `beatMapExporter.ts`

```typescript
exportBeatMap(notes: LaneNote[], options: ExportOptions, existingTracks: Track[]): AIImportData
// Maps laneIndex → track name, creates missing tracks automatically
```

---

## 5. BeatMapperModal.tsx

**Location**: `src/components/BeatMapperModal.tsx`

### Props
```typescript
interface BeatMapperModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;      // used as localStorage key
  projectName: string;
  bpm: number;
  rhythmSync: number;
  subRhythmSync: number;
  audioUrl?: string;
  audioFileName?: string;
  tracks: Track[];
  onApply: (data: AIImportData, clearExisting: boolean) => void;
}
```

### Phases
```typescript
type Phase = "initial" | "decomposing" | "decomposed" | "analyzing" | "done" | "error";
```

### Persistence
Config is saved to / loaded from `localStorage["beatmapper-<projectId>"]`:
```typescript
interface BeatMapperConfig {
  difficulty, pattern, allowHolds, useBpmOverride, bpmOverride,
  stemEnabled: Record<StemType, boolean>,
  clearExisting
}
```
User manually triggers save via "Sauvegarder config" button.

### Playback
- Web Audio API: `AudioContext` + `AudioBufferSourceNode`
- Per-stem `GainNode` allows mute/unmute in real time without restarting
- Smooth fade: `gain.setTargetAtTime(0 or 1, ctx.currentTime, 0.015)`

### Note generation trigger
The `useEffect` keyed on `[beatResult, analysis, sections, stems, stemKey, pattern, difficulty, allowHolds, tracks.length]` re-runs generation whenever any of these change. It:
1. Uses `beatResult.quantizedOnsets` by default
2. Overrides with `computeOnsetsFromStems(...)` if stems are available + some are enabled
3. Calls `generateNotes(...)` with `enableChords: difficulty === "hard" || difficulty === "expert"`
4. Calls `filterByDifficulty(...)`

---

## 6. Editor.tsx integration

**File**: `src/pages/Editor.tsx` (~3130 lines)

BeatMapperModal is rendered near the bottom. Key integration point:
```typescript
<BeatMapperModal
  open={showAIModal}
  onOpenChange={setShowAIModal}
  projectId={project?.id || ""}
  projectName={project?.name || ""}
  bpm={bpm}
  rhythmSync={rhythmSync}
  subRhythmSync={subRhythmSync}
  audioUrl={audioUrl}
  audioFileName={audioFileName}
  tracks={tracks}
  onApply={(data: AIImportData, clearExisting: boolean) => {
    const baseTracks = clearExisting
      ? tracks.map((t) => ({ ...t, notes: [] }))   // wipe existing notes
      : tracks;
    const result = applyAIImport(data, baseTracks, trackGroups, specificActions, bpm, subRhythmSync, startOffset);
    setTracks(result.tracks);
    setTrackGroups(result.trackGroups);
    // + update bpm, rhythmSync, subRhythmSync, volume, pitch, startOffset if provided
    setHasUnsavedChanges(true);
  }}
/>
```

---

## 7. System architecture

```
Tauri (Rust shell)
└─ WebView (React app)
     ├─ App.tsx         (routing, LanguageProvider, ThemeProvider)
     ├─ pages/
     │   ├─ Home.tsx    (project list)
     │   └─ Editor.tsx  (main editor, 3130 lines)
     └─ components/
         ├─ BeatMapperModal.tsx
         ├─ TracksPanel.tsx
         ├─ ProjectPanel.tsx
         ├─ AudioPanel.tsx
         └─ ... (86 total)
```

**Tauri plugins used**: `@tauri-apps/plugin-fs`, `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-shell`

**No server / backend** — fully offline, all audio processing runs in the browser via Web Audio API.

---

## 8. i18n

- Languages: `en`, `fr` (stored in `src/locales/`)
- `useTranslation()` hook from `src/contexts/LanguageContext.tsx`
- `t("key")` or `t("key", { param: "value" })`
- Preference saved in `localStorage`

---

## 9. Known design decisions & constraints

| Decision | Rationale |
|---|---|
| HOP_SIZE = FRAME_SIZE = 2048 | Fast enough for browser, 46ms resolution before parabolic refinement |
| No automatic analysis on modal open | User must explicitly decompose and generate |
| `quantizedOnsets` not `onsets` in patternEngine | Grid-snapped times produce more musical results |
| Stem separation via BiquadFilters (not ML) | Runs 100% offline in browser, no server needed |
| `enableChords` only on hard/expert | Chords increase difficulty significantly |
| Pattern reset every 4 beats | Creates repeating musical phrases, not endless linear pattern |
| `subdivisionIndex % 16` = measure | Assumes 4/4 time signature |
| `clearExisting` wipes `notes: []` before `applyAIImport` | Allows fresh beatmap without manual clearing |
| Config persisted by `projectId` in localStorage | Different projects keep their own Beat Mapper settings |

---

## 10. What BeatLearning analysis showed (research context)

[BeatLearning](https://github.com/sedthh/BeatLearning) is a Python-only research prototype (GPU required, OSU format only). **Not integrated directly** — too much friction for a browser app. Instead, three of its concepts were ported to TypeScript:

1. **Beat-aligned tokenisation** → our `quantizeOnsets()` snapping to 1/16-note grid
2. **Metrical importance weighting** → our `subdivisionPriority()` multipliers in `difficultyFilter.ts`
3. **Phase offset estimation** → our `estimateBeatPhase()` with 32 candidates

---

## 11. Pending / future work

- [ ] Multi-band Mel spectrogram flux (currently single-band spectral flux) for better onset detection in complex music
- [ ] Export format extension: link generated notes to `specificActions` automatically
- [ ] Section-adaptive pattern density (currently density is uniform across all sections)
- [ ] 3/4 and 6/8 time signature support (currently assumes 4/4: `% 16` = measure)
- [ ] Test on various music genres (current algo tuned for EDM/pop)
- [ ] Consider ONNX export of a small transformer trained on the project's own beatmaps for personalised generation

---

## 12. Quick start for the next AI

1. **Read this file first**, then open `src/components/BeatMapperModal.tsx` and `src/beatMapper/beatDetector.ts` for the freshest code.
2. The TypeScript compiler is clean: `npx tsc --noEmit` should produce zero output.
3. Dev server: `npm run tauri dev` (requires Rust toolchain + Tauri CLI).
4. The user communicates in **French**; respond in French.
5. Follow existing code style: terse comments in English, UI labels in French.
6. Do **not** start analysis automatically on modal open — the user explicitly triggers each step.
7. Use `quantizedOnsets` (not raw `onsets`) everywhere note generation is needed.
