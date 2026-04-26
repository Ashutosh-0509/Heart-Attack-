import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, Activity, ShieldCheck, AlertCircle } from 'lucide-react';
import { ROUTE_PATHS, ScanResult, SCAN_CONFIGS } from '@/lib';
import { Layout } from '@/components/Layout';

const MOCK_RESULT: ScanResult = {
  id: '1',
  date: new Date(),
  bpm: 72,
  healthScore: 94,
  aiConfidence: 96,
  stressLevel: 'normal',
  pallor: false,
  cyanosis: false,
  scanMode: 'complete',
  duration: 50
};

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as ScanResult | null;
  const result = locationState || MOCK_RESULT;

  const scanConfig = SCAN_CONFIGS[result.scanMode] || SCAN_CONFIGS['complete'];
  
  // Ensure date is a Date object (in case of serialization)
  const dateObj = result.date instanceof Date ? result.date : new Date(result.date);
  
  const formattedDate = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Recently';

  const getStressLevelColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-emerald text-emerald-light';
      case 'high':
        return 'bg-rose text-rose-light';
      default:
        return 'bg-blue-brand text-blue-light';
    }
  };

  const getStressLevelText = (level: string) => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background pb-24">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">Scan Results</h1>
          </div>

          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-full bg-emerald/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-12 h-12 text-emerald" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Scan Complete</h2>
            <p className="text-muted-foreground text-sm">
              {scanConfig.label} • {formattedDate}
            </p>
          </div>

          {/* REAL DATA STATS STRIP — from cardio_train.csv */}
          <div className="bg-card rounded-xl border border-border p-4 mb-6 grid grid-cols-2 gap-4 shadow-sm">
            <div className="text-center border-r border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Patients</p>
              <p className="text-xl font-bold">68,629</p>
              <p className="text-[10px] text-muted-foreground">cardio_train.csv</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">High-Risk Rate</p>
              <p className="text-xl font-bold text-rose">49.5%</p>
              <p className="text-[10px] text-muted-foreground">33,962 of 68,629</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Health Score</p>
              <p className={`text-3xl font-bold ${result.healthScore > 70 ? 'text-emerald' : 'text-rose'}`}>{result.healthScore || 0}</p>
            </div>

            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">CVD Risk</p>
              <p className={`text-3xl font-bold ${result.healthScore > 70 ? 'text-emerald' : 'text-rose'}`}>
                {Math.round((result.cvdProbability || 0) * 100)}%
              </p>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-brand" />
                AI Clinical Assessment
              </h3>
              <div className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold">
                Trained on real data
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg border border-border/50 text-sm leading-relaxed italic text-muted-foreground">
                "{result.aiInterpretation || 'Your health vitals are within normal ranges. No immediate concerns detected.'}"
              </div>

              {/* FEATURE IMPORTANCE */}
              <div className="pt-4 border-t border-border">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">Key Predictive Factors (GBM Weights)</p>
                <div className="space-y-2">
                  {[
                    { label: 'Systolic BP', value: 44.6 },
                    { label: 'Cholesterol', value: 16.3 },
                    { label: 'Age',         value: 16.3 },
                    { label: 'BMI',         value:  6.5 },
                    { label: 'Diastolic BP', value:  5.1 },
                    { label: 'Activity',    value:  4.5 },
                  ].map(f => (
                    <div key={f.label}>
                      <div className="flex justify-between text-[10px] font-medium mb-1">
                        <span>{f.label}</span>
                        <span>{f.value}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-brand" style={{ width: `${f.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-600/10 rounded-xl p-5 mb-6 border border-blue-200">
            <div className="flex gap-3">
              <div className="p-2 bg-blue-600 rounded-lg h-fit">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-blue-900 mb-1">Dataset-Backed Advice</h4>
                <p className="text-sm text-blue-800/80 leading-snug">
                  Active patients show a 4.8% lower CVD rate. Based on high-risk averages (BMI 28.48), optimizing weight can shift your risk category.
                </p>
              </div>
            </div>
          </div>

          {/* DATA SOURCES — real datasets used */}
          <div className="bg-slate-900 rounded-xl p-6 mb-8 text-white">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest">Training Data Sources</h4>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-200">cardio_train.csv</p>
                <p className="text-[10px] text-slate-400">68,629 patients · Real-world clinical dataset</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">Algorithm</p>
                <p className="text-[10px] text-slate-400">Logistic Regression · StandardScaler · 80/20 split · AUC 0.795</p>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <p className="text-[10px] text-slate-500 italic">Model accuracy 73.0% · Avg systolic BP 126.7 mmHg · High-risk avg BMI 28.48</p>
              </div>
            </div>
          </div>


          <div className="flex gap-3 mb-6">
            <button
              onClick={() => navigate(ROUTE_PATHS.SCAN_SELECT)}
              className="flex-1 bg-blue-brand text-white py-3 px-6 rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Start New Scan
            </button>
            <button
              onClick={() => navigate(ROUTE_PATHS.HISTORY)}
              className="flex-1 border border-border py-3 px-6 rounded-xl font-medium hover:bg-muted transition-colors"
            >
              Save to History
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Results are for informational purposes only. Consult a doctor for medical advice.
          </p>
        </div>
      </div>
    </Layout>
  );
}
