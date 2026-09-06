// ─── BEAT MAPPER MODAL ────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from "react";
import {
  Music, Check, Loader2, AlertCircle, Wand2, BarChart3,
  Layers, Play, Pause, Square, ChevronRight, Save, Trash2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Track } from "@/types/track";
import { AIImportData } from "@/types/aiImport";
import { analyzeAudio, AudioAnalysisResult } from "@/beatMapper/audioAnalyzer";
import { detectBeats, BeatDetectionResult } from "@/beatMapper/beatDetector";
import { detectSections, Section } from "@/beatMapper/sectionDetector";
import { generateNotes, LaneNote, PatternStyle } from "@/beatMapper/patternEngine";
import { filterByDifficulty, Difficulty } from "@/beatMapper/difficultyFilter";
import { exportBeatMap, LaneMapping } from "@/beatMapper/beatMapExporter";
import { separateStems, computeOnsetsFromStems, StemData, StemType } from "@/beatMapper/stemSeparator";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

// ─── Types & constants ────────────────────────────────────────────────────────

type Phase = "initial" | "decomposing" | "decomposed" | "analyzing" | "done" | "error";

const DECOMP_STEPS = [
  { key: "fetching",  label: "Récupération audio" },
  { key: "decoding",  label: "Décodage" },
  { key: "spectral",  label: "Analyse spectrale" },
  { key: "stems",     label: "Décomposition (4 bandes)" },
];

const ANALYSIS_STEPS = [
  { key: "beats",      label: "Détection BPM & beats" },
  { key: "sections",   label: "Segmentation" },
  { key: "generating", label: "Génération des notes" },
];

// ─── Persistence ──────────────────────────────────────────────────────────────

interface BeatMapperConfig {
  difficulty: Difficulty;
  pattern: PatternStyle;
  allowHolds: boolean;
  useBpmOverride: boolean;
  bpmOverride: number;
  stemEnabled: Record<StemType, boolean>;
  clearExisting: boolean;
}

const DEFAULT_CONFIG: BeatMapperConfig = {
  difficulty: "normal",
  pattern: "zigzag",
  allowHolds: true,
  useBpmOverride: false,
  bpmOverride: 120,
  stemEnabled: { drums: true, bass: true, vocals: true, other: true },
  clearExisting: false,
};

function loadConfig(projectId: string): BeatMapperConfig {
  try {
    const raw = localStorage.getItem(`beatmapper-${projectId}`);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_CONFIG };
}

