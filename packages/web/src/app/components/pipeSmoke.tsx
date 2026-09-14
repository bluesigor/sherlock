"use client";

import { useEffect, useRef } from "react";

type Puff = { x: number; y: number; age: number; life: number; radius: number; drift: number; birthY: number };

/** Emit in screen coordinates so released smoke stays independent of the rocking pipe. */
export function PipeSmoke() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        const hero = canvas?.parentElement;
        if (!canvas || !context || !hero) return;
        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        let frame = 0;
        let previous = 0;
        let emission = 0;
        let puffs: Puff[] = [];
        let width = 0;
        let height = 0;
        let scale = 1;
        let color = "";

        const resize = () => {
            const bounds = canvas.getBoundingClientRect();
            width = bounds.width;
            height = bounds.height;
            scale = hero.getBoundingClientRect().height / 48;
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(width * ratio);
            canvas.height = Math.round(height * ratio);
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
            puffs = [];
        };
        const observer = new ResizeObserver(resize);
        observer.observe(canvas);
        resize();

        const draw = (now: number) => {
            frame = requestAnimationFrame(draw);
            const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
            previous = now;
            if (document.hidden) { puffs = []; return; }
            context.clearRect(0, 0, width, height);
            const source = hero.querySelector<SVGCircleElement>(".pipe-smoke-source");
            const svg = source?.ownerSVGElement;
            if (!source || !svg) return;
            const sourceBounds = source.getBoundingClientRect();
            scale = svg.getBoundingClientRect().height / svg.viewBox.baseVal.height;
            const bounds = canvas.getBoundingClientRect();
            const origin = {
                x: sourceBounds.left + sourceBounds.width / 2 - bounds.left,
                y: sourceBounds.top + sourceBounds.height / 2 - bounds.top,
            };
            color = getComputedStyle(hero).getPropertyValue("--pipe-smoke-color").trim() || "265 18% 60%";
            // Dense, faint samples overlap into a continuous plume, not isolated blobs.
            emission += dt * (48 + 6 * Math.sin(now / 1700));
            while (emission >= 1) {
                emission -= 1;
                puffs.push({ x: origin.x + (Math.random() - 0.5) * 1.4 * scale, y: origin.y,
                    age: 0, life: 3.6 + Math.random() * 0.8,
                    radius: (0.45 + Math.random() * 0.25) * scale,
                    drift: (Math.random() - 0.5) * 0.5, birthY: origin.y });
            }
            puffs = puffs.filter(puff => puff.age < puff.life).slice(-240);
            for (const puff of puffs) {
                puff.age += dt;
                const progress = Math.min(puff.age / puff.life, 1);
                const rise = (puff.birthY - puff.y) / scale;
                const time = now / 1000;
                // Nearby particles share the same air current. Curl develops only
                // after the narrow, buoyant stream has cleared the bowl.
                const curl = Math.min(rise / 12, 1);
                const current = Math.sin(rise * 0.22 - time * 0.7) * 3.5
                    + Math.sin(rise * 0.41 + time * 0.45) * 1.2;
                puff.y -= (8 + 2 * progress) * scale * dt;
                puff.x += (current * curl + puff.drift) * scale * dt;
                const radius = puff.radius + Math.pow(progress, 1.4) * 3.8 * scale;
                const fadeIn = Math.min(puff.age / 0.25, 1);
                const alpha = fadeIn * Math.pow(1 - progress, 1.7) * 0.085;
                // Elongated, feathered samples keep the smoke airy and threadlike.
                context.save();
                context.translate(puff.x, puff.y);
                context.rotate(current * curl * 0.06);
                context.scale(1, 1.8);
                const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius);
                gradient.addColorStop(0, `hsl(${color} / ${alpha})`);
                gradient.addColorStop(0.35, `hsl(${color} / ${alpha * 0.65})`);
                gradient.addColorStop(1, `hsl(${color} / 0)`);
                context.fillStyle = gradient;
                context.fillRect(-radius, -radius, radius * 2, radius * 2);
                context.restore();
            }
        };
        const updateMotion = () => {
            cancelAnimationFrame(frame);
            previous = 0;
            emission = 0;
            puffs = [];
            context.clearRect(0, 0, width, height);
            if (!motion.matches) frame = requestAnimationFrame(draw);
        };
        motion.addEventListener("change", updateMotion);
        updateMotion();
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            motion.removeEventListener("change", updateMotion);
        };
    }, []);

    return <canvas ref={canvasRef} className="pipe-smoke-canvas" aria-hidden="true" />;
}
