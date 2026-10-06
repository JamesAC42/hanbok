'use client';
import { useEffect, useRef } from 'react';

const COLORS = ['#3D64E8', '#13B5A6', '#FFB020', '#FF5A5F', '#8E6CF0', '#FF8A00'];

// One burst of confetti over its parent. Skipped for reduced motion.
const Confetti = ({ pieces = 140 }) => {
    const ref = useRef(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const { width, height } = canvas.getBoundingClientRect();
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const parts = Array.from({ length: pieces }, () => ({
            x: width / 2 + (Math.random() - 0.5) * 80,
            y: height * 0.35,
            vx: (Math.random() - 0.5) * 12,
            vy: -Math.random() * 11 - 4,
            size: Math.random() * 7 + 5,
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.3,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
        }));

        let frame;
        let ticks = 0;
        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            parts.forEach(p => {
                p.vy += 0.32;
                p.vx *= 0.99;
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.vr;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                ctx.restore();
            });
            ticks += 1;
            if (ticks < 220) frame = requestAnimationFrame(draw);
            else ctx.clearRect(0, 0, width, height);
        };
        frame = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(frame);
    }, [pieces]);

    return (
        <canvas
            ref={ref}
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}
        />
    );
};

export default Confetti;
