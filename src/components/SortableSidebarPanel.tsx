import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGripVertical } from "@fortawesome/free-solid-svg-icons";
import { ReactNode } from "react";

interface SortableSidebarPanelProps {
  id: string;
  children: ReactNode;
}

export const SortableSidebarPanel = ({ id, children }: SortableSidebarPanelProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Drag handle - zone de prise */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-4 right-4 z-10 p-1.5 rounded-md cursor-grab active:cursor-grabbing hover:bg-secondary/50 transition-colors"
        title="Glisser pour réorganiser"
      >
        <FontAwesomeIcon icon={faGripVertical} className="h-4 w-4 text-muted-foreground" />
      </div>
      {children}
    </div>
  );
};
