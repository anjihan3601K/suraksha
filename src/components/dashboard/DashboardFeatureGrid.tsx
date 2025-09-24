
"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, Route, Camera, Mic, Handshake, Siren, Phone, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";


interface DashboardFeatureGridProps {
  isOnline: boolean;
}

const features = [
    { id: "safetyIndex", title: "AI Safety Index", description: "Check the AI-assessed risk level for your area.", icon: <ShieldCheck />, href: "/dashboard/safety-index", onlineOnly: true, color: "border-green-500" },
    { id: "safePath", title: "Safe Path Guidance", description: "Find the safest route to a help center.", icon: <Route />, href: "/dashboard/safe-path", onlineOnly: true, color: "border-purple-500" },
    { id: "photoReporter", title: "Report an Incident", description: "Send a photo and report to officials.", icon: <Camera />, href: "/dashboard/photo-reporter", onlineOnly: false, color: "border-blue-500" },
    { id: "voiceSOS", title: "Voice-Activated SOS", description: "Use your voice to trigger an SOS alert.", icon: <Mic />, href: "/dashboard/voice-sos", onlineOnly: true, color: "border-red-500" },
    { id: "communityHelp", title: "Community Help", description: "Offer or request help from your local community.", icon: <Handshake />, href: "/dashboard/community-help", onlineOnly: false, color: "border-orange-500" },
    { id: "contacts", title: "Emergency Contacts", description: "Quickly access important numbers.", icon: <Phone />, href: "/contacts", onlineOnly: false, color: "border-blue-500" },
];


export function DashboardFeatureGrid({ isOnline }: DashboardFeatureGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature) => {
        const isDisabled = feature.onlineOnly && !isOnline;
        const CardComponent = isDisabled ? 'div' : Link;
        
        return (
          <CardComponent
            key={feature.id}
            href={isDisabled ? "#" : feature.href}
            className={cn(
                "block",
                isDisabled ? "cursor-not-allowed opacity-60" : "hover:shadow-lg hover:-translate-y-1 transition-transform duration-200"
            )}
            aria-disabled={isDisabled}
            tabIndex={isDisabled ? -1 : undefined}
          >
            <Card className={`h-full border-t-4 ${feature.color}`}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`text-2xl ${feature.color.replace('border-', 'text-')}`}>{feature.icon}</div>
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription className="text-sm">{feature.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </CardComponent>
        );
      })}
    </div>
  );
}
