
"use client";

import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  ShieldCheck,
  Route,
  Camera,
  Mic,
  Handshake,
  LifeBuoy,
} from "lucide-react";
import type { Feature } from "@/app/dashboard/page";

interface DashboardSidebarProps {
  featureLabels: {
    safetyIndex: string;
    safePath: string;
    photoReporter: string;
    voiceSOS: string;
    communityHelp: string;
  };
  isOnline: boolean;
}

export function DashboardSidebar({
  featureLabels,
  isOnline,
}: DashboardSidebarProps) {
  const { setOpenMobile } = useSidebar();
  
  const features: {
    id: Feature;
    label: string;
    icon: React.ReactNode;
    onlineOnly: boolean;
    href: string;
  }[] = [
    {
      id: "voiceSOS",
      label: featureLabels.voiceSOS,
      icon: <Mic className="text-red-500" />,
      onlineOnly: true,
      href: "/dashboard/voice-sos",
    },
    {
      id: "photoReporter",
      label: featureLabels.photoReporter,
      icon: <Camera className="text-blue-500" />,
      onlineOnly: false,
      href: "/dashboard/photo-reporter",
    },
    {
      id: "safetyIndex",
      label: featureLabels.safetyIndex,
      icon: <ShieldCheck className="text-green-500" />,
      onlineOnly: true,
      href: "/dashboard/safety-index",
    },
    {
      id: "safePath",
      label: featureLabels.safePath,
      icon: <Route className="text-purple-500"/>,
      onlineOnly: true,
      href: "/dashboard/safe-path",
    },
    {
      id: "communityHelp",
      label: featureLabels.communityHelp,
      icon: <Handshake className="text-orange-500" />,
      onlineOnly: false,
      href: "/dashboard/community-help",
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 p-4">
            <div className="bg-primary p-2 rounded-lg">
                <LifeBuoy className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
                 <h2 className="text-xl font-bold font-headline">Suraksha</h2>
                 <p className="text-xs text-muted-foreground">Emergency Features</p>
            </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {features.map((feature) => (
            <SidebarMenuItem key={feature.id} onClick={() => setOpenMobile(false)}>
              <Link href={feature.href} className="w-full" tabIndex={-1}>
                <SidebarMenuButton
                  disabled={feature.onlineOnly && !isOnline}
                  className="h-12 justify-start w-full"
                >
                  <div className="w-8">{feature.icon}</div>
                  <span className="text-base">{feature.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
