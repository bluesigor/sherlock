import type { Metadata } from "next";
import { Jersey_10 } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "./queryClientProvider";
import { PostHogProvider } from "./posthogProvider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "next-auth/react";
import { env } from "@/env.mjs";

// Pixel typeface used for the Sherlock wordmark. Jersey 10, SIL OFL 1.1.
// Single weight by design: asking for 700 would make the browser synthesise a
// bold, which smears the pixel grid.
const pixelFont = Jersey_10({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-pixel",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Sherlock",
    description: "Search and explore code across your repositories.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={pixelFont.variable}
            // @see : https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
            suppressHydrationWarning
        >
            <body>
                <Toaster />
                <SessionProvider>
                    <PostHogProvider disabled={env.SOURCEBOT_TELEMETRY_DISABLED === "true"}>
                        <ThemeProvider
                            attribute="class"
                            defaultTheme="dark"
                            enableSystem
                            disableTransitionOnChange
                        >
                            <QueryClientProvider>
                                <TooltipProvider>
                                    {children}
                                </TooltipProvider>
                            </QueryClientProvider>
                        </ThemeProvider>
                    </PostHogProvider>
                </SessionProvider>
            </body>
        </html>
    );
}
