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
import { STYLES, VALIDATION, truncateToMaxLength } from "@/lib/designTokens";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => void;
  existingGroupNames: string[];
}

export const CreateGroupDialog = ({ open, onOpenChange, onCreate, existingGroupNames }: CreateGroupDialogProps) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const { t } = useTranslation();

  const handleCreate = () => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError(t("group.errorNameRequired"));
      return;
    }
    
    if (existingGroupNames.includes(trimmedName)) {
      setError(t("group.errorNameExists"));
      return;
    }
    
    onCreate(trimmedName);
    setName("");
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
          <DialogTitle>{t("group.createGroup")}</DialogTitle>
          <DialogDescription>
            {t("group.createGroupDescription")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">{t("group.groupName")}</Label>
            <Input
              id="group-name"
              placeholder={t("group.groupNamePlaceholder")}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
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
          <Button onClick={handleCreate} disabled={!name.trim()}>
            {t("actions.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
