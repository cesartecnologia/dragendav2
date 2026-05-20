import type { CloudinaryUploadResult } from "../types";

export type UploadImageError = {
  message: string;
  status: number;
};

type CloudinaryUploadResponse = {
  secure_url: string;
  public_id: string;
};

const maxFileSize = 5 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/png"];

const getRequiredEnv = (key: string, value: string | undefined): string => {
  if (value === undefined || value.trim().length === 0) {
    throw new Error(`Configuração ausente: ${key}`);
  }

  return value;
};

export const uploadImage = async (
  file: File,
  folder: string,
): Promise<CloudinaryUploadResult> => {
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Envie uma imagem JPG ou PNG");
  }

  if (file.size > maxFileSize) {
    throw new Error("A imagem deve ter no máximo 5MB");
  }

  const cloudName = getRequiredEnv(
    "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  );
  const uploadPreset = getRequiredEnv(
    "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET",
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  );
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    const payload = (await response.json().catch(
      (): UploadImageError => ({
        status: response.status,
        message: "Erro ao enviar imagem. Tente novamente.",
      }),
    )) as Partial<UploadImageError>;

    throw new Error(
      payload.message ?? "Erro ao enviar imagem. Tente novamente.",
    );
  }

  const payload = (await response.json().catch(
    (): UploadImageError => ({
      status: response.status,
      message: "Erro ao enviar imagem. Tente novamente.",
    }),
  )) as Partial<CloudinaryUploadResponse> & Partial<UploadImageError>;

  if (
    typeof payload.secure_url !== "string" ||
    typeof payload.public_id !== "string"
  ) {
    throw new Error(
      payload.message ?? "Erro ao enviar imagem. Tente novamente.",
    );
  }

  return {
    url: payload.secure_url,
    publicId: payload.public_id,
  };
};
