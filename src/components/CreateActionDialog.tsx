import { useState } from "react";
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
import { useTranslation } from "@/hooks/useTranslation";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";

const AVAILABLE_ICONS: { name: string; component: LucideIcon }[] = [
  { name: 'Play', component: Icons.Play },
  { name: 'Pause', component: Icons.Pause },
  { name: 'Stop', component: Icons.Square },
  { name: 'Music', component: Icons.Music },
  { name: 'Volume', component: Icons.Volume2 },
  { name: 'Heart', component: Icons.Heart },
  { name: 'Star', component: Icons.Star },
  { name: 'Circle', component: Icons.Circle },
  { name: 'Square', component: Icons.Square },
  { name: 'Triangle', component: Icons.Triangle },
  { name: 'Zap', component: Icons.Zap },
  { name: 'Bell', component: Icons.Bell },
  { name: 'Flag', component: Icons.Flag },
  { name: 'Bookmark', component: Icons.Bookmark },
  { name: 'Target', component: Icons.Target },
  { name: 'Award', component: Icons.Award },
  { name: 'Crown', component: Icons.Crown },
  { name: 'Flame', component: Icons.Flame },
  { name: 'Sparkles', component: Icons.Sparkles },
  { name: 'Sun', component: Icons.Sun },
  { name: 'Moon', component: Icons.Moon },
  { name: 'Cloud', component: Icons.Cloud },
  { name: 'Umbrella', component: Icons.CloudRain },
  { name: 'Snowflake', component: Icons.Snowflake },
  { name: 'Wind', component: Icons.Wind },
  { name: 'Smile', component: Icons.Smile },
  { name: 'Meh', component: Icons.Meh },
  { name: 'Frown', component: Icons.Frown },
  { name: 'AlertCircle', component: Icons.AlertCircle },
  { name: 'CheckCircle', component: Icons.CheckCircle2 },
  { name: 'XCircle', component: Icons.XCircle },
  { name: 'Info', component: Icons.Info },
  { name: 'HelpCircle', component: Icons.HelpCircle },
  { name: 'Eye', component: Icons.Eye },
  { name: 'EyeOff', component: Icons.EyeOff },
  { name: 'Lock', component: Icons.Lock },
  { name: 'Unlock', component: Icons.Unlock },
  { name: 'Key', component: Icons.Key },
  { name: 'Shield', component: Icons.Shield },
  { name: 'Home', component: Icons.Home },
  { name: 'User', component: Icons.User },
  { name: 'Users', component: Icons.Users },
  { name: 'Settings', component: Icons.Settings },
  { name: 'Tool', component: Icons.Wrench },
  { name: 'Activity', component: Icons.Activity },
  // Additional icons
  { name: 'Plus', component: Icons.Plus },
  { name: 'Minus', component: Icons.Minus },
  { name: 'X', component: Icons.X },
  { name: 'Check', component: Icons.Check },
  { name: 'ChevronUp', component: Icons.ChevronUp },
  { name: 'ChevronDown', component: Icons.ChevronDown },
  { name: 'ChevronLeft', component: Icons.ChevronLeft },
  { name: 'ChevronRight', component: Icons.ChevronRight },
  { name: 'ArrowUp', component: Icons.ArrowUp },
  { name: 'ArrowDown', component: Icons.ArrowDown },
  { name: 'ArrowLeft', component: Icons.ArrowLeft },
  { name: 'ArrowRight', component: Icons.ArrowRight },
  { name: 'Download', component: Icons.Download },
  { name: 'Upload', component: Icons.Upload },
  { name: 'Send', component: Icons.Send },
  { name: 'Mail', component: Icons.Mail },
  { name: 'Phone', component: Icons.Phone },
  { name: 'Calendar', component: Icons.Calendar },
  { name: 'Clock', component: Icons.Clock },
  { name: 'MapPin', component: Icons.MapPin },
  { name: 'Map', component: Icons.Map },
  { name: 'Navigation', component: Icons.Navigation },
  { name: 'Compass', component: Icons.Compass },
  { name: 'Camera', component: Icons.Camera },
  { name: 'Image', component: Icons.Image },
  { name: 'Video', component: Icons.Video },
  { name: 'Film', component: Icons.Film },
  { name: 'Mic', component: Icons.Mic },
  { name: 'Radio', component: Icons.Radio },
  { name: 'Headphones', component: Icons.Headphones },
  { name: 'Speaker', component: Icons.Volume },
  { name: 'Battery', component: Icons.Battery },
  { name: 'Wifi', component: Icons.Wifi },
  { name: 'Bluetooth', component: Icons.Bluetooth },
  { name: 'Cast', component: Icons.Cast },
  { name: 'Monitor', component: Icons.Monitor },
  { name: 'Smartphone', component: Icons.Smartphone },
  { name: 'Tablet', component: Icons.Tablet },
  { name: 'Laptop', component: Icons.Laptop },
  { name: 'Printer', component: Icons.Printer },
  { name: 'Thermometer', component: Icons.Thermometer },
  { name: 'Droplet', component: Icons.Droplet },
  { name: 'Feather', component: Icons.Feather },
  { name: 'Anchor', component: Icons.Anchor },
  { name: 'Airplay', component: Icons.Airplay },
  { name: 'Aperture', component: Icons.Aperture },
  { name: 'Archive', component: Icons.Archive },
  { name: 'AtSign', component: Icons.AtSign },
  { name: 'Box', component: Icons.Box },
  { name: 'Briefcase', component: Icons.Briefcase },
  { name: 'Coffee', component: Icons.Coffee },
  { name: 'Command', component: Icons.Command },
  { name: 'Cpu', component: Icons.Cpu },
  { name: 'CreditCard', component: Icons.CreditCard },
  { name: 'Database', component: Icons.Database },
  { name: 'Disc', component: Icons.Disc },
  { name: 'DollarSign', component: Icons.DollarSign },
  { name: 'FileText', component: Icons.FileText },
  { name: 'Filter', component: Icons.Filter },
  { name: 'Folder', component: Icons.Folder },
  { name: 'Gift', component: Icons.Gift },
  { name: 'GitBranch', component: Icons.GitBranch },
  { name: 'Globe', component: Icons.Globe },
  { name: 'Grid', component: Icons.Grid3x3 },
  { name: 'Hash', component: Icons.Hash },
  { name: 'Inbox', component: Icons.Inbox },
  { name: 'Layers', component: Icons.Layers },
  { name: 'Layout', component: Icons.Layout },
  { name: 'Link', component: Icons.Link },
  { name: 'List', component: Icons.List },
  { name: 'Loader', component: Icons.Loader },
  { name: 'MessageCircle', component: Icons.MessageCircle },
  { name: 'Package', component: Icons.Package },
  { name: 'Paperclip', component: Icons.Paperclip },
  { name: 'Percent', component: Icons.Percent },
  { name: 'PieChart', component: Icons.PieChart },
  { name: 'Power', component: Icons.Power },
  { name: 'Repeat', component: Icons.Repeat },
  { name: 'RotateCw', component: Icons.RotateCw },
  { name: 'RotateCcw', component: Icons.RotateCcw },
  { name: 'Save', component: Icons.Save },
  { name: 'Search', component: Icons.Search },
  { name: 'Share', component: Icons.Share2 },
  { name: 'ShoppingCart', component: Icons.ShoppingCart },
  { name: 'Shuffle', component: Icons.Shuffle },
  { name: 'Sidebar', component: Icons.PanelLeft },
  { name: 'Sliders', component: Icons.Sliders },
  { name: 'Tag', component: Icons.Tag },
  { name: 'Terminal', component: Icons.Terminal },
  { name: 'ThumbsUp', component: Icons.ThumbsUp },
  { name: 'ThumbsDown', component: Icons.ThumbsDown },
  { name: 'Trash', component: Icons.Trash2 },
  { name: 'TrendingUp', component: Icons.TrendingUp },
  { name: 'TrendingDown', component: Icons.TrendingDown },
  { name: 'Tv', component: Icons.Tv },
  { name: 'Type', component: Icons.Type },
  { name: 'Umbrella', component: Icons.Umbrella },
  { name: 'Watch', component: Icons.Watch },
];