function saveConfigToStorage(projectId: string, cfg: BeatMapperConfig) {
  try { localStorage.setItem(`beatmapper-${projectId}`, JSON.stringify(cfg)); } catch { /* ignore */ }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface BeatMapperModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  bpm: number;
  rhythmSync: number;
  subRhythmSync: number;
  audioUrl?: string;
  audioFileName?: string;
  tracks: Track[];
  onApply: (data: AIImportData, clearExisting: boolean) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BeatMapperModal({
  open,
  onOpenChange,
  projectId,
  projectName,
  bpm: projectBpm,
  rhythmSync,
  subRhythmSync,
  audioUrl,
  audioFileName,
  tracks,
  onApply,
}: BeatMapperModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Playback refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef   = useRef<AudioBufferSourceNode | null>(null);
  const stemGainsRef = useRef<Record<string, GainNode>>({});
  const playStartRef  = useRef(0);
  const playOffsetRef = useRef(0);
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isPlaying,    setIsPlaying]    = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);

  // Phase & progress
  const [phase,       setPhase]       = useState<Phase>("initial");
  const [currentStep, setCurrentStep] = useState("");
  const [progress,    setProgress]    = useState(0);
  const [errorMsg,    setErrorMsg]    = useState<string | null>(null);

  // Analysis results
  const [analysis,        setAnalysis]        = useState<AudioAnalysisResult | null>(null);
  const [beatResult,      setBeatResult]      = useState<BeatDetectionResult | null>(null);
  const [sections,        setSections]        = useState<Section[]>([]);
  const [stems,           setStems]           = useState<StemData[]>([]);
  const [generatedNotes,  setGeneratedNotes]  = useState<LaneNote[]>([]);

  // Settings (loaded from localStorage)
  const [difficulty,     setDifficulty]     = useState<Difficulty>("normal");
  const [pattern,        setPattern]        = useState<PatternStyle>("zigzag");
  const [bpmOverride,    setBpmOverride]    = useState<number>(projectBpm);
  const [useBpmOverride, setUseBpmOverride] = useState(false);
  const [allowHolds,     setAllowHolds]     = useState(true);
  const [stemEnabled,    setStemEnabled]    = useState<Record<StemType, boolean>>(DEFAULT_CONFIG.stemEnabled);
  const [clearExisting,  setClearExisting]  = useState(false);

  // ─── Audio helpers ───────────────────────────────────────────────────────────

  const stopAudio = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (sourceRef.current) { try { sourceRef.current.stop(); } catch { /* already stopped */ } sourceRef.current = null; }
    setIsPlaying(false);
  };

  const playAudio = (offsetSecs = 0) => {
    if (!analysis?.audioBuffer || stems.length === 0) return;
    stopAudio();
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();
    const src = ctx.createBufferSource();
    src.buffer = analysis.audioBuffer;
    sourceRef.current = src;
    const master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    const newGains: Record<string, GainNode> = {};
    for (const stem of stems) {
      let node: AudioNode = src;
      for (const f of stem.filters) {
        const filt = ctx.createBiquadFilter();
        filt.type = f.type; filt.frequency.value = f.frequency;
        node.connect(filt); node = filt;
      }
      const g = ctx.createGain();
      g.gain.value = stemEnabled[stem.type] ? 1 : 0;
      node.connect(g); g.connect(master);
      newGains[stem.type] = g;
    }
    stemGainsRef.current = newGains;
    const safeOffset = Math.max(0, Math.min(offsetSecs, analysis.duration - 0.01));
    src.start(0, safeOffset);
    playStartRef.current = ctx.currentTime;
    playOffsetRef.current = safeOffset;
    setIsPlaying(true);
    setPlaybackTime(safeOffset);
    src.onended = () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      setIsPlaying(false); playOffsetRef.current = 0; setPlaybackTime(0);
    };
    intervalRef.current = setInterval(() => {
      const elapsed = audioCtxRef.current ? audioCtxRef.current.currentTime - playStartRef.current : 0;
      setPlaybackTime(playOffsetRef.current + elapsed);
    }, 100);
  };

  const togglePlay = () => {
    if (isPlaying) {
      if (audioCtxRef.current) playOffsetRef.current += audioCtxRef.current.currentTime - playStartRef.current;
      stopAudio();
    } else {
      playAudio(playOffsetRef.current);
    }
  };

  // ─── Config persistence ──────────────────────────────────────────────────────

  const saveConfig = () => {
    saveConfigToStorage(projectId, { difficulty, pattern, allowHolds, useBpmOverride, bpmOverride, stemEnabled, clearExisting });
    toast.success("Configuration sauvegardée !");
  };

  // ─── Reset ───────────────────────────────────────────────────────────────────

  const resetAnalysis = () => {
    stopAudio();
    playOffsetRef.current = 0;
    setPlaybackTime(0);
    setPhase("initial");
    setCurrentStep("");
    setProgress(0);
    setErrorMsg(null);
    setAnalysis(null);
    setBeatResult(null);
    setSections([]);
    setStems([]);
    setGeneratedNotes([]);
  };

  // ─── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (open) {
      const cfg = loadConfig(projectId);
      setDifficulty(cfg.difficulty);
      setPattern(cfg.pattern);
      setAllowHolds(cfg.allowHolds);
      setUseBpmOverride(cfg.useBpmOverride);
      setBpmOverride(cfg.useBpmOverride ? cfg.bpmOverride : projectBpm);
      setStemEnabled(cfg.stemEnabled);
      setClearExisting(cfg.clearExisting);
      resetAnalysis();
    } else {
      stopAudio();
      playOffsetRef.current = 0;
      setPlaybackTime(0);
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state === "closed") return;
    Object.entries(stemGainsRef.current).forEach(([type, gain]) => {
      gain.gain.setTargetAtTime(stemEnabled[type as StemType] ? 1 : 0, ctx.currentTime, 0.015);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stemEnabled]);

  const stemKey = Object.entries(stemEnabled).filter(([, v]) => v).map(([k]) => k).join(",");
  useEffect(() => {
    if (!beatResult || !analysis) return;
    // Prefer stem-based onsets (already quantized); fall back to spectral-flux quantized onsets
    let onsets = beatResult.quantizedOnsets;
    if (stems.length > 0) {
      const activeStems = stems.filter((s) => stemEnabled[s.type]);
      if (activeStems.length > 0) {
        onsets = computeOnsetsFromStems(
          activeStems, analysis.hopSize, analysis.sampleRate, analysis.framesPerSecond,
          beatResult.bpm, beatResult.beatPhaseOffset
        );
      }
    }
    const laneCount = Math.max(1, tracks.length);
    const notes = generateNotes(onsets, beatResult.beats, sections, {
      laneCount, pattern, allowHolds, minHoldStrength: 0.6,
      enableChords: difficulty === "hard" || difficulty === "expert",
    });
    setGeneratedNotes(filterByDifficulty(notes, difficulty));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatResult, analysis, sections, stems, stemKey, pattern, difficulty, allowHolds, tracks.length]);

  useEffect(() => {
    if (!analysis || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;
    const { rmsFrames, duration } = analysis;
    const W = canvas.width, H = canvas.height;
    ctx2d.clearRect(0, 0, W, H);
    ctx2d.fillStyle = "rgba(15,15,25,0.95)";
    ctx2d.fillRect(0, 0, W, H);
    for (const s of sections) {
      const x1 = (s.startTime / duration) * W, x2 = (s.endTime / duration) * W;
      ctx2d.fillStyle = s.color + "33"; ctx2d.fillRect(x1, 0, x2 - x1, H);
      ctx2d.fillStyle = s.color; ctx2d.font = "10px sans-serif"; ctx2d.fillText(s.label, x1 + 4, 14);
    }
    const maxRms = Math.max(...rmsFrames, 0.001);
    ctx2d.strokeStyle = "rgba(99,102,241,0.8)"; ctx2d.lineWidth = 1;
    ctx2d.beginPath();
    for (let x = 0; x < W; x++) {
      const rms = rmsFrames[Math.floor((x / W) * rmsFrames.length)] / maxRms;
      x === 0 ? ctx2d.moveTo(x, H / 2) : ctx2d.lineTo(x, H / 2 - (rms * H) / 2);
    }
    ctx2d.stroke();
    ctx2d.beginPath();
    for (let x = 0; x < W; x++) {
      const rms = rmsFrames[Math.floor((x / W) * rmsFrames.length)] / maxRms;
      x === 0 ? ctx2d.moveTo(x, H / 2) : ctx2d.lineTo(x, H / 2 + (rms * H) / 2);
    }
    ctx2d.stroke();
    if (beatResult) {
      ctx2d.strokeStyle = "rgba(255,255,255,0.12)"; ctx2d.lineWidth = 1;
      for (const beat of beatResult.beats) {
        const x = (beat.time / duration) * W;
        ctx2d.beginPath(); ctx2d.moveTo(x, 0); ctx2d.lineTo(x, H); ctx2d.stroke();
      }
      for (const note of generatedNotes) {
        const x = (note.time / duration) * W;
        ctx2d.fillStyle = (tracks[note.laneIndex]?.color ?? "#6366f1") + "cc";
        ctx2d.fillRect(x - 1, H - 16 - note.laneIndex * 4, 2, 12);
      }
    }
  }, [analysis, sections, beatResult, generatedNotes, tracks]);

  // ─── Core functions ───────────────────────────────────────────────────────────

  const runDecomposition = async () => {
    if (!audioUrl) { toast.error("Aucune musique chargée dans le projet."); return; }
    setErrorMsg(null);
    try {
      setPhase("decomposing"); setProgress(0);

      setCurrentStep("fetching");
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      setProgress(10);

      setCurrentStep("decoding");
      const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
      const file = new File([blob], audioFileName || "audio", { type: "audio/mpeg" });
      const result = await analyzeAudio(file, (pct) => {
        setCurrentStep(pct <= 35 ? "decoding" : "spectral");
        setProgress(10 + pct * 0.5);
      });
      setAnalysis(result);
      setProgress(60);

      setCurrentStep("stems");
      const stemData = await separateStems(result.audioBuffer, result.hopSize, (pct) => setProgress(60 + pct * 0.4));
      setStems(stemData);

      setProgress(100);
      setPhase("decomposed");
      toast.success("Décomposition terminée — active/désactive les bandes, puis génère les notes");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue");
      setPhase("error");
    }
  };

  const runAnalysis = async () => {
    if (!analysis) { toast.error("Effectue d'abord la décomposition."); return; }
    setErrorMsg(null);
    try {
      setPhase("analyzing"); setProgress(0);

      setCurrentStep("beats");
      const beats = await detectBeats(analysis, useBpmOverride ? bpmOverride : undefined, (pct) => setProgress(pct * 0.5));
      setBeatResult(beats);
      setProgress(50);

      setCurrentStep("sections");
      const detectedSections = detectSections(analysis, beats.bpm);
      setSections(detectedSections);
      setProgress(90);

      setCurrentStep("generating");
      setProgress(100);
      setPhase("done");
      toast.success(`BPM: ${beats.bpm.toFixed(1)} — génération terminée`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue");
      setPhase("error");
    }
  };

  const handleApply = () => {
    if (!beatResult || generatedNotes.length === 0) return;
    if (tracks.length === 0) { toast.error("Le projet n'a aucune piste."); return; }
    const laneMapping: LaneMapping[] = tracks.map((t, i) => ({ laneIndex: i, trackName: t.name }));
    const data = exportBeatMap(generatedNotes, { bpm: beatResult.bpm, rhythmSync, subRhythmSync, laneMapping }, tracks);
    onApply(data, clearExisting);
    onOpenChange(false);
    toast.success(`${data.addNotes?.length ?? 0} notes appliquées !${clearExisting ? " (notes précédentes supprimées)" : ""}`);
  };

  // ─── Derived ─────────────────────────────────────────────────────────────────

  const isDecomposing = phase === "decomposing";
  const isAnalyzing   = phase === "analyzing";
  const isRunning     = isDecomposing || isAnalyzing;
  const isDecomposed  = ["decomposed", "analyzing", "done", "error"].includes(phase) && stems.length > 0;
  const isDone        = phase === "done";
  const notesByTrack  = tracks.map((_t, i) => generatedNotes.filter((n) => n.laneIndex === i).length);
  const decompStepIdx  = DECOMP_STEPS.findIndex((s) => s.key === currentStep);
  const analysisStepIdx = ANALYSIS_STEPS.findIndex((s) => s.key === currentStep);

  // ─── JSX ─────────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isRunning) onOpenChange(v); }}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden [&>button]:z-10">
        <div style={{ display: "flex", flexDirection: "column", maxHeight: "88vh", height: "88vh" }}>

          {/* ── Header ─────────────────────────────────────────────────── */}
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-border" style={{ flexShrink: 0 }}>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Wand2 className="h-5 w-5 text-primary" />
              Beat Mapper
              <Badge variant="secondary" className="ml-1 text-xs">Auto</Badge>
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Génération automatique de beatmap pour <span className="font-medium">{projectName}</span>
            </p>
          </DialogHeader>

          {/* ── Scrollable body ─────────────────────────────────────────── */}
          <div className="overflow-y-auto px-6 py-4 space-y-4" style={{ flex: "1 1 0", minHeight: 0 }}>

            {/* Audio source */}
            <div className="rounded-lg border border-border p-3 flex items-center gap-3">
              <Music className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{audioFileName || "Musique du projet"}</p>
                <p className="text-xs text-muted-foreground">
                  {audioUrl ? "Musique chargée depuis le projet" : "Aucune musique chargée dans le projet"}
                </p>
              </div>
              {!audioUrl && <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />}
            </div>

            {/* ══ ÉTAPE 1 : DÉCOMPOSITION ══════════════════════════════════ */}
            <div className="rounded-lg border border-border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold flex-shrink-0">1</span>
                  Décomposition audio
                </p>
                {isDecomposed && !isDecomposing && (
                  <Badge variant="outline" className="text-xs text-green-500 border-green-500/40">
                    <Check className="h-3 w-3 mr-1" />Terminé
                  </Badge>
                )}
              </div>

              {/* Decompose button */}
              {!isDecomposing && (
                <Button
                  variant={isDecomposed ? "outline" : "default"}
                  onClick={runDecomposition}
                  disabled={!audioUrl || isRunning}
                  className="w-full gap-2" size="sm"
                >
                  {isDecomposed
                    ? <><Music className="h-4 w-4" />Re-décomposer</>
                    : <><ChevronRight className="h-4 w-4" />Décomposer la musique</>}
                </Button>
              )}

              {/* Decomp progress */}
              {isDecomposing && (
                <div className="space-y-2">
                  {DECOMP_STEPS.map((s, i) => {
                    const past = i < decompStepIdx, cur = s.key === currentStep;
                    return (
                      <div key={s.key} className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${past ? "bg-green-500" : cur ? "bg-primary animate-pulse" : "bg-muted"}`} />
                        <span className={`text-xs ${cur ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                        {cur && <Loader2 className="h-3 w-3 animate-spin text-primary ml-auto" />}
                      </div>
                    );
                  })}
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {/* Stems + playback */}
              {isDecomposed && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Layers className="h-3 w-3 flex-shrink-0" />
                    Active les bandes à inclure dans la génération — désactive celles qui brouillent l'algorithme
                  </p>
                  {stems.map((stem) => (
                    <div key={stem.type} className="flex items-center gap-3">
                      <Switch
                        checked={stemEnabled[stem.type]}
                        onCheckedChange={(v) => setStemEnabled((p) => ({ ...p, [stem.type]: v }))}
                        id={`stem-${stem.type}`}
                      />
                      <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: stem.color }} />
                      <span className="text-xs w-28 flex-shrink-0" style={{ color: stemEnabled[stem.type] ? stem.color : undefined }}>
                        {stem.label}
                      </span>
                      <div className="flex-1 transition-opacity" style={{ opacity: stemEnabled[stem.type] ? 1 : 0.25 }}>
                        <MiniWaveform data={stem.miniWaveform} color={stem.color} />
                      </div>
                    </div>
                  ))}

                  {/* Playback bar */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <Button size="sm" variant={isPlaying ? "default" : "outline"} className="gap-1.5 h-7 px-3 text-xs flex-shrink-0" onClick={togglePlay}>
                      {isPlaying ? <><Pause className="h-3 w-3" />Pause</> : <><Play className="h-3 w-3" />Écouter</>}
                    </Button>
                    {playbackTime > 0.1 && (
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 flex-shrink-0"
                        onClick={() => { stopAudio(); playOffsetRef.current = 0; setPlaybackTime(0); }}>
                        <Square className="h-3 w-3" />
                      </Button>
                    )}
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full"
                        style={{ width: `${(playbackTime / (analysis?.duration || 1)) * 100}%`, transition: isPlaying ? "none" : "width 0.3s" }} />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
                      {formatTime(playbackTime)}{analysis ? ` / ${formatTime(analysis.duration)}` : ""}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ══ ÉTAPE 2 : ANALYSE & GÉNÉRATION ══════════════════════════ */}
            {isDecomposed && (
              <div className="rounded-lg border border-border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold flex-shrink-0">2</span>
                    Analyse & Génération
                  </p>
                  {isDone && (
                    <Badge variant="outline" className="text-xs text-green-500 border-green-500/40">
                      <Check className="h-3 w-3 mr-1" />{generatedNotes.length} notes
                    </Badge>
                  )}
                </div>

                {/* Settings */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Difficulté</Label>
                    <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Pattern</Label>
                    <Select value={pattern} onValueChange={(v) => setPattern(v as PatternStyle)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zigzag">Zigzag</SelectItem>
                        <SelectItem value="mirror">Miroir</SelectItem>
                        <SelectItem value="stairs">Escaliers</SelectItem>
                        <SelectItem value="circle">Cercle</SelectItem>
                        <SelectItem value="random">Aléatoire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <Switch checked={allowHolds} onCheckedChange={setAllowHolds} id="allowHolds" />
                    <Label htmlFor="allowHolds" className="text-xs cursor-pointer">Notes longues (hold)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={useBpmOverride} onCheckedChange={setUseBpmOverride} id="bpmOverride" />
                    <Label htmlFor="bpmOverride" className="text-xs cursor-pointer">BPM forcé: {bpmOverride}</Label>
                  </div>
                </div>

                {useBpmOverride && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">BPM override ({bpmOverride})</Label>
                    <Slider min={60} max={240} step={1} value={[bpmOverride]} onValueChange={([v]) => setBpmOverride(v)} className="py-1" />
                  </div>
                )}

                {/* Analysis progress */}
                {isAnalyzing && (
                  <div className="space-y-2">
                    {ANALYSIS_STEPS.map((s, i) => {
                      const past = i < analysisStepIdx, cur = s.key === currentStep;
                      return (
                        <div key={s.key} className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full flex-shrink-0 ${past ? "bg-green-500" : cur ? "bg-primary animate-pulse" : "bg-muted"}`} />
                          <span className={`text-xs ${cur ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                          {cur && <Loader2 className="h-3 w-3 animate-spin text-primary ml-auto" />}
                        </div>
                      );
                    })}
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                {/* Waveform canvas */}
                {isDone && (
                  <div className="rounded-lg overflow-hidden border border-border">
                    <canvas ref={canvasRef} width={640} height={90} className="w-full h-[90px]" />
                  </div>
                )}

                {/* Sections */}
                {isDone && sections.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {sections.map((s, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: s.color + "33", color: s.color, border: `1px solid ${s.color}55` }}>
                        {s.label} {s.startTime.toFixed(0)}s–{s.endTime.toFixed(0)}s
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats */}
                {isDone && beatResult && (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { v: beatResult.bpm.toFixed(1), l: "BPM" },
                      { v: generatedNotes.length, l: "Notes" },
                      { v: sections.length, l: "Sections" },
                    ].map(({ v, l }) => (
                      <div key={l} className="rounded-lg bg-muted/30 border border-border p-2.5 text-center">
                        <p className="text-lg font-bold">{v}</p>
                        <p className="text-xs text-muted-foreground">{l}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Track distribution */}
                {isDone && tracks.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Répartition sur les pistes :</p>
                    {tracks.map((t, i) => (
                      <div key={t.id} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                        <span className="text-xs flex-1 truncate text-muted-foreground">{t.name}</span>
                        <span className="text-xs font-medium tabular-nums">{notesByTrack[i]}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Generate button */}
                {!isAnalyzing && (
                  <Button onClick={runAnalysis} disabled={isRunning} className="w-full gap-2" size="sm"
                    variant={isDone ? "outline" : "default"}>
                    {isDone
                      ? <><BarChart3 className="h-4 w-4" />Re-générer les notes</>
                      : <><ChevronRight className="h-4 w-4" />Générer les notes</>}
                  </Button>
                )}

                {/* Clear existing toggle */}
                {isDone && (
                  <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                    <Switch checked={clearExisting} onCheckedChange={setClearExisting} id="clearExisting" />
                    <Label htmlFor="clearExisting" className="text-xs cursor-pointer flex items-center gap-1.5">
                      <Trash2 className="h-3 w-3 text-destructive" />
                      Supprimer les notes existantes avant d'appliquer
                    </Label>
                  </div>
                )}

                {/* Error */}
                {phase === "error" && errorMsg && (
                  <p className="text-xs text-destructive flex items-center gap-1.5">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />{errorMsg}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <div className="px-6 py-4 border-t border-border flex justify-between items-center gap-3" style={{ flexShrink: 0 }}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={saveConfig}>
              <Save className="h-3.5 w-3.5" />Sauvegarder config
            </Button>
            <Button
              onClick={handleApply}
              disabled={!isDone || generatedNotes.length === 0}
              size="sm" className="gap-2"
            >
              <Check className="h-4 w-4" />
              Appliquer ({generatedNotes.length} notes)
              {clearExisting && <Badge variant="destructive" className="ml-1 text-[10px] px-1 py-0">+clear</Badge>}
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── MiniWaveform ─────────────────────────────────────────────────────────────

function MiniWaveform({ data, color }: { data: Float32Array; color: string }) {
  const bars = Array.from(data);
  return (
    <div className="flex items-end gap-px flex-1" style={{ height: 28 }}>
      {bars.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm"
          style={{ height: `${Math.max(4, v * 100)}%`, backgroundColor: color, opacity: 0.75 }} />
      ))}
    </div>
  );
}

