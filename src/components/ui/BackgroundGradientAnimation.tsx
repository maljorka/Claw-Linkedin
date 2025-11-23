import { cn } from '../../lib/utils';
import { useEffect, useRef, useState } from 'react';

export function BackgroundGradientAnimation({
  gradientBackgroundStart = 'rgb(0, 0, 0)',
  gradientBackgroundEnd = 'rgb(0, 0, 0)',
  firstColor = '220, 38, 38',
  secondColor = '153, 27, 27',
  thirdColor = '248, 113, 113',
  fourthColor = '127, 29, 29',
  fifthColor = '185, 28, 28',
  pointerColor = '220, 38, 38',
  size = '80%',
  containerClassName,
}: {
  gradientBackgroundStart?: string;
  gradientBackgroundEnd?: string;
  firstColor?: string;
  secondColor?: string;
  thirdColor?: string;
  fourthColor?: string;
  fifthColor?: string;
  pointerColor?: string;
  size?: string;
  containerClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.style.setProperty('--gradient-background-start', gradientBackgroundStart);
    el.style.setProperty('--gradient-background-end', gradientBackgroundEnd);
    el.style.setProperty('--first-color', firstColor);
    el.style.setProperty('--second-color', secondColor);
    el.style.setProperty('--third-color', thirdColor);
    el.style.setProperty('--fourth-color', fourthColor);
    el.style.setProperty('--fifth-color', fifthColor);
    el.style.setProperty('--pointer-color', pointerColor);
    el.style.setProperty('--size', size);
  }, [
    gradientBackgroundStart, gradientBackgroundEnd,
    firstColor, secondColor, thirdColor, fourthColor, fifthColor,
    pointerColor, size,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'h-full w-full relative overflow-hidden top-0 left-0 bg-black',
        containerClassName
      )}
    >
      <svg className="hidden">
        <defs>
          <filter id="blurMe">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
      <div
        className={cn('gradients-container h-full w-full blur-lg', isSafari ? 'blur-2xl' : '[filter:url(#blurMe)_blur(40px)]')}
      >
        <div className="absolute [background:radial-gradient(circle_at_center,_rgba(var(--first-color),_0.8)_0,_rgba(var(--first-color),_0)_50%)_no-repeat] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)] [transform-origin:center_center] animate-first opacity-100" />
        <div className="absolute [background:radial-gradient(circle_at_center,_rgba(var(--second-color),_0.8)_0,_rgba(var(--second-color),_0)_50%)_no-repeat] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)] [transform-origin:calc(50%-400px)] animate-second opacity-100" />
        <div className="absolute [background:radial-gradient(circle_at_center,_rgba(var(--third-color),_0.8)_0,_rgba(var(--third-color),_0)_50%)_no-repeat] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)] [transform-origin:calc(50%+400px)] animate-third opacity-70" />
        <div className="absolute [background:radial-gradient(circle_at_center,_rgba(var(--fourth-color),_0.8)_0,_rgba(var(--fourth-color),_0)_50%)_no-repeat] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)] [transform-origin:calc(50%-200px)] animate-fourth opacity-70" />
        <div className="absolute [background:radial-gradient(circle_at_center,_rgba(var(--fifth-color),_0.8)_0,_rgba(var(--fifth-color),_0)_50%)_no-repeat] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)] [transform-origin:calc(50%-800px)_calc(50%+800px)] animate-fifth opacity-100" />
      </div>
    </div>
  );
}
