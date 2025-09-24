
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ShieldCheck, LogIn, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { translateUI } from "@/ai/flows/translate-ui";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const initialText = {
  title: "suraksha",
  description: "Enter your credentials to access your account",
  emailLabel: "Email",
  passwordLabel: "Password",
  loginButton: "Login",
  loggingInButton: "Logging in...",
  noAccountText: "Don't have an account?",
  signUpLink: "Sign up",
};


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uiText, setUiText] = useState(initialText);
  const [isTranslating, setIsTranslating] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage && savedLanguage !== 'en') {
      handleLanguageChange(savedLanguage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === "en") {
      setUiText(initialText);
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
    } catch (error) {
      console.error("Translation error:", error);
      // Don't show a toast, just fallback to English
      setUiText(initialText);
    } finally {
      setIsTranslating(false);
    }
  };


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const adminDocRef = doc(db, "admins", values.email);
      const adminDoc = await getDoc(adminDocRef);

      if (adminDoc.exists()) {
        // This is a potential admin, check password (placeholder)
        if (values.password === "Sai@2006") {
           localStorage.setItem('userEmail', values.email);
           router.push("/admin/dashboard");
        } else {
          toast({ variant: "destructive", title: "Invalid Credentials", description: "Please check your password and try again." });
        }
        setIsSubmitting(false);
        return;
      }
      
      // If not an admin, check if they are a regular user
      const userDocRef = doc(db, "users", values.email);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        // In a real app, passwords should be hashed. For this demo, we compare plain text.
        if (userData.password === values.password) {
            localStorage.setItem('userEmail', values.email);
            router.push("/dashboard");
        } else {
             toast({ variant: "destructive", title: "Invalid Credentials", description: "Please check your password and try again." });
        }
      } else {
        // User not found in admins or users
        toast({
          variant: "destructive",
          title: "Account Not Found",
          description: "No account found with this email. Please sign up.",
        });
      }
    } catch (error) {
      console.error("Error logging in:", error);
      toast({ variant: "destructive", title: "Login Failed", description: "An unexpected error occurred. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm w-full shadow-xl">
        <CardHeader className="text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
          <CardTitle className="text-2xl font-headline">{uiText.title}</CardTitle>
          <CardDescription>
            {uiText.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isClient ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{uiText.emailLabel}</FormLabel>
                          <FormControl>
                            <Input placeholder="m@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{uiText.passwordLabel}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isSubmitting || isTranslating}>
                      {(isSubmitting || isTranslating) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />} 
                      {isSubmitting ? uiText.loggingInButton : uiText.loginButton}
                    </Button>
                  </div>
                </form>
              </Form>
              <Separator className="my-6" />
              <div className="text-center text-sm">
                {uiText.noAccountText}{" "}
                <Link href="/signup" className="underline text-primary" prefetch={false}>
                  {uiText.signUpLink}
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
