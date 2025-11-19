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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("editor.unsavedChangesTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("editor.unsavedChangesWarning")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onCancel}>
            {t("actions.cancel")}
          </AlertDialogCancel>
          {onSaveAndQuit && (
            <AlertDialogAction onClick={onSaveAndQuit} className="bg-primary">
              {t("editor.saveAndQuit")}
            </AlertDialogAction>
          )}
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {t("editor.quitWithoutSaving")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
