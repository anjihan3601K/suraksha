
"use client";

import React, { useState, useEffect } from "react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, UserCheck, LogIn, Globe, Bell, Route, Users, HeartPulse, Siren, Home } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { translateUI } from "@/ai/flows/translate-ui";
import { useToast } from "@/hooks/use-toast";

const initialText = {
  // Header
  govOfIndia: "Government of India",
  ndma: "National Disaster Management Authority",
  lastUpdated: "Last Updated",
  home: "Home",
  services: "Services",
  contact: "Contact",
  
  // Hero
  portalTitle: "Suraksha Portal",
  portalDescription: "Official Emergency Response and Disaster Management System by the Government of India. Ensuring citizen safety through technology and coordinated response mechanisms.",
  citizenLogin: "Citizen Login",
  officialAccess: "Official Access",

  // Services
  ourServices: "Our Services",
  service1Title: "Real-time Alerts",
  service1Desc: "Receive instant notifications about emergencies and official advisories.",
  service2Title: "Safe Path Guidance",
  service2Desc: "Get AI-powered evacuation routes to the nearest help centers.",
  service3Title: "Community Help",
  service3Desc: "Connect with your local community to offer or request assistance.",

  // Impact
  ourImpact: "Our Impact",
  impact1Title: "Lives Saved",
  impact1Desc: "> 1 Million",
  impact2Title: "Active Responders",
  impact2Desc: "50,000+",
  impact3Title: "Shelters Provided",
  impact3Desc: "10,000+",

  // Footer
  footerAbout: "About Suraksha",
  footerAboutDesc: "A unified portal for disaster management, providing critical information and services to citizens and authorities.",
  footerQuickLinks: "Quick Links",
  footerContactUs: "Contact Us",
  footerEmail: "contact@ndma.gov.in",
  footerPhone: "1-800-621-3362",
  footerRights: "National Disaster Management Authority, Government of India. All rights reserved.",
};


const languages = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "bn", name: "Bengali" },
  { code: "te", name: "Telugu" },
  { code: "mr", name: "Marathi" },
  { code: "ta", name: "Tamil" },
];


