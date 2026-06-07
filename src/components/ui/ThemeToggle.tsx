import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
      className={`relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:border-togo-green hover:text-togo-green dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-togo-yellow dark:hover:text-togo-yellow ${className}`}
    >
      <Sun
        className={`h-5 w-5 transition-all duration-300 ${isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
      />
      <Moon
        className={`absolute h-5 w-5 transition-all duration-300 ${isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`}
      />
    </button>
  );
}
