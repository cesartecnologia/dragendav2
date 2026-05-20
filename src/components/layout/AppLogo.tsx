"use client";

export type AppLogoProps = {
  className?: string;
};

export const AppLogo = ({ className = "h-8 w-8" }: AppLogoProps): JSX.Element => {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label="Dr. Agenda"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="10" fill="#1D6BFF" />
      <path
        d="M8 25H18.5L21.8 16.5L27.2 33L31.5 25H40"
        stroke="#FFFFFF"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
