import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Upload, RotateCcw, Palette, Copy, Check, Save, Trash2 } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { useTranslation } from "@/hooks/useTranslation";
import { Theme } from "@/types/theme";
import { 
  loadTheme, 
  applyTheme, 
  exportTheme, 
  importTheme, 
  resetToDefaultTheme,
  hslToHex,
  hexToHsl,
  getSavedThemes,
  saveCustomTheme,
  deleteCustomTheme,
  isBuiltinTheme
} from "@/utils/themeManager";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface ThemeEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ColorCategory = "base" | "interactive" | "status" | "borders" | "panels" | "tracks";

const COLOR_CATEGORIES: Record<ColorCategory, Array<keyof Theme['colors']>> = {
  base: ["background", "foreground", "card", "cardForeground"],
  interactive: ["primary", "primaryForeground", "secondary", "secondaryForeground", "accent", "accentForeground", "gradientStart", "gradientEnd"],
  status: ["muted", "mutedForeground", "destructive", "destructiveForeground"],
  borders: ["border", "input", "ring", "popover", "popoverForeground"],
  panels: ["panelBackground", "panelBorder", "panelIconBackground", "panelInputBackground", "panelSectionBackground"],
  tracks: ["trackBorder", "trackGridLine", "trackMeasureLine", "waveformColor"],
};

