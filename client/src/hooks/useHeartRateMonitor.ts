import { useState, useRef, useEffect, useCallback } from 'react';

export interface SignalPoint {
  value: number;
  time: number;
  ema: number;
  filtered: number;
}

export interface BPResult {
  systolic: number;
  diastolic: number;
  category: string;
  color: string;
}

// CONSTANTS
const CAPTURE_SIZE = 32; 
const SCAN_DURATION = 30000;
const EMA_ALPHA = 0.2;
const MIN_PEAK_INTERVAL = 300; // ms (max 200 BPM)
const MAX_PEAK_INTERVAL = 1500; // ms (min 40 BPM)
const FINGER_THRESHOLD = 150; // avgRed must exceed this

export function useHeartRateMonitor() {
  const [bpm, setBpm] = useState<number | null>(null);
  const [bp, setBp] = useState<BPResult | null>(null);
  const [statusText, setStatusText] = useState<string>('Ready to start');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFingerDetected, setIsFingerDetected] = useState(false);
  const [signalQuality, setSignalQuality] = useState<'good' | 'weak' | 'none'>('none');
  
  const isProcessingRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const processingCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const signalBufferRef = useRef<SignalPoint[]>([]);
  const emaValueRef = useRef<number | null>(null);

  useEffect(() => {
    if (!videoRef.current) {
      videoRef.current = document.createElement('video');
      videoRef.current.playsInline = true;
    }
    if (!processingCanvasRef.current) {
      processingCanvasRef.current = document.createElement('canvas');
      processingCanvasRef.current.width = CAPTURE_SIZE;
      processingCanvasRef.current.height = CAPTURE_SIZE;
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

  const estimateBP = (avgBPM: number) => {
    const sys = Math.round(120 + (avgBPM - 72) * 0.5);
    const dia = Math.round(80 + (avgBPM - 72) * 0.3);
    
    const finalSys = Math.min(180, Math.max(85, sys));
    const finalDia = Math.min(110, Math.max(55, dia));
    const cat = getBpCategory(finalSys, finalDia);
    
    // Calculate Health Score
    let score = 100;
    if (avgBPM < 60 || avgBPM > 100) score -= 20;
    else if (avgBPM < 65 || avgBPM > 90) score -= 8;
    if (finalSys >= 140) score -= 20;
    else if (finalSys >= 130) score -= 10;
    score = Math.max(0, Math.min(100, score));

    return { systolic: finalSys, diastolic: finalDia, score, ...cat };
  };

  const calculateFinalBPM = (signalBuffer: SignalPoint[]) => {
    const values = signalBuffer.map(b => b.filtered);
    const times  = signalBuffer.map(b => b.time);
    if (values.length < 100) return null;

    const mean = values.reduce((a,b)=>a+b,0)/values.length;
    const std  = Math.sqrt(values.map(v=>(v-mean)**2).reduce((a,b)=>a+b)/values.length);
    const threshold = mean + 0.3 * std;

    const peaks = [];
    let lastPeakTime = 0;
    for (let i = 2; i < values.length - 2; i++) {
      if (values[i] > threshold &&
          values[i] > values[i-1] && values[i] > values[i-2] &&
          values[i] > values[i+1] && values[i] > values[i+2]) {
        if (times[i] - lastPeakTime > MIN_PEAK_INTERVAL) {
          peaks.push(times[i]);
          lastPeakTime = times[i];
        }
      }
    }

    if (peaks.length < 3) return null;

    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      const d = peaks[i] - peaks[i-1];
      if (d >= MIN_PEAK_INTERVAL && d <= MAX_PEAK_INTERVAL) intervals.push(d);
    }
    if (intervals.length === 0) return null;

    // MAD outlier removal
    const sorted = [...intervals].sort((a,b)=>a-b);
    const median = sorted[Math.floor(sorted.length/2)];
    const mad = [...sorted.map(x=>Math.abs(x-median))].sort((a,b)=>a-b)[Math.floor(sorted.length/2)];
    const clean = intervals.filter(x => Math.abs(x-median) < 2.5*(mad || 1));
    if (clean.length === 0) return null;

    const avgInterval = clean.reduce((a,b)=>a+b)/clean.length;
    return Math.round(60000 / avgInterval);
  };

  const processFrame = useCallback(() => {
    if (!isProcessingRef.current) return;
    const ctx = processingCtxRef.current;
    const canvas = processingCanvasRef.current;
    const video = videoRef.current;
    if (!ctx || !canvas || !video) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    let r = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
    }
    const avgR = r / (data.length / 4);

    const fingerDetected = avgR > FINGER_THRESHOLD;
    setIsFingerDetected(fingerDetected);

    if (!fingerDetected) {
      setSignalQuality('none');
      setStatusText('No finger detected — cover camera completely');
    } else {
      // EMA Smoothing
      if (emaValueRef.current === null) emaValueRef.current = avgR;
      emaValueRef.current = EMA_ALPHA * avgR + (1 - EMA_ALPHA) * emaValueRef.current;
      
      // High Pass Filter
      const last30 = signalBufferRef.current.slice(-30).map(b => b.ema);
      const mean = last30.length > 0 ? last30.reduce((a,b)=>a+b,0) / last30.length : avgR;
      const filtered = emaValueRef.current - mean;

      // Signal quality check via variance
      const last10 = signalBufferRef.current.slice(-10).map(b => b.ema);
      const variance = last10.length > 0 ? 
        last10.reduce((a,b)=>a+Math.pow(b-mean,2),0)/last10.length : 0;
      
      if (variance < 1.5) {
        setSignalQuality('weak');
        setStatusText('Weak signal — press harder');
      } else {
        setSignalQuality('good');
        setStatusText('Good signal ✅');
      }

      signalBufferRef.current.push({ 
        value: avgR, 
        time: performance.now(),
        ema: emaValueRef.current,
        filtered: filtered
      });
    }

    animationIdRef.current = requestAnimationFrame(processFrame);
  }, []);

  const doStop = useCallback(() => {
    isProcessingRef.current = false;
    setIsProcessing(false);
    if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    
    // Calculate final results if buffer is large enough
    if (signalBufferRef.current.length > 300) {
      const finalBpm = calculateFinalBPM(signalBufferRef.current);
      if (finalBpm) {
        setBpm(finalBpm);
        const finalBp = estimateBP(finalBpm);
        setBp(finalBp);
      }
    }
    
    signalBufferRef.current = [];
    emaValueRef.current = null;
  }, []);

  const startMeasurement = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', frameRate: { ideal: 30 } }, 
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