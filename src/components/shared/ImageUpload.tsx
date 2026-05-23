"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { uploadImage } from "../../lib/cloudinary/upload";
import type { CloudinaryUploadResult } from "../../lib/types";

export type ImageUploadProps = {
  label: string;
  folder: string;
  value: string;
  disabled?: boolean;
  onUploaded: (result: CloudinaryUploadResult) => void;
  onRemove?: () => void;
};

export const ImageUpload = ({
  label,
  folder,
  value,
  disabled = false,
  onUploaded,
  onRemove,
}: ImageUploadProps): JSX.Element => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [zoom, setZoom] = useState(1);
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);

  useEffect(() => {
    if (pendingFile === null) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const createAdjustedImage = async (file: File): Promise<File> => {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Não foi possível carregar a imagem"));
      img.src = URL.createObjectURL(file);
    });
    const canvas = document.createElement("canvas");
    const outputSize = 800;
    const context = canvas.getContext("2d");

    if (context === null) {
      throw new Error("Não foi possível preparar o corte da imagem");
    }

    canvas.width = outputSize;
    canvas.height = outputSize;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, outputSize, outputSize);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    const baseScale = Math.max(outputSize / image.width, outputSize / image.height);
    const scale = baseScale * zoom;
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const maxOffsetX = Math.max(drawWidth - outputSize, 0);
    const maxOffsetY = Math.max(drawHeight - outputSize, 0);
    const x = -maxOffsetX * (positionX / 100);
    const y = -maxOffsetY * (positionY / 100);

    context.drawImage(image, x, y, drawWidth, drawHeight);
    URL.revokeObjectURL(image.src);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result === null) {
            reject(new Error("Não foi possível gerar a imagem ajustada"));
            return;
          }

          resolve(result);
        },
        file.type,
        0.92,
      );
    });

    return new File([blob], file.name, { type: file.type });
  };

  const handleChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0];

    if (file === undefined) {
      return;
    }

    setPendingFile(file);
    setZoom(1);
    setPositionX(50);
    setPositionY(50);
    setError(null);
    if (inputRef.current !== null) {
      inputRef.current.value = "";
    }
  };

  const uploadPendingFile = async (): Promise<void> => {
    if (pendingFile === null) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const adjustedFile = await createAdjustedImage(pendingFile);
      const result = await uploadImage(adjustedFile, folder);
      onUploaded(result);
      setPendingFile(null);
    } catch (uploadError: unknown) {
      setError(uploadError instanceof Error ? uploadError.message : "Erro ao enviar imagem");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();

    if (disabled || isLoading || onRemove === undefined) {
      return;
    }

    onRemove();
  };

  return (
    <div className="grid gap-2">
      <span className="text-sm text-clinic-text">{label}</span>
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-md border border-clinic-border bg-clinic-bg">
          {value.length > 0 ? (
            onRemove !== undefined ? (
              <button
                type="button"
                aria-label={`Remover ${label.toLowerCase()}`}
                disabled={disabled || isLoading}
                onClick={handleRemove}
                className="group relative h-full w-full disabled:cursor-not-allowed"
                title="Clique para remover"
              >
                <Image src={value} alt={label} fill sizes="80px" className="object-cover transition group-hover:brightness-75" />
                <span className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
                  <Trash2 className="h-5 w-5 text-white" />
                </span>
              </button>
            ) : (
              <Image src={value} alt={label} fill sizes="80px" className="object-cover" />
            )
          ) : (
            <ImagePlus className="m-6 h-8 w-8 text-clinic-muted" />
          )}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-clinic-border px-4 py-2 text-sm text-clinic-text">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          Enviar imagem
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            disabled={disabled || isLoading}
            onChange={handleChange}
            className="sr-only"
          />
        </label>
      </div>
      {error !== null ? <span className="text-xs text-clinic-danger">{error}</span> : null}
      {pendingFile !== null ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onMouseDown={() => setPendingFile(null)} role="presentation">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-lg bg-clinic-surface p-4 shadow-xl sm:rounded-md sm:p-5" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-clinic-text">Ajustar imagem</h2>
                <p className="mt-1 text-sm text-clinic-muted">Posicione e corte a foto antes de enviar.</p>
              </div>
              <button type="button" onClick={() => setPendingFile(null)} className="rounded-md border border-clinic-border p-2 text-clinic-muted" aria-label="Fechar">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(180px,240px)_1fr]">
              <div className="relative aspect-square w-full overflow-hidden rounded-md border border-clinic-border bg-clinic-bg">
                {previewUrl.length > 0 ? (
                  <img
                    src={previewUrl}
                    alt="Pré-visualização"
                    className="h-full w-full object-cover"
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: `${positionX}% ${positionY}%`,
                    }}
                  />
                ) : null}
              </div>
              <div className="grid content-start gap-4">
                <label className="grid gap-1 text-sm text-clinic-text">
                  Zoom
                  <input type="range" min="1" max="2.5" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
                </label>
                <label className="grid gap-1 text-sm text-clinic-text">
                  Posição horizontal
                  <input type="range" min="0" max="100" step="1" value={positionX} onChange={(event) => setPositionX(Number(event.target.value))} />
                </label>
                <label className="grid gap-1 text-sm text-clinic-text">
                  Posição vertical
                  <input type="range" min="0" max="100" step="1" value={positionY} onChange={(event) => setPositionY(Number(event.target.value))} />
                </label>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setPendingFile(null)} disabled={isLoading} className="rounded-md border border-clinic-border px-4 py-2 text-sm">
                Cancelar
              </button>
              <button type="button" onClick={uploadPendingFile} disabled={isLoading} className="inline-flex items-center gap-2 rounded-md bg-clinic-primary px-4 py-2 text-sm text-white disabled:opacity-60">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Enviar imagem
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
