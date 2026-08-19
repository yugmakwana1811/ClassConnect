"use client";

import { useId } from 'react';
import './ShinyText.css';

const ShinyText = ({
  text,
  disabled = false,
  speed = 2,
  className = '',
  color = '#b5b5b5',
  shineColor = '#ffffff',
  spread = 120,
  yoyo = false,
  pauseOnHover = false,
  direction = 'left',
  delay = 0
}) => {
  const rawId = useId();
  const animationName = `shiny-text-${rawId.replace(/:/g, '')}`;
  const shineDuration = Math.max(0.1, Number(speed) || 2);
  const holdDuration = Math.max(0, Number(delay) || 0);
  const start = direction === 'left' ? '150%' : '-50%';
  const end = direction === 'left' ? '-50%' : '150%';
  const singleCycle = shineDuration + holdDuration;
  const totalDuration = yoyo ? singleCycle * 2 : singleCycle;
  const forwardEnd = (shineDuration / totalDuration) * 100;
  const holdEnd = (singleCycle / totalDuration) * 100;
  const reverseEnd = ((singleCycle + shineDuration) / totalDuration) * 100;
  const keyframes = yoyo
    ? `
      @keyframes ${animationName} {
        0% { background-position: ${start} center; }
        ${forwardEnd.toFixed(4)}% { background-position: ${end} center; }
        ${holdEnd.toFixed(4)}% { background-position: ${end} center; }
        ${reverseEnd.toFixed(4)}% { background-position: ${start} center; }
        100% { background-position: ${start} center; }
      }
    `
    : `
      @keyframes ${animationName} {
        0% { background-position: ${start} center; }
        ${forwardEnd.toFixed(4)}%, 100% { background-position: ${end} center; }
      }
    `;

  const gradientStyle = {
    backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`,
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  };

  return (
    <>
      <style>{keyframes}</style>
      <span
        className={`shiny-text ${className}`}
        data-pause-on-hover={pauseOnHover}
        style={{
          ...gradientStyle,
          backgroundPosition: disabled ? start : undefined,
          animation: disabled
            ? 'none'
            : `${animationName} ${totalDuration}s linear infinite`,
        }}
      >
        {text}
      </span>
    </>
  );
};

export default ShinyText;
