import React, { useEffect, useRef } from 'react';

const ForestParticles = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement.clientHeight || 600;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const particleCount = 40;
    const particles = [];

    const colors = [
      'rgba(16, 185, 129, ',
      'rgba(52, 211, 153, ',
      'rgba(217, 119, 6, ',
      'rgba(110, 231, 183, '
    ];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * (canvas.width || 1000),
        y: Math.random() * (canvas.height || 600),
        radius: Math.random() * 2 + 0.8,
        colorPrefix: colors[Math.floor(Math.random() * colors.length)],
        baseAlpha: Math.random() * 0.4 + 0.15,
        alpha: 0.2,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: - (Math.random() * 0.4 + 0.15),
        swaySpeed: Math.random() * 0.02 + 0.01,
        swayStep: Math.random() * Math.PI * 2
      });
    }

    const render = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.swayStep += p.swaySpeed;
        p.x += p.speedX + Math.sin(p.swayStep) * 0.2;
        p.y += p.speedY;

        p.alpha = p.baseAlpha + Math.sin(p.swayStep * 2) * 0.15;
        if (p.alpha < 0.05) p.alpha = 0.05;

        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.colorPrefix}${p.alpha})`;
        ctx.shadowColor = `${p.colorPrefix}0.6)`;
        ctx.shadowBlur = p.radius * 3;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="forest-particles-canvas"
      aria-hidden="true"
    />
  );
};

export default ForestParticles;
