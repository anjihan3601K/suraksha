
"use client";

import { AppHeader } from "@/components/shared/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, ShieldAlert, Ambulance, Shield, Building, HeartPulse, Cloud, Droplets, Wind, Mountain, Home, User, Mail, Globe, Users, Info, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const contacts = [
    { name: "National Disaster Response", number: "1-800-621-3362", icon: <ShieldAlert className="h-5 w-5 text-destructive" /> },
    { name: "Emergency Medical Services", number: "911", icon: <Ambulance className="h-5 w-5 text-blue-500" /> },
    { name: "Local Police Department", number: "311", icon: <Shield className="h-5 w-5 text-primary" /> },
    { name: "City Services & Information", number: "311", icon: <Building className="h-5 w-5 text-muted-foreground" /> },
    { name: "Local Red Cross", number: "1-800-733-2767", icon: <HeartPulse className="h-5 w-5 text-red-500" /> },
    { name: "National Weather Service", number: "N/A", icon: <Cloud className="h-5 w-5 text-gray-400" />, website: "https://www.weather.gov/" },
    { name: "Poison Control Center", number: "1-800-222-1222", icon: <Droplets className="h-5 w-5 text-green-500" /> },
    { name: "Gas Leak Emergency", number: "1-800-532-5325", icon: <Wind className="h-5 w-5 text-yellow-500" /> },
    { name: "Mountain Rescue", number: "911", icon: <Mountain className="h-5 w-5 text-indigo-500" /> },
    { name: "Animal Control", number: "311", icon: <Home className="h-5 w-5 text-orange-500" /> },
    { name: "Non-Emergency Information", number: "211", icon: <Info className="h-5 w-5 text-teal-500" /> },
    { name: "Public Health Department", number: "1-888-782-4363", icon: <Users className="h-5 w-5 text-purple-500" /> },
    { name: "Mental Health Crisis Line", number: "988", icon: <User className="h-5 w-5 text-pink-500" /> },
    { name: "Consular Services for Foreign Nationals", number: "1-202-501-4444", icon: <Globe className="h-5 w-5 text-cyan-500" /> },
    { name: "Report Price Gouging", number: "1-800-952-5225", icon: <Mail className="h-5 w-5 text-lime-500" /> },
];

export default function ContactsPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1 p-4 md:p-6 lg:p-8 flex items-start justify-center">
         <Card className="w-full max-w-4xl shadow-xl">
          <CardHeader>
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <CardTitle className="font-headline flex items-center gap-2 text-3xl">
                      <Phone className="h-7 w-7" />
                      Emergency Contacts
                    </CardTitle>
                    <CardDescription>A comprehensive list of essential services for various emergencies.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
                    <ArrowLeft className="h-6 w-6" />
                    <span className="sr-only">Go back</span>
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {contacts.map((contact) => (
                  <div key={contact.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                      <div className="flex items-center gap-4">
                          {contact.icon}
                          <span className="text-base font-medium">{contact.name}</span>
                      </div>
                      {contact.website ? (
                        <Link href={contact.website} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline font-mono tracking-wider">
                          Visit Website
                        </Link>
                      ) : (
                        <a href={`tel:${contact.number}`} className="text-base font-semibold text-primary hover:underline font-mono tracking-wider">
                          {contact.number}
                        </a>
                      )}
                  </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
