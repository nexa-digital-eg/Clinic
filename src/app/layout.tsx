import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { getLocale } from "@/lib/locale";
import { dirFor } from "@/lib/i18n";

// خط Cairo مُضمَّن داخل المشروع (بدون أي اعتماد على شبكة وقت البناء)
const cairo = localFont({
  src: [
    { path: "../fonts/cairo-arabic.woff2", weight: "200 1000", style: "normal" },
    { path: "../fonts/cairo-latin.woff2", weight: "200 1000", style: "normal" },
  ],
  variable: "--font-cairo",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { getClinicSettings } = await import("@/server/clinic");
  let name = "Smart Clinic";
  let logo: string | null = null;
  try {
    const c = await getClinicSettings();
    name = c.name;
    logo = c.logoUrl;
  } catch {
    /* قاعدة البيانات غير متاحة وقت البناء */
  }
  return {
    title: name,
    description: "نظام متكامل لإدارة عيادات الأسنان والمراكز الطبية",
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: name, statusBarStyle: "default" },
    icons: { icon: logo || "/icon.svg", apple: logo || "/icon.svg" },
  };
}

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={dirFor(locale)}>
      <head>
        {/* يطبّق الوضع المحفوظ قبل الرسم لمنع وميض الشاشة */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${cairo.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
