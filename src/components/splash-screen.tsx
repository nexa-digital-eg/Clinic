"use client";

import { useEffect, useState } from "react";

// شاشة افتتاحية تظهر عند فتح الموقع / عمل رفرش — بروح دعاء الخير
export function SplashScreen() {
  const [gone, setGone] = useState(false);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // احترام تقليل الحركة: إخفاء أسرع
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hold = reduce ? 400 : 2600;
    const t1 = setTimeout(() => setFade(true), hold);
    const t2 = setTimeout(() => setGone(true), hold + 750);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      className={`splash-root ${fade ? "splash-fade" : ""}`}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(120% 120% at 50% 0%, #fbf7ef 0%, #f3ead8 55%, #ecdfc4 100%)",
      }}
    >
      {/* زخارف الزاوية */}
      <div className="splash-leaf splash-leaf-tl" />
      <div className="splash-leaf splash-leaf-br" />

      <div className="splash-card" style={{ textAlign: "center", padding: "0 28px", maxWidth: 560 }}>
        <div className="splash-orn">۞</div>
        <h1
          style={{
            fontSize: "clamp(40px, 11vw, 76px)",
            fontWeight: 800,
            color: "#14532d",
            margin: "8px 0 18px",
            lineHeight: 1.1,
          }}
        >
          اللَّهُمَّ
        </h1>
        <p
          style={{
            fontSize: "clamp(16px, 4.6vw, 22px)",
            color: "#1f5132",
            lineHeight: 2,
            fontWeight: 600,
          }}
        >
          علِّمنا ما ينفعنا، وانفعنا بما علَّمتنا،
          <br />
          وزدنا علمًا، إنكَ أنت العليم الحكيم.
        </p>
        <div className="splash-divider" />
        <p
          style={{
            fontSize: "clamp(18px, 5.2vw, 26px)",
            color: "#14532d",
            fontWeight: 800,
            marginTop: 8,
          }}
        >
          ربي افتح لي أبواب الخير كلها.
        </p>
        <div className="splash-orn" style={{ marginTop: 18 }}>۞</div>
      </div>
    </div>
  );
}
