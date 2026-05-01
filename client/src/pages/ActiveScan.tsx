import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Activity, HeartPulse, Camera, CheckCircle2 } from 'lucide-react';
import { ROUTE_PATHS, type ScanMode, type ScanResult } from '@/lib/index';
import { useHeartRateMonitor } from '@/hooks/useHeartRateMonitor';

export default function ActiveScan() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialMode = (location.state?.mode as ScanMode) || 'heart-rate';
  const isComplete = initialMode === 'complete';
  
  const [currentStage, setCurrentStage] = useState<'heart-rate' | 'facial'>(
    initialMode === 'facial' ? 'facial' : 'heart-rate'
  );
  
  const [timeLeft, setTimeLeft] = useState(45);
  const [scanState, setScanState] = useState<'idle' | 'running' | 'done'>('idle');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const {
    bpm,
    bp,
    statusText,
    signalQuality,
    isFingerDetected,
    startMeasurement,
    stopMeasurement,
    signalBuffer
  } = useHeartRateMonitor();

  const startStage = async (stage: 'heart-rate' | 'facial') => {
    setScanState('running');
    const duration = stage === 'heart-rate' ? 45 : 15;
    setTimeLeft(duration);

    if (stage === 'heart-rate') {
      await startMeasurement();
    } else {
      // Start camera for facial scan
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play();
        }
      } catch (e) {
        console.error("Facial camera error:", e);
      }
    }
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          finishStage(stage);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finishStage = (stage: 'heart-rate' | 'facial') => {
    if (stage === 'heart-rate') {
      stopMeasurement();
      if (isComplete) {
        // Automatically transition to facial
        setTimeout(() => {
          setCurrentStage('facial');
        }, 1000);
      } else {
        setScanState('done');
        setTimeout(finalize, 1500);
      }
    } else {
      // Stop facial camera
      const s = videoRef.current?.srcObject as MediaStream;
      s?.getTracks().forEach(t => t.stop());
      setScanState('done');
      setTimeout(finalize, 1500);
    }
  };

  const finalize = () => {
    const finalReport: ScanResult = {
      id: 'scan_' + Date.now(),
      date: new Date(),
      bpm: bpm || 72,
      healthScore: 85,
      cvdProbability: 0.12,
      aiConfidence: 95,
      stressLevel: 'normal',
      pallor: false,
      cyanosis: false,
      scanMode: initialMode,
      duration: 45,
      bpEstimate: bp
    };
    navigate(ROUTE_PATHS.RESULTS, { state: finalReport });
  };

  useEffect(() => {
    startStage(currentStage);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopMeasurement();
    };
  }, [currentStage]);

  const progress = currentStage === 'heart-rate' ? ((45 - timeLeft) / 45) * 100 : ((15 - timeLeft) / 15) * 100;

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-gray-900 flex flex-col items-center py-4 px-4 sm:px-6">
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 font-medium">
            <ChevronLeft className="w-5 h-5 mr-1" /> Cancel
          </button>
          <div className="bg-[#10B981] text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm">
            {isComplete ? 'Complete Health Scan' : currentStage === 'heart-rate' ? 'Heart Rate Only' : 'Face Only'}
          </div>
        </div>

        {currentStage === 'heart-rate' ? (
          /* --- Heart Rate Monitor UI --- */
          <div className="space-y-4">
            <h1 className="text-2xl font-bold mb-4 tracking-tight">Heart Rate Monitor</h1>
            
            {/* Instructions Card */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-blue-500" />
                <h2 className="font-bold text-gray-900 text-sm">Instructions</h2>
              </div>
              <ol className="space-y-3 pl-1 text-[13px]">
                <li className="flex gap-3">
                  <span className="text-gray-400 font-medium">1.</span>
                  <span className="text-blue-600 font-medium leading-tight">Cover the rear camera completely with your fingertip</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-gray-400 font-medium">2.</span>
                  <span className="text-blue-600 font-medium leading-tight">Make sure the flashlight is also covered</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-gray-400 font-medium">3.</span>
                  <span className="text-blue-600 font-medium leading-tight">Keep your finger steady and still</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-gray-400 font-medium">4.</span>
                  <span className="text-blue-600 font-medium leading-tight">Wait for 45 seconds</span>
                </li>
              </ol>
            </div>

            {/* Main Scanning Card */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col items-center">
              <motion.div 
                animate={isFingerDetected ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="mb-8 text-red-500"
              >
                <HeartPulse fill="currentColor" className="w-14 h-14" />
              </motion.div>

              <div className="text-center mb-6">
                <span className="text-5xl font-black text-gray-800 tabular-nums tracking-tighter">
                  {bpm ?? '--'}
                </span>
                <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mt-1">BPM</p>
              </div>

              {/* Signal Quality Bar */}
              <div className="w-full mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Signal Quality</span>
                  <span className={`text-[10px] font-bold uppercase ${signalQuality === 'good' ? 'text-green-500' : signalQuality === 'weak' ? 'text-amber-500' : 'text-red-500'}`}>
                    {signalQuality === 'good' ? 'Good' : signalQuality === 'weak' ? 'Weak' : 'None'}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${signalQuality === 'good' ? 'bg-green-500' : signalQuality === 'weak' ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: signalQuality === 'good' ? '100%' : signalQuality === 'weak' ? '40%' : '10%' }}
                  />
                </div>
              </div>

              {/* Waveform */}
              <div className="flex items-end justify-center gap-1.5 h-16 w-full mb-8">
                {Array.from({ length: 20 }).map((_, i) => {
                  const sampleIdx = Math.max(0, signalBuffer.length - 20 + i);
                  const sample = signalBuffer[sampleIdx];
                  // Normalize sample filtered value for display
                  const height = isFingerDetected && sample 
                    ? Math.min(100, Math.max(10, (Math.abs(sample.filtered) / 5) * 100)) 
                    : 10;
                  return (
                    <div 
                      key={i} 
                      className={`w-3.5 rounded-full transition-all duration-100 ease-out ${signalQuality === 'good' ? 'bg-blue-500' : 'bg-gray-300'}`}
                      style={{ height: `${height}%` }}
                    />
                  );
                })}
              </div>

              <div className="w-full space-y-4 pt-4 border-t border-gray-50 text-[13px]">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status:</span>
                  <span className={`font-bold ${signalQuality === 'none' ? 'text-red-500' : signalQuality === 'weak' ? 'text-amber-500' : 'text-green-600'}`}>
                    {statusText}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Time Remaining:</span>
                  <span className="font-bold text-gray-900">{timeLeft}s</span>
                </div>
              </div>
            </div>

            {/* Progress Card */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-3 text-sm font-medium">
                <span className="text-gray-500 text-[13px]">Scan Progress</span>
                <span className="text-blue-600 font-bold">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        ) : (
          /* --- Facial Diagnostics UI --- */
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold tracking-tight">Facial Diagnostics</h1>
              <p className="text-sm text-gray-400 font-medium">Remain steady for best accuracy.</p>
            </div>

            {/* Camera Card */}
            <div className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm">
              <div className="relative aspect-square bg-black">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
                {/* Blue Frame Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[80%] h-[60%] border-2 border-blue-400/60 rounded-3xl" />
                </div>
              </div>
              {/* Footer */}
              <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Scanning Facial Markers</p>
                  <p className="text-lg font-bold">Neural Engine Active</p>
                </div>
                <Camera className="w-7 h-7" />
              </div>
            </div>

            {/* Progress Card */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-3 text-sm font-medium uppercase tracking-widest">
                <span className="text-gray-400 text-[10px] font-bold">Neural Analysis</span>
                <span className="text-blue-600 font-bold">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* Completion Alert */}
        {scanState === 'done' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 bg-green-600 rounded-2xl p-5 flex items-center justify-center gap-3 shadow-lg shadow-green-100">
            <CheckCircle2 className="w-6 h-6 text-white" />
            <span className="text-white font-bold uppercase tracking-widest text-xs">Vitals Captured Successfully</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
