
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, GeoPoint } from "firebase/firestore";

import { AppHeader } from "@/components/shared/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Hospital, Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(5, { message: "Center name must be at least 5 characters." }),
  location: z.string().min(10, { message: "Please provide a valid address." }),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email." }).optional().or(z.literal('')),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

export default function RegisterHelplinePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      location: "",
      contactPerson: "",
      contactPhone: "",
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    try {
      const { latitude, longitude, ...rest } = values;
      const data: any = {
        ...rest,
        email: values.email || "",
        contact: {
            name: values.contactPerson || "",
            phone: values.contactPhone || "",
        },
        registeredAt: serverTimestamp(),
      };
      
      if (latitude && longitude) {
          data.coordinates = new GeoPoint(latitude, longitude);
      }

      await addDoc(collection(db, "help-centers"), data);
      
      toast({
        title: "Center Registered",
        description: `${values.name} has been added to the system.`,
      });
      form.reset();
    } catch (error) {
      console.error("Error registering help center:", error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "Could not save the new help center. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1 p-4 md:p-6 lg:p-8 flex items-start justify-center">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader>
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <CardTitle className="font-headline flex items-center gap-2 text-2xl">
                        <Hospital className="h-6 w-6 text-primary" />
                        Register New Helpline Center
                    </CardTitle>
                    <CardDescription>Add a new facility to the disaster response network.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => router.push('/admin/dashboard')}>
                    <ArrowLeft className="h-6 w-6" />
                    <span className="sr-only">Go back to dashboard</span>
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Center Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., City Convention Hall Relief Camp" {...field} />
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
                      <FormLabel>Full Address</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 123 Main St, Anytown" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude (Optional)</FormLabel>
                          <FormControl>
                            <Input type="number" step="any" placeholder="e.g., 12.9716" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="longitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude (Optional)</FormLabel>
                          <FormControl>
                            <Input type="number" step="any" placeholder="e.g., 77.5946" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="contactPerson"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Contact Person (Optional)</FormLabel>
                          <FormControl>
                              <Input placeholder="e.g., Ms. Priya Sharma" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Contact Phone (Optional)</FormLabel>
                          <FormControl>
                              <Input placeholder="e.g., 555-123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                    />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="e.g., contact@reliefcenter.org" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" size="lg" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSaving ? "Saving..." : "Save Center"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