export default function LandingPage() {
  const [uiText, setUiText] = useState(initialText);
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const d = new Date();
    setCurrentDate(`${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`);

    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage && savedLanguage !== 'en') {
      handleLanguageChange(savedLanguage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLanguageChange = async (languageCode: string) => {
    localStorage.setItem('selectedLanguage', languageCode);
    setCurrentLanguage(languageCode);

    if (languageCode === "en") {
      setUiText(initialText);
      localStorage.setItem('landingUiText', JSON.stringify(initialText));
      return;
    }
    setIsTranslating(true);
    try {
      const textToTranslate = Object.values(initialText);
      const { translatedTexts } = await translateUI({
        texts: textToTranslate,
        targetLanguage: languageCode,
      });

      const newUiText = Object.keys(initialText).reduce((acc, key, index) => {
        (acc as any)[key] = translatedTexts[index];
        return acc;
      }, {} as typeof initialText);
      setUiText(newUiText);
      localStorage.setItem('landingUiText', JSON.stringify(newUiText));
    } catch (error) {
      console.error("Translation error:", error);
      toast({
        title: "Translation Failed",
        description: "Could not translate the UI. Reverting to English.",
        variant: "destructive",
      });
      // Fallback to English
      setCurrentLanguage("en");
      localStorage.setItem('selectedLanguage', "en");
      setUiText(initialText);
    } finally {
      setIsTranslating(false);
    }
  };


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="bg-accent text-accent-foreground text-xs p-2">
        <div className="container mx-auto flex justify-between items-center">
            <span>{uiText.govOfIndia} • {uiText.ndma}</span>
            <span>{uiText.lastUpdated}: {currentDate}</span>
        </div>
      </div>
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
                <div className="bg-primary p-2 rounded-lg">
                    <ShieldCheck className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                    <h1 className="text-xl font-bold font-headline">Suraksha</h1>
                    <p className="text-xs text-muted-foreground">National Emergency Response Portal</p>
                </div>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                <a href="#home" className="hover:text-primary transition-colors">{uiText.home}</a>
                <a href="#resources" className="hover:text-primary transition-colors">{uiText.services}</a>
                <a href="/contacts" className="hover:text-primary transition-colors">{uiText.contact}</a>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Globe className="h-4 w-4 mr-2" />
                        {isClient ? languages.find(l => l.code === currentLanguage)?.name || 'English' : 'English'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {languages.map((lang) => (
                        <DropdownMenuItem key={lang.code} onClick={() => handleLanguageChange(lang.code)}>
                          {lang.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </nav>
        </div>
      </header>

      <main>
        <section id="home" className="flex-1 flex flex-col items-center justify-center p-4 text-center min-h-[calc(100vh-7rem)] bg-gradient-to-b from-blue-50/50 to-background">
            <div className="bg-primary p-4 rounded-2xl shadow-lg mb-6 inline-block">
                <ShieldCheck className="h-10 w-10 text-primary-foreground" />
            </div>
            <h2 className="text-5xl font-bold font-headline mb-4">{uiText.portalTitle}</h2>
            <p className="max-w-2xl text-lg text-muted-foreground mx-auto mb-8">
                {uiText.portalDescription}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg">
                    <Link href="/login"><UserCheck className="mr-2 h-5 w-5" />{uiText.citizenLogin}</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                    <Link href="/login"><LogIn className="mr-2 h-5 w-5" />{uiText.officialAccess}</Link>
                </Button>
            </div>
        </section>

        <section id="resources" className="py-20 bg-secondary/50">
            <div className="container mx-auto text-center">
                <h2 className="text-4xl font-bold font-headline mb-12">{uiText.ourServices}</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    <Card className="text-left">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="bg-primary/10 p-3 rounded-full">
                                <Bell className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle>{uiText.service1Title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{uiText.service1Desc}</p>
                        </CardContent>
                    </Card>
                    <Card className="text-left">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="bg-primary/10 p-3 rounded-full">
                                <Route className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle>{uiText.service2Title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{uiText.service2Desc}</p>
                        </CardContent>
                    </Card>
                    <Card className="text-left">
                         <CardHeader className="flex flex-row items-center gap-4">
                            <div className="bg-primary/10 p-3 rounded-full">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle>{uiText.service3Title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{uiText.service3Desc}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        <section id="impact" className="py-20 bg-background">
            <div className="container mx-auto text-center">
                <h2 className="text-4xl font-bold font-headline mb-12">{uiText.ourImpact}</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    <Card className="text-center py-6">
                        <CardHeader className="justify-center">
                            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                                <HeartPulse className="h-8 w-8 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold">{uiText.impact1Desc}</p>
                            <p className="text-muted-foreground mt-2">{uiText.impact1Title}</p>
                        </CardContent>
                    </Card>
                     <Card className="text-center py-6">
                        <CardHeader className="justify-center">
                           <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                                <Siren className="h-8 w-8 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold">{uiText.impact2Desc}</p>
                            <p className="text-muted-foreground mt-2">{uiText.impact2Title}</p>
                        </CardContent>
                    </Card>
                     <Card className="text-center py-6">
                        <CardHeader className="justify-center">
                           <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                                <Home className="h-8 w-8 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold">{uiText.impact3Desc}</p>
                            <p className="text-muted-foreground mt-2">{uiText.impact3Title}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

      </main>

       <footer className="bg-gray-800 text-white">
        <div className="container mx-auto py-12 px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">{uiText.footerAbout}</h3>
              <p className="text-gray-400 text-sm">{uiText.footerAboutDesc}</p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">{uiText.footerQuickLinks}</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#home" className="text-gray-400 hover:text-white">{uiText.home}</a></li>
                <li><a href="#resources" className="text-gray-400 hover:text-white">{uiText.services}</a></li>
                <li><a href="/contacts" className="text-gray-400 hover:text-white">{uiText.contact}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">{uiText.footerContactUs}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>{uiText.footerEmail}</li>
                <li>{uiText.footerPhone}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} {uiText.footerRights}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
