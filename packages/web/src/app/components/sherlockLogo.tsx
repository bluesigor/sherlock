import { useId } from "react";
import { cn } from "@/lib/utils";

interface SherlockLogoProps { className?: string; size?: "small" | "large"; smokingProfile?: boolean; }

const FONT_SIZE = 38;

// Separate regions of the same artwork so only the pipe pivots at the lips.
const SherlockProfile = () => {
    const cutoutId = useId();
    return (
        <>
            <defs>
                <filter id={cutoutId} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
                    {/* The artwork is violet; neutral background pixels have no blue/green difference. */}
                    <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 -8 8 0 -0.2" />
                </filter>
                <clipPath id={`${cutoutId}-pipe`}>
                    <rect x="14" y="16" width="17.4" height="12" />
                </clipPath>
                <linearGradient id={`${cutoutId}-base-fade`} x1="0" y1="39" x2="0" y2="48" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="white" />
                    <stop offset="0.4" stopColor="white" />
                    <stop offset="1" stopColor="black" />
                </linearGradient>
                <mask id={`${cutoutId}-portrait`} maskUnits="userSpaceOnUse" x="14" y="-24" width="72" height="72">
                    <rect x="14" y="-24" width="72" height="72" fill={`url(#${cutoutId}-base-fade)`} />
                    <rect x="14" y="16" width="17.3" height="12" fill="black" />
                </mask>
            </defs>
            <g className="smoking-character" aria-hidden="true">
                <image
                    href="/sherlock-smoking.png"
                    className="sherlock-profile"
                    mask={`url(#${cutoutId}-portrait)`}
                    filter={`url(#${cutoutId})`}
                    x="14" y="-24" width="72" height="72"
                />
                <g className="smoking-pipe">
                    <g clipPath={`url(#${cutoutId}-pipe)`}>
                        <image href="/sherlock-smoking.png" className="sherlock-profile"
                            filter={`url(#${cutoutId})`} x="14" y="-24" width="72" height="72" />
                    </g>
                    <circle className="pipe-smoke-source" cx="18.4" cy="18.2" r="0.1" fill="transparent" />
                </g>
                {/* A parted lip and overlapping mouthpiece make the grip visible. */}
                <g className="pipe-mouth-contact">
                    <path d="M31.1 16.8H31.6V16.6H32.2V16.8H32.7V17.5H32.2V17.7H31.6V17.5H31.1Z" fill="#32104f" />
                    <path d="M30.7 16.9H32.2V17.5H30.7Z" fill="#54218a" />
                    <path d="M31.1 16.65H31.6V16.45H32.2V16.65H32.7" fill="none" stroke="#a46be8" strokeWidth="0.3" />
                    <path d="M31.2 17.65H31.6V17.85H32.2V17.65H32.7" fill="none" stroke="#b386f0" strokeWidth="0.35" />
                </g>
            </g>
        </>
    );
};

export const SherlockLogo = ({ className, size = "large", smokingProfile = false }: SherlockLogoProps) => (
    <svg
        role="img"
        aria-label="Sherlock"
        viewBox="0 -24 124 92"
        className={cn("logo-glow w-auto text-foreground", size === "small" ? "h-12" : "h-24", className)}
        xmlns="http://www.w3.org/2000/svg"
    >
        <g transform="translate(12 0)" className={smokingProfile ? undefined : "sherlock-static"}>
            <SherlockProfile />
        </g>
        <text x="62" y="64" textAnchor="middle" className="pixel-type" fontSize={FONT_SIZE} fill="hsl(var(--logo-ink))">
            Sherlock
        </text>
    </svg>
);
