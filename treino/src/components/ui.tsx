import { useEffect, useState, type ReactNode } from 'react';

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cx('rounded-2xl border border-slate-800 bg-slate-900/70 p-4', onClick && 'cursor-pointer active:scale-[0.99] transition', className)}
    >
      {children}
    </div>
  );
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  children,
  onClick,
  variant = 'primary',
  className,
  disabled,
  type = 'button',
  full,
  'aria-label': ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
  full?: boolean;
  'aria-label'?: string;
}) {
  const styles: Record<BtnVariant, string> = {
    primary: 'bg-accent text-slate-950 font-semibold hover:brightness-110',
    secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700',
    ghost: 'bg-transparent text-slate-300 hover:bg-slate-800',
    danger: 'bg-red-500/15 text-red-300 hover:bg-red-500/25',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm transition active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none',
        styles[variant],
        full && 'w-full',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Chip({ active, children, onClick, className }: { active?: boolean; children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'rounded-xl border px-3 py-2 text-sm transition text-left',
        active ? 'border-accent bg-accent/15 text-slate-50' : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function OptionCard({
  active,
  title,
  desc,
  onClick,
  icon,
}: {
  active?: boolean;
  title: string;
  desc?: string;
  onClick: () => void;
  icon?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition',
        active ? 'border-accent bg-accent/10' : 'border-slate-800 bg-slate-900 hover:border-slate-600',
      )}
    >
      {icon && <span className="text-2xl leading-none">{icon}</span>}
      <span>
        <span className="block font-semibold text-slate-100">{title}</span>
        {desc && <span className="mt-0.5 block text-sm text-slate-400">{desc}</span>}
      </span>
    </button>
  );
}

export function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, Math.round(v / step) * step)));
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => set(value - step)} className="h-12 w-12 rounded-xl bg-slate-800 text-2xl active:bg-slate-700" aria-label="Diminuir">
        −
      </button>
      <div className="min-w-24 text-center text-2xl font-bold tabular-nums">
        {value}
        {suffix && <span className="ml-1 text-base font-normal text-slate-400">{suffix}</span>}
      </div>
      <button type="button" onClick={() => set(value + step)} className="h-12 w-12 rounded-xl bg-slate-800 text-2xl active:bg-slate-700" aria-label="Aumentar">
        +
      </button>
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  suffix,
  placeholder,
  step = 'any',
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  suffix?: string;
  placeholder?: string;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-slate-400">{label}</span>
      <div className="flex items-center rounded-xl border border-slate-700 bg-slate-900 focus-within:border-accent">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value.replace(',', '.')))}
          className="w-full bg-transparent px-3 py-3 text-lg outline-none"
        />
        {suffix && <span className="pr-3 text-slate-500">{suffix}</span>}
      </div>
    </label>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-2 mt-6 flex items-center justify-between">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{children}</h2>
      {right}
    </div>
  );
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'accent' | 'warn' | 'ok' | 'info' }) {
  const t = {
    default: 'bg-slate-800 text-slate-300',
    accent: 'bg-accent/15 text-accent',
    warn: 'bg-amber-500/15 text-amber-300',
    ok: 'bg-emerald-500/15 text-emerald-300',
    info: 'bg-sky-500/15 text-sky-300',
  }[tone];
  return <span className={cx('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', t)}>{children}</span>;
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <div
        className="animate-pop safe-bottom max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-slate-800 bg-slate-900 p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800" aria-label="Fechar">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Ring({ value, size = 64, stroke = 7, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#1e293b" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--accent)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: 'stroke-dashoffset .4s' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">{children}</div>
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

/** Seção recolhível: título sempre visível, conteúdo ao tocar. */
export function Collapsible({
  title,
  subtitle,
  icon,
  children,
  defaultOpen = false,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cx('rounded-2xl border border-slate-800 bg-slate-900/70', className)}>
      <button className="flex w-full items-center gap-3 p-4 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
        {icon && <span className="text-xl leading-none">{icon}</span>}
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{title}</span>
          {subtitle && <span className="block text-xs text-slate-400">{subtitle}</span>}
        </span>
        <span className={cx('text-slate-500 transition', open && 'rotate-180')}>▾</span>
      </button>
      {open && <div className="border-t border-slate-800 p-4 pt-3">{children}</div>}
    </div>
  );
}
