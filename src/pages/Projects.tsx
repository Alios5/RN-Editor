import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Music, FolderOpen, Package, FileText, Keyboard, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectListItem } from "@/components/ProjectListItem";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ShortcutsDialog } from "@/components/ShortcutsDialog";
import { ThemeEditor } from "@/components/ThemeEditor";
import { getProjects, createProject, deleteProject } from "@/utils/localStorage";
import { openProjectFile, saveProjectToFile } from "@/utils/fileSystem";
import { copyMusicToProjectFolder } from "@/utils/musicManager";
import { join, basename } from "@tauri-apps/api/path";
import { Project } from "@/types/project";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { panelColors } from "@/lib/panelColors";

// Import version from package.json
const APP_VERSION = "0.2.5";

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isShortcutsDialogOpen, setIsShortcutsDialogOpen] = useState(false);
  const [isThemeEditorOpen, setIsThemeEditorOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  const handleCreateProject = async (name: string, projectFolder?: string, musicPath?: string, musicFileName?: string) => {
    try {
      let finalMusicPath = musicPath;
      let finalMusicFileName = musicFileName;
      
      // If music is provided and a project folder is specified
      if (musicPath && projectFolder) {
        // Copy the music to the project folder
        const copiedPath = await copyMusicToProjectFolder(musicPath, projectFolder);
        if (copiedPath) {
          finalMusicPath = copiedPath;
          finalMusicFileName = await basename(copiedPath);
          toast.success(t("audio.copySuccess"));
        }
      }
      
      const newProject = createProject(name, projectFolder, finalMusicPath, finalMusicFileName);
      
      // If a project folder is specified, save the RNE file immediately
      if (projectFolder) {
        const rneFilePath = await join(projectFolder, `${name}.rne`);
        await saveProjectToFile(newProject, rneFilePath);
        newProject.filePath = rneFilePath;
      }
      
      setProjects(getProjects());
      toast.success(t("project.createSuccess", { name }));
      navigate(`/editor/${newProject.id}`);
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error(t("project.createError"));
    }
  };

  const handleOpenProject = (id: string) => {
    navigate(`/editor/${id}`);
  };

  const handleDeleteProject = (id: string) => {
    const project = projects.find(p => p.id === id);
    deleteProject(id);
    setProjects(getProjects());
    toast.success(t("project.deleteSuccess", { name: project?.name || "" }));
  };

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden">
      {/* Header Principal */}
      <header className="border-b border-border backdrop-blur-md" style={{ backgroundColor: panelColors.background() }}>
        <div className="w-full px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-primary p-0.5">
                <div className="w-full h-full bg-background rounded-md overflow-hidden flex items-center justify-center">
                  <img src="/logo.png" alt="RhythmNator Logo" className="w-8 h-8 object-cover" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold leading-tight" style={{ fontFamily: 'Audiowide, sans-serif' }}>{t("app.name")}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: panelColors.sectionBackground() }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md"
                  onClick={() => setIsThemeEditorOpen(true)}
                  title={t("theme.editor")}
                >
                  <Palette className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md"
                  onClick={() => setIsShortcutsDialogOpen(true)}
                  title={t("shortcuts.title")}
                >
                  <Keyboard className="h-4 w-4" />
                </Button>
                <LanguageSelector />
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Dialog des raccourcis */}
      <ShortcutsDialog
        open={isShortcutsDialogOpen}
        onOpenChange={setIsShortcutsDialogOpen}
      />

      {/* Éditeur de thème */}
      <ThemeEditor
        open={isThemeEditorOpen}
        onOpenChange={setIsThemeEditorOpen}
      />

      {/* Main Content avec Grid Layout */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="h-full grid grid-cols-12 gap-6">
          {/* Colonne Gauche - Sections Project et Release Note */}
          <div className="col-span-3 space-y-6 overflow-y-auto">
            {/* Section PROJECT */}
            <Card className="backdrop-blur-sm hover:scale-100 transition-none shadow-sm">
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md flex items-center justify-center" style={{ backgroundColor: panelColors.iconBackground() }}>
                    <Music className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-foreground">{t("project.title")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  variant="default"
                  className="w-full justify-start gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {t("project.new")}
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      const project = await openProjectFile();
                      if (project) {
                        navigate(`/editor/${project.id}`);
                      }
                    } catch (error) {
                      console.error("Erreur lors de l'ouverture:", error);
                      toast.error(t("project.openError"));
                    }
                  }}
                  variant="secondary"
                  className="w-full justify-start gap-2"
                >
                  <FolderOpen className="h-4 w-4" />
                  {t("project.open")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                >
                  <FileText className="h-4 w-4" />
                  {t("project.documentation")}
                </Button>
              </CardContent>
            </Card>

            {/* Section RELEASE NOTE */}
            <Card className="backdrop-blur-sm hover:scale-100 transition-none shadow-sm">
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md flex items-center justify-center" style={{ backgroundColor: panelColors.iconBackground() }}>
                    <Package className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-foreground">{t("release.title")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t("release.noReleases")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Colonne Droite - Section Recent Projects */}
          <div className="col-span-9 overflow-hidden">
            <Card className="h-full backdrop-blur-sm hover:scale-100 transition-none shadow-sm flex flex-col">
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md flex items-center justify-center" style={{ backgroundColor: panelColors.iconBackground() }}>
                    <Music className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-foreground">{t("project.recent")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                {projects.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center max-w-md">
                      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/20 mx-auto" style={{ backgroundColor: panelColors.iconBackground() }}>
                        <Music className="h-10 w-10 text-primary" />
                      </div>
                      <h3 className="mb-2 text-xl font-semibold">{t("project.noProjects")}</h3>
                      <p className="mb-6 text-sm text-muted-foreground">
                        {t("project.noProjectsDescription")}
                      </p>
                      <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        {t("project.createProject")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.map((project) => (
                      <ProjectListItem
                        key={project.id}
                        project={project}
                        onClick={handleOpenProject}
                        onDelete={handleDeleteProject}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreate={handleCreateProject}
      />

      {/* Version badge - subtle */}
      <div className="fixed bottom-3 right-3 px-2 py-1 rounded-md bg-secondary/20 backdrop-blur-sm border border-border/30">
        <span className="text-xs text-muted-foreground/70 font-mono">v{APP_VERSION} Dev</span>
      </div>
    </div>
  );
};

export default Projects;
