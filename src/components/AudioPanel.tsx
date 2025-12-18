import { memo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder, faBolt, faMusic, faVolumeHigh, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/useTranslation";
import { panelColors } from "@/lib/panelColors";

interface AudioPanelProps {
  audioFile: string;
  bpm: number;
  setBpm: (value: number) => void;
  rhythmSync: number;
  setRhythmSync: (value: number) => void;
  subRhythmSync: number;
  setSubRhythmSync: (value: number) => void;
  volume: number;
  setVolume: (value: number) => void;
  pitch: number;
  setPitch: (value: number) => void;
  startOffset: number;
  setStartOffset: (value: number) => void;
  onLoadAudio: () => void;
  onDetectBPM?: () => void;
  isDetectingBPM?: boolean;

  showMouseIndicator: boolean;
  setShowMouseIndicator: (value: boolean) => void;
}

export const AudioPanel = memo(({
  audioFile,
  bpm,
  setBpm,
  rhythmSync,
  setRhythmSync,
  subRhythmSync,
  setSubRhythmSync,
  volume,
  setVolume,
  pitch,
  setPitch,
  startOffset,
  setStartOffset,
  onLoadAudio,
  onDetectBPM,
  isDetectingBPM = false,

  showMouseIndicator,
  setShowMouseIndicator,
}: AudioPanelProps) => {
  const { t } = useTranslation();

  return (
    <Card className="m-4 backdrop-blur-sm hover:scale-100 transition-none shadow-sm">
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="h-7 w-7 rounded-md flex items-center justify-center" style={{ backgroundColor: panelColors.iconBackground() }}>
            <FontAwesomeIcon icon={faMusic} className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-foreground">{t("audio.title")}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Audio File Section */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            {t("audio.audioFile")}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              value={audioFile || t("audio.noAudio")}
              readOnly
              className="flex-1 text-sm"
              style={{ backgroundColor: panelColors.inputBackground() }}
            />
            <Button variant="outline" size="icon" onClick={onLoadAudio}>
              <FontAwesomeIcon icon={faFolder} className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/50" />

        {/* Timing Section */}
        <div className="space-y-3">
          <Label className="text-xs font-medium text-muted-foreground block">
            {t("audio.timingSection")}
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t("audio.bpm")}</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="h-9 flex-1"
                  style={{ backgroundColor: panelColors.inputBackground() }}
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={onDetectBPM}
                        disabled={!onDetectBPM || isDetectingBPM}
                      >
                        <FontAwesomeIcon icon={faBolt} className={`h-4 w-4 ${isDetectingBPM ? 'animate-pulse' : ''}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isDetectingBPM ? t("audio.detectingBPM") : t("audio.detectBPMTooltip")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t("audio.startOffset")}</Label>
              <Input
                type="number"
                value={startOffset}
                onChange={(e) => setStartOffset(Number(e.target.value))}
                className="h-9"
                style={{ backgroundColor: panelColors.inputBackground() }}
              />
            </div>
          </div>
        </div>

        {/* Rhythm Sync Section */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t("audio.rhythmSync")}</Label>
              <Input
                type="number"
                value={rhythmSync}
                onChange={(e) => setRhythmSync(Number(e.target.value))}
                className="h-9"
                style={{ backgroundColor: panelColors.inputBackground() }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t("audio.subRhythmSync")}</Label>
              <Input
                type="number"
                value={subRhythmSync}
                onChange={(e) => setSubRhythmSync(Number(e.target.value))}
                className="h-9"
                style={{ backgroundColor: panelColors.inputBackground() }}
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/50" />

        {/* Playback Controls Section */}
        <div className="space-y-4">
          <Label className="text-xs font-medium text-muted-foreground block">
            {t("audio.playbackSection")}
          </Label>

          {/* Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">{t("audio.volume")}</Label>
              <span className="text-xs font-medium text-foreground">{volume}%</span>
            </div>
            <Slider
              value={[volume]}
              onValueChange={([value]) => setVolume(value)}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* Pitch */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t("audio.pitch")}</Label>
            <div className="grid grid-cols-5 gap-2">
              {[0.25, 0.5, 0.8, 1, 1.5].map((value) => (
                <Button
                  key={value}
                  variant={pitch === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPitch(value)}
                  className="h-8 text-xs"
                >
                  {value}x
                </Button>
              ))}
            </div>
          </div>
        </div>



        {/* UI Controls Section */}
        <div className="space-y-3">
          <Label className="text-xs font-medium text-muted-foreground block">
            {t("audio.uiControls")}
          </Label>

          {/* Mouse Indicator Toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground flex items-center gap-2">
              {showMouseIndicator ? <FontAwesomeIcon icon={faEye} className="h-4 w-4" /> : <FontAwesomeIcon icon={faEyeSlash} className="h-4 w-4" />}
              {t("audio.mouseIndicator")}
            </Label>
            <Button
              variant={showMouseIndicator ? "default" : "outline"}
              size="sm"
              onClick={() => setShowMouseIndicator(!showMouseIndicator)}
              className="h-8 text-xs"
            >
              {showMouseIndicator ? t("audio.enabled") : t("audio.disabled")}
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>
  );
});
