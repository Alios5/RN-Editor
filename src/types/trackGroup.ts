export interface TrackGroup {
  id: string;
  name: string;
  visible: boolean; // If false, all tracks in the group are hidden
  collapsed: boolean; // If true, the track list is collapsed
}
