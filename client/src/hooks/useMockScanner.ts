import { useState, useRef, useEffect, useCallback } from 'react';
import { SCAN_CONFIGS, type ScanMode } from '@/lib/index';

export function useMockScanner(mode: ScanMode) {
  const [bpm, setBpm] = useState<number | null>(null);
  const [statusText, setStatusText] = useState<string>('Ready to start');
  const [confidence, setConfidence] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [waveform, setWaveform] = useState<number[]>(Array(20).fill(10));
  
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const duration = SCAN_CONFIGS[mode]?.duration || 30; // seconds

  const doStop = useCallback(() => {
    setIsScanning(false);
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startScan = useCallback(async () => {
    try {
      setStatusText('Requesting camera...');
      
      // Attempt to get camera just for the realism (light on)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }, 
          audio: false 
        });
        streamRef.current = stream;
        
        // Try to enable torch if available
        const track = stream.getVideoTracks()[0];
        try {
          const capabilities = track.getCapabilities() as Record<string, unknown>;
          if (capabilities['torch'] || capabilities['fillLightMode']) {
            await track.applyConstraints({
              advanced: [{ torch: true } as MediaTrackConstraintSet]
            });
          }
        } catch (e) {
          // Ignore torch failure
        }
      } catch (err) {
        console.warn("Camera access failed/denied. Proceeding with simulation.");
      }

      setIsScanning(true);
      setIsFinished(false);
      setProgress(0);
      setConfidence(0);
      setStatusText('Detecting pulse...');
      startTimeRef.current = Date.now();
      
      let currentBpm = 72;
      let targetBpm = 75;

      const step = () => {
        const elapsed = Date.now() - startTimeRef.current;
        const p = Math.min((elapsed / (duration * 1000)) * 100, 100);
        setProgress(p);

        if (p < 15) {
          setStatusText('Warming up sensor...');
          setConfidence(Math.min(p * 2, 25));
          setBpm(null);
        } else if (p < 95) {
          setStatusText('Reading signal...');
          setConfidence(Math.min(25 + p * 0.7, 98));
          
          // Fluctuate BPM smoothly
          if (Math.random() > 0.95) {
            targetBpm = 68 + Math.floor(Math.random() * 15);
          }
          currentBpm += (targetBpm - currentBpm) * 0.1;
          setBpm(Math.round(currentBpm));
        } else {
          setStatusText('Finalizing...');
          setConfidence(99);
        }

        // Animate waveform
        if (elapsed % 100 < 20) {
          setWaveform(prev => {
            const next = [...prev.slice(1)];
            const active = p > 15;
            next.push(active ? 20 + Math.random() * 80 : 10);
            return next;
          });
        }

        if (p < 100) {
          timerRef.current = requestAnimationFrame(step);
        } else {
          finishScan();
        }
      };
      
      timerRef.current = requestAnimationFrame(step);

    } catch (err) {
      const error = err as Error;
      setStatusText(`Error: ${error.message}`);
      setIsScanning(false);
    }
  }, [duration]);

  const finishScan = useCallback(() => {
    doStop();
    setIsFinished(true);
    setStatusText('Scan complete');
    setConfidence(100);
  }, [doStop]);

  useEffect(() => {
    return () => doStop();
  }, [doStop]);

  return {
    bpm,
    statusText,
    confidence,
    progress,
    isScanning,
    isFinished,
    waveform,
    startScan,
    stopScan: doStop
  };
}
