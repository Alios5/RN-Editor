import { useState } from "react";
import { Bot, ClipboardCopy, Play, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/useTranslation";
import { AIImportData } from "@/types/aiImport";
import { Track } from "@/types/track";
import { TrackGroup } from "@/types/trackGroup";
import { SpecificAction } from "@/types/specificAction";
import { toast } from "sonner";

interface AIAssistantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  bpm: number;
  rhythmSync: number;
  subRhythmSync: number;
  volume: number;
  pitch: number;
  startOffset: number;
  audioFileName: string;
  tracks: Track[];
  trackGroups: TrackGroup[];
  specificActions: SpecificAction[];
  onApply: (data: AIImportData) => void;
}

export function AIAssistantModal({
  open,
  onOpenChange,
  projectName,
  bpm,
  rhythmSync,
  subRhythmSync,
  volume,
  pitch,
  startOffset,
  audioFileName,
  tracks,
  trackGroups,
  specificActions,
  onApply,
}: AIAssistantModalProps) {
  const { t } = useTranslation();
  const [jsonInput, setJsonInput] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseSuccess, setParseSuccess] = useState(false);

  const validateAndParse = (value: string): AIImportData | null => {
    setParseError(null);
    setParseSuccess(false);
    if (!value.trim()) return null;
    try {
      const parsed = JSON.parse(value);
      setParseSuccess(true);
      return parsed as AIImportData;
    } catch (e) {
      setParseError(t("ai.invalidJson"));
      return null;
    }
  };

  const handleJsonChange = (value: string) => {
    setJsonInput(value);
    if (value.trim()) {
      validateAndParse(value);
    } else {
      setParseError(null);
      setParseSuccess(false);
    }
  };

  const handleApply = () => {
    const data = validateAndParse(jsonInput);
    if (!data) return;
    onApply(data);
    setJsonInput("");
    setParseError(null);
    setParseSuccess(false);
    onOpenChange(false);
    toast.success(t("ai.applySuccess"));
  };

  const buildContextPrompt = (): string => {
    const groupMap: Record<string, string[]> = {};
    tracks.forEach((track) => {
      const groupName = track.groupId
        ? trackGroups.find((g) => g.id === track.groupId)?.name || t("ai.ungrouped")
        : t("ai.ungrouped");
      if (!groupMap[groupName]) groupMap[groupName] = [];
      groupMap[groupName].push(
        `  - "${track.name}" (${track.notes?.length ?? 0} ${t("ai.notes")})`
      );
    });

    const groupsText = Object.entries(groupMap)
      .map(([gName, tList]) => `• ${gName}:\n${tList.join("\n")}`)
      .join("\n");

    const actionsText =
      specificActions.length > 0
        ? specificActions.map((a) => `  - ${a.name}`).join("\n")
        : `  ${t("ai.none")}`;

    return `# ${t("ai.promptTitle")} — ${projectName}

## ${t("ai.promptProjectInfo")}
- **${t("ai.promptMusic")}**: ${audioFileName || t("ai.noMusic")}
- **BPM**: ${bpm}
- **RhythmSync**: ${rhythmSync}
- **SubRhythmSync**: ${subRhythmSync}
- **Volume**: ${volume}
- **Pitch**: ${pitch}
- **StartOffset**: ${startOffset}

## ${t("ai.promptTracks")} (${tracks.length})
${groupsText || `  ${t("ai.none")}`}

## ${t("ai.promptActions")}
${actionsText}

---

## ${t("ai.promptInstructions")}

${t("ai.promptStep1")}

${t("ai.promptStep2")}

${t("ai.promptStep3")}

${t("ai.promptJsonFormat")}

\`\`\`json
{
  "addTracks": [
    { "name": "Track Name", "color": "#6366f1", "groupName": "Group Name" }
  ],
  "addNotes": [
    { "trackName": "Track Name", "startTime": 1.0, "duration": 0.5, "action": "ActionName" }
  ],
  "updateSettings": {
    "bpm": ${bpm},
    "rhythmSync": ${rhythmSync},
    "subRhythmSync": ${subRhythmSync},
    "volume": ${volume},
    "pitch": ${pitch},
    "startOffset": ${startOffset}
  }
}
\`\`\`

${t("ai.promptNote")}`;
  };

  const handleGeneratePrompt = () => {
    const prompt = buildContextPrompt();
    navigator.clipboard.writeText(prompt).then(() => {
      toast.success(t("ai.promptCopied"));
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Bot className="h-5 w-5 text-primary" />
            {t("ai.title")}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">{t("ai.description")}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Generate Prompt Section */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div>
              <h3 className="text-sm font-semibold">{t("ai.step1Title")}</h3>
              <p className="text-xs text-muted-foreground mt-1">{t("ai.step1Description")}</p>
            </div>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleGeneratePrompt}
            >
              <ClipboardCopy className="h-4 w-4" />
              {t("ai.generatePrompt")}
            </Button>
          </div>

          {/* Apply JSON Section */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div>
              <h3 className="text-sm font-semibold">{t("ai.step2Title")}</h3>
              <p className="text-xs text-muted-foreground mt-1">{t("ai.step2Description")}</p>
            </div>

            <div className="relative">
              <Textarea
                placeholder={t("ai.jsonPlaceholder")}
                value={jsonInput}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="font-mono text-xs min-h-[200px] resize-none"
                spellCheck={false}
              />
              {parseSuccess && (
                <div className="absolute top-2 right-2 flex items-center gap-1 text-green-500 text-xs">
                  <CheckCircle2 className="h-3 w-3" />
                  {t("ai.validJson")}
                </div>
              )}
            </div>

            {parseError && (
              <div className="flex items-center gap-2 text-destructive text-xs">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                {parseError}
              </div>
            )}

            <Button
              className="w-full gap-2"
              onClick={handleApply}
              disabled={!jsonInput.trim() || !!parseError || !parseSuccess}
            >
              <Play className="h-4 w-4" />
              {t("ai.applyJson")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
