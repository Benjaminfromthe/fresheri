"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Minimal country code picker — Rwanda (+250) default
// Integrated inside FloatingInput as a prefix element
// ─────────────────────────────────────────────────────────────

const COUNTRIES = [
  { code: "+250", flag: "🇷🇼", name: "Rwanda"   },
  { code: "+254", flag: "🇰🇪", name: "Kenya"    },
  { code: "+255", flag: "🇹🇿", name: "Tanzania" },
  { code: "+256", flag: "🇺🇬", name: "Uganda"   },
  { code: "+243", flag: "🇨🇩", name: "DRC"      },
  { code: "+1",   flag: "🇺🇸", name: "USA"      },
];

interface CountryCodePickerProps {
  value:    string;
  onChange: (code: string) => void;
}

export default function CountryCodePicker({ value, onChange }: CountryCodePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = COUNTRIES.find((c) => c.code === value) ?? COUNTRIES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap"
      >
        <span className="text-base leading-none">{selected.flag}</span>
        <span className="font-semibold text-gray-800 dark:text-gray-200">{selected.code}</span>
        <ChevronDown
          size={12}
          className={`text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-44 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50">
          {COUNTRIES.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => { onChange(country.code); setOpen(false); }}
              className={`
                w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors
                ${country.code === value
                  ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}
              `}
            >
              <span className="text-base">{country.flag}</span>
              <span className="flex-1">{country.name}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{country.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
