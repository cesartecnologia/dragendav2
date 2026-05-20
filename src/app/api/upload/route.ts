import { NextResponse, type NextRequest } from "next/server";
import type { CloudinaryUploadResult } from "../../../lib/types";

export const runtime = "nodejs";

type ParsedUpload = {
  file: File;
  folder: string;
};

type CloudinaryUploadResponse = {
  secure_url: string;
  public_id: string;
};

const maxFileSize = 5 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/png"];

const requiredEnv = (key: string, value: string | undefined): string => {
  if (value === undefined || value.trim().length === 0) {
    throw new Error(`Variável de ambiente ausente: ${key}`);
  }

  return value;
};

const verifySession = (request: NextRequest): boolean => {
  const authorization = request.headers.get("authorization") ?? "";
  const sessionCookie =
    request.cookies.get("__session")?.value ??
    request.cookies.get("firebase-token")?.value ??
    "";

  return authorization.startsWith("Bearer ") || sessionCookie.length > 0;
};

const parseMultipart = async (request: NextRequest): Promise<ParsedUpload> => {
  const formData = await request.formData();
  const file = formData.get("file");
  const folder = formData.get("folder");

  if (!(file instanceof File) || typeof folder !== "string") {
    throw new Error("Arquivo ou pasta ausente");
  }

  return { file, folder };
};

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  if (!verifySession(request)) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { message: "Formato de envio inválido" },
      { status: 400 },
    );
  }

  try {
    const { file, folder } = await parseMultipart(request);

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "Envie uma imagem JPG ou PNG" },
        { status: 400 },
      );
    }

    if (file.size > maxFileSize) {
      return NextResponse.json(
        { message: "A imagem deve ter no máximo 5MB" },
        { status: 400 },
      );
    }

    const cloudName = requiredEnv(
      "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    );
    const uploadPreset = requiredEnv(
      "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
    );
    const uploadFormData = new FormData();
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type });

    uploadFormData.append("file", blob, file.name);
    uploadFormData.append("upload_preset", uploadPreset);
    uploadFormData.append("folder", folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: uploadFormData,
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { message: "Erro ao enviar imagem. Tente novamente." },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as CloudinaryUploadResponse;
    const result: CloudinaryUploadResult = {
      url: payload.secure_url,
      publicId: payload.public_id,
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { message: "Erro ao enviar imagem. Tente novamente." },
      { status: 502 },
    );
  }
};
