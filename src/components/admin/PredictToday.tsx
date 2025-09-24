
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Wand, Loader2, AlertCircle, Megaphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  "Year": z.coerce.number().min(1900, { message: "Year must be after 1900." }),
  "Dis Mag Scale": z.coerce.number(),
  "Dis Mag Value": z.coerce.number(),
  "Country": z.coerce.number(),
  "Longitude": z.coerce.number(),
  "Latitude": z.coerce.number(),
});

interface PredictTodayProps {
  onPrediction: (disasterType: string) => void;
}

export function PredictToday({ onPrediction }: PredictTodayProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      Year: new Date().getFullYear(),
      "Dis Mag Scale": 0,
      "Dis Mag Value": 0,
      Country: 89, // Default to India's code if it's common
      Longitude: 77.216,
      Latitude: 28.66,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setPredictionResult(null);
    try {
      // The API expects keys with spaces, and values as numbers.
      const apiPayload = {
        "Year": values.Year,
        "Dis Mag Scale": values["Dis Mag Scale"],
        "Dis Mag Value": values["Dis Mag Value"],
        "Country": values.Country,
        "Longitude": values.Longitude,
        "Latitude": values.Latitude
      };
        
      const response = await fetch("https://suraksha-api-9srx.onrender.com/predict", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
      });

      if (!response.ok) {
        throw new Error(`Prediction failed with status code: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.disaster_Type) {
        setPredictionResult(result.disaster_Type);
        toast({
          title: "Prediction Successful",
          description: `Predicted Disaster: ${result.disaster_Type}`,
        });
      } else {
        throw new Error("Prediction response did not contain 'disaster_Type'.");
      }
    } catch (error) {
      console.error("Error predicting event:", error);
      toast({
        variant: "destructive",
        title: "Prediction Failed",
        description: "Could not get a prediction from the model. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="max-w-4xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <Wand className="h-5 w-5" />
            Predict Disaster
        </CardTitle>
        <CardDescription>
          Use the custom ML model to forecast potential disasters based on input data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
               <FormField
                  control={form.control}
                  name="Year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl><Input type="number" placeholder="e.g., 2024" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="Dis Mag Value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dis Mag Value</FormLabel>
                      <FormControl><Input type="number" step="any" placeholder="e.g., 7.8" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="Dis Mag Scale"
                  render={({ field }) => (
                     <FormItem>
                      <FormLabel>Dis Mag Scale</FormLabel>
                      <FormControl><Input type="number" placeholder="e.g., 0" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
             <div className="grid md:grid-cols-3 gap-4">
               <FormField
                  control={form.control}
                  name="Country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl><Input type="number" placeholder="e.g., 89 for India" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="Latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl><Input type="number" step="any" placeholder="e.g., 28.66" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="Longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl><Input type="number" step="any" placeholder="e.g., 77.216" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand className="mr-2 h-4 w-4" />}
              {isLoading ? 'Predicting...' : 'Predict Disaster'}
            </Button>
          </form>
        </Form>

        {predictionResult && (
          <Alert className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-bold">Prediction Result</AlertTitle>
            <AlertDescription className="flex justify-between items-center">
              <div>
                Predicted Disaster Type: <span className="font-semibold">{predictionResult}</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => onPrediction(predictionResult)}>
                <Megaphone className="mr-2 h-4 w-4" />
                Create Alert
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
