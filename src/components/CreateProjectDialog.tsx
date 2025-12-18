import { useState } from "react";
import { z } from "zod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder, faMusic } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { selectAudioFile, copyMusicToProjectFolder } from "@/utils/musicManager";
import { basename, dirname } from "@tauri-apps/api/path";
import { CopyMusicDialog } from "@/components/CopyMusicDialog";

const projectNameSchema = z
  .string()
  .trim()
  .min(1, { message: "Le nom du projet est requis" })
  .max(100, { message: "Le nom doit faire moins de 100 caractères" });

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, projectFolder?: string, musicPath?: string, musicFileName?: string, shouldCopyMusic?: boolean) => void;
}

export const CreateProjectDialog = ({ open, onOpenChange, onCreate }: CreateProjectDialogProps) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [folderError, setFolderError] = useState("");
  const [projectFolder, setProjectFolder] = useState<string>("");
  const [musicPath, setMusicPath] = useState<string>("");
  const [musicFileName, setMusicFileName] = useState<string>("");
  const [showCopyMusicDialog, setShowCopyMusicDialog] = useState(false);
  const [pendingMusicPath, setPendingMusicPath] = useState<string | null>(null);
  const [pendingMusicFileName, setPendingMusicFileName] = useState<string | null>(null);
  const [shouldCopyMusic, setShouldCopyMusic] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = projectNameSchema.safeParse(name);
    
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    // Vérifier que le dossier projet est sélectionné
    if (!projectFolder) {
      setFolderError(t("project.folderRequired"));
      return;
    }

    onCreate(result.data, projectFolder, musicPath || undefined, musicFileName || undefined, shouldCopyMusic);
    setName("");
    setProjectFolder("");
    setMusicPath("");
    setMusicFileName("");
    setShouldCopyMusic(false);
    setError("");
    setFolderError("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setName("");
    setProjectFolder("");
    setMusicPath("");
    setMusicFileName("");
    setShouldCopyMusic(false);
    setError("");
    setFolderError("");
    onOpenChange(false);
  };

  const handleSelectFolder = async () => {
    try {
      const folder = await openDialog({
        directory: true,
        multiple: false
      });
      
      if (folder && !Array.isArray(folder)) {
        setProjectFolder(folder);
        setFolderError(""); // Réinitialiser l'erreur lors de la sélection
      }
    } catch (error) {
      console.error("Erreur lors de la sélection du dossier:", error);
    }
  };

  const handleSelectMusic = async () => {
    try {
      const filePath = await selectAudioFile();
      if (filePath) {
        const fileName = await basename(filePath);
        
        // Check if project folder is selected
        if (projectFolder) {
          const musicDir = await dirname(filePath);
          
          // If music is not in project folder, ask user
          if (musicDir !== projectFolder) {
            setPendingMusicPath(filePath);
            setPendingMusicFileName(fileName);
            setShowCopyMusicDialog(true);
            return;
          }
        }
        
        // Music is already in project folder or no project folder selected
        setMusicPath(filePath);
        setMusicFileName(fileName);
        setShouldCopyMusic(false);
      }
    } catch (error) {
      console.error("Erreur lors de la sélection de la musique:", error);
    }
  };

  const handleConfirmCopyMusic = () => {
    if (pendingMusicPath && pendingMusicFileName) {
      setMusicPath(pendingMusicPath);
      setMusicFileName(pendingMusicFileName);
      setShouldCopyMusic(true);
    }
    setShowCopyMusicDialog(false);
    setPendingMusicPath(null);
    setPendingMusicFileName(null);
  };

  const handleDeclineCopyMusic = () => {
    if (pendingMusicPath && pendingMusicFileName) {
      setMusicPath(pendingMusicPath);
      setMusicFileName(pendingMusicFileName);
      setShouldCopyMusic(false);
    }
    setShowCopyMusicDialog(false);
    setPendingMusicPath(null);
    setPendingMusicFileName(null);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("project.createProject")}</DialogTitle>
          <DialogDescription>
            {t("project.noProjectsDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("project.projectName")}</Label>
              <Input
                id="name"
                placeholder={t("project.projectNamePlaceholder")}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                maxLength={100}
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            
            <div className="grid gap-2">
              <Label>{t("project.projectFolder")} <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <Input
                  value={projectFolder}
                  placeholder={t("project.projectFolderPlaceholder")}
                  readOnly
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={handleSelectFolder}>
                  <FontAwesomeIcon icon={faFolder} className="h-4 w-4" />
                </Button>
              </div>
              {folderError && <p className="text-sm text-destructive">{folderError}</p>}
              <p className="text-xs text-muted-foreground">
                {t("project.projectFolderHint")}
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label>{t("project.music")}</Label>
              <div className="flex gap-2">
                <Input
                  value={musicFileName}
                  placeholder={t("project.musicPlaceholder")}
                  readOnly
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={handleSelectMusic}>
                  <FontAwesomeIcon icon={faMusic} className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("project.musicHint")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleCancel}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit">{t("actions.create")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

      <CopyMusicDialog
        open={showCopyMusicDialog}
        onOpenChange={setShowCopyMusicDialog}
        musicFileName={pendingMusicFileName || ""}
        onConfirm={handleConfirmCopyMusic}
        onDecline={handleDeclineCopyMusic}
      />
    </>
  );
};
