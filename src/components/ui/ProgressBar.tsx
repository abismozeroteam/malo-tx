export function ProgressBar({ value, label }: { value: number; label: string }) {
  const percent = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} className="h-1.75 w-full rounded-sm bg-track">
      <div className="h-full rounded-sm bg-brand-bright" style={{ width: `${percent}%` }} />
    </div>
  );
}
