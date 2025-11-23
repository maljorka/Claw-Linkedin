import { BackgroundGradientAnimation } from '../ui/BackgroundGradientAnimation';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <BackgroundGradientAnimation
        containerClassName="!h-full !w-full !absolute"
        gradientBackgroundStart="rgb(0, 0, 0)"
        gradientBackgroundEnd="rgb(0, 0, 0)"
        firstColor="220, 38, 38"
        secondColor="239, 68, 68"
        thirdColor="248, 113, 113"
        fourthColor="185, 28, 28"
        fifthColor="255, 50, 50"
        pointerColor="220, 38, 38"
        size="70%"
      />
      <div className="absolute inset-0 bg-black/60" />
    </div>
  );
}