interface CreateActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, icon: string) => void;
  existingActionNames: string[];
}

export const CreateActionDialog = ({
  open,
  onOpenChange,
  onCreate,
  existingActionNames,
}: CreateActionDialogProps) => {
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Zap");
  const [error, setError] = useState("");
  const { t } = useTranslation();

  const handleCreate = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError(t("action.errorNameRequired"));
      return;
    }

    if (existingActionNames.includes(trimmedName)) {
      setError(t("action.errorNameExists"));
      return;
    }

    onCreate(trimmedName, selectedIcon);
    setName("");
    setSelectedIcon("Zap");
    setError("");
    onOpenChange(false);
  };

  const handleNameChange = (value: string) => {
    setName(value.slice(0, 50));
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("action.createAction")}</DialogTitle>
          <DialogDescription>
            {t("action.createActionDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="action-name">{t("action.actionName")}</Label>
            <Input
              id="action-name"
              placeholder={t("action.actionNamePlaceholder")}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t("action.actionIcon")}</Label>
            <div className="grid grid-cols-8 gap-2 p-4 border rounded-lg bg-muted/30 max-h-64 overflow-y-auto">
              {AVAILABLE_ICONS.map((icon) => {
                const IconComponent = icon.component;
                return (
                  <button
                    key={icon.name}
                    type="button"
                    onClick={() => setSelectedIcon(icon.name)}
                    className={`p-3 rounded-lg border transition-all hover:bg-accent ${selectedIcon === icon.name
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border"
                      }`}
                    title={icon.name}
                  >
                    <IconComponent className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prévisualisation */}
          {selectedIcon && name && (
            <div className="p-4 border rounded-lg bg-accent/50">
              <p className="text-sm text-muted-foreground mb-2">
                {t("action.preview") || "Prévisualisation"}
              </p>
              <div className="flex items-center gap-2">
                {(() => {
                  const IconComponent = AVAILABLE_ICONS.find(i => i.name === selectedIcon)?.component;
                  return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
                })()}
                <span className="font-medium">{name}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("actions.cancel")}
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>
            {t("actions.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
