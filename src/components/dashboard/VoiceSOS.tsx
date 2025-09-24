"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mic, MicOff, AlertTriangle, CheckCircle, CircleDotDashed, ArrowLeft } from "lucide-react";
import { voiceActivatedSOS, VoiceActivatedSOSOutput } from "@/ai/flows/voice-activated-sos";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

// Define SpeechRecognition interface
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
}

// Extend the Window interface
declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

export function VoiceSOS() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<VoiceActivatedSOSOutput | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognitionClass) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognitionClass();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setTranscript("");
          setResult(null);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const currentTranscript = event.results[0][0].transcript;
          setTranscript(currentTranscript);
          handleVoiceCommand(currentTranscript);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error', event.error);
          toast({ 
            title: "Voice Recognition Error", 
            description: event.error, 
            variant: "destructive" 
          });
          setIsListening(false);
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        setSpeechSupported(false);
        console.warn("Speech recognition not supported in this browser.");
      }
    }
  }, [toast]);

  const handleToggleListening = () => {
    if (!recognitionRef.current || !speechSupported) {
      toast({ 
        title: "Not Supported", 
        description: "Voice recognition is not supported on this browser.", 
        variant: "destructive" 
      });
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleVoiceCommand = async (command: string) => {
    try {
      const res = await voiceActivatedSOS({ 
        voiceCommand: command, 
        userDetails: 'Jane Doe, 555-1234', 
        locationData: 'Lat: 34.05, Lon: -118.24' 
      });
      setResult(res);
      
      if (res.sosTriggered) {
        toast({
          title: "Voice SOS Triggered!",
          description: `Command: "${command}". Alert sent.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error processing voice command:", error);
      toast({ 
        title: "AI Error", 
        description: "Could not process voice command.", 
        variant: "destructive" 
      });
    }
  };

  const getStatusIcon = () => {
    if (isListening) return <CircleDotDashed className="h-5 w-5 text-accent animate-spin" />;
    if (!result) return <Mic className="mr-2 h-5 w-5" />;
    if (result.sosTriggered) return <AlertTriangle className="h-5 w-5 text-destructive" />;
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  }

  return (
    <Card className="shadow-lg h-full border-t-4 border-red-500">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="font-headline">Voice-Activated SOS</CardTitle>
            <CardDescription>Press the button and say a keyword like "Help".</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-6 w-6" />
            <span className="sr-only">Go back</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button 
          onClick={handleToggleListening} 
          disabled={!isClient || !speechSupported} 
          size="lg" 
          variant={isListening ? "outline" : "default"}
        >
          {isListening ? <MicOff className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
          {isListening ? "Listening..." : "Activate Voice SOS"}
        </Button>
        
        {!speechSupported && isClient && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">
              Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.
            </p>
          </div>
        )}
        
        <div className="flex items-center justify-between p-3 rounded-md bg-secondary/50 min-h-[52px]">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <p className="text-sm text-foreground/80 italic">
              {isListening ? "Say your command..." : transcript ? `"${transcript}"` : "Awaiting voice command..."}
            </p>
          </div>
          {result && (
            <p className={`text-sm font-bold ${result.sosTriggered ? 'text-destructive' : 'text-green-600'}`}>
              {result.sosTriggered ? "SOS TRIGGERED" : "NO SOS"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}