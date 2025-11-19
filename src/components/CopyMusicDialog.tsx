import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "@/hooks/useTranslation";

interface CopyMusicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  musicFileName: string;
  onConfirm: () => void;
  onDecline: () => void;
}

export const CopyMusicDialog = ({
  open,
  onOpenChange,
  musicFileName,
  onConfirm,
  onDecline,
}: CopyMusicDialogProps) => {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("audio.copyMusic")}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              {t("audio.copyMusicDescription")}
            </p>
            <p>
              {t("audio.copyMusicRecommendation")}
            </p>
            <p className="text-yellow-600 dark:text-yellow-500 font-medium">
              ⚠️ {t("audio.copyMusic")}
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDecline}>
            {t("actions.decline")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {t("actions.copy")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
