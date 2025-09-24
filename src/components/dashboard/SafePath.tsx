
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSafePath, GetSafePathOutput } from "@/ai/flows/dynamic-safe-path-guidance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Map, Route, Clock, AlertTriangle, Loader2, Pin, MapPin, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

const DynamicMap = dynamic(() => import('@/components/dashboard/DynamicMap'), {
  ssr: false,
  loading: () => <div className="aspect-video w-full bg-muted rounded-md flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div>
});

const formSchema = z.object({
  currentLocation: z.string().min(1, { message: "Location is required." }),
  disasterType: z.string().min(1, { message: "Disaster type is required." }),
  disasterSeverity: z.string().min(1, { message: "Severity is required." }),
});

// Helper function to parse coordinates from string
const parseCoords = (location: string): [number, number] | null => {
    // Handles formats like "12.9716° N, 77.5946° E" or "12.9716, 77.5946"
    const parts = location.replace(/°/g, '').replace(/[NSEW]/g, '').split(',');
    if (parts.length !== 2) return null;
    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());
    if (isNaN(lat) || isNaN(lng)) return null;
    return [lat, lng];
}

export function SafePath() {
  const [result, setResult] = useState<GetSafePathOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsClient(true); // This will be true only on the client
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentLocation: "",
      disasterType: "Flood",
      disasterSeverity: "High",
    },
  });

  const fetchLocation = (showToast = true) => {
    if (!navigator.geolocation) {
      if (showToast) {
        toast({
            variant: "destructive",
            title: "Geolocation Not Supported",
            description: "Your browser doesn't support location services.",
        });
      }
      return;
    }

    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locationString = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        form.setValue("currentLocation", locationString, { shouldValidate: true });
        setIsFetchingLocation(false);
        if (showToast) {
            toast({ title: "Location Fetched", description: "Your current location has been filled in." });
        }
      },
      async (error) => {
        setIsFetchingLocation(false);
        if (showToast) {
            toast({
              variant: "destructive",
              title: "Location Error",
              description: "Could not fetch location. Please grant permission or enter manually.",
            });
        }
        console.error("Geolocation error:", error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };
  
  useEffect(() => {
      if (isClient) {
          const online = navigator.onLine;
          setIsOnline(online);
          
          const handleOnline = () => setIsOnline(true);
          const handleOffline = () => setIsOnline(false);
          window.addEventListener('online', handleOnline);
          window.addEventListener('offline', handleOffline);

          if (online) {
              const userEmail = localStorage.getItem('userEmail');
              if (userEmail) {
                  const userDocRef = doc(db, "users", userEmail);
                  getDoc(userDocRef).then(userDoc => {
                      if (userDoc.exists() && userDoc.data().address) {
                          form.setValue("currentLocation", userDoc.data().address);
                      } else {
                          fetchLocation(false);
                      }
                  }).catch(() => fetchLocation(false));
              } else {
                  fetchLocation(false);
              }
          }

          return () => {
              window.removeEventListener('online', handleOnline);
              window.removeEventListener('offline', handleOffline);
          };
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]);

  const startCoords = result ? parseCoords(form.getValues("currentLocation")) : null;
  const endCoords = result?.destinationCoords ? [result.destinationCoords.lat, result.destinationCoords.lng] as [number, number] : null;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);

    const parsedStart = parseCoords(values.currentLocation);
    if (!parsedStart) {
        toast({ title: "Address Detected", description: "Coordinates are not in a recognizable format. The AI will attempt to use the provided address, which may be less accurate." });
    }

    try {
      const res = await getSafePath(values);
      setResult(res);

      const parsedDestination = [res.destinationCoords.lat, res.destinationCoords.lng];
      if (!parsedStart || !parsedDestination) {
          toast({ variant: "destructive", title: "Cannot Display on Map", description: "Could not determine exact coordinates for the route. Please check the locations." });
      }

    } catch (error) {
      console.error("Error getting safe path:", error);
      toast({ title: "AI Error", description: "Could not generate a safe path. This may happen if no help centers are available or if there is an issue with the AI service.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  if (!isClient) {
      return (
          <Card className="shadow-lg h-full border-t-4 border-purple-500">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <CardTitle className="font-headline flex items-center gap-2">
                                <Map className="h-5 w-5"/>
                                Safe Path Guidance
                            </CardTitle>
                            <CardDescription>AI-powered dynamic evacuation routes to the nearest help center.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
      )
  }

  return (
    <Card className="shadow-lg h-full border-t-4 border-purple-500">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="flex-1">
                <CardTitle className="font-headline flex items-center gap-2">
                    <Map className="h-5 w-5"/>
                    Safe Path Guidance
                </CardTitle>
                <CardDescription>AI-powered dynamic evacuation routes to the nearest help center.</CardDescription>
            </div>
             <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-6 w-6" />
                <span className="sr-only">Go back</span>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Location (or Address)</FormLabel>
                   <div className="flex gap-2">
                      <FormControl>
                         <div className="relative flex-grow">
                          <Pin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Fetching location..." {...field} disabled={isLoading || isFetchingLocation} className="pl-9"/>
                        </div>
                      </FormControl>
                      <Button type="button" variant="outline" size="icon" onClick={() => fetchLocation(true)} disabled={isFetchingLocation || isLoading}>
                        {isFetchingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                        <span className="sr-only">Fetch My Location</span>
                      </Button>
                    </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="disasterType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disaster</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Earthquake">Earthquake</SelectItem>
                        <SelectItem value="Flood">Flood</SelectItem>
                        <SelectItem value="Wildfire">Wildfire</SelectItem>
                        <SelectItem value="Tsunami">Tsunami</SelectItem>
                        <SelectItem value="Cyclone">Cyclone</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="disasterSeverity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select severity" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Extreme">Extreme</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !isOnline}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Route className="mr-2 h-4 w-4" />}
              {isLoading ? 'Generating...' : 'Find Safe Path'}
            </Button>
            {!isOnline && (
              <p className="text-sm text-destructive text-center pt-2">You are offline. Safe Path Guidance is disabled.</p>
            )}
          </form>
        </Form>
        
        {isLoading && (
          <div className="mt-6 space-y-4 animate-pulse">
            <div className="p-4 bg-secondary/50 rounded-lg space-y-3">
              <div className="h-5 w-3/4 bg-muted rounded-md"></div>
              <div className="h-4 w-1/2 bg-muted rounded-md"></div>
              <div className="h-4 w-3/5 bg-muted rounded-md"></div>
              <div className="h-4 w-2/4 bg-muted rounded-md"></div>
            </div>
            <div className="aspect-video w-full bg-muted rounded-md"></div>
          </div>
        )}
        {result && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-secondary/50 rounded-lg space-y-3 text-sm">
                <h4 className="font-bold font-headline text-base">Recommended Evacuation Route:</h4>
                <div className="flex items-start gap-3">
                    <Pin className="h-5 w-5 text-primary mt-0.5" />
                    <p><span className="font-semibold">Destination:</span> {result.destination}</p>
                </div>
                <div className="flex items-start gap-3">
                    <Route className="h-5 w-5 text-primary mt-0.5" />
                    <p><span className="font-semibold">Path:</span> {result.safePath}</p>
                </div>
                 <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <p><span className="font-semibold">Est. Time:</span> {result.estimatedTime}</p>
                </div>
                 <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    <p><span className="font-semibold">Risk Level:</span> {result.riskLevel}</p>
                </div>
            </div>
             {startCoords && endCoords && (
                <div className="aspect-video w-full rounded-md overflow-hidden border">
                   <DynamicMap start={startCoords} end={endCoords} pathString={result.safePath} />
                </div>
             )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
