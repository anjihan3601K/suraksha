
"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { assessSafetyRisk, AssessSafetyRiskOutput } from "@/ai/flows/assess-safety-risk";
import { useToast } from "@/hooks/use-toast";
import { onSnapshot, collection, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Alert {
  id: string;
  severity: string;
  title: string;
  timestamp: Timestamp;
}

const riskLevels = {
  Low: {
    label: "Low Risk",
    icon: <ShieldCheck className="h-6 w-6 text-green-500" />,
    color: "bg-green-500"
  },
  Moderate: {
    label: "Moderate Risk",
    icon: <Shield className="h-6 w-6 text-yellow-500" />,
     color: "bg-yellow-500"
  },
  High: {
    label: "High Risk",
    icon: <ShieldAlert className="h-6 w-6 text-orange-500" />,
     color: "bg-orange-500"
  },
  Extreme: {
    label: "Extreme Risk",
    icon: <ShieldAlert className="h-6 w-6 text-destructive" />,
     color: "bg-destructive"
  },
};

export function SafetyIndex() {
  const [assessment, setAssessment] = useState<AssessSafetyRiskOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const alertsQuery = query(collection(db, "alerts"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      const alertsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Alert));
      setAlerts(alertsData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const runAssessment = async () => {
      setIsLoading(true);
      try {
        const activeAlerts = alerts.map(({ title, severity }) => ({ title, severity }));
        const res = await assessSafetyRisk({ 
            location: "Central City, USA", // Placeholder location
            activeAlerts: activeAlerts 
        });
        setAssessment(res);
      } catch (error) {
        console.error("Error assessing safety risk:", error);
        toast({ title: "AI Error", description: "Could not assess safety risk.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    // Rerun assessment when new alerts come in
    runAssessment();
  }, [alerts, toast]);

  const currentRisk = assessment ? riskLevels[assessment.riskLevel as keyof typeof riskLevels] : null;

  return (
    <>
        {isLoading ? (
            <div className="flex justify-center items-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : assessment && currentRisk ? (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {currentRisk.icon}
                        <span className="text-lg font-bold">{currentRisk.label}</span>
                    </div>
                    <span className="text-2xl font-bold font-mono">{assessment.safetyScore}%</span>
                </div>
                <Progress value={assessment.safetyScore} className="h-3" />
                <p className="text-sm text-muted-foreground text-center">{assessment.recommendation}</p>
            </div>
        ) : (
             <div className="flex justify-center items-center h-24">
                <p className="text-muted-foreground">Could not load safety index.</p>
            </div>
        )}
    </>
  );
}
