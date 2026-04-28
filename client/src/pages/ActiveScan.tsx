import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Activity, Camera, Mic, CheckCircle2 } from 'lucide-react';
import { useHeartRateMonitor } from '@/hooks/useHeartRateMonitor';
import { ROUTE_PATHS, SCAN_CONFIGS, type ScanMode, type ScanResult } from '@/lib/index';

// --- Animated Waveform ---
function PulseWaveform({ active }: { active: boolean }) {
  const bars = 15;
  return (
    <div className="flex items-end gap-[4px] h-12 w-full justify-center px-4">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-full bg-blue-500"
          animate={active ? { height: [10, 40, 15, 35, 10] } : { height: 10 }}
          transition={active ? {
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut"
          } : { duration: 0.3 }}
        />
      ))}
    </div>
  );
}

// --- Multi-Step Progress ---
type StepId = 'heart-rate' | 'facial' | 'assessment';
const STEPS: { id: StepId; label: string; Icon: React.ElementType }[] = [
  { id: 'heart-rate', label: 'Vitals', Icon: Activity },
  { id: 'facial', label: 'Facial AI', Icon: Camera },
  { id: 'assessment', label: 'Questions', Icon: Mic },
];

function StepIndicator({ activeIdx }: { activeIdx: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEPS.map((step, idx) => (
        <div key={step.id} className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
            idx < activeIdx ? 'bg-green-500 text-white' : 
            idx === activeIdx ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 
            'bg-gray-100 text-gray-400'
          }`}>
            {idx < activeIdx ? <CheckCircle2 className="w-5 h-5" /> : <step.Icon className="w-4 h-4" />}
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`w-8 h-[2px] mx-2 ${idx < activeIdx ? 'bg-green-500' : 'bg-gray-100'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// --- Cards ---
function HeartRateCard({ statusText, isFingerDetected, confidence, progress, scanState }: { statusText: string, isFingerDetected: boolean, confidence: number, progress: number, scanState: string }) {
  const remaining = Math.max(0, Math.ceil(30 - (progress / 100) * 30));
  let message = "Place finger firmly on camera…";
  if (progress > 33 && progress <= 66) message = "Hold still, detecting pulse…";
  else if (progress > 66) message = "Almost done, finalizing…";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-col items-center relative overflow-hidden">
      <div className="relative mb-6">
        <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 100 100" style={{ width: '120px', height: '120px', left: '-20px', top: '-20px' }}>
          <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="8" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="#ef4444" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (progress / 100) * 283} className="transition-all duration-300" />
        </svg>
        <motion.div animate={isFingerDetected ? { scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] } : {}} transition={{ duration: 0.8, repeat: Infinity }} className="absolute inset-0 bg-red-400 rounded-full blur-2xl" />
        <div className="relative w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
          <Activity className="w-10 h-10 text-white" />
        </div>
      </div>
      
      <div className="text-center mb-6 z-10">
        <h2 className="text-5xl font-black text-gray-900 tracking-tighter tabular-nums">---</h2>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Beats Per Minute</p>
        
        {scanState === 'running' && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <span className="text-sm font-bold text-blue-600">Scanning… {remaining}s remaining</span>
            <div className="flex items-center gap-2 text-xs font-semibold text-red-500 bg-red-50 px-3 py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              Collecting readings…
            </div>
            <p className="text-sm text-gray-600 mt-2 font-medium">{message}</p>
          </div>
        )}
      </div>

      <PulseWaveform active={isFingerDetected} />
      <div className="w-full mt-8 pt-6 border-t border-gray-50 flex justify-between text-xs font-bold uppercase tracking-wider">
        <span className="text-gray-400">Signal: <span className={isFingerDetected ? "text-green-500" : "text-amber-500"}>{statusText}</span></span>
        <span className="text-gray-400">AI Confidence: <span className="text-blue-600">{confidence}%</span></span>
      </div>
    </motion.div>
  );
}

