import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '@/lib/index';
import { toast } from '@/components/ui/use-toast';

export function useVoiceAssistant() {
  const navigate = useNavigate();
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      // Restart if it stops automatically (unless component unmounted)
      if (recognitionRef.current) recognition.start();
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      console.log('Voice Command:', transcript);

      if (transcript.includes('scan') || transcript.includes('start scan')) {
        toast({ title: "Voice Command Detected", description: "Starting Complete Health Scan..." });
        navigate(ROUTE_PATHS.ACTIVE_SCAN, { state: { mode: 'complete' } });
      } else if (transcript.includes('emergency')) {
        handleEmergency();
      } else if (transcript.includes('history')) {
        navigate(ROUTE_PATHS.HISTORY);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();

    return () => {
      recognitionRef.current = null;
      recognition.stop();
    };
  }, [navigate]);

  const handleEmergency = () => {
    const saved = localStorage.getItem('heartguard_contacts');
    const contacts = saved ? JSON.parse(saved) : [];
    
    if (contacts.length > 0) {
      const contact = contacts[0];
      toast({ 
        title: "EMERGENCY ACTIVATED", 
        description: `Calling ${contact.name}...`,
        variant: "destructive"
      });
      window.location.href = `tel:${contact.phone}`;
    } else {
      toast({ 
        title: "Emergency Activated", 
        description: "No family contacts found. Calling emergency services...",
        variant: "destructive"
      });
      window.location.href = "tel:112";
    }
  };

  return { isListening };
}
