
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { browserSessionPersistence, setPersistence, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";

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

const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "venkat.kanamarlapudi1906@gmail.com";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uiText, setUiText] = useState(initialText);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("selectedLanguage");
    if (savedLanguage && savedLanguage !== "en") {
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
      await setPersistence(auth, browserSessionPersistence);
      const { user } = await signInWithEmailAndPassword(auth, values.email, values.password);
      const email = user.email ?? values.email;

      if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
        sessionStorage.setItem("userEmail", email);
        sessionStorage.setItem("userUid", user.uid);
        sessionStorage.setItem("userRole", "official");
        toast({
          title: "Login Successful",
          description: "Welcome back to the admin dashboard.",
        });
        router.push("/admin/dashboard");
        return;
      }

      const [citizenSnap, officialSnap, adminSnap] = await Promise.all([
        getDocs(query(collection(db, "users"), where("email", "==", email))),
        getDocs(query(collection(db, "officials"), where("email", "==", email))),
        getDocs(query(collection(db, "admins"), where("email", "==", email))),
      ]);

      const [citizenByUid, officialByUid, adminByUid] = await Promise.all([
        getDoc(doc(db, "users", user.uid)),
        getDoc(doc(db, "officials", user.uid)),
        getDoc(doc(db, "admins", user.uid)),
      ]);

      const citizenDoc = citizenByUid.exists() ? citizenByUid : citizenSnap.docs[0];
      let officialDoc = officialByUid.exists() ? officialByUid : officialSnap.docs[0];
      const adminDoc = adminByUid.exists() ? adminByUid : adminSnap.docs[0];

      if (!officialDoc && adminDoc) {
        officialDoc = adminDoc;
      }

      if (officialDoc) {
        sessionStorage.setItem("userEmail", email);
        sessionStorage.setItem("userUid", user.uid);
        sessionStorage.setItem("userRole", "official");
        toast({
          title: "Login Successful",
          description: "Welcome back to the official dashboard.",
        });
        router.push("/admin/dashboard");
        return;
      }

      if (citizenDoc) {
        sessionStorage.setItem("userEmail", email);
        sessionStorage.setItem("userUid", user.uid);
        sessionStorage.setItem("userRole", "citizen");
        toast({
          title: "Login Successful",
          description: "Welcome back to your dashboard.",
        });
        router.push("/dashboard");
        return;
      }

      await signOut(auth);
      toast({
        variant: "destructive",
        title: "Access Not Found",
        description: "No matching account was found. If you are an official, contact your super admin for credentials. If you are a citizen, please create an account.",
      });
      router.push("/signup");
    } catch (error: any) {
      console.error("Error logging in:", error);
      const friendlyMessage =
        error?.code === "auth/invalid-credential" ||
        error?.code === "auth/wrong-password" ||
        error?.code === "auth/user-not-found"
          ? "Wrong email or password. Please try again."
          : error?.message || "An unexpected error occurred. Please try again.";

      toast({
        variant: "destructive",
        title: "Login Failed",
        description: friendlyMessage,
      });
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
          <CardDescription>{uiText.description}</CardDescription>
        </CardHeader>
        <CardContent>
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
                  {isSubmitting || isTranslating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
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
        </CardContent>
      </Card>
    </div>
  );
}
