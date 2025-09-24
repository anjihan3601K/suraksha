
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Send, Megaphone, Loader2, Sparkles, Trash2, Clock, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, Timestamp, doc, deleteDoc } from "firebase/firestore";
import { generateAlertSuggestion } from "@/ai/flows/generate-alert-suggestion";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  severity: z.string().min(1, { message: "Severity is required." }),
  message: z.string().min(20, { message: "Message must be at least 20 characters." }),
});

interface AlertBroadcasterProps {
  suggestion?: { title: string; message: string } | null;
}

interface Alert {
  id: string;
  severity: "High" | "Moderate" | "Low" | "Info";
  title: string;
  message: string;
  timestamp: Timestamp;
}

const severityInfo = {
  High: { icon: <AlertTriangle className="h-5 w-5 text-destructive" />, badge: "destructive" as const },
  Moderate: { icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />, badge: "secondary" as const },
  Low: { icon: <Info className="h-5 w-5 text-blue-500" />, badge: "default" as const },
  Info: { icon: <CheckCircle className="h-5 w-5 text-green-500" />, badge: "outline" as const },
};


function AlertsList() {
    const [alerts, setAlerts] = React.useState<Alert[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();

    React.useEffect(() => {
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
    
    const handleDelete = async (alertId: string) => {
        try {
            await deleteDoc(doc(db, "alerts", alertId));
            toast({
                title: "Alert Deleted",
                description: "The alert has been successfully removed.",
            });
        } catch (error) {
            console.error("Error deleting alert:", error);
            toast({
                variant: "destructive",
                title: "Deletion Failed",
                description: "Could not delete the alert. Please try again.",
            });
        }
    };

    const formatTimestamp = (timestamp: Timestamp) => {
        if (!timestamp) return "Just now";
        return `${formatDistanceToNow(timestamp.toDate())} ago`;
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">Sent Alerts</CardTitle>
                <CardDescription>View and manage previously broadcasted alerts.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[50vh] pr-4">
                     {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : alerts.length === 0 ? (
                        <div className="flex justify-center items-center h-full py-10">
                        <p className="text-muted-foreground">No alerts have been sent yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {alerts.map((alert, index) => (
                                <div key={alert.id}>
                                    <div className="flex gap-4">
                                        <div className="mt-1">{severityInfo[alert.severity as keyof typeof severityInfo].icon}</div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-start justify-between">
                                                <h4 className="font-bold font-headline">{alert.title}</h4>
                                                <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>This action cannot be undone. This will permanently delete the alert.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(alert.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                            <p className="text-sm text-foreground/80">{alert.message}</p>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                 <Badge variant={severityInfo[alert.severity as keyof typeof severityInfo].badge}>{alert.severity}</Badge>
                                                 <div className="flex items-center gap-2">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{formatTimestamp(alert.timestamp)}</span>
                                                 </div>
                                            </div>
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
    )
}

export function AlertBroadcaster({ suggestion }: AlertBroadcasterProps) {
  const { toast } = useToast();
  const [isBroadcasting, setIsBroadcasting] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(true);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      severity: "High",
      message: "",
    },
  });
  
  React.useEffect(() => {
    if (suggestion) {
      form.setValue("title", suggestion.title, { shouldValidate: true });
      form.setValue("message", suggestion.message, { shouldValidate: true });
      form.setValue("severity", "High", { shouldValidate: true });
    }
  }, [suggestion, form]);

  const handleGenerateSuggestion = async () => {
    setIsGenerating(true);
    const severity = form.getValues("severity");
    // For simplicity, we'll use a disaster type. This could be an input field.
    const disasterType = "Wildfire"; 

    try {
      const suggestion = await generateAlertSuggestion({
        disasterType,
        severity,
      });
      form.setValue("title", suggestion.title, { shouldValidate: true });
      form.setValue("message", suggestion.message, { shouldValidate: true });
      toast({
        title: "AI Suggestion Generated",
        description: "Review and edit the suggested alert before broadcasting.",
      });
    } catch (error) {
      console.error("Error generating alert suggestion:", error);
      toast({
        variant: "destructive",
        title: "AI Generation Failed",
        description: "Could not generate a suggestion. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "You are offline",
        description: "Cannot broadcast alerts while offline.",
      });
      return;
    }
    setIsBroadcasting(true);
    try {
      await addDoc(collection(db, "alerts"), {
        ...values,
        timestamp: serverTimestamp(),
      });
      toast({
        title: "Alert Broadcasted",
        description: `"${values.title}" has been sent to all users.`,
      });
      form.reset();
    } catch (error) {
      console.error("Error broadcasting alert:", error);
      toast({
        variant: "destructive",
        title: "Broadcast Failed",
        description: "Could not send the alert. Please try again.",
      });
    } finally {
        setIsBroadcasting(false);
    }
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Broadcast New Alert
          </CardTitle>
          <CardDescription>
            Compose and send a new alert to all users. This action is immediate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alert Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Evacuation Order Issued" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select severity" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Info">Info</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Moderate">Moderate</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" variant="outline" onClick={handleGenerateSuggestion} disabled={isGenerating || !isOnline}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {isGenerating ? 'Generating...' : 'Generate with AI'}
                  </Button>
              </div>
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alert Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide clear instructions and details about the situation..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" size="lg" disabled={isBroadcasting || !isOnline}>
                {isBroadcasting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {isBroadcasting ? 'Broadcasting...' : 'Broadcast Alert'}
              </Button>
              {!isOnline && (
                <p className="text-sm text-destructive text-center pt-2">You are offline. Broadcasting is disabled.</p>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
      <AlertsList />
    </>
  );
}
