import { Link } from 'react-router-dom';
import { ShieldCheck, Activity, Camera, Mic, Heart } from 'lucide-react';
import { ROUTE_PATHS } from '@/lib/index';
import { Layout } from '@/components/Layout';

export default function Home() {
  return (
    <Layout>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
        <div className="w-full max-w-[400px] text-center">
          <div className="mb-6">
            <svg
              viewBox="0 0 100 100"
              className="w-24 h-24 mx-auto mb-4"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M50 85C50 85 15 60 15 35C15 20 25 15 35 15C42 15 47 20 50 25C53 20 58 15 65 15C75 15 85 20 85 35C85 60 50 85 50 85Z"
                fill="#ef4444"
              />
              <path
                d="M30 40L35 35L40 45L45 30L50 40L55 35L60 45L65 35L70 40"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h1 className="text-3xl font-bold mb-2 text-foreground">
              HeartGuard Mobile
            </h1>
            <p className="text-muted-foreground">
              AI-Powered Heart Health Monitoring
            </p>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-blue-brand" />
              <h2 className="text-lg font-bold text-foreground">
                Three-Layer AI Protection
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 text-left">
                <div className="w-10 h-10 rounded-full bg-blue-light flex items-center justify-center flex-shrink-0">
                  <Activity className="w-5 h-5 text-blue-brand" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Heart Rate Monitoring
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time BPM detection using camera and flashlight
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-left">
                <div className="w-10 h-10 rounded-full bg-blue-light flex items-center justify-center flex-shrink-0">
                  <Camera className="w-5 h-5 text-blue-brand" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    AI Facial Analysis
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Detects pallor, cyanosis, and stress indicators
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-left">
                <div className="w-10 h-10 rounded-full bg-blue-light flex items-center justify-center flex-shrink-0">
                  <Mic className="w-5 h-5 text-blue-brand" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Voice Emergency Assistant
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Pain assessment and hands-free emergency activation
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-light rounded-xl p-4 mb-6 flex items-center gap-3">
            <Mic className="w-5 h-5 text-blue-brand flex-shrink-0" />
            <div className="text-left">
              <p className="font-bold text-blue-brand">
                Voice Commands Active
              </p>
              <p className="text-xs text-muted-foreground">
                Say Start scan, Emergency, or Show history
              </p>
            </div>
          </div>

          <Link
            to={ROUTE_PATHS.SCAN_SELECT}
            className="w-full bg-[#3b82f6] text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 active:scale-[0.98] mb-4 block"
          >
            <Heart className="w-5 h-5" />
            Start Health Check
          </Link>

          <div className="flex items-center justify-center gap-4 text-sm">
            <Link
              to={ROUTE_PATHS.HISTORY}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              View History
            </Link>
            <span className="text-border">•</span>
            <Link
              to={ROUTE_PATHS.SETTINGS}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}