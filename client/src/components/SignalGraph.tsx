import { useRef, useEffect } from 'react';
import type { SignalPoint } from '@/hooks/useHeartRateMonitor';

interface SignalGraphProps {
  signalBuffer: SignalPoint[];
  isFingerDetected: boolean;
}

export function SignalGraph({ signalBuffer, isFingerDetected }: SignalGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      drawGraph();
    };

    const drawGraph = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      if (!isFingerDetected || signalBuffer.length < 2) return;

      const maxSamples = 150;
      const displayBuffer = signalBuffer.slice(-maxSamples);

      if (displayBuffer.length < 2) return;

      let min = Infinity;
      let max = -Infinity;

      for (const point of displayBuffer) {
        if (point.value < min) min = point.value;
        if (point.value > max) max = point.value;
      }

      const range = max - min || 1;

      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;

      for (let i = 0; i < displayBuffer.length; i++) {
        const val = displayBuffer[i].value;
        const x = (i / (displayBuffer.length - 1)) * width;
        const normalizedY = (val - min) / range;
        const y = height - (normalizedY * height);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    };

    updateCanvasSize();

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [signalBuffer, isFingerDetected]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