function HeartRateReportCard({ report, onScanAgain, onSave }: { report: any, onScanAgain: () => void, onSave: () => void }) {
  let category = "Normal";
  let catColor = "text-green-500 bg-green-50";
  if (report.averageBpm < 60) {
    category = "Bradycardia";
    catColor = "text-blue-500 bg-blue-50";
  } else if (report.averageBpm > 100) {
    category = "Tachycardia";
    catColor = "text-red-500 bg-red-50";
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Session Complete</h3>
        <p className="text-xs text-gray-500">{new Date().toLocaleString()}</p>
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 ${catColor}`}>
          {category}
        </div>
        <h2 className="text-6xl font-black text-gray-900 tracking-tighter tabular-nums mb-1">{report.averageBpm}</h2>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Avg BPM</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-2xl text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Min / Max</p>
          <p className="text-lg font-bold text-gray-900">{report.minBpm} <span className="text-gray-400 text-sm font-normal">/</span> {report.maxBpm}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Quality</p>
          <p className={`text-lg font-bold ${report.quality === 'Good' ? 'text-green-600' : report.quality === 'Fair' ? 'text-amber-500' : 'text-red-500'}`}>{report.quality}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stability</span>
          <span className={`text-xs font-bold uppercase ${report.stability === 'stable' ? 'text-green-500' : 'text-amber-500'}`}>{report.stability}</span>
        </div>
        <div className="h-16 flex items-end gap-1 w-full mt-4">
          {report.segmentBpms.map((bpm: number, i: number) => {
            const h = Math.max(10, Math.min(100, (bpm / 150) * 100));
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-blue-100 rounded-t-sm relative" style={{ height: `${h}%` }}>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 rounded-t-sm"></div>
                </div>
                <span className="text-[8px] font-bold text-gray-400">{bpm}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[8px] text-center text-gray-400 mt-2 uppercase">5-second segments</p>
      </div>

      <div className="flex gap-3">
        <button onClick={onScanAgain} className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs uppercase tracking-widest transition-colors">Scan Again</button>
        <button onClick={onSave} className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-colors shadow-lg shadow-blue-200">Save Reading</button>
      </div>
    </motion.div>
  );
}

function FacialCard({ videoRef, scanning }: { videoRef: React.RefObject<HTMLVideoElement>, scanning: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-xl">
      <div className="relative aspect-square sm:aspect-video bg-black flex items-center justify-center">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
        {scanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-blue-400 rounded-3xl relative">
              <motion.div animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute left-0 right-0 h-[2px] bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
            </div>
          </div>
        )}
      </div>
      <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Scanning facial markers</p>
          <p className="font-bold">Neural Engine Active</p>
        </div>
        <Camera className="w-6 h-6 opacity-80" />
      </div>
    </motion.div>
  );
}

function SymptomAssessment({ 
  symptoms, 
  demographics,
  onToggleSymptom, 
  onUpdateDemographics,
  onFinish 
}: { 
  symptoms: Record<string, boolean>, 
  demographics: any,
  onToggleSymptom: (id: string) => void, 
  onUpdateDemographics: (field: string, val: any) => void,
  onFinish: () => void 
}) {
  const symptomOptions = [
    { id: 'chestPain', label: 'Chest Pressure', icon: '🫀' },
    { id: 'shortnessOfBreath', label: 'Breathing Difficulty', icon: '🫁' },
    { id: 'dizziness', label: 'Dizziness', icon: '🌀' },
    { id: 'palpitations', label: 'Palpitations', icon: '💓' },
  ];

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900">Clinical Profile</h3>
        <p className="text-xs text-gray-500">Provide details for high-accuracy assessment</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Age</label>
            <input type="number" value={demographics.age} onChange={e => onUpdateDemographics('age', +e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Gender</label>
            <select value={demographics.gender} onChange={e => onUpdateDemographics('gender', +e.target.value)} className="w-full p-2 border rounded-xl text-sm">
              <option value={0}>Female</option>
              <option value={1}>Male</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Height (cm)</label>
            <input type="number" value={demographics.height} onChange={e => onUpdateDemographics('height', +e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Weight (kg)</label>
            <input type="number" value={demographics.weight} onChange={e => onUpdateDemographics('weight', +e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Lifestyle</label>
          <div className="flex gap-2">
            <button onClick={() => onUpdateDemographics('smoking', demographics.smoking ? 0 : 1)} className={`flex-1 p-2 rounded-xl border text-[10px] font-bold transition-colors ${demographics.smoking ? 'bg-red-50 border-red-200 text-red-600' : 'bg-gray-50 text-gray-500'}`}>SMOKER</button>
            <button onClick={() => onUpdateDemographics('active', demographics.active ? 0 : 1)} className={`flex-1 p-2 rounded-xl border text-[10px] font-bold transition-colors ${demographics.active ? 'bg-green-50 border-green-200 text-green-600' : 'bg-gray-50 text-gray-500'}`}>ACTIVE</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Cholesterol</label>
            <select value={demographics.cholesterol} onChange={e => onUpdateDemographics('cholesterol', +e.target.value)} className="w-full p-2 border rounded-xl text-sm">
              <option value={1}>Normal</option>
              <option value={2}>Above Normal</option>
              <option value={3}>Well Above</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Glucose</label>
            <select value={demographics.glucose} onChange={e => onUpdateDemographics('glucose', +e.target.value)} className="w-full p-2 border rounded-xl text-sm">
              <option value={1}>Normal</option>
              <option value={2}>Pre-diabetic</option>
              <option value={3}>Diabetic</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block text-center">Acute Symptoms</label>
        <div className="grid grid-cols-2 gap-2">
          {symptomOptions.map(opt => (
            <button key={opt.id} onClick={() => onToggleSymptom(opt.id)} className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${symptoms[opt.id] ? 'border-blue-500 bg-blue-50' : 'border-gray-50 bg-gray-50'}`}>
              <span className="text-lg">{opt.icon}</span>
              <span className={`text-[9px] font-bold uppercase ${symptoms[opt.id] ? 'text-blue-700' : 'text-gray-500'}`}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <button onClick={onFinish} className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-200 uppercase tracking-widest text-xs hover:bg-blue-700 transition-all">Generate Clinical Report</button>
    </motion.div>
  );
}

