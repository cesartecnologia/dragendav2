"use client";

export type AppLogoProps = {
  className?: string;
};

export const AppLogo = ({ className = "h-8 w-8" }: AppLogoProps): JSX.Element => {
  return (
    <img
      src="/favicon.ico"
      alt="Dr. Agenda"
      className={className}
    />
  );
};
