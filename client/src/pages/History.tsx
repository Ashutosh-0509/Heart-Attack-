import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ChevronRight, Activity, Camera, Mic } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { MOCK_HISTORY, ROUTE_PATHS, type ScanMode } from '@/lib/index';

type FilterTab = 'all' | ScanMode;

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'heart-rate', label: 'Heart Rate' },
  { value: 'facial', label: 'Facial' },
  { value: 'complete', label: 'Complete' }
];

const SCAN_MODE_COLORS: Record<ScanMode, string> = {
  'heart-rate': 'bg-blue-brand',
  'facial': 'bg-[#a855f7]',
  'complete': 'bg-emerald'
};

const SCAN_MODE_ICONS: Record<ScanMode, typeof Activity> = {
  'heart-rate': Activity,
  'facial': Camera,
  'complete': Mic
};

const SCAN_MODE_LABELS: Record<ScanMode, string> = {
  'heart-rate': 'Heart Rate Scan',
  'facial': 'Facial Analysis',
  'complete': 'Complete Health Scan'
};

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (hours < 1) {
    return 'Just now';
  } else if (hours < 24) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (days < 7) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export default function History() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const filteredHistory = MOCK_HISTORY.filter(
    (entry) => activeFilter === 'all' || entry.scanMode === activeFilter
  );

  const handleCardClick = (entry: typeof MOCK_HISTORY[0]) => {
    navigate(ROUTE_PATHS.RESULTS, {
      state: {
        id: entry.id,
        date: entry.date,
        scanMode: entry.scanMode,
        bpm: entry.bpm || 72,
        healthScore: entry.healthScore || 90,
        aiConfidence: 98,
        stressLevel: 'low',
        pallor: false,
        cyanosis: false,
        duration: 30,
        metrics: {
          heartRate: { value: entry.bpm || 72, unit: 'BPM', status: 'Normal' },
          heartRateVariability: { value: 48, unit: 'ms', status: 'Good' },
          bloodPressure: { value: '118/76', unit: 'mmHg', status: 'Optimal' },
          oxygenLevel: { value: 98.5, unit: '%', status: 'Optimal' },
          respiratoryRate: { value: 14, unit: 'br/m', status: 'Normal' },
          stressLevel: { value: 'Low', score: 18, status: 'Stable' }
        },
        aiInterpretation: "Analysis of your historical data confirms a stable cardiovascular profile with optimal recovery markers."
      }
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">History</h1>
            <p className="text-muted-foreground">Previous health scans</p>
          </div>

          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveFilter(tab.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === tab.value
                    ? 'bg-blue-brand text-white'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Clock className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No scans yet
              </h2>
              <p className="text-muted-foreground text-center mb-6">
                Start your first health check
              </p>
              <button
                onClick={() => navigate(ROUTE_PATHS.SCAN_SELECT)}
                className="px-6 py-3 bg-blue-brand text-white rounded-xl font-medium hover:bg-blue-brand/90 transition-colors"
              >
                Start Scan
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((entry) => {
                const Icon = SCAN_MODE_ICONS[entry.scanMode];
                const dotColor = SCAN_MODE_COLORS[entry.scanMode];
                const label = SCAN_MODE_LABELS[entry.scanMode];

                return (
                  <button
                    key={entry.id}
                    onClick={() => handleCardClick(entry)}
                    className="w-full bg-card border border-border rounded-xl shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-3 h-3 rounded-full ${dotColor}`} />
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-card-foreground mb-1">
                          {label}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(entry.date)} • {formatTime(entry.date)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {entry.bpm && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-brand">
                            {entry.bpm}
                          </div>
                          <div className="text-xs text-muted-foreground">BPM</div>
                        </div>
                      )}
                      {entry.healthScore && !entry.bpm && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-emerald">
                            {entry.healthScore}
                          </div>
                          <div className="text-xs text-muted-foreground">Score</div>
                        </div>
                      )}
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
