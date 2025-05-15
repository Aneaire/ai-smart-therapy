import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { ParticlesBackground } from "@/components/common/Particle";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import HeaderUser from "@/integrations/clerk/header-user";
import AppClerkProvider from "@/integrations/clerk/provider.tsx";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import type { QueryClient } from "@tanstack/react-query";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => {
    return (
      <>
        <AppClerkProvider>
          <div className="min-h-screen relative">
            <ParticlesBackground />

            <div className="relative z-10">
              <div className="absolute md:top-4 md:right-10 top-2 right-4 scale-125">
                <SignedIn>
                  <HeaderUser />
                </SignedIn>
              </div>
              <SignedIn>
                <div className="container mx-auto md:p-4 p-2">
                  <Outlet />
                </div>
              </SignedIn>
              <SignedOut>
                <WelcomeScreen />
              </SignedOut>
              <TanStackRouterDevtools />
            </div>
          </div>
        </AppClerkProvider>
      </>
    );
  },
});
