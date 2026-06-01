"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/utils";

// عدّاد رقمي متحرك — يعدّ من 0 حتى القيمة بسلاسة (مع دعم العملة)
export function CountUp({
  value,
  currency = false,
  duration = 1300,
  className,
}: {
  value: number;
  currency?: boolean;
  duration?: number;
  className?: string;
}) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    // احترام تفضيل تقليل الحركة
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setN(value);
      return;
    }

    let raf = 0;
    const run = () => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
        setN(value * eased);
        if (p < 1) raf = requestAnimationFrame(tick);
        else setN(value);
      };
      raf = requestAnimationFrame(tick);
    };

    // ابدأ العدّ عند ظهور العنصر في الشاشة
    const el = ref.current;
    if (el && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && !started.current) {
            started.current = true;
            run();
            io.disconnect();
          }
        },
        { threshold: 0.2 },
      );
      io.observe(el);
      return () => {
        io.disconnect();
        cancelAnimationFrame(raf);
      };
    }

    run();
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const rounded = Math.round(n);
  const display = currency ? formatCurrency(rounded) : rounded.toLocaleString("en-GB");

  return (
    <span ref={ref} className={className} dir="ltr">
      {display}
    </span>
  );
}
