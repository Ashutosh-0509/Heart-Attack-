import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Activity, Camera, Mic, Clock } from 'lucide-react';
import { ROUTE_PATHS, SCAN_CONFIGS, type ScanMode } from '@/lib/index';
import { Layout } from '@/components/Layout';

export default function ScanSelect() {
  const navigate = useNavigate();

  const handleStartScan = (mode: ScanMode | string) => {
    if (mode === 'cvd') {
      navigate(ROUTE_PATHS.CVD_PREDICTOR);
    } else {
      navigate(ROUTE_PATHS.ACTIVE_SCAN, { state: { mode } });
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Activity':
        return Activity;
      case 'Camera':
        return Camera;
      case 'Mic':
        return Mic;
      default:
        return Activity;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <Link to={ROUTE_PATHS.HOME} className="text-foreground hover:text-primary transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Choose Scan Mode</h1>
          </div>
          
          <p className="text-muted-foreground mb-8 ml-10">
            Select the type of health check you want to perform
          </p>

          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-brand/10 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-6 h-6 text-blue-brand" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-card-foreground mb-2">
                    {SCAN_CONFIGS['heart-rate'].label}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {SCAN_CONFIGS['heart-rate'].description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Clock className="w-4 h-4" />
                      <span>~{SCAN_CONFIGS['heart-rate'].duration} seconds</span>
                    </div>
                    <button
                      onClick={() => handleStartScan('heart-rate')}
                      className="border border-border rounded-full px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                    >
                      Start Scan
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-brand/10 flex items-center justify-center flex-shrink-0">
                  <Camera className="w-6 h-6 text-blue-brand" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-card-foreground mb-2">
                    {SCAN_CONFIGS['facial'].label}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {SCAN_CONFIGS['facial'].description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Clock className="w-4 h-4" />
                      <span>~{SCAN_CONFIGS['facial'].duration} seconds</span>
                    </div>
                    <button
                      onClick={() => handleStartScan('facial')}
                      className="border border-border rounded-full px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                    >
                      Start Scan
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-sm p-6 relative">
              <div className="absolute top-4 right-4 bg-emerald text-white text-xs font-semibold px-3 py-1 rounded-full">
                Recommended
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald/10 flex items-center justify-center flex-shrink-0">
                  <Mic className="w-6 h-6 text-emerald" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-card-foreground mb-2">
                    {SCAN_CONFIGS['complete'].label}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {SCAN_CONFIGS['complete'].description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Clock className="w-4 h-4" />
                      <span>~{SCAN_CONFIGS['complete'].duration} seconds</span>
                    </div>
                    <button
                      onClick={() => handleStartScan('complete')}
                      className="border border-border rounded-full px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                    >
                      Start Scan
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-sm p-6 ml-2 mr-2 mb-4 bg-red-50 relative">
              <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                New clinical model
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-card-foreground mb-2 text-red-900">
                    CardioPredict Risk Model
                  </h3>
                  <p className="text-red-700 text-sm mb-4 font-medium">
                    Clinical-grade CVD prediction trained on 1,529+ real patient records (Logistic Regression).
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>~2-3 minutes</span>
                    </div>
                    <button
                      onClick={() => handleStartScan('cvd')}
                      className="bg-red-500 border border-red-200 rounded-full px-5 py-2 text-sm font-bold text-white hover:bg-red-600 transition-colors shadow-sm"
                    >
                      Launch Predictor
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
