

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell, AlertTriangle, Info, CheckCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { translateAlert } from "@/ai/flows/translate-alert";

interface Alert {
  id: string;
  severity: "High" | "Moderate" | "Low" | "Info";
  title: string;
  message: string;
  timestamp: Timestamp;
}

interface TranslatedAlert {
  translatedTitle: string;
  translatedContent: string;
}

const severityInfo = {
  High: { icon: <AlertTriangle className="h-5 w-5 text-destructive" />, badge: "destructive" as const },
  Moderate: { icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />, badge: "secondary" as const },
  Low: { icon: <Info className="h-5 w-5 text-blue-500" />, badge: "default" as const },
  Info: { icon: <CheckCircle className="h-5 w-5 text-green-500" />, badge: "outline" as const },
};

export function AlertsFeed({ t }: { t: (key: string) => string }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [translatedAlerts, setTranslatedAlerts] = useState<Record<string, TranslatedAlert>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isTranslating, setIsTranslating] = useState<Record<string, boolean>>({});
  const [language, setLanguage] = useState('en');
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setIsOnline(navigator.onLine);
        setLanguage(localStorage.getItem('selectedLanguage') || 'en');
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const handleStorageChange = () => {
            setLanguage(localStorage.getItem('selectedLanguage') || 'en');
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('storage', handleStorageChange);
        };
    }
  }, []);

  useEffect(() => {
    const alertsQuery = query(collection(db, "alerts"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      const alertsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Alert));
      setAlerts(alertsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching alerts:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const translateAlertContent = useCallback(async (alert: Alert, lang: string) => {
    const alertId = alert.id;
    if (lang === 'en' || translatedAlerts[alertId] || !isOnline) {
      return;
    }
    
    setIsTranslating(prev => ({ ...prev, [alertId]: true }));
    try {
      const result = await translateAlert({
        title: alert.title,
        content: alert.message,
        targetLanguage: lang,
      });
      setTranslatedAlerts(prev => ({ ...prev, [alertId]: result }));
    } catch (error) {
      console.error(`Alert translation error for alert ${alertId}:`, error);
      // Optional: Don't retry automatically to avoid hitting limits again
    } finally {
      setIsTranslating(prev => ({ ...prev, [alertId]: false }));
    }
  }, [translatedAlerts, isOnline]);

  useEffect(() => {
    if (language !== 'en' && isOnline) {
      alerts.forEach(alert => {
        if (!translatedAlerts[alert.id] && !isTranslating[alert.id]) {
          translateAlertContent(alert, language);
        }
      });
    }
  }, [language, alerts, translateAlertContent, translatedAlerts, isTranslating, isOnline]);

  const formatTimestamp = (timestamp: Timestamp) => {
    if (!timestamp) return "Just now";
    return `${formatDistanceToNow(timestamp.toDate())} ago`;
  };

  const getAlertTitle = (alert: Alert) => {
    if (language === 'en' || !isOnline) return alert.title;
    return translatedAlerts[alert.id]?.translatedTitle || alert.title;
  };

  const getAlertContent = (alert: Alert) => {
    if (language === 'en' || !isOnline) return alert.message;
    return translatedAlerts[alert.id]?.translatedContent || alert.message;
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('alerts_and_notifications')}
        </CardTitle>
        <CardDescription>{t('alerts_desc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96 pr-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : alerts.length === 0 ? (
             <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">No alerts at the moment.</p>
            </div>
          ) : (
            <div className="space-y-6">
                {alerts.map((alert, index) => (
                    <div key={alert.id}>
                        <div className="flex gap-4">
                            <div className="mt-1">{severityInfo[alert.severity as keyof typeof severityInfo].icon}</div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold font-headline">{getAlertTitle(alert)}</h4>
                                    <div className="flex items-center gap-2">
                                      {isTranslating[alert.id] && <Loader2 className="h-4 w-4 animate-spin"/>}
                                      <span className="text-xs text-muted-foreground">{formatTimestamp(alert.timestamp)}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-foreground/80">{getAlertContent(alert)}</p>
                                <Badge variant={severityInfo[alert.severity as keyof typeof severityInfo].badge}>{alert.severity}</Badge>
                            </div>
                        </div>
                        {index < alerts.length - 1 && <Separator className="mt-6" />}
                    </div>
                ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
