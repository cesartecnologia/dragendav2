type PdfImageFormat = "PNG" | "JPEG";

type PdfDocumentWithImage = {
  addImage: (
    imageData: string,
    format: PdfImageFormat,
    x: number,
    y: number,
    width: number,
    height: number,
    alias?: string,
    compression?: "FAST",
  ) => void;
};

const imageUrlToDataUrl = async (url: string): Promise<string | null> => {
  const trimmedUrl = url.trim();

  if (trimmedUrl.length === 0) {
    return null;
  }

  try {
    const response = await fetch(trimmedUrl);

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();

    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onerror = () => resolve(null);
      reader.onloadend = () => {
        resolve(typeof reader.result === "string" ? reader.result : null);
      };
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const getImageFormat = (dataUrl: string): PdfImageFormat => {
  return dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")
    ? "JPEG"
    : "PNG";
};

const getImageSize = async (dataUrl: string): Promise<{ width: number; height: number } | null> => {
  return await new Promise((resolve) => {
    const image = new Image();
    image.onerror = () => resolve(null);
    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.src = dataUrl;
  });
};

export const drawClinicLogo = async (
  pdf: PdfDocumentWithImage,
  logoUrl: string | undefined,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
): Promise<boolean> => {
  if (logoUrl === undefined || logoUrl.trim().length === 0) {
    return false;
  }

  const dataUrl = await imageUrlToDataUrl(logoUrl);

  if (dataUrl === null) {
    return false;
  }

  const imageSize = await getImageSize(dataUrl);

  if (imageSize === null || imageSize.width <= 0 || imageSize.height <= 0) {
    return false;
  }

  const scale = Math.min(maxWidth / imageSize.width, maxHeight / imageSize.height);
  const width = imageSize.width * scale;
  const height = imageSize.height * scale;
  const centeredX = x + (maxWidth - width) / 2;
  const centeredY = y + (maxHeight - height) / 2;

  try {
    pdf.addImage(dataUrl, getImageFormat(dataUrl), centeredX, centeredY, width, height, undefined, "FAST");
    return true;
  } catch {
    return false;
  }
};
