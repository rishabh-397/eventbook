import { useEffect, useRef } from 'react';

/**
 * Animated space background: stars drifting slowly + a few larger
 * "planets" orbiting subtly. Pure Canvas API, no external libraries -
 * runs on requestAnimationFrame for smooth, GPU-friendly animation.
 */
export default function StarfieldBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    let width, height;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Generate a fixed starfield - each star has its own depth (z) which
    // controls size + speed, giving a subtle parallax feel
    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 0.8 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2,
    }));

    // A couple of large, slow "planets" orbiting a faint center point
    const planets = [
      { radius: 26, orbitRadius: 220, angle: 0, speed: 0.0004, color: '#E8B563', glow: 'rgba(232,181,99,0.15)' },
      { radius: 14, orbitRadius: 340, angle: 2, speed: 0.0002, color: '#4A9B7F', glow: 'rgba(74,155,127,0.12)' },
      { radius: 8, orbitRadius: 130, angle: 4, speed: 0.0007, color: '#C1443D', glow: 'rgba(193,68,61,0.12)' },
    ];

    const centerX = () => width * 0.8;
    const centerY = () => height * 0.25;

    function draw(time) {
      ctx.clearRect(0, 0, width, height);

      // Stars
      stars.forEach((star) => {
        const twinkle = 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed + star.twinklePhase);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.z * 1.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(237, 234, 227, ${twinkle * star.z})`;
        ctx.fill();

        // slow downward drift
        star.y += star.z * 0.05;
        if (star.y > height) star.y = 0;
      });

      // Planets orbiting a fixed point
      planets.forEach((p) => {
        p.angle += p.speed;
        const px = centerX() + Math.cos(p.angle) * p.orbitRadius;
        const py = centerY() + Math.sin(p.angle) * p.orbitRadius * 0.4; // flattened orbit

        const gradient = ctx.createRadialGradient(px, py, 0, px, py, p.radius * 3);
        gradient.addColorStop(0, p.glow);
        gradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(px, py, p.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    }

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}