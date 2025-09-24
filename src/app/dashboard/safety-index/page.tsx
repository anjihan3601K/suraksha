
"use client";

import { AppHeader } from "@/components/shared/AppHeader";
import { SafetyIndex } from "@/components/dashboard/SafetyIndex";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function SafetyIndexPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1 p-4 md:p-6 lg:p-8 flex justify-center">
        <div className="w-full max-w-lg">
          <Card className="shadow-lg h-full border-t-4 border-green-500">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="font-headline flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      AI-Based Safety Index
                  </CardTitle>
                  <CardDescription>Predicted risk level for your current location.</CardDescription>
                </div>
                 <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
                    <ArrowLeft className="h-6 w-6" />
                    <span className="sr-only">Go back</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <SafetyIndex />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
