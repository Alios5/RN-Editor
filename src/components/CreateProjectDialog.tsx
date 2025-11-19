import { useState } from "react";
import { z } from "zod";
import { Folder, Music } from "lucide-react";
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
import { selectAudioFile } from "@/utils/musicManager";
import { basename } from "@tauri-apps/api/path";

const projectNameSchema = z
  .string()
  .trim()
  .min(1, { message: "Le nom du projet est requis" })
  .max(100, { message: "Le nom doit faire moins de 100 caractères" });

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, projectFolder?: string, musicPath?: string, musicFileName?: string) => void;
}

export const CreateProjectDialog = ({ open, onOpenChange, onCreate }: CreateProjectDialogProps) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [folderError, setFolderError] = useState("");
  const [projectFolder, setProjectFolder] = useState<string>("");
  const [musicPath, setMusicPath] = useState<string>("");
  const [musicFileName, setMusicFileName] = useState<string>("");
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

    onCreate(result.data, projectFolder, musicPath || undefined, musicFileName || undefined);
    setName("");
    setProjectFolder("");
    setMusicPath("");
    setMusicFileName("");
    setError("");
    setFolderError("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setName("");
    setProjectFolder("");
    setMusicPath("");
    setMusicFileName("");
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
        setMusicPath(filePath);
        const fileName = await basename(filePath);
        setMusicFileName(fileName);
      }
    } catch (error) {
      console.error("Erreur lors de la sélection de la musique:", error);
    }
  };

  return (
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
                  <Folder className="h-4 w-4" />
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
                  <Music className="h-4 w-4" />
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
  );
};
