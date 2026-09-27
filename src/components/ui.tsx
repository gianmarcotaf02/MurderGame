import { useState, type ReactNode } from "react";
import { Eye, LoaderCircle, X } from "lucide-react";
import { cn } from "../utils";

/** Grana pellicola + vignettatura cinematografica sopra tutto il resto. */
export function GrainOverlay() {
  return (
    <>
      <div aria-hidden className="vignette pointer-events-none fixed inset-0 z-50" />
      <div aria-hidden className="grain pointer-events-none fixed inset-0 z-50 opacity-[0.05]" />
    </>
  );
}

export function LoadingScreen({ text = "Un momento..." }: { text?: string }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 p-8">
      <LoaderCircle className="animate-spin text-gold-500" size={38} />
      <p className="animate-pulse-soft font-display text-xs tracking-[0.3em] text-parchment-400 uppercase">
        {text}
      </p>
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold-700/50" />
      <h2 className="font-display text-xs tracking-[0.3em] whitespace-nowrap text-gold-400 uppercase">
        {children}
      </h2>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold-700/50" />
    </div>
  );
}

export function OrnamentDivider() {
  return (
    <div className="flex items-center gap-3 text-gold-700" aria-hidden>
      <span className="h-px flex-1 bg-gold-700/40" />
      <span className="font-display text-sm">✦</span>
      <span className="h-px flex-1 bg-gold-700/40" />
    </div>
  );
}

/** Testo sfocato finché non viene toccato: perfetto per segreti e indizi privati. */
export function BlurReveal({ text, className }: { text: string; className?: string }) {
  const [shown, setShown] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setShown(true)}
      disabled={shown}
      className={cn("group relative w-full text-left disabled:cursor-default", className)}
    >
      <span
        className={cn(
          "block transition-all duration-700",
          shown ? "blur-0" : "select-none blur-[6px]",
        )}
      >
        {text}
      </span>
      {!shown && (
        <span className="absolute inset-0 flex items-center justify-center gap-2 font-display text-[11px] tracking-[0.22em] text-gold-400 uppercase opacity-80 transition-opacity group-hover:opacity-100">
          <Eye size={14} /> Tocca per rivelare
        </span>
      )}
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn("noir-card animate-fade-up w-full p-6", wide ? "max-w-xl" : "max-w-md")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="font-display text-base tracking-[0.16em] text-gold-300 uppercase">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-parchment-400 transition-colors hover:text-parchment-100"
            aria-label="Chiudi"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="mb-6 text-lg leading-relaxed text-parchment-200">{message}</p>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Annulla
        </button>
        <button type="button" className={cn("btn", danger ? "btn-blood" : "btn-gold")} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

/** Banner di notifica in-app (sessione scaduta, errori, fallback AI...). */
export function NoticeBanner({ text, tone = "blood" }: { text: string; tone?: "blood" | "gold" }) {
  return (
    <div
      className={cn(
        "animate-fade-in rounded border px-4 py-3 text-base leading-relaxed",
        tone === "blood"
          ? "border-blood-500/50 bg-blood-600/15 text-blood-300"
          : "border-gold-700/50 bg-gold-500/10 text-gold-300",
      )}
    >
      {text}
    </div>
  );
}
