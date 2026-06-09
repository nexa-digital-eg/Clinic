"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { quickSearchPatients, type QuickSearchResult } from "@/app/(dashboard)/search-actions";
import { useT } from "@/lib/i18n-client";
import { Search, User, Phone } from "lucide-react";

export function QuickSearch() {
  const tr = useT();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QuickSearchResult[] | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // اختصار Ctrl+K / Cmd+K للتركيز على البحث
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // إغلاق عند الضغط خارج الصندوق
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // بحث مع تأخير بسيط حتى لا نرسل طلباً مع كل حرف
  const onChange = (value: string) => {
    setQuery(value);
    setOpen(true);
    setActive(0);
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        setResults(await quickSearchPatients(value));
      } finally {
        setLoading(false);
      }
    }, 250);
  };

  const go = useCallback(
    (id: string) => {
      setOpen(false);
      setQuery("");
      setResults(null);
      router.push(`/patients/${id}`);
    },
    [router],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!results || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active].id);
    }
  };

  return (
    <div className="relative w-full max-w-xs sm:max-w-sm" ref={boxRef}>
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={tr("qs.placeholder")}
          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 ps-9 pe-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {open && query.trim().length >= 2 && (
        <div className="animate-pop absolute inset-x-0 top-11 z-50 origin-top overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          {loading ? (
            <p className="px-4 py-3 text-sm text-slate-400">{tr("qs.searching")}</p>
          ) : !results || results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">{tr("qs.noResults")}</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {results.map((r, i) => (
                <li key={r.id}>
                  <button
                    onClick={() => go(r.id)}
                    onMouseEnter={() => setActive(i)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-start transition-colors ${
                      i === active ? "bg-brand-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 text-white">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{r.name}</p>
                      <p className="flex items-center gap-1 text-xs text-slate-400" dir="ltr">
                        <Phone className="h-3 w-3" /> {r.phone}
                      </p>
                    </div>
                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                      {r.code}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
