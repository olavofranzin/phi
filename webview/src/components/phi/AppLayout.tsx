import type { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/phi/AppSidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-12 items-center border-b border-border bg-background/80 px-3 backdrop-blur">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="ml-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="hidden sm:inline">Modo demo · dados mockados</span>
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
