"use client";

import { useEffect, useRef } from "react";

/**
 * Pure CSS/Canvas star background that doesn't require WebGL.
 * Works on all hardware including older Intel HD Graphics.
 */
export const StarsCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    // Generate stars with varying properties
    const STAR_COUNT = 800;
    const stars: {
      x: number;
      y: number;
      z: number;
      size: number;
      opacity: number;
      twinkleSpeed: number;
      twinkleOffset: number;
    }[] = [];

    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random(), // depth layer (0 = far, 1 = near)
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }

    // Shooting stars
    const shootingStars: {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
      angle: number;
      active: boolean;
      life: number;
    }[] = [];

    const createShootingStar = () => {
      shootingStars.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.5,
        length: Math.random() * 80 + 40,
        speed: Math.random() * 6 + 4,
        opacity: 1,
        angle: (Math.random() * 0.5 + 0.2) * Math.PI,
        active: true,
        life: 1,
      });
    };

    // Occasionally spawn shooting stars
    const shootingStarInterval = setInterval(() => {
      if (shootingStars.length < 2 && Math.random() > 0.5) {
        createShootingStar();
      }
    }, 3000);

    let time = 0;

    const animate = () => {
      time += 1;
      ctx.clearRect(0, 0, width, height);

      // Draw stars
      for (const star of stars) {
        const twinkle =
          Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.5 + 0.5;
        const currentOpacity = star.opacity * (0.4 + twinkle * 0.6);
        const currentSize = star.size * (0.8 + twinkle * 0.2);

        // Subtle parallax drift
        const driftX = Math.sin(time * 0.0003 * (1 + star.z)) * 2 * star.z;
        const driftY = Math.cos(time * 0.0002 * (1 + star.z)) * 1.5 * star.z;

        const drawX = (star.x + driftX + width) % width;
        const drawY = (star.y + driftY + height) % height;

        // Glow effect for brighter stars
        if (currentSize > 1.2) {
          const gradient = ctx.createRadialGradient(
            drawX,
            drawY,
            0,
            drawX,
            drawY,
            currentSize * 3
          );
          gradient.addColorStop(
            0,
            `rgba(200, 210, 255, ${currentOpacity * 0.6})`
          );
          gradient.addColorStop(1, "rgba(200, 210, 255, 0)");
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(drawX, drawY, currentSize * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Star core
        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
        ctx.beginPath();
        ctx.arc(drawX, drawY, currentSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        if (!s.active) {
          shootingStars.splice(i, 1);
          continue;
        }

        const dx = Math.cos(s.angle) * s.speed;
        const dy = Math.sin(s.angle) * s.speed;

        s.x += dx;
        s.y += dy;
        s.life -= 0.015;
        s.opacity = Math.max(0, s.life);

        if (s.life <= 0 || s.x > width + 100 || s.y > height + 100) {
          s.active = false;
          continue;
        }

        const tailX = s.x - Math.cos(s.angle) * s.length;
        const tailY = s.y - Math.sin(s.angle) * s.length;

        const gradient = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
        gradient.addColorStop(0.7, `rgba(200, 210, 255, ${s.opacity * 0.4})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${s.opacity})`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        // Bright head
        ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      // Reposition stars
      for (const star of stars) {
        star.x = Math.random() * width;
        star.y = Math.random() * height;
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      clearInterval(shootingStarInterval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="w-full h-auto fixed inset-0 -z-10">
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          background: "transparent",
        }}
      />
    </div>
  );
};
