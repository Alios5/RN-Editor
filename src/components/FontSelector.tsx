import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFont } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFont, availableFonts } from "@/contexts/FontContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useState } from "react";

interface FontSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FontSelector = ({ open, onOpenChange }: FontSelectorProps) => {
  const { textFont, titleFont, setTextFont, setTitleFont, getFontValue } = useFont();
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-title">{t("font.title") || "Polices"}</DialogTitle>
          <DialogDescription>
            {t("font.description") || "Personnalisez les polices de l'application"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Text Font */}
          <div className="space-y-2">
            <Label>{t("font.textFont") || "Police du texte"}</Label>
            <Select value={textFont} onValueChange={setTextFont}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableFonts.map((font) => (
                  <SelectItem 
                    key={font.name} 
                    value={font.name}
                    style={{ fontFamily: font.value }}
                  >
                    {font.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p 
              className="text-sm text-muted-foreground p-2 border rounded"
              style={{ fontFamily: getFontValue(textFont) }}
            >
              {t("font.textPreview") || "Aperçu du texte normal"}
            </p>
          </div>

          {/* Title Font */}
          <div className="space-y-2">
            <Label>{t("font.titleFont") || "Police des titres"}</Label>
            <Select value={titleFont} onValueChange={setTitleFont}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableFonts.map((font) => (
                  <SelectItem 
                    key={font.name} 
                    value={font.name}
                    style={{ fontFamily: font.value }}
                  >
                    {font.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p 
              className="text-lg font-semibold p-2 border rounded"
              style={{ fontFamily: getFontValue(titleFont) }}
            >
              {t("font.titlePreview") || "Aperçu des titres"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const FontSelectorButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-md"
        onClick={() => setIsOpen(true)}
        title={t("font.title") || "Polices"}
      >
        <FontAwesomeIcon icon={faFont} className="h-4 w-4" />
      </Button>
      <FontSelector open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};
