import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMusic, faFolderOpen, faBox, faFileLines, faKeyboard, faPalette } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectListItem } from "@/components/ProjectListItem";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ShortcutsDialog } from "@/components/ShortcutsDialog";
import { ThemeEditor } from "@/components/ThemeEditor";
import { FontSelectorButton } from "@/components/FontSelector";
import { getProjects, createProject, deleteProject } from "@/utils/localStorage";
import { openProjectFile, saveProjectToFile } from "@/utils/fileSystem";
import { copyMusicToProjectFolder } from "@/utils/musicManager";
import { join, basename } from "@tauri-apps/api/path";
import { Project } from "@/types/project";
import { useTranslation } from "@/hooks/useTranslation";
import { panelColors } from "@/lib/panelColors";

// Import version from package.json
const APP_VERSION = "0.3.3";

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

  const handleCreateProject = async (name: string, projectFolder?: string, musicPath?: string, musicFileName?: string, shouldCopyMusic?: boolean) => {
    try {
      let finalMusicPath = musicPath;
      let finalMusicFileName = musicFileName;
      
      // If music is provided and user chose to copy it to project folder
      if (musicPath && projectFolder && shouldCopyMusic) {
        // Copy the music to the project folder
        const copiedPath = await copyMusicToProjectFolder(musicPath, projectFolder);
        if (copiedPath) {
          finalMusicPath = copiedPath;
          finalMusicFileName = await basename(copiedPath);
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
      navigate(`/editor/${newProject.id}`);
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  const handleOpenProject = (id: string) => {
    navigate(`/editor/${id}`);
  };

  const handleDeleteProject = (id: string) => {
    const project = projects.find(p => p.id === id);
    deleteProject(id);
    setProjects(getProjects());
  };

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden">
      {/* Header Principal */}
      <header className="border-b border-border backdrop-blur-md animate-fade-in-down" style={{ backgroundColor: panelColors.background() }}>
        <div className="w-full px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="RhythmNator Logo" className="w-10 h-10 object-cover logo-animate" />
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
                  <FontAwesomeIcon icon={faPalette} className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md"
                  onClick={() => setIsShortcutsDialogOpen(true)}
                  title={t("shortcuts.title")}
                >
                  <FontAwesomeIcon icon={faKeyboard} className="h-4 w-4" />
                </Button>
                <FontSelectorButton />
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
            <Card className="backdrop-blur-sm shadow-sm hover-lift hover-glow animate-slide-in-left stagger-1">
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md flex items-center justify-center icon-bounce" style={{ backgroundColor: panelColors.iconBackground() }}>
                    <FontAwesomeIcon icon={faMusic} className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-foreground">{t("project.title")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  variant="default"
                  className="w-full justify-start gap-2 btn-animate"
                >
                  <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
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
                    }
                  }}
                  variant="secondary"
                  className="w-full justify-start gap-2 btn-animate"
                >
                  <FontAwesomeIcon icon={faFolderOpen} className="h-4 w-4" />
                  {t("project.open")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                >
                  <FontAwesomeIcon icon={faFileLines} className="h-4 w-4" />
                  {t("project.documentation")}
                </Button>
              </CardContent>
            </Card>

            {/* Section RELEASE NOTE */}
            <Card className="backdrop-blur-sm shadow-sm hover-lift hover-glow animate-slide-in-left stagger-2">
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md flex items-center justify-center icon-bounce" style={{ backgroundColor: panelColors.iconBackground() }}>
                    <FontAwesomeIcon icon={faBox} className="h-3.5 w-3.5 text-primary" />
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
            <Card className="h-full backdrop-blur-sm shadow-sm hover-glow flex flex-col animate-slide-in-right stagger-1">
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md flex items-center justify-center icon-bounce" style={{ backgroundColor: panelColors.iconBackground() }}>
                    <FontAwesomeIcon icon={faMusic} className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-foreground">{t("project.recent")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                {projects.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center max-w-md">
                      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/20 mx-auto empty-state-icon" style={{ backgroundColor: panelColors.iconBackground() }}>
                        <FontAwesomeIcon icon={faMusic} className="h-10 w-10 text-primary" />
                      </div>
                      <h3 className="mb-2 text-xl font-semibold">{t("project.noProjects")}</h3>
                      <p className="mb-6 text-sm text-muted-foreground">
                        {t("project.noProjectsDescription")}
                      </p>
                      <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2 btn-animate">
                        <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                        {t("project.createProject")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.map((project, index) => (
                      <ProjectListItem
                        key={project.id}
                        project={project}
                        onClick={handleOpenProject}
                        onDelete={handleDeleteProject}
                        index={index}
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
      <div className="fixed bottom-3 right-3 px-2 py-1 rounded-md bg-secondary/20 backdrop-blur-sm border border-border/30 animate-fade-in-up stagger-3">
        <span className="text-xs text-muted-foreground/70 font-mono">v{APP_VERSION} Beta</span>
      </div>
    </div>
  );
};

export default Projects;
