export default function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      role="status"
      aria-label="Chargement"
    />
  );
}

export function PageLoader({ label = 'Chargement...' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
      <Spinner className="h-8 w-8 text-togo-green" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
