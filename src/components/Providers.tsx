"use client";

import { ReactNode } from "react";

// Mock Convex provider for development/build
// When NEXT_PUBLIC_CONVEX_URL is the placeholder, we skip Convex
const isMockConvex = process.env.NEXT_PUBLIC_CONVEX_URL === "https://placeholder.convex.cloud";

export function Providers({ children }: { children: ReactNode }) {
  if (isMockConvex) {
    // Return children without Convex provider for build
    return <>{children}</>;
  }
  
  // Real Convex provider (commented out for now)
  // const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  // return <ConvexProvider client={convex}>{children}</ConvexProvider>;
  
  // For now, just return children
  return <>{children}</>;
}
