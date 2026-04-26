export const ROUTE_PATHS = {
  HOME: '/',
  SCAN_SELECT: '/scan',
  ACTIVE_SCAN: '/scan/active',
  RESULTS: '/results',
  HISTORY: '/history',
  SETTINGS: '/settings',
  CVD_PREDICTOR: '/cvd-predictor'
} as const;

export type ScanMode = 'heart-rate' | 'facial' | 'complete';

export interface ScanResult {
  id: string;
  date: Date;
  bpm: number;
  healthScore: number;
  aiConfidence: number;
  stressLevel: 'low' | 'normal' | 'high' | 'Low' | 'Moderate' | 'High';
  pallor: boolean;
  cyanosis: boolean;
  scanMode: ScanMode;
  duration: number;
  // Extended metrics from backend
  metrics?: {
    heartRate: { value: number; unit: string; status: string };
    heartRateVariability: { value: number; unit: string; status: string };
    bloodPressure: { value: string; unit: string; status: string };
    oxygenLevel: { value: number; unit: string; status: string };
    respiratoryRate: { value: number; unit: string; status: string };
    stressLevel: { value: string; score: number; status: string };
  };
  aiInterpretation?: string;
  cvdProbability?: number;
  facialAnalysis?: {
    skinTone: string;
    symmetry: string;
    indicators: { pallor: boolean; cyanosis: boolean; jaundice: boolean };
  };
}

export interface HistoryEntry {
  id: string;
  date: Date;
  scanMode: ScanMode;
  bpm?: number;
  healthScore?: number;
}

export interface ScanConfig {
  label: string;
  description: string;
  duration: number;
  icon: string;
}

export const SCAN_CONFIGS: Record<ScanMode, ScanConfig> = {
  'heart-rate': {
    label: 'Heart Rate Only',
    description: 'Quick BPM check using camera and flashlight',
    duration: 30,
    icon: 'Activity'
  },
  'facial': {
    label: 'AI Selfie Analysis',
    description: 'Facial analysis for pallor, cyanosis, and stress indicators',
    duration: 20,
    icon: 'Camera'
  },
  'complete': {
    label: 'Complete Health Scan',
    description: 'Heart rate + AI selfie + voice assessment for maximum accuracy',
    duration: 50,
    icon: 'Mic'
  }
};

export const MOCK_HISTORY: HistoryEntry[] = [
  {
    id: '1',
    date: new Date(Date.now() - 3600000),
    scanMode: 'complete',
    bpm: 72,
    healthScore: 94
  },
  {
    id: '2',
    date: new Date(Date.now() - 86400000),
    scanMode: 'heart-rate',
    bpm: 68
  },
  {
    id: '3',
    date: new Date(Date.now() - 172800000),
    scanMode: 'facial',
    healthScore: 91
  },
  {
    id: '4',
    date: new Date(Date.now() - 259200000),
    scanMode: 'complete',
    bpm: 75,
    healthScore: 89
  }
];

export interface SignalPoint {
  value: number;
  time: number;
}

export type MeasurementState = 'idle' | 'requesting' | 'processing' | 'error';

export const CONFIG = {
  WINDOW_SIZE_SECONDS: 5,
  FPS: 30,
  BUFFER_SIZE: 150,
  SMOOTHING_WINDOW: 5,
  MIN_PEAK_DISTANCE_MS: 300,
  MIN_BPM: 40,
  MAX_BPM: 200,
  MIN_AMPLITUDE: 3,
  FINGER_DETECTION: {
    MIN_RED: 60,
    RED_GREEN_RATIO: 1.5,
    RED_BLUE_RATIO: 1.5
  },
  PROCESSING_CANVAS_SIZE: 50,
  GRAPH_WINDOW_SIZE: 150,
  BEAT_ANIMATION_DURATION: 600,
  VIBRATION_DURATION: 50
} as const;
