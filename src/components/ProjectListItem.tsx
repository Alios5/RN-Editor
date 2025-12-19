import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMusic, faTrash, faFileLines } from "@fortawesome/free-solid-svg-icons";
import { Project } from "@/types/project";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { panelColors } from "@/lib/panelColors";
import { useTranslation } from "@/hooks/useTranslation";

interface ProjectListItemProps {
  project: Project;
  onClick: (id: string) => void;
  onDelete: (id: string) => void;
  index?: number;
}

export const ProjectListItem = ({ project, onClick, onDelete, index = 0 }: ProjectListItemProps) => {
  const { t } = useTranslation();
  const formattedDate = new Date(project.createdAt).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div 
      className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/30 project-item group animate-fade-in-up" 
      style={{ 
        backgroundColor: panelColors.inputBackground(),
        animationDelay: `${index * 0.08}s`,
        opacity: 0
      }}
    >
      <button
        onClick={() => onClick(project.id)}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-md gradient-primary flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
          {project.filePath ? (
            <FontAwesomeIcon icon={faFileLines} className="h-5 w-5 text-primary-foreground" />
          ) : (
            <FontAwesomeIcon icon={faMusic} className="h-5 w-5 text-primary-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{project.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
            {project.filePath && (
              <>
                <span className="text-xs text-muted-foreground/50">•</span>
                <p className="text-xs text-muted-foreground/70 truncate flex-1">
                  {project.filePath}
                </p>
              </>
            )}
          </div>
        </div>
      </button>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive rounded-md"
            onClick={(e) => e.stopPropagation()}
          >
            <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("project.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("project.deleteConfirm", { name: project.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(project.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
