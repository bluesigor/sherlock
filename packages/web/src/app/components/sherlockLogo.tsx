import { cn } from "@/lib/utils";

interface SherlockLogoProps { className?: string; size?: "small" | "large"; }

const PIPE_AR = 1.7158;                        // intrinsic aspect of the mark art

// Lockup geometry (hero + top bar), in viewBox units on a 48-unit box. The
// wordmark leads and the mark supports it, so the pipe sits well under half the
// box height while the type carries the size.
const MARK_H = 32;
const MARK_W = Math.round(MARK_H * PIPE_AR);   // 55
const GAP = 8;
const TEXT_X = MARK_W + GAP;                   // 63
// From Jersey10-Regular.ttf (upem 1400): at fontSize 38 "Sherlock" advances
// 116.0 units and the caps stand 20.4, so a baseline of 34 centres them on the box.
const FONT_SIZE = 38;
const TEXT_W = 116;
const BASELINE = 34;
const FULL_W = TEXT_X + TEXT_W + 4;            // 183

// The standalone mark keeps its own size: it is a lone icon in the nav rather
// than a supporting element, so it is not bound to the lockup's proportions.
const SOLO_H = 40;
const SOLO_W = Math.round(SOLO_H * PIPE_AR);   // 69

/**
 * The pipe ships as two rasters rather than one: the source art is emissive
 * (glow on black), which washes out over the light theme's paper, so the light
 * variant is the same art restruck as deep violet ink. `.mark-dark` / `.mark-light`
 * in globals.css pick one per theme.
 *
 * The wordmark is set in Jersey 10 via the --font-pixel variable declared in the
 * root layout, at weight 400 — the face has no bold, and asking for one would get
 * a synthesised smear.
 */
const Mark = ({ w, h }: { w: number; h: number }) => (
    <>
        <image className="mark-dark" href="/sherlock-mark.png" x="0" y={(48 - h) / 2} width={w} height={h} />
        <image className="mark-light" href="/sherlock-mark-light.png" x="0" y={(48 - h) / 2} width={w} height={h} />
    </>
);

export const SherlockLogo = ({ className, size = "large" }: SherlockLogoProps) => (
    <svg
        role="img"
        aria-label="Sherlock"
        viewBox={size === "small" ? `0 0 ${SOLO_W} 48` : `0 0 ${FULL_W} 48`}
        className={cn("logo-glow h-16 w-auto text-foreground", className)}
        xmlns="http://www.w3.org/2000/svg"
    >
        {size === "small" ? (
            <Mark w={SOLO_W} h={SOLO_H} />
        ) : (
            <>
                <Mark w={MARK_W} h={MARK_H} />
                <text x={TEXT_X} y={BASELINE} className="pixel-type" fontSize={FONT_SIZE} fill="hsl(var(--logo-ink))">
                    Sherlock
                </text>
            </>
        )}
    </svg>
);
