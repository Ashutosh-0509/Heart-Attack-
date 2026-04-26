import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ChevronRight, User } from 'lucide-react';

export default function Settings() {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceSensitivity, setVoiceSensitivity] = useState([50]);
  const [voiceConfirmation, setVoiceConfirmation] = useState(true);
  const [dailyReminders, setDailyReminders] = useState(true);
  const [scanAlerts, setScanAlerts] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const handleSaveContact = () => {
    console.log('Saving contact:', { contactName, contactPhone });
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all scan history? This action cannot be undone.')) {
      console.log('Clearing history');
    }
  };

  const getSensitivityLabel = (value: number) => {
    if (value < 33) return 'Low';
    if (value < 67) return 'Medium';
    return 'High';
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background pb-24">
        <div className="max-w-lg mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-8">Settings</h1>

          <div className="bg-card rounded-xl border border-border shadow-sm p-6 mb-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Health User</h2>
                <p className="text-sm text-muted-foreground">Guest Mode</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Voice Control</h3>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">Enable Voice Commands</p>
                <p className="text-sm text-muted-foreground">Activate voice-based controls</p>
              </div>
              <Switch checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">Voice Sensitivity</p>
                <span className="text-sm text-muted-foreground">{getSensitivityLabel(voiceSensitivity[0])}</span>
              </div>
              <Slider
                value={voiceSensitivity}
                onValueChange={setVoiceSensitivity}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Voice Confirmation Sounds</p>
                <p className="text-sm text-muted-foreground">Audio feedback for commands</p>
              </div>
              <Switch checked={voiceConfirmation} onCheckedChange={setVoiceConfirmation} />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Contact Name</label>
                <Input
                  type="text"
                  placeholder="Enter name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <Input
                  type="tel"
                  placeholder="Enter phone number"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>

              <Button onClick={handleSaveContact} className="w-full">
                Save Contact
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Notifications</h3>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">Daily Reminders</p>
                <p className="text-sm text-muted-foreground">Get daily health check reminders</p>
              </div>
              <Switch checked={dailyReminders} onCheckedChange={setDailyReminders} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Scan Alerts</p>
                <p className="text-sm text-muted-foreground">Notifications for scan results</p>
              </div>
              <Switch checked={scanAlerts} onCheckedChange={setScanAlerts} />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">About</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <p className="font-medium">App Version</p>
                <p className="text-muted-foreground">1.0.0</p>
              </div>

              <button className="w-full flex items-center justify-between py-2 hover:bg-accent/50 rounded-lg px-2 transition-colors">
                <p className="font-medium">Privacy Policy</p>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button className="w-full flex items-center justify-between py-2 hover:bg-accent/50 rounded-lg px-2 transition-colors">
                <p className="font-medium">Terms of Service</p>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 text-destructive">Danger Zone</h3>
            
            <Button
              variant="outline"
              onClick={handleClearHistory}
              className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              Clear All History
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
