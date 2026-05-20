"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

export type ErrorBoundaryProps = {
  children: ReactNode;
};

export type ErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = {
    hasError: false,
    message: "",
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message,
    };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="rounded-md border border-clinic-danger/30 bg-clinic-danger/10 p-6 text-clinic-danger">
          <AlertTriangle className="h-8 w-8" />
          <h2 className="mt-3 text-lg font-semibold">Erro ao carregar página</h2>
          <p className="mt-2 text-sm">{this.state.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

