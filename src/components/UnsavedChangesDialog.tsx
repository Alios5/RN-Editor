import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTranslation } from "@/hooks/useTranslation";

interface UnsavedChangesDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onSaveAndQuit?: () => void;
}

export function UnsavedChangesDialog({ open, onConfirm, onCancel, onSaveAndQuit }: UnsavedChangesDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("editor.unsavedChangesTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("editor.unsavedChangesWarning")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 overflow-visible">
          <AlertDialogCancel onClick={onCancel} className="rounded-full bg-secondary border-0">
            {t("actions.cancel")}
          </AlertDialogCancel>
          {onSaveAndQuit && (
            <AlertDialogAction onClick={onSaveAndQuit} className="bg-primary rounded-full">
              {t("editor.saveAndQuit")}
            </AlertDialogAction>
          )}
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full">
            {t("editor.quitWithoutSaving")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
