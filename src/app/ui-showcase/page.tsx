
"use client";

import * as React from "react";
import { AppHeader } from "@/components/shared/AppHeader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Terminal, Waves, CheckCircle, Info, Rocket } from "lucide-react";

export default function UIShowcasePage() {
  const { toast } = useToast();
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [progress, setProgress] = React.useState(33);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <header className="text-center">
            <h1 className="text-4xl font-bold font-headline">UI Component Showcase</h1>
            <p className="text-muted-foreground mt-2">A gallery of available ShadCN UI components for this project.</p>
          </header>

          <ShowcaseSection title="Alert">
            <div className="space-y-4">
              <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Heads up!</AlertTitle>
                <AlertDescription>You can add components to your app using the cli.</AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <Waves className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Your session has expired. Please log in again.</AlertDescription>
              </Alert>
            </div>
          </ShowcaseSection>

          <ShowcaseSection title="Accordion">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Is it accessible?</AccordionTrigger>
                <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Is it styled?</AccordionTrigger>
                <AccordionContent>Yes. It comes with default styles that match the rest of the components.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </ShowcaseSection>
          
          <div className="grid md:grid-cols-2 gap-8">
            <ShowcaseSection title="Avatar & Badge">
                <div className="flex gap-4 items-center">
                    <Avatar>
                        <AvatarImage src="https://picsum.photos/seed/avatar/100/100" />
                        <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-wrap gap-2">
                        <Badge>Default</Badge>
                        <Badge variant="secondary">Secondary</Badge>
                        <Badge variant="destructive">Destructive</Badge>
                        <Badge variant="outline">Outline</Badge>
                    </div>
                </div>
            </ShowcaseSection>

            <ShowcaseSection title="Progress & Slider">
                <div className="space-y-4">
                    <Progress value={progress} />
                    <Slider defaultValue={[progress]} max={100} step={1} onValueChange={(value) => setProgress(value[0])} />
                </div>
            </Showcase.section>
          </div>

          <ShowcaseSection title="Buttons">
            <div className="flex flex-wrap gap-4">
              <Button>Default</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button size="lg">Large</Button>
              <Button size="sm">Small</Button>
              <Button size="icon"><Rocket className="h-4 w-4"/></Button>
            </div>
          </ShowcaseSection>

          <ShowcaseSection title="Card">
            <Card className="w-full max-w-sm">
              <CardHeader>
                <CardTitle>Create project</CardTitle>
                <CardDescription>Deploy your new project in one-click.</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Card Content</p>
              </CardContent>
              <CardFooter>
                <Button>Deploy</Button>
              </CardFooter>
            </Card>
          </ShowcaseSection>
          
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <ShowcaseSection title="Dialogs & Toasts">
                <div className="flex gap-4">
                    <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="outline">Alert Dialog</Button></AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction>Continue</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Dialog>
                        <DialogTrigger asChild><Button variant="outline">Dialog</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Edit profile</DialogTitle><DialogDescription>Make changes to your profile here.</DialogDescription></DialogHeader>
                            <p>This is the dialog content.</p>
                        </DialogContent>
                    </Dialog>
                    <Button onClick={() => toast({ title: "Scheduled: Catch up", description: "Friday, February 10, 2023 at 5:57 PM" })}>Show Toast</Button>
                </div>
            </ShowcaseSection>

            <ShowcaseSection title="Popovers & Tooltips">
                <TooltipProvider>
                    <div className="flex gap-4">
                    <Popover>
                        <PopoverTrigger asChild><Button variant="outline">Popover</Button></PopoverTrigger>
                        <PopoverContent className="w-80">
                            <h4 className="font-medium leading-none">Dimensions</h4>
                            <p className="text-sm text-muted-foreground">Set the dimensions for the layer.</p>
                        </PopoverContent>
                    </Popover>
                    <Tooltip>
                        <TooltipTrigger asChild><Button variant="outline">Tooltip</Button></TooltipTrigger>
                        <TooltipContent><p>Add to library</p></TooltipContent>
                    </Tooltip>
                    </div>
                </TooltipProvider>
            </ShowcaseSection>
          </div>

          <ShowcaseSection title="Forms">
            <div className="space-y-6">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input type="email" id="email" placeholder="Email" />
                </div>
                <Textarea placeholder="Type your message here." />
                <Select>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Theme" /></SelectTrigger>
                    <SelectContent><SelectItem value="light">Light</SelectItem><SelectItem value="dark">Dark</SelectItem></SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                    <Checkbox id="terms" />
                    <label htmlFor="terms" className="text-sm font-medium">Accept terms and conditions</label>
                </div>
                <RadioGroup defaultValue="comfortable">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="default" id="r1" /><Label htmlFor="r1">Default</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="comfortable" id="r2" /><Label htmlFor="r2">Comfortable</Label></div>
                </RadioGroup>
                <div className="flex items-center space-x-2">
                    <Switch id="airplane-mode" />
                    <Label htmlFor="airplane-mode">Airplane Mode</Label>
                </div>
            </div>
          </ShowcaseSection>

          <ShowcaseSection title="Tabs">
            <Tabs defaultValue="account" className="w-full max-w-md">
              <TabsList><TabsTrigger value="account">Account</TabsTrigger><TabsTrigger value="password">Password</TabsTrigger></TabsList>
              <TabsContent value="account">Make changes to your account here.</TabsContent>
              <TabsContent value="password">Change your password here.</TabsContent>
            </Tabs>
          </ShowcaseSection>

          <ShowcaseSection title="Calendar">
            <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
          </ShowcaseSection>
          
          <ShowcaseSection title="Separator">
            <div className="space-y-1">
                <h4 className="text-sm font-medium leading-none">Radix Primitives</h4>
                <p className="text-sm text-muted-foreground">An open-source UI component library.</p>
            </div>
            <Separator className="my-4" />
            <div className="flex h-5 items-center space-x-4 text-sm">
                <div>Blog</div><Separator orientation="vertical" /><div>Docs</div><Separator orientation="vertical" /><div>Source</div>
            </div>
          </ShowcaseSection>

        </div>
      </main>
    </div>
  );
}

function ShowcaseSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold font-headline border-b pb-2">{title}</h2>
      <div className="p-6 rounded-xl border bg-card text-card-foreground">
        {children}
      </div>
    </section>
  );
}
