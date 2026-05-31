"use client";

import { useRef, useState, useTransition } from "react";
import { recordPatientFile, deletePatientFile } from "../actions";
import { Card, Button, Label, Select, EmptyState } from "@/components/ui";
import { useT } from "@/lib/i18n-client";
import { formatDate } from "@/lib/utils";
import { Upload, Trash2, FileText, ExternalLink } from "lucide-react";

type FileItem = {
  id: string;
  name: string;
  url: string;
  mimeType: string | null;
  category: string | null;
  createdAt: string;
};

export function PatientFiles({
  patientId,
  files,
}: {
  patientId: string;
  files: FileItem[];
}) {
  const tr = useT();
  const [items, setItems] = useState<FileItem[]>(files);
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState("xray");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // ضغط الصور الكبيرة قبل الرفع لتسريعه (لا يمس PDF/الفيديو)
  const maybeCompress = async (file: File): Promise<File> => {
    if (!file.type.startsWith("image/") || file.size < 1 * 1024 * 1024) return file;
    try {
      const bitmap = await createImageBitmap(file);
      const maxDim = 1800;
      const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
      const w = Math.round(bitmap.width * scale);
      const h = Math.round(bitmap.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.drawImage(bitmap, 0, 0, w, h);
      const blob: Blob | null = await new Promise((res) =>
        canvas.toBlob((b) => res(b), "image/jpeg", 0.85),
      );
      if (!blob || blob.size >= file.size) return file;
      return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
    } catch {
      return file;
    }
  };

  const onPick = async (picked: File) => {
    setError(null);
    setUploading(true);
    setProgress(0);
    try {
      const file = await maybeCompress(picked);
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/files/upload",
        clientPayload: JSON.stringify({ patientId }),
        onUploadProgress: (e) => setProgress(Math.round(e.percentage)),
      });
      const rec = await recordPatientFile(patientId, {
        name: file.name,
        url: blob.url,
        mimeType: file.type,
        size: file.size,
        category,
      });
      // أظهر الملف فوراً بدون إعادة تحميل الصفحة كاملة
      setItems((prev) => [
        {
          id: rec?.id ?? blob.url,
          name: file.name,
          url: blob.url,
          mimeType: file.type,
          category,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    } catch (e) {
      setError((e as Error).message || tr("files.error"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const isImage = (f: FileItem) => (f.mimeType ?? "").startsWith("image/");

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-40">
            <Label htmlFor="category">{tr("files.category")}</Label>
            <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="xray">{tr("files.catXray")}</option>
              <option value="photo">{tr("files.catPhoto")}</option>
              <option value="report">{tr("files.catReport")}</option>
              <option value="other">{tr("files.catOther")}</option>
            </Select>
          </div>
          <div className="flex-1">
            <Label>{tr("files.choose")}</Label>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf,video/mp4"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPick(f);
              }}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-700 disabled:opacity-50"
            />
          </div>
          {uploading && (
            <span className="flex items-center gap-1.5 text-sm text-brand-600">
              <Upload className="h-4 w-4 animate-pulse" />
              {tr("files.uploading")}
            </span>
          )}
        </div>
        {uploading && (
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-brand-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </Card>

      {items.length === 0 ? (
        <EmptyState title={tr("profile.noFiles")} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((f) => (
            <Card key={f.id} className="overflow-hidden">
              <a href={f.url} target="_blank" rel="noreferrer" className="block">
                {isImage(f) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt={f.name} className="h-32 w-full object-cover" />
                ) : (
                  <div className="flex h-32 w-full items-center justify-center bg-slate-50 text-slate-400">
                    <FileText className="h-10 w-10" />
                  </div>
                )}
              </a>
              <div className="p-3">
                <p className="truncate text-sm font-medium text-slate-800" title={f.name}>
                  {f.name}
                </p>
                <p className="text-xs text-slate-400">{formatDate(f.createdAt)}</p>
                <div className="mt-2 flex items-center justify-between">
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {tr("files.view")}
                  </a>
                  <button
                    onClick={() => {
                      if (confirm(tr("common.delete") + "؟")) {
                        setItems((prev) => prev.filter((x) => x.id !== f.id));
                        startTransition(() => deletePatientFile(f.id));
                      }
                    }}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
