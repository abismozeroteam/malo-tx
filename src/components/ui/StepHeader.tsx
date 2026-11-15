import { es } from "@/content/es";
import { cx } from "./cx";
import { Icon } from "./Icon";

export function StepHeader({ title, step, onBack }: { title: string; step: 1 | 2 | 3; onBack?: () => void }) {
  return (
    <header className="flex w-full flex-col gap-4">
      <div className="flex items-center gap-4">
        <button type="button" onClick={onBack} aria-label={es.debtForm.back} className="-ml-1 p-1 text-ink">
          <Icon name="back" className="size-6" />
        </button>
        <p className="flex-1 text-lead font-semibold text-ink">{title}</p>
      </div>
      <div className="flex items-center justify-between text-caption font-semibold text-brand-ink">
        <span>{es.debtForm.kicker}</span>
        <span>{es.debtForm.stepOf(step)}</span>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3].map((n) => (
          <span key={n} className={cx("h-1 flex-1 rounded-full", n <= step ? "bg-brand" : "bg-track")} />
        ))}
      </div>
    </header>
  );
}
