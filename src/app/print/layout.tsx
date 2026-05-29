import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <div className="mx-auto max-w-3xl p-6 print:p-0">{children}</div>
    </div>
  );
}