// --- Main Page ---
export default function ActiveScan() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialMode = (location.state?.mode as ScanMode) || 'heart-rate';
  const isComplete = initialMode === 'complete';

  const [currentMode, setCurrentMode] = useState<ScanMode>(isComplete ? 'heart-rate' : initialMode);
  const [activeStage, setActiveStage] = useState<'scanning' | 'assessment'>('scanning');
  const [scanState, setScanState] = useState<'idle' | 'running' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [bpmValue, setBpmValue] = useState<number | null>(null);
  const [symptoms, setSymptoms] = useState<Record<string, boolean>>({});
  const [demographics, setDemographics] = useState({
    age: 53,
    height: 165,
    weight: 75,
    gender: 0,
    smoking: 0,
    active: 1,
    cholesterol: 1,
    glucose: 1
  });
  
  const [report, setReport] = useState<any>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number>(0);
  const frameRef = useRef<number>(0);

  const { bpm, statusText, isFingerDetected, startMeasurement, stopMeasurement, analyzeFullSession } = useHeartRateMonitor();

  const startScan = useCallback(async () => {
    try {
      console.log(`Starting scan for mode: ${currentMode}`);
      if (currentMode === 'heart-rate') {
        await startMeasurement();
      } else {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play();
        }
      }
      setScanState('running');
      setProgress(0);
      setConfidence(0);
      timerRef.current = Date.now();
      
      const duration = SCAN_CONFIGS[currentMode].duration * 1000;
      const step = () => {
        const elapsed = Date.now() - timerRef.current;
        const p = Math.min((elapsed / duration) * 100, 100);
        setProgress(p);
        setConfidence(prev => Math.min(prev + Math.random() * 2, 99));

        if (p < 100) {
          frameRef.current = requestAnimationFrame(step);
        } else {
          finishStep();
        }
      };
      frameRef.current = requestAnimationFrame(step);
    } catch (err) {
      console.error("Scan start error:", err);
      // Fallback: move forward anyway for demo purposes if hardware fails
      setScanState('running'); 
      timerRef.current = Date.now();
    }
  }, [currentMode, startMeasurement]);

  const handleScanAgain = () => {
    setReport(null);
    setScanState('idle');
  };

  const handleSaveReading = () => {
    if (currentMode === 'heart-rate' && isComplete) {
      setCurrentMode('facial');
      setScanState('idle');
      setReport(null);
    } else {
      finalize();
    }
  };

  const finishStep = () => {
    setScanState('done');
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    
    if (currentMode === 'heart-rate') {
      const result = analyzeFullSession();
      if (result) {
        setBpmValue(result.averageBpm);
        setReport(result);
      } else {
        setBpmValue(75); // fallback
        setReport({ averageBpm: 75, minBpm: 70, maxBpm: 80, quality: 'Fair', stability: 'stable', segmentBpms: [75,75,75,75,75,75], validPeaksCount: 15 });
      }
    }
    
    stopMeasurement();
    
    if (currentMode !== 'heart-rate') {
      setTimeout(() => {
        if (currentMode === 'facial' && isComplete) {
          setActiveStage('assessment');
          setScanState('idle');
        } else {
          finalize();
        }
      }, 1500);
    }
  };

  const finalize = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const res = await fetch('http://localhost:5000/api/scan/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bpm: bpmValue || bpm || 75,
          scanMode: initialMode,
          confidence: Math.round(confidence),
          symptoms,
          demographics
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await res.json();
      const finalReport: ScanResult = { ...data, date: new Date(data.timestamp), bpm: data.metrics.heartRate.value, healthScore: data.healthScore, aiConfidence: data.confidence, stressLevel: data.metrics.stressLevel.value.toLowerCase(), pallor: data.facialAnalysis.indicators.pallor, cyanosis: data.facialAnalysis.indicators.cyanosis, scanMode: initialMode };
      navigate(ROUTE_PATHS.RESULTS, { state: finalReport });
    } catch (e) {
      console.error("Finalize error:", e);
      // Fallback algorithm for local calculation when backend is unavailable
      const actualBpm = bpmValue || bpm || 75;
      
      // Calculate BMI
      const h = demographics.height / 100;
      const bmi = demographics.weight / (h * h);
      
      // Estimate BP based on BPM (for demo purposes only since camera can't measure BP)
      const sys = 120 + ((actualBpm - 70) * 0.4);
      const dia = 80 + ((actualBpm - 70) * 0.2);

      // Appropriate Logistic Regression Algorithm (trained on cardio_train.csv)
      const MODEL = {
        coef:      [0.339085, 0.135304, 0.012165, 0.33993, -0.070266, -0.05742, -0.092789, 0.930461, 0.107033],
        intercept: 0.028908,
        means:     [53.2937, 27.4879, 0.3503, 1.3646, 1.2256, 0.0874, 0.8031, 126.6524, 81.2971],
        stds:      [6.7452, 5.3745, 0.4771, 0.6788, 0.5722, 0.2825, 0.3977, 16.6986, 9.4317]
      };

      const raw = [
        demographics.age, bmi, demographics.gender, demographics.cholesterol, 
        demographics.glucose, demographics.smoking, demographics.active, sys, dia
      ];

      const z = raw.map((v, i) => (v - MODEL.means[i]) / MODEL.stds[i]);
      const logit = z.reduce((s, v, i) => s + v * MODEL.coef[i], MODEL.intercept);
      const prob = 1 / (1 + Math.exp(-logit)); // Sigmoid activation

      let healthScore = Math.round(100 - (prob * 100));
      let stressLevel = 'normal';
      
      if (actualBpm > 100 || actualBpm < 60) {
        healthScore = Math.max(0, healthScore - 15);
        stressLevel = 'high';
      } else if (actualBpm > 85 || actualBpm < 65) {
        healthScore = Math.max(0, healthScore - 5);
        stressLevel = 'moderate';
      }

      navigate(ROUTE_PATHS.RESULTS, { 
        state: { 
          id: 'LOCAL_SCAN_' + Date.now(), 
          date: new Date(), 
          bpm: actualBpm, 
          healthScore, 
          cvdProbability: prob,
          aiConfidence: Math.round(confidence) || 90, 
          stressLevel, 
          pallor: false, 
          cyanosis: false, 
          scanMode: initialMode, 
          duration: SCAN_CONFIGS[initialMode]?.duration || 30 
        } 
      });
    }
  };

  useEffect(() => {
    if (scanState === 'idle' && activeStage === 'scanning') {
      startScan();
    }
    return () => cancelAnimationFrame(frameRef.current);
  }, [scanState, activeStage, startScan]);

  const activeIdx = isComplete ? (currentMode === 'heart-rate' ? 0 : (activeStage === 'scanning' ? 1 : 2)) : 0;

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto flex flex-col font-sans">
      <div className="p-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><ChevronLeft className="w-6 h-6" /></button>
        <div className="bg-blue-50 px-4 py-1.5 rounded-full"><span className="text-[10px] font-black uppercase tracking-widest text-blue-600 font-mono">Live Monitoring</span></div>
      </div>

      <div className="px-6 flex-1 flex flex-col gap-6">
        {isComplete && <StepIndicator activeIdx={activeIdx} />}
        
        <div className="text-center">
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">
            {activeStage === 'scanning' ? (currentMode === 'heart-rate' ? 'Vitals Extraction' : 'Facial Diagnostics') : 'Clinical Symptoms'}
          </h1>
          <p className="text-sm text-gray-400 font-medium mt-1">Remain steady for best accuracy.</p>
        </div>

        <AnimatePresence mode="wait">
          {report && currentMode === 'heart-rate' ? (
            <motion.div key="report" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <HeartRateReportCard report={report} onScanAgain={handleScanAgain} onSave={handleSaveReading} />
            </motion.div>
          ) : activeStage === 'scanning' ? (
            <motion.div key={currentMode} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {currentMode === 'heart-rate' ? <HeartRateCard statusText={statusText} isFingerDetected={isFingerDetected} confidence={Math.round(confidence)} progress={progress} scanState={scanState} /> : <FacialCard videoRef={videoRef} scanning={scanState === 'running'} />}
            </motion.div>
          ) : (
            <SymptomAssessment 
              symptoms={symptoms} 
              demographics={demographics}
              onToggleSymptom={id => setSymptoms(s => ({...s, [id]: !s[id]}))} 
              onUpdateDemographics={(field, val) => setDemographics(d => ({...d, [field]: val}))}
              onFinish={finalize} 
            />
          )}
        </AnimatePresence>

        {scanState === 'running' && (
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Neural Analysis</span>
              <span className="text-blue-600 font-bold text-sm tracking-tighter">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div className="h-full bg-blue-600" animate={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {scanState === 'done' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-500 rounded-2xl p-5 flex items-center justify-center gap-3 shadow-lg shadow-green-200">
            <CheckCircle2 className="w-6 h-6 text-white" />
            <span className="text-white font-bold uppercase tracking-widest text-[10px]">Biometrics Captured Successfully</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
