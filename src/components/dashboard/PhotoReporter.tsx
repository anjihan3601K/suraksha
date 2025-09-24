"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Send, Loader2, MapPin, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  image: z.any().refine((files) => files?.length > 0, "Image is required."),
  location: z.string().min(3, { message: "Location must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
});

export function PhotoReporter() {
  const { toast } = useToast();
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      image: undefined,
      location: "",
    },
  });

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support location services.",
      });
      return;
    }

    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locationString = `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° W`;
        form.setValue("location", locationString, { shouldValidate: true });
        setIsFetchingLocation(false);
        toast({ title: "Location Fetched", description: "Your current location has been filled in." });
      },
      (error) => {
        setIsFetchingLocation(false);
        toast({
          variant: "destructive",
          title: "Location Error",
          description: "Could not fetch location. Please grant permission or enter it manually.",
        });
        console.error("Geolocation error:", error);
      }
    );
  };
  
  useEffect(() => {
    const fetchUserAddressOrLocation = async () => {
      const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
      if (userEmail) {
        const userDocRef = doc(db, "users", userEmail);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().address) {
          form.setValue("location", userDoc.data().address);
        } else {
          fetchLocation(); // Fetch GPS if no address
        }
      } else {
         fetchLocation(); // Fetch GPS for anonymous users
      }
    };
    fetchUserAddressOrLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue("image", event.target.files);
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;

    if (!userEmail) {
        toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in to submit a report."});
        setIsLoading(false);
        return;
    }

    if (!preview) {
        toast({ variant: "destructive", title: "Image Missing", description: "Please select an image before submitting."});
        setIsLoading(false);
        return;
    }
    
    try {
        const userRef = doc(db, "users", userEmail);
        const userSnap = await getDoc(userRef);
        const userName = userSnap.exists() ? userSnap.data().name : "Anonymous";
        const userAddress = userSnap.exists() ? userSnap.data().address : "";

        await addDoc(collection(db, "reports"), {
            description: values.description,
            imageUrl: preview, // Use the preview data URL
            location: values.location,
            userName: userName,
            timestamp: serverTimestamp(),
            imageHint: "user report", // Generic hint
        });

        toast({
            title: "Report Sent",
            description: "Your photo and description have been sent to officials.",
        });
        form.reset({
          description: "",
          image: undefined,
          location: userAddress || values.location,
        });
        setPreview(null);
    } catch (error) {
        console.error("Error sending report:", error);
        toast({ variant: "destructive", title: "Submission Failed", description: "Could not send your report. Please try again." });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Card className="shadow-lg h-full border-t-4 border-blue-500">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="flex-1">
                <CardTitle className="font-headline flex items-center gap-2">
                    <Camera className="h-5 w-5"/>
                    Photo & Text Reporting
                </CardTitle>
                <CardDescription>Send a photo and description to officials.</CardDescription>
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
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <div className="w-full aspect-video border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/50">
                      {preview ? (
                        <Image src={preview} alt="Image preview" width={200} height={112} className="object-cover h-full w-full rounded-md" />
                      ) : (
                        <>
                          <Camera className="h-8 w-8 text-muted-foreground" />
                          <span className="mt-2 text-sm text-muted-foreground">Click to upload image</span>
                        </>
                      )}
                    </div>
                  </FormLabel>
                  <FormControl>
                    <Input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <div className="relative flex-grow">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Fetching location..." {...field} disabled={isLoading || isFetchingLocation} className="pl-9"/>
                      </div>
                    </FormControl>
                    <Button type="button" variant="outline" size="icon" onClick={fetchLocation} disabled={isFetchingLocation || isLoading}>
                      {isFetchingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                      <span className="sr-only">Fetch My Location</span>
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe what you see..." {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {isLoading ? 'Sending...' : 'Send Report'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
