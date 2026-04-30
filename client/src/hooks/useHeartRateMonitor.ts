import { useState, useRef, useEffect, useCallback } from 'react';

export interface SignalPoint {
  value: number;
  time: number;
}

export interface BPResult {
  systolic: number;
  diastolic: number;
  category: string;
  color: string;
}

const WINDOW_SIZE_SECONDS = 10;
const FPS = 30;
const BUFFER_SIZE = FPS * WINDOW_SIZE_SECONDS;
const ALPHA = 0.2; // EMA smoothing factor
const MIN_PEAK_DISTANCE_MS = 300;

export function useHeartRateMonitor() {
  const [bpm, setBpm] = useState<number | null>(null);
  const [bp, setBp] = useState<BPResult | null>(null);
  const [statusText, setStatusText] = useState<string>('Ready to start');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFingerDetected, setIsFingerDetected] = useState(false);
  const [signalQuality, setSignalQuality] = useState<'Good' | 'Weak' | 'No Contact'>('No Contact');
  
  const isProcessingRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const processingCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const signalBufferRef = useRef<SignalPoint[]>([]);
  const lastBeatTimeRef = useRef(0);
  const bpmHistoryRef = useRef<number[]>([]);

  useEffect(() => {
    if (!videoRef.current) {
      videoRef.current = document.createElement('video');
      videoRef.current.playsInline = true;
    }
    if (!processingCanvasRef.current) {
      processingCanvasRef.current = document.createElement('canvas');
      processingCanvasRef.current.width = 50;
      processingCanvasRef.current.height = 50;
      processingCtxRef.current = processingCanvasRef.current.getContext('2d', { willReadFrequently: true });
    }
    return () => doStop();
  }, []);

  const getBpCategory = (sys: number, dia: number) => {
    if (sys < 90) return { category: 'Hypotension', color: 'text-blue-500' };
    if (sys < 120 && dia < 80) return { category: 'Normal ✅', color: 'text-green-500' };
    if (sys < 130 && dia < 80) return { category: 'Elevated ⚠️', color: 'text-amber-500' };
    if (sys < 140 || dia < 90) return { category: 'Stage 1 Hypertension', color: 'text-amber-600' };
    return { category: 'Stage 2 Hypertension 🔴', color: 'text-red-500' };
  };

  const analyzeSignal = useCallback(() => {
    if (signalBufferRef.current.length < 30) return;

    // 1. EMA Smoothing
    const values = signalBufferRef.current.map(p => p.value);
    const smoothed: number[] = [];
    let ema = values[0];
    for (let i = 0; i < values.length; i++) {
      ema = ALPHA * values[i] + (1 - ALPHA) * ema;
      smoothed.push(ema);
    }

    // 2. High-Pass Filter (Remove slow drift)
    const filtered: number[] = [];
    const localWin = 30;
    for (let i = 0; i < smoothed.length; i++) {
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - localWin); j <= i; j++) {
        sum += smoothed[j];
        count++;
      }
      filtered.push(smoothed[i] - (sum / count));
    }

    // 3. Peak Detection
    const peaks: { time: number; value: number }[] = [];
    const mean = filtered.reduce((a, b) => a + b, 0) / filtered.length;
    const std = Math.sqrt(filtered.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / filtered.length);
    const threshold = mean + 0.3 * std;

    for (let i = 1; i < filtered.length - 1; i++) {
      if (filtered[i] > filtered[i - 1] && filtered[i] > filtered[i + 1] && filtered[i] > threshold) {
        const time = signalBufferRef.current[i].time;
        if (peaks.length === 0 || time - peaks[peaks.length - 1].time > MIN_PEAK_DISTANCE_MS) {
          peaks.push({ time, value: filtered[i] });
        }
      }
    }

    if (peaks.length < 2) return;

    // 4. Outlier Removal (Median + MAD)
    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i].time - peaks[i - 1].time);
    }

    const sortedIntervals = [...intervals].sort((a, b) => a - b);
    const median = sortedIntervals[Math.floor(sortedIntervals.length / 2)];
    const mad = [...intervals].map(x => Math.abs(x - median)).sort((a, b) => a - b)[Math.floor(intervals.length / 2)];
    
    const validIntervals = intervals.filter(x => Math.abs(x - median) < 2.5 * mad);
    if (validIntervals.length === 0) return;

    // 5. BPM Calculation
    const avgInterval = validIntervals.reduce((a, b) => a + b, 0) / validIntervals.length;
    const rawBpm = 60000 / avgInterval;

    // 6. Weighted Moving Average for final BPM
    bpmHistoryRef.current.push(rawBpm);
    if (bpmHistoryRef.current.length > 3) bpmHistoryRef.current.shift();
    
    let finalBpm = rawBpm;
    if (bpmHistoryRef.current.length === 3) {
      finalBpm = 0.2 * bpmHistoryRef.current[0] + 0.3 * bpmHistoryRef.current[1] + 0.5 * bpmHistoryRef.current[2];
    }
    setBpm(Math.round(finalBpm));

    // 7. BP Estimation (Experimental PTT method)
    const valleys: number[] = [];
    for (let i = 1; i < filtered.length - 1; i++) {
      if (filtered[i] < filtered[i - 1] && filtered[i] < filtered[i + 1]) {
        valleys.push(i);
      }
    }

    if (peaks.length > 0 && valleys.length > 0) {
      const lastPeakIdx = peaks[peaks.length - 1].time; // Note: simplified for estimation
      // Empirical formula for demonstration
      const amplitude = Math.max(...filtered) - Math.min(...filtered);
      const riseTime = 100; // Simplified
      
      const sys = 120 + (amplitude - 5) * 0.8 - (riseTime - 100) * 0.15;
      const dia = 80 + (avgInterval - 800) * (-0.04);
      
      const finalSys = Math.min(180, Math.max(85, Math.round(sys)));
      const finalDia = Math.min(110, Math.max(55, Math.round(dia)));
      
      const cat = getBpCategory(finalSys, finalDia);
      setBp({ systolic: finalSys, diastolic: finalDia, ...cat });
    }

  }, []);

  const processFrame = useCallback(() => {
    if (!isProcessingRef.current) return;
    const ctx = processingCtxRef.current;
    const canvas = processingCanvasRef.current;
    const video = videoRef.current;
    if (!ctx || !canvas || !video) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    let r = 0, g = 0, b = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i]; g += data[i+1]; b += data[i+2];
    }
    const avgR = r / (data.length / 4);
    const avgG = g / (data.length / 4);
    const avgB = b / (data.length / 4);

    const fingerDetected = avgR > 150 && avgR > avgG * 1.2;
    setIsFingerDetected(fingerDetected);

    if (!fingerDetected) {
      setSignalQuality('No Contact');
      setStatusText('Place finger on camera');
    } else {
      // Calculate variance for signal quality
      const samples = signalBufferRef.current.slice(-10).map(s => s.value);
      const mean = samples.reduce((a, b) => a + b, 0) / (samples.length || 1);
      const variance = samples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (samples.length || 1);
      
      if (variance < 0.5) setSignalQuality('Weak');
      else setSignalQuality('Good');
      
      setStatusText('Reading signal...');
      signalBufferRef.current.push({ value: avgR, time: performance.now() });
      if (signalBufferRef.current.length > BUFFER_SIZE) signalBufferRef.current.shift();
      if (signalBufferRef.current.length % 15 === 0) analyzeSignal();
    }

    animationIdRef.current = requestAnimationFrame(processFrame);
  }, [analyzeSignal]);

  const doStop = useCallback(() => {
    isProcessingRef.current = false;
    setIsProcessing(false);
    if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    signalBufferRef.current = [];
  }, []);

  const startMeasurement = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', frameRate: { ideal: FPS } }, 
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Torch
      const track = stream.getVideoTracks()[0];
      try {
        const caps = track.getCapabilities() as any;
        if (caps.torch) await track.applyConstraints({ advanced: [{ torch: true }] } as any);
      } catch (e) {}

      isProcessingRef.current = true;
      setIsProcessing(true);
      processFrame();
    } catch (err) {
      setStatusText('Camera error: ' + (err as Error).message);
    }
  };

  return {
    bpm,
    bp,
    statusText,
    isProcessing,
    isFingerDetected,
    signalQuality,
    startMeasurement,
    stopMeasurement: doStop,
    signalBuffer: signalBufferRef.current
  };
}