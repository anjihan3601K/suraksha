"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Loader2 } from "lucide-react";
import { voiceActivatedSOS } from "@/ai/flows/voice-activated-sos";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface VoiceSOSProps {
  userId: string;
  userDetails?: string;
  locationData?: string;
}

export function VoiceSOS({ userId, userDetails, locationData }: VoiceSOSProps) {
  const [listening, setListening] = useState(false);
  const { toast } = useToast();

  const handleVoiceSOS = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Your browser does not support voice recognition.",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();
    setListening(true);

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log("Heard:", transcript);

      try {
        const response = await voiceActivatedSOS({
          voiceCommand: transcript,
          userDetails,
          locationData,
        });

        if (response.sosTriggered) {
          await updateDoc(doc(db, "users", userId), {
            status: "Emergency",
          });

          toast({
            title: "🚨 SOS Triggered!",
            description: response.alertDetails || "Emergency signaled.",
          });
        } else {
          toast({
            title: "No SOS detected",
            description: "Voice command did not trigger emergency.",
          });
        }
      } catch (error) {
        console.error("Voice SOS error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not process voice SOS.",
        });
      }

      setListening(false);
    };

    recognition.onerror = () => {
      toast({
        variant: "destructive",
        title: "Voice Error",
        description: "Could not capture your voice command.",
      });
      setListening(false);
    };
  };

  return (
    <div className="p-4 border rounded-xl shadow bg-white flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">
        Press the button and say <b>"help"</b> to trigger an SOS.
      </p>
      <Button
        variant={listening ? "destructive" : "default"}
        size="lg"
        onClick={handleVoiceSOS}
        disabled={listening}
      >
        {listening ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Listening...
          </>
        ) : (
          <>
            <Mic className="mr-2 h-4 w-4" /> Activate Voice SOS
          </>
        )}
      </Button>
    </div>
  );
}
