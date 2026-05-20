import crypto from "crypto";

export type CloudinaryDeleteResponse = {
  result: string;
};

const requiredEnv = (key: string, value: string | undefined): string => {
  if (value === undefined || value.trim().length === 0) {
    throw new Error(`Variável de ambiente ausente: ${key}`);
  }

  return value;
};

export const deleteImage = async (publicId: string): Promise<void> => {
  const cloudName = requiredEnv(
    "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  );
  const apiKey = requiredEnv("CLOUDINARY_API_KEY", process.env.CLOUDINARY_API_KEY);
  const apiSecret = requiredEnv(
    "CLOUDINARY_API_SECRET",
    process.env.CLOUDINARY_API_SECRET,
  );
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHash("sha1")
    .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");
  const body = new URLSearchParams({
    public_id: publicId,
    timestamp,
    api_key: apiKey,
    signature,
  });
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    {
      method: "POST",
      body,
    },
  );

  if (!response.ok) {
    throw new Error("Erro ao remover imagem. Tente novamente.");
  }

  const result = (await response.json()) as CloudinaryDeleteResponse;

  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error("Erro ao remover imagem. Tente novamente.");
  }
};