export const ThemeEditor = ({ open, onOpenChange }: ThemeEditorProps) => {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<Theme>(loadTheme());
  const [editingColor, setEditingColor] = useState<keyof Theme['colors'] | null>(null);
  const [currentHex, setCurrentHex] = useState("#000000");
  const [copied, setCopied] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [savedThemes, setSavedThemes] = useState<Theme[]>(getSavedThemes());
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveThemeName, setSaveThemeName] = useState("");
  const [themeToDelete, setThemeToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTheme(loadTheme());
      setSavedThemes(getSavedThemes());
    }
  }, [open]);

  const handleColorClick = (colorKey: keyof Theme['colors']) => {
    setEditingColor(colorKey);
    const hex = hslToHex(theme.colors[colorKey]);
    setCurrentHex(hex);
    setCopied(false);
    setPopoverOpen(true);
  };

  const handleColorChange = (hex: string) => {
    setCurrentHex(hex);
    setCopied(false);
    
    if (editingColor) {
      const hsl = hexToHsl(hex);
      setTheme({
        ...theme,
        colors: {
          ...theme.colors,
          [editingColor]: hsl,
        },
      });
    }
  };

  const handleCopyHex = () => {
    navigator.clipboard.writeText(currentHex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    applyTheme(theme);
    toast.success(t("theme.applySuccess"));
    onOpenChange(false);
  };

  const handleExport = async () => {
    try {
      await exportTheme(theme);
      toast.success(t("theme.exportSuccess"));
    } catch (error) {
      toast.error(t("theme.exportError"));
    }
  };

  const handleImport = async () => {
    try {
      const importedTheme = await importTheme();
      if (importedTheme) {
        setTheme(importedTheme);
        applyTheme(importedTheme);
        toast.success(t("theme.importSuccess"));
      }
    } catch (error) {
      toast.error(t("theme.importError"));
    }
  };

  const handleReset = () => {
    resetToDefaultTheme();
    setTheme(loadTheme());
    toast.success(t("theme.resetSuccess"));
  };

  const handleLoadTheme = (themeName: string) => {
    const selectedTheme = savedThemes.find(t => t.name === themeName);
    if (selectedTheme) {
      setTheme(selectedTheme);
    }
  };

  const handleSaveTheme = () => {
    if (!saveThemeName.trim()) {
      toast.error(t("theme.nameRequired") || "Le nom du thème est requis");
      return;
    }

    try {
      const themeToSave = { ...theme, name: saveThemeName.trim() };
      saveCustomTheme(themeToSave);
      setSavedThemes(getSavedThemes());
      setTheme(themeToSave);
      applyTheme(themeToSave);
      setShowSaveDialog(false);
      setSaveThemeName("");
      toast.success(t("theme.saveSuccess") || "Thème sauvegardé avec succès");
    } catch (error) {
      toast.error(t("theme.saveError") || "Erreur lors de la sauvegarde du thème");
    }
  };

  const handleDeleteTheme = () => {
    if (!themeToDelete) return;

    if (isBuiltinTheme(themeToDelete)) {
      toast.error(t("theme.cannotDeleteBuiltin") || "Impossible de supprimer un thème intégré");
      return;
    }

    try {
      deleteCustomTheme(themeToDelete);
      setSavedThemes(getSavedThemes());
      setThemeToDelete(null);
      toast.success(t("theme.deleteSuccess") || "Thème supprimé avec succès");
    } catch (error) {
      toast.error(t("theme.deleteError") || "Erreur lors de la suppression du thème");
    }
  };

  const handleImportAndSave = async () => {
    try {
      const importedTheme = await importTheme();
      if (importedTheme) {
        // Generate a unique name if the theme name already exists
        const { generateUniqueThemeName } = await import('@/utils/themeManager');
        const uniqueName = generateUniqueThemeName(importedTheme.name, savedThemes);
        const themeWithUniqueName = { ...importedTheme, name: uniqueName };
        
        setTheme(themeWithUniqueName);
        setSaveThemeName(uniqueName);
        setShowSaveDialog(true);
        toast.success(t("theme.importSuccess"));
      }
    } catch (error) {
      toast.error(t("theme.importError"));
    }
  };

  const renderColorBox = (colorKey: keyof Theme['colors'], label: string) => {
    const isSelected = editingColor === colorKey && popoverOpen;
    const hsl = theme.colors[colorKey];
    
    return (
      <Popover key={colorKey} open={isSelected} onOpenChange={(open) => {
        if (!open && editingColor === colorKey) {
          setPopoverOpen(false);
          setEditingColor(null);
        }
      }}>
        <PopoverTrigger asChild>
          <div
            className={`cursor-pointer rounded-lg p-3 border-2 transition-all ${
              isSelected ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background" : "border-border hover:border-primary/50"
            }`}
            onClick={() => handleColorClick(colorKey)}
          >
            <div
              className="w-full h-12 rounded mb-2"
              style={{ backgroundColor: `hsl(${hsl})` }}
            />
            <p className="text-xs font-medium truncate">{label}</p>
            <p className="text-xs text-muted-foreground font-mono">{hsl}</p>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80" side="top">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">{label}</h4>
            
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <HexColorPicker 
                  color={editingColor === colorKey ? currentHex : hslToHex(hsl)} 
                  onChange={handleColorChange} 
                  style={{ width: '180px', height: '180px' }} 
                />
              </div>
              
              <div className="flex-1 space-y-2">
                <div>
                  <Label className="text-xs mb-1 block">{t("theme.hexColor")}</Label>
                  <div className="flex gap-1">
                    <Input
                      value={editingColor === colorKey ? currentHex : hslToHex(hsl)}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="font-mono text-xs h-8"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleCopyHex}
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs mb-1 block">{t("theme.hslColor")}</Label>
                  <Input
                    value={hsl}
                    readOnly
                    className="font-mono text-xs h-8"
                  />
                </div>

                <div>
                  <Label className="text-xs mb-1 block">{t("theme.preview")}</Label>
                  <div className="h-16 rounded border-2 border-border" style={{ backgroundColor: editingColor === colorKey ? currentHex : hslToHex(hsl) }} />
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  const renderCategoryColors = (category: ColorCategory) => {
    return (
      <div className="grid grid-cols-2 gap-3">
        {COLOR_CATEGORIES[category].map((colorKey) => {
          // Try to get translation first, fallback to camelCase conversion
          const translationKey = `theme.${colorKey}`;
          const label = t(translationKey) !== translationKey 
            ? t(translationKey) 
            : colorKey.replace(/([A-Z])/g, ' $1').trim();
          return renderColorBox(colorKey, label);
        })}
      </div>
    );
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t("theme.editor")}
          </DialogTitle>
          <DialogDescription>
            {t("theme.editorDescription")}
          </DialogDescription>
        </DialogHeader>

        {/* Theme Selector */}
        <div className="flex items-center gap-3 px-1">
          <div className="flex-1">
            <Label className="text-xs mb-1.5 block">{t("theme.selectTheme") || "Sélectionner un thème"}</Label>
            <Select value={theme.name} onValueChange={handleLoadTheme}>
              <SelectTrigger>
                <SelectValue placeholder={t("theme.selectTheme") || "Sélectionner un thème"} />
              </SelectTrigger>
              <SelectContent>
                {savedThemes.map((t) => (
                  <SelectItem key={t.name} value={t.name}>
                    <div className="flex items-center justify-between w-full">
                      <span>{t.name}</span>
                      {!isBuiltinTheme(t.name) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 ml-2 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setThemeToDelete(t.name);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            className="gap-2 mt-5"
            onClick={() => {
              setSaveThemeName(theme.name);
              setShowSaveDialog(true);
            }}
          >
            <Save className="h-4 w-4" />
            {t("theme.saveAs") || "Enregistrer sous"}
          </Button>
        </div>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="base" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="base">{t("theme.categoryBase")}</TabsTrigger>
              <TabsTrigger value="interactive">{t("theme.categoryInteractive")}</TabsTrigger>
              <TabsTrigger value="status">{t("theme.categoryStatus")}</TabsTrigger>
              <TabsTrigger value="borders">{t("theme.categoryBorders")}</TabsTrigger>
              <TabsTrigger value="panels">{t("theme.categoryPanels")}</TabsTrigger>
              <TabsTrigger value="tracks">{t("theme.categoryTracks") || "Pistes"}</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              <TabsContent value="base">{renderCategoryColors("base")}</TabsContent>
              <TabsContent value="interactive">{renderCategoryColors("interactive")}</TabsContent>
              <TabsContent value="status">{renderCategoryColors("status")}</TabsContent>
              <TabsContent value="borders">{renderCategoryColors("borders")}</TabsContent>
              <TabsContent value="panels">{renderCategoryColors("panels")}</TabsContent>
              <TabsContent value="tracks">{renderCategoryColors("tracks")}</TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleImportAndSave} className="gap-2">
              <Upload className="h-4 w-4" />
              {t("theme.import")}
            </Button>
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              {t("theme.export")}
            </Button>
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              {t("theme.reset")}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("actions.cancel")}
            </Button>
            <Button onClick={handleApply}>
              {t("theme.apply")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Save Theme Dialog */}
    <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("theme.saveTheme") || "Enregistrer le thème"}</DialogTitle>
          <DialogDescription>
            {t("theme.saveThemeDescription") || "Donnez un nom à votre thème personnalisé"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="theme-name">{t("theme.themeName") || "Nom du thème"}</Label>
            <Input
              id="theme-name"
              value={saveThemeName}
              onChange={(e) => setSaveThemeName(e.target.value)}
              placeholder={t("theme.themeNamePlaceholder") || "Mon thème personnalisé"}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveTheme();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
            {t("actions.cancel")}
          </Button>
          <Button onClick={handleSaveTheme}>
            <Save className="h-4 w-4 mr-2" />
            {t("actions.save") || "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete Theme Dialog */}
    <AlertDialog open={!!themeToDelete} onOpenChange={(open) => !open && setThemeToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("theme.deleteTheme") || "Supprimer le thème"}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("theme.deleteThemeDescription") || `Êtes-vous sûr de vouloir supprimer le thème "${themeToDelete}" ? Cette action est irréversible.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("actions.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteTheme}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t("actions.delete") || "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};
