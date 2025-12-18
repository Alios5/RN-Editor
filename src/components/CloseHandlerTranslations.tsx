import { useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { CloseHandler } from "@/utils/closeHandler";

/**
 * Component that syncs translations to the CloseHandler utility
 * Must be rendered inside LanguageProvider
 */
export const CloseHandlerTranslations = () => {
  const { t } = useTranslation();

  useEffect(() => {
    CloseHandler.setTranslations({
      confirmQuit: t("dialog.confirmQuit"),
      confirmQuitUnsaved: t("dialog.confirmQuitUnsaved"),
      confirm: t("dialog.confirm"),
      quit: t("dialog.quit"),
      cancel: t("dialog.cancel"),
    });
  }, [t]);

  return null;
};
