
"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, Timestamp, doc, deleteDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { User, Clock, MessageSquare, Image as ImageIcon, Loader2, MapPin, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";


interface Report {
  id: string;
  userName: string;
  timestamp: Timestamp;
  description: string;
  imageUrl: string;
  imageHint: string;
  location: string;
}

export function ReportsFeed() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const reportsQuery = query(collection(db, "reports"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Report));
      setReports(reportsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching reports:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatTimestamp = (timestamp: Timestamp) => {
    if (!timestamp) return "Just now";
    return `${formatDistanceToNow(timestamp.toDate())} ago`;
  };
  
  const handleDelete = async (reportId: string) => {
    try {
        await deleteDoc(doc(db, "reports", reportId));
        toast({
            title: "Report Deleted",
            description: "The user report has been successfully removed.",
        });
    } catch (error) {
        console.error("Error deleting report:", error);
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "Could not delete the report. Please try again.",
        });
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            User-Submitted Reports
        </CardTitle>
        <CardDescription>Visual reports and descriptions from users on the ground.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[70vh] pr-4">
           {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reports.length === 0 ? (
             <div className="flex justify-center items-center h-full py-10">
              <p className="text-muted-foreground">No reports have been submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-8">
                {reports.map((report, index) => (
                    <div key={report.id}>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                                <Image src={report.imageUrl} alt={`Report ${report.id}`} fill style={{objectFit: 'cover'}} data-ai-hint={report.imageHint}/>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <User className="h-4 w-4" />
                                            <span>{report.userName}</span>
                                        </div>
                                         <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <MapPin className="h-4 w-4" />
                                            <span>{report.location || 'Location not provided'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                                        <Clock className="h-4 w-4" />
                                        <span>{formatTimestamp(report.timestamp)}</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 text-sm text-foreground/90 pt-2">
                                    <MessageSquare className="h-4 w-4 mt-1 shrink-0" />
                                    <p>{report.description}</p>
                                </div>
                                <div className="pt-2">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" size="sm" className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete Report
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete this user report from the database.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(report.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </div>
                        {index < reports.length - 1 && <Separator className="mt-8" />}
                    </div>
                ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
