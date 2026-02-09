"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Camera, Loader2, CheckCircle } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  onOcrResult?: (amount: number) => void;
  folder?: string;
  label?: string;
  className?: string;
}

export default function ImageUpload({
  onUpload,
  onOcrResult,
  folder = "receipts",
  label = "Upload Receipt",
  className,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrAmount, setOcrAmount] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB");
      return;
    }

    setError(null);
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const fileName = `${folder}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setUploadedUrl(downloadUrl);
      onUpload(downloadUrl);

      // Run OCR if callback provided
      if (onOcrResult) {
        setOcrLoading(true);
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
          const { auth: firebaseAuth } = await import("@/lib/firebase");
          const token = await firebaseAuth.currentUser?.getIdToken();
          const res = await fetch(`${API_URL}/ocr/extract`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ imageUrl: downloadUrl }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.amount) {
              setOcrAmount(data.amount);
              onOcrResult(data.amount);
            }
          }
        } catch (ocrErr) {
          console.error("OCR failed:", ocrErr);
        } finally {
          setOcrLoading(false);
        }
      }
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }, [folder, onUpload, onOcrResult]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleRemove = () => {
    setPreview(null);
    setUploadedUrl(null);
    setOcrAmount(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium text-text-secondary">{label}</label>

      {preview ? (
        <div className="relative rounded-xl overflow-hidden border-2 border-border-subtle bg-bg-secondary">
          <img src={preview} alt="Receipt preview" className="w-full max-h-48 object-contain" />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
          >
            <X className="h-4 w-4" />
          </button>

          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-gold animate-spin" />
            </div>
          )}

          {uploadedUrl && !uploading && (
            <div className="absolute bottom-2 left-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/20 text-success text-xs font-medium">
              <CheckCircle className="h-3.5 w-3.5" />
              Uploaded
            </div>
          )}

          {ocrLoading && (
            <div className="absolute bottom-2 right-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-info/20 text-info text-xs font-medium">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Scanning...
            </div>
          )}

          {ocrAmount !== null && !ocrLoading && (
            <div className="absolute bottom-2 right-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold/20 text-gold text-xs font-bold">
              Detected: {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(ocrAmount)}
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all",
            dragActive
              ? "border-gold bg-gold/5"
              : "border-border-subtle hover:border-gold/50 hover:bg-bg-secondary"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gold/10">
              <Upload className="h-5 w-5 text-gold" />
            </div>
            <div className="p-2.5 rounded-lg bg-info/10">
              <Camera className="h-5 w-5 text-info" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-text-primary">
              Drop image here or click to browse
            </p>
            <p className="text-xs text-text-tertiary mt-1">
              JPG, PNG up to 10MB
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {error && (
        <p className="text-xs text-error">{error}</p>
      )}
    </div>
  );
}
