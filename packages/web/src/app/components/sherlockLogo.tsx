import { cn } from "@/lib/utils";

interface SherlockLogoProps { className?: string; size?: "small" | "large"; }
export const SherlockLogo = ({ className, size = "large" }: SherlockLogoProps) => (
    <svg role="img" aria-label="Sherlock" viewBox={size === "small" ? "0 0 48 48" : "0 0 244 48"}
        className={cn("h-16 w-auto text-foreground", className)} xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="4" />
        <path d="m29 29 12 12" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        {size === "large" && <text x="55" y="34" fontFamily="system-ui, sans-serif" fontSize="32" fontWeight="700" fill="currentColor">Sherlock</text>}
    </svg>
);
