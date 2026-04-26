import { useState, useRef, useEffect, useCallback } from 'react';

export interface SignalPoint {
  value: number;
  time: number;
}

const WINDOW_SIZE_SECONDS = 5;
const FPS = 30;
const BUFFER_SIZE = 150;
const SMOOTHING_WINDOW = 5;
const MIN_PEAK_DISTANCE_MS = 300;
const MIN_BPM = 40;
const MAX_BPM = 200;

const CONFIG = {
  PROCESSING_CANVAS_SIZE: 100,
  MIN_AMPLITUDE: 5,
  VIBRATION_DURATION: 50,
  FINGER_DETECTION: {
    MIN_RED: 100,
    RED_GREEN_RATIO: 1.2,
    RED_BLUE_RATIO: 1.2
  }
};

export function useHeartRateMonitor() {
  const [bpm, setBpm] = useState<number | null>(null);
  const [statusText, setStatusText] = useState<string>('Ready to start');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFingerDetected, setIsFingerDetected] = useState(false);
  const [lastBeatTime, setLastBeatTime] = useState(0);

  const isProcessingRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const processingCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const signalBufferRef = useRef<SignalPoint[]>([]);
  const lastBeatTimeRef = useRef(0);

  useEffect(() => {
    if (!videoRef.current) {
      videoRef.current = document.createElement('video');
      videoRef.current.playsInline = true;
    }

    if (!processingCanvasRef.current) {
      processingCanvasRef.current = document.createElement('canvas');
      processingCanvasRef.current.width = CONFIG.PROCESSING_CANVAS_SIZE;
      processingCanvasRef.current.height = CONFIG.PROCESSING_CANVAS_SIZE;
      processingCtxRef.current = processingCanvasRef.current.getContext('2d', {
        willReadFrequently: true
      });
    }

    return () => {
      doStop();
    };
  }, []);

  const analyzeSignal = useCallback(() => {
    const values = signalBufferRef.current.map((p) => p.value);

    const smoothed: number[] = [];
    const win = SMOOTHING_WINDOW;

    for (let i = 0; i < values.length; i++) {
      let sum = 0;
      let count = 0;
      for (
        let j = Math.max(0, i - win);
        j <= Math.min(values.length - 1, i + win);
        j++
      ) {
        sum += values[j];
        count++;
      }
      smoothed.push(sum / count);
    }

    const minVal = Math.min(...smoothed);
    const maxVal = Math.max(...smoothed);
    const amplitude = maxVal - minVal;

    if (amplitude < CONFIG.MIN_AMPLITUDE) {
      return;
    }

    const currentPeaks: { time: number; index: number }[] = [];

    for (let i = 1; i < smoothed.length - 1; i++) {
      if (smoothed[i] > smoothed[i - 1] && smoothed[i] > smoothed[i + 1]) {
        if (smoothed[i] > minVal + amplitude * 0.6) {
          const time = signalBufferRef.current[i].time;

          if (
            currentPeaks.length === 0 ||
            time - currentPeaks[currentPeaks.length - 1].time > MIN_PEAK_DISTANCE_MS
          ) {
            currentPeaks.push({ time, index: i });
          }
        }
      }
    }

    if (currentPeaks.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < currentPeaks.length; i++) {
        intervals.push(currentPeaks[i].time - currentPeaks[i - 1].time);
      }

      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = 60000 / avgInterval;

      if (calculatedBpm > MIN_BPM && calculatedBpm < MAX_BPM) {
        const roundedBpm = Math.round(calculatedBpm);
        setBpm(roundedBpm);

        const lastPeak = currentPeaks[currentPeaks.length - 1];
        if (lastPeak.time !== lastBeatTimeRef.current) {
          lastBeatTimeRef.current = lastPeak.time;
          setLastBeatTime(lastPeak.time);

          if (navigator.vibrate) {
            navigator.vibrate(CONFIG.VIBRATION_DURATION);
          }
        }
      }
    }
  }, []);

  const processFrame = useCallback(() => {
    if (!isProcessingRef.current) return;
    if (!videoRef.current || !processingCtxRef.current || !processingCanvasRef.current) {
      animationIdRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const ctx = processingCtxRef.current;
    const canvas = processingCanvasRef.current;
    const video = videoRef.current;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = frameData.data;

    let sumRed = 0;
    let sumGreen = 0;
    let sumBlue = 0;
    const totalPixels = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      sumRed += data[i];
      sumGreen += data[i + 1];
      sumBlue += data[i + 2];
    }

    const avgRed = sumRed / totalPixels;
    const avgGreen = sumGreen / totalPixels;
    const avgBlue = sumBlue / totalPixels;

    const fingerDetected =
      avgRed > CONFIG.FINGER_DETECTION.MIN_RED &&
      avgRed > avgGreen * CONFIG.FINGER_DETECTION.RED_GREEN_RATIO &&
      avgRed > avgBlue * CONFIG.FINGER_DETECTION.RED_BLUE_RATIO;

    setIsFingerDetected(fingerDetected);

    if (!fingerDetected) {
      setStatusText('Place finger on camera');
      setBpm(null);
      signalBufferRef.current = [];
    } else {
      setStatusText('Reading signal...');

      const now = performance.now();
      signalBufferRef.current.push({ value: avgRed, time: now });

      if (signalBufferRef.current.length > BUFFER_SIZE) {
        signalBufferRef.current.shift();
      }

      if (signalBufferRef.current.length > FPS * 1) {
        analyzeSignal();
      }
    }

    animationIdRef.current = requestAnimationFrame(processFrame);
  }, [analyzeSignal]);

  const doStop = useCallback(() => {
    isProcessingRef.current = false;
    setIsProcessing(false);

    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setBpm(null);
    setStatusText('Stopped');
    setIsFingerDetected(false);
    signalBufferRef.current = [];
  }, []);

  const startMeasurement = useCallback(async () => {
    try {
      setStatusText('Requesting camera...');

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: 'environment',
          frameRate: { ideal: FPS },
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              resolve();
            };
          }
        });
      }

      const track = stream.getVideoTracks()[0];
      try {
        const capabilities = track.getCapabilities() as Record<string, unknown>;
        if (capabilities['torch'] || capabilities['fillLightMode']) {
          await track.applyConstraints({
            advanced: [{ torch: true } as MediaTrackConstraintSet]
          });
        }
      } catch (err) {
        setStatusText('Torch failed. Use good lighting.');
      }

      isProcessingRef.current = true;
      setIsProcessing(true);
      setStatusText('Detecting pulse...');
      signalBufferRef.current = [];

      processFrame();
    } catch (err) {
      const error = err as Error;
      setStatusText(`Error: ${error.name || error.message}`);
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  }, [processFrame]);

  const stopMeasurement = useCallback(() => {
    doStop();
  }, [doStop]);

  return {
    bpm,
    statusText,
    isProcessing,
    isFingerDetected,
    startMeasurement,
    stopMeasurement,
    signalBufferRef,
    lastBeatTime
  };
}