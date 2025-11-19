import { Note } from "./note";

export interface Track {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  order: number;
  createdAt: string;
  notes?: Note[];
  groupId?: string; // ID du groupe auquel appartient la piste (optionnel)
  assignedKey?: string; // Touche du clavier assignée pour la création de notes en temps réel
}
