import { useState, useEffect } from "react";
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
import { TrackGroup } from "@/types/trackGroup";
import { useTranslation } from "@/hooks/useTranslation";
import { STYLES, VALIDATION, truncateToMaxLength } from "@/lib/designTokens";

interface EditGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (name: string) => void;
  group: TrackGroup | null;
  existingGroupNames: string[];
}

export const EditGroupDialog = ({ open, onOpenChange, onEdit, group, existingGroupNames }: EditGroupDialogProps) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    if (group) {
      setName(group.name);
      setError("");
    }
  }, [group]);

  const handleEdit = () => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError(t("group.errorNameRequired"));
      return;
    }
    
    // Vérifier si le nom existe déjà (sauf si c'est le nom actuel du groupe)
    if (existingGroupNames.includes(trimmedName) && trimmedName !== group?.name) {
      setError(t("group.errorNameExists"));
      return;
    }
    
    onEdit(trimmedName);
    setError("");
    onOpenChange(false);
  };

  const handleNameChange = (value: string) => {
    setName(truncateToMaxLength(value, VALIDATION.maxNameLength));
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("group.editGroup")}</DialogTitle>
          <DialogDescription>
            {t("group.editGroupDescription")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-group-name">{t("group.groupName")}</Label>
            <Input
              id="edit-group-name"
              placeholder={t("group.groupNamePlaceholder")}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEdit()}
              className={error ? "border-destructive" : ""}
            />
            {error && (
              <p className={STYLES.errorMessage}>{error}</p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("actions.cancel")}
          </Button>
          <Button onClick={handleEdit} disabled={!name.trim()}>
            {t("actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
