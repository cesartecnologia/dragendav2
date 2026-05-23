import type { ReactNode } from "react";
import { DashboardAuthGate } from "../../components/layout/DashboardAuthGate";
import { ErrorBoundary } from "../../components/layout/ErrorBoundary";
import { Sidebar } from "../../components/layout/Sidebar";

export type DashboardLayoutProps = {
  children: ReactNode;
};

const DashboardLayout = ({ children }: DashboardLayoutProps): JSX.Element => {
  return (
    <DashboardAuthGate>
      <div className="min-h-screen bg-clinic-bg">
        <Sidebar />
        <div className="lg:pl-60">
          <main className="mx-auto max-w-7xl px-3 pb-28 pt-3 sm:px-4 sm:py-4 lg:px-6 lg:pb-6">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </div>
      </div>
    </DashboardAuthGate>
  );
};

export default DashboardLayout;
