const getCloudName = (): string => {
  return process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
};

export const getDoctorPhotoUrl = (publicId: string): string => {
  return `https://res.cloudinary.com/${getCloudName()}/image/upload/f_auto,q_auto,w_400,h_400,c_fill/${publicId}`;
};

export const getClinicLogoUrl = (publicId: string): string => {
  return `https://res.cloudinary.com/${getCloudName()}/image/upload/f_auto,q_auto,w_200,h_200,c_pad/${publicId}`;
};

