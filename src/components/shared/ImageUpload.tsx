"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
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

  const handleChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0];

    if (file === undefined) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await uploadImage(file, folder);
      onUploaded(result);
    } catch (uploadError: unknown) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Erro ao enviar imagem",
      );
    } finally {
      setIsLoading(false);
      if (inputRef.current !== null) {
        inputRef.current.value = "";
      }
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
    </div>
  );
};
