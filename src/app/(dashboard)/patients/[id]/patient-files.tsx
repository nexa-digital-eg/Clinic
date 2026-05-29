"use client";

import { useRef, useState, useTransition } from "react";
import { upload } from "@vercel/blob/client";
import { recordPatientFile, deletePatientFile } from "../actions";
import { Card, Button, Label, Select, EmptyState } from "@/components/ui";
import { useT } from "@/lib/i18n-client";
import { formatDate } from "@/lib/utils";
import { Upload, Trash2, FileText, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

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
  enabled,
}: {
  patientId: string;
  files: FileItem[];
  enabled: boolean;
}) {
  const tr = useT();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState("xray");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const onPick = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/files/upload",
        clientPayload: JSON.stringify({ patientId }),
      });
      await recordPatientFile(patientId, {
        name: file.name,
        url: blob.url,
        mimeType: file.type,
        size: file.size,
        category,
      });
      router.refresh();
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
        {!enabled && (
          <p className="mb-3 rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
            {tr("files.disabledHint")}
          </p>
        )}
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
              disabled={!enabled || uploading}
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
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </Card>

      {files.length === 0 ? (
        <EmptyState title={tr("profile.noFiles")} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {files.map((f) => (
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
                      if (confirm(tr("common.delete") + "؟"))
                        startTransition(() => deletePatientFile(f.id).then(() => router.refresh()));
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
