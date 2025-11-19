interface LassoSelectionProps {
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
}

export const LassoSelection = ({ startPoint, endPoint }: LassoSelectionProps) => {
  const left = Math.min(startPoint.x, endPoint.x);
  const top = Math.min(startPoint.y, endPoint.y);
  const width = Math.abs(endPoint.x - startPoint.x);
  const height = Math.abs(endPoint.y - startPoint.y);

  return (
    <div
      className="absolute pointer-events-none border-2 border-blue-500 bg-blue-500/20 rounded z-50"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
    />
  );
};
