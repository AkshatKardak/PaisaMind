import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className="group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-all duration-200 ease-in-out hover:border-[var(--primary)] hover:bg-[var(--primary-glow)] hover:text-[var(--primary)]"
    >
      <span
        className={`absolute transition-all duration-300 ease-in-out ${
          isDark ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"
        }`}
      >
        <Sun size={17} />
      </span>
      <span
        className={`absolute transition-all duration-300 ease-in-out ${
          isDark ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        }`}
      >
        <Moon size={17} />
      </span>
      <span className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 rounded-full bg-black px-3 py-1 text-[11px] text-white opacity-0 shadow-xl transition-opacity delay-500 duration-200 group-hover:opacity-100">
        {isDark ? "Light mode" : "Dark mode"}
      </span>
    </button>
  );
};

export default ThemeToggle;
