
"use client";

import React from "react";
import { AppHeader } from "@/components/shared/AppHeader";
import { SosFeed } from "@/components/admin/SosFeed";
import { UserStatusTable } from "@/components/admin/UserStatusTable";
import { AlertBroadcaster } from "@/components/admin/AlertBroadcaster";
import { ReportsFeed } from "@/components/admin/ReportsFeed";
import { PredictToday } from "@/components/admin/PredictToday";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BarChart, Users, AlertTriangle, Loader2, Hospital } from "lucide-react";
import { ResponsiveContainer, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart as RechartsBarChart } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { generateAlertSuggestion } from "@/ai/flows/generate-alert-suggestion";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [activeView, setActiveView] = React.useState("dashboard");
  const [alertSuggestion, setAlertSuggestion] = React.useState<{title: string, message: string} | null>(null);
  const [userStats, setUserStats] = React.useState({
    total: 0,
    safe: 0,
    emergency: 0,
    unknown: 0,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    const usersQuery = query(collection(db, "users"));
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      let safeCount = 0;
      let emergencyCount = 0;
      let unknownCount = 0;
      
      snapshot.forEach(doc => {
        const userStatus = doc.data().status;
        if (userStatus === "Safe") {
          safeCount++;
        } else if (userStatus === "Emergency") {
          emergencyCount++;
        } else {
          unknownCount++;
        }
      });

      setUserStats({
        total: snapshot.size,
        safe: safeCount,
        emergency: emergencyCount,
        unknown: unknownCount,
      });
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching user stats:", error);
      setIsLoading(false);
      toast({ variant: "destructive", title: "Error", description: "Could not load user statistics." });
    });

    return () => unsubscribe();
  }, [toast]);

  const analyticsData = [
    { name: 'Safe', count: userStats.safe, fill: 'hsl(var(--primary))' },
    { name: 'Emergency', count: userStats.emergency, fill: 'hsl(var(--destructive))' },
    { name: 'Unknown', count: userStats.unknown, fill: 'hsl(var(--muted-foreground))' },
  ];

  const handlePrediction = async (disasterType: string) => {
    try {
      toast({
        title: "Generating Alert Suggestion...",
        description: "Please wait while AI drafts an alert.",
      });

      const suggestion = await generateAlertSuggestion({
        disasterType,
        severity: 'High',
      });
      
      setAlertSuggestion(suggestion);
      setActiveView("broadcasts");

      toast({
        title: "Suggestion Ready!",
        description: "The broadcast form has been pre-filled.",
      });

    } catch (error) {
      console.error("Error generating alert from prediction:", error);
      toast({
        variant: "destructive",
        title: "AI Generation Failed",
        description: "Could not create a suggestion from the prediction.",
      });
    }
  };


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader setAdminView={setActiveView} />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        {activeView === 'dashboard' && (
          <div className="grid gap-6 md:gap-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
               <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{userStats.total}</div>}
                      <p className="text-xs text-muted-foreground">Live user count</p>
                  </CardContent>
              </Card>
               <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active SOS Signals</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                      {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold text-destructive">{userStats.emergency}</div>}
                       <p className="text-xs text-muted-foreground">Users requiring immediate help</p>
                  </CardContent>
              </Card>
               <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Users Marked Safe</CardTitle>
                      <Users className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                      {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold text-green-500">{userStats.safe}</div>}
                       <p className="text-xs text-muted-foreground">Users who have confirmed safety</p>
                  </CardContent>
              </Card>
            </div>
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                  <Card className="lg:col-span-3">
                      <CardHeader>
                          <CardTitle>User Status Overview</CardTitle>
                           <CardDescription>A real-time summary of user-reported statuses.</CardDescription>
                      </CardHeader>
                      <CardContent className="h-[300px] w-full">
                         {isLoading ? <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div> :
                          <ResponsiveContainer>
                              <RechartsBarChart data={analyticsData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} />
                                  <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
                                  <Tooltip
                                      contentStyle={{
                                      background: "hsl(var(--background))",
                                      border: "1px solid hsl(var(--border))",
                                      color: "hsl(var(--foreground))",
                                      }}
                                  />
                                  <Bar dataKey="count" />
                              </RechartsBarChart>
                          </ResponsiveContainer>
                          }
                      </CardContent>
                  </Card>
                  <div className="lg:col-span-2">
                    <SosFeed />
                 </div>
             </div>
            <UserStatusTable />
          </div>
        )}
        {activeView === 'broadcasts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <AlertBroadcaster suggestion={alertSuggestion} />
          </div>
        )}
        {activeView === 'reports' && (
          <ReportsFeed />
        )}
        {activeView === 'predict' && (
          <PredictToday onPrediction={handlePrediction} />
        )}
      </main>
    </div>
  );
}
