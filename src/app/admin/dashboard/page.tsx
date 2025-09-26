"use client";

import React from "react";
import { AppHeader } from "@/components/shared/AppHeader";
import { SosFeed } from "@/components/admin/SosFeed";
import { UserStatusTable } from "@/components/admin/UserStatusTable";
import { AlertBroadcaster } from "@/components/admin/AlertBroadcaster";
import { ReportsFeed } from "@/components/admin/ReportsFeed";
import { PredictToday } from "@/components/admin/PredictToday";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { 
  BarChart, 
  Users, 
  AlertTriangle, 
  Loader2, 
  Hospital, 
  Menu, 
  X, 
  TrendingUp,
  Shield,
  Radio,
  Activity,
  CheckCircle2,
  Clock,
  MapPin,
  Zap,
  Calendar,
  Search,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import {
  ResponsiveContainer,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart as RechartsBarChart,
  Cell,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { generateAlertSuggestion } from "@/ai/flows/generate-alert-suggestion";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface PredictHQEvent {
  id: string;
  title: string;
  category: string;
  labels: string[];
  start: string;
  end: string;
  timezone: string;
  location: {
    place_id: string;
    name: string;
    country: string;
  };
  impact_patterns: {
    vertical: string;
    impact_rank: number;
  }[];
  state: string;
}

export default function AdminDashboardPage(): JSX.Element {
  // sidebar open flag: hidden by default, toggled by hamburger
  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(false);
  const toggleSidebar = () => setSidebarOpen((s) => !s);
  const [activeView, setActiveView] = React.useState<string>("dashboard");
  const [alertSuggestion, setAlertSuggestion] =
    React.useState<{ title: string; message: string } | null>(null);
  const [userStats, setUserStats] = React.useState({
    total: 0,
    safe: 0,
    emergency: 0,
    unknown: 0,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  
  // Check Today states
  const [checkTodayInputs, setCheckTodayInputs] = React.useState({
    location: "",
    category: "",
    radius: "50",
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const [predictHQEvents, setPredictHQEvents] = React.useState<PredictHQEvent[]>([]);
  const [isPredictHQLoading, setIsPredictHQLoading] = React.useState(false);
  
  const { toast } = useToast();

  React.useEffect(() => {
    const usersQuery = query(collection(db, "users"));
    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        let safeCount = 0;
        let emergencyCount = 0;
        let unknownCount = 0;

        snapshot.forEach((doc) => {
          const userData = doc.data();
          const userStatus = userData.status?.toLowerCase();
          
          if (userStatus === "safe") {
            safeCount++;
          } else if (userStatus === "emergency") {
            emergencyCount++;
          } else {
            unknownCount++;
          }
        });

        const newStats = {
          total: snapshot.size,
          safe: safeCount,
          emergency: emergencyCount,
          unknown: unknownCount,
        };

        console.log("Updated user stats:", newStats);
        setUserStats(newStats);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching user stats:", error);
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load user statistics.",
        });
      }
    );

    return () => unsubscribe();
  }, [toast]);

  // Create analytics data based on real-time userStats
  const analyticsData = React.useMemo(() => [
    { 
      name: "Safe", 
      count: userStats.safe, 
      fill: "#10b981" // emerald-500
    },
    {
      name: "Emergency",
      count: userStats.emergency,
      fill: "#f59e0b" // amber-500
    },
    {
      name: "Unknown",
      count: userStats.unknown,
      fill: "#6b7280" // gray-500
    },
  ], [userStats]);

  const handlePrediction = async (disasterType: string) => {
    try {
      toast({
        title: "Generating Alert Suggestion...",
        description: "Please wait while AI drafts an alert.",
      });

      const suggestion = await generateAlertSuggestion({
        disasterType,
        severity: "High",
      });

      setAlertSuggestion(suggestion);
      setActiveView("broadcasts");

      toast({
        title: "Suggestion Ready!",
        description: "The broadcast form has been pre-filled.",
      });
    } catch (error) {
      console.error("Error generating alert from prediction:", error);
      toast({
        variant: "destructive",
        title: "AI Generation Failed",
        description: "Could not create a suggestion from the prediction.",
      });
    }
  };

  // Function to handle Predict Today redirect
  const handlePredictTodayRedirect = () => {
    window.open("https://surakshamodels.onrender.com/", "_blank");
  };

  // Function to handle Check Today (same functionality as sidebar button)
  const handleCheckTodayQuickAction = () => {
    setActiveView("checkToday");
    toast({
      title: "Event Monitoring Opened",
      description: "Configure your search parameters to monitor events.",
    });
  };

  // Function to handle Back to Dashboard
  const handleBackToDashboard = () => {
    setActiveView("dashboard");
    toast({
      title: "Back to Dashboard",
      description: "Returned to the main dashboard view.",
    });
  };

  // Function to handle PredictHQ API request
  const handleCheckToday = async () => {
    setIsPredictHQLoading(true);
    try {
      const params = new URLSearchParams({
        'location.place_id': checkTodayInputs.location || 'New York, NY, USA',
        category: checkTodayInputs.category || 'disasters,severe-weather',
        'location.radius': `${checkTodayInputs.radius}km`,
        'active.gte': checkTodayInputs.startDate,
        'active.lte': checkTodayInputs.endDate,
        limit: '20',
        sort: 'start'
      });

      const response = await fetch(`https://api.predicthq.com/v1/events/?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PREDICTHQ_API_KEY || 'KIUl41eW6kuvAqBcGGjTkA_eFdvH7dJyipQhm62n'}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`PredictHQ API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setPredictHQEvents(data.results || []);
      
      toast({
        title: "Data Retrieved Successfully!",
        description: `Found ${data.results?.length || 0} events for the specified criteria.`,
      });

    } catch (error) {
      console.error("Error fetching PredictHQ data:", error);
      toast({
        variant: "destructive",
        title: "API Request Failed",
        description: "Could not retrieve event data. Please check your inputs and try again.",
      });
      setPredictHQEvents([]);
    } finally {
      setIsPredictHQLoading(false);
    }
  };

  // App features data
  const appFeatures = [
    { name: "Real-time Monitoring", icon: Activity, color: "text-blue-600" },
    { name: "Emergency Alerts", icon: AlertTriangle, color: "text-amber-600" },
    { name: "Rescue Coordination", icon: Hospital, color: "text-red-600" },
    { name: "Location Tracking", icon: MapPin, color: "text-green-600" },
    { name: "Safety Reports", icon: Shield, color: "text-purple-600" },
    { name: "AI Predictions", icon: Zap, color: "text-indigo-600" }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <AppHeader setAdminView={setActiveView} />

      {/* hamburger (visible always) to open/close admin sidebar */}
      <button
        aria-label="Open admin menu"
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-60 md:hidden p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/20"
      >
        <Menu className="h-5 w-5 text-slate-600" />
      </button>

      {/* Layout: sidebar + main */}
      <div className="flex flex-1">
        {/* backdrop when sidebar open */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={toggleSidebar}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 h-full w-64 bg-white/95 backdrop-blur-md shadow-2xl border-r border-slate-200/50 z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-semibold text-slate-700">Admin Panel</h4>
              <button
                aria-label="Close admin menu"
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <nav className="space-y-2">
              <Link href="/admin/dashboard" passHref>
                <Button
                  variant={activeView === "dashboard" ? "default" : "ghost"}
                  className="w-full justify-start text-slate-600 hover:text-slate-900"
                  onClick={() => {
                    setActiveView("dashboard");
                    toggleSidebar();
                  }}
                >
                  <Users className="h-4 w-4 mr-3" /> Dashboard
                </Button>
              </Link>

              <Link href="/admin/alerts" passHref>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-600 hover:text-slate-900"
                  onClick={() => {
                    setActiveView("alerts");
                    toggleSidebar();
                  }}
                >
                  <AlertTriangle className="h-4 w-4 mr-3" /> Alerts
                </Button>
              </Link>

              <Link href="/admin/rescue-allocation" passHref>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-600 hover:text-slate-900"
                  onClick={() => {
                    setActiveView("rescue");
                    toggleSidebar();
                  }}
                >
                  <Hospital className="h-4 w-4 mr-3" /> Rescue Team Allocation
                </Button>
              </Link>

              <Link href="/admin/users" passHref>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-600 hover:text-slate-900"
                  onClick={() => {
                    setActiveView("users");
                    toggleSidebar();
                  }}
                >
                  <BarChart className="h-4 w-4 mr-3" /> User Stats
                </Button>
              </Link>

              {/* Check Today Button */}
              <Button
                variant={activeView === "checkToday" ? "default" : "ghost"}
                className="w-full justify-start text-slate-600 hover:text-slate-900"
                onClick={() => {
                  setActiveView("checkToday");
                  toggleSidebar();
                }}
              >
                <Calendar className="h-4 w-4 mr-3" /> Check Today
              </Button>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8 space-y-8">
          {activeView === "dashboard" && (
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Header */}
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
                <p className="text-slate-600">Monitor and manage your disaster response system</p>
              </div>

              {/* User Status Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-700 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  User Status
                </h2>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-medium text-slate-700">
                        Total Users
                      </CardTitle>
                      <Users className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      ) : (
                        <div className="text-3xl font-bold text-blue-700">{userStats.total}</div>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        Registered users
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-medium text-slate-700">
                        Active SOS Signals
                      </CardTitle>
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
                      ) : (
                        <div className="text-3xl font-bold text-amber-700">{userStats.emergency}</div>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        Immediate assistance needed
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200/50 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-medium text-slate-700">
                        Users Marked Safe
                      </CardTitle>
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                      ) : (
                        <div className="text-3xl font-bold text-emerald-700">{userStats.safe}</div>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        Confirmed safety status
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Analytics and SOS Feed */}
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-700">User Status Analytics</CardTitle>
                    <CardDescription className="text-slate-500">
                      Real-time overview of user safety status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] w-full">
                    {isLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart 
                          data={analyticsData} 
                          margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                          key={JSON.stringify(analyticsData)}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                          <YAxis stroke="#64748b" fontSize={12} />
                          <Tooltip
                            wrapperStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }}
                            formatter={(value, name) => [value, `${name} Users`]}
                          />
                          <Legend />
                          <Bar dataKey="count" name="User Count" radius={[4, 4, 0, 0]}>
                            {analyticsData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.fill}
                              />
                            ))}
                          </Bar>
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <SosFeed />
                </div>
              </div>

              {/* Quick Actions Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-700 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-indigo-600" />
                  Quick Actions
                </h2>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold text-slate-700">
                            Rescue Team Allocation
                          </CardTitle>
                          <CardDescription className="text-slate-500">
                            Manage emergency response resources
                          </CardDescription>
                        </div>
                        <Hospital className="h-8 w-8 text-red-600 group-hover:scale-110 transition-transform" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 mb-4">
                        Deploy ambulances, field workers and safety tools to emergency locations.
                      </p>
                      <Link href="/admin/rescue-allocation" passHref>
                        <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                          Open Rescue Allocation
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold text-slate-700">
                            AI Prediction Dashboard
                          </CardTitle>
                          <CardDescription className="text-slate-500">
                            Forecast potential disasters
                          </CardDescription>
                        </div>
                        <TrendingUp className="h-8 w-8 text-indigo-600 group-hover:scale-110 transition-transform" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 mb-4">
                        Use machine learning models to predict and prepare for emergencies.
                      </p>
                      <Button 
                        onClick={handlePredictTodayRedirect}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        Open Prediction Dashboard
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Check Today Quick Action Card */}
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold text-slate-700">
                            Check Today Events
                          </CardTitle>
                          <CardDescription className="text-slate-500">
                            Monitor current event impacts
                          </CardDescription>
                        </div>
                        <Calendar className="h-8 w-8 text-green-600 group-hover:scale-110 transition-transform" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 mb-4">
                        Search and monitor events that may impact disaster response operations.
                      </p>
                      <Button 
                        onClick={handleCheckTodayQuickAction}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Open Event Monitor
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* App Status Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-700 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-green-600" />
                  App Status
                </h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200/50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-slate-700">System Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200/50">
                        <div className="flex items-center space-x-3">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Database Connection</span>
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200/50">
                        <div className="flex items-center space-x-3">
                          <Radio className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Alert System</span>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Online</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200/50">
                        <div className="flex items-center space-x-3">
                          <Clock className="h-5 w-5 text-purple-600" />
                          <span className="text-sm font-medium text-purple-800">Last Updated</span>
                        </div>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Now</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200/50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-slate-700">Features Offered</CardTitle>
                      <CardDescription className="text-slate-500">
                        Comprehensive disaster management capabilities
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {appFeatures.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-3 p-2 rounded-lg bg-white border border-slate-100">
                            <feature.icon className={`h-4 w-4 ${feature.color}`} />
                            <span className="text-sm font-medium text-slate-700">{feature.name}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <UserStatusTable />
            </div>
          )}

          {activeView === "broadcasts" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <AlertBroadcaster suggestion={alertSuggestion} />
            </div>
          )}

          {activeView === "reports" && <ReportsFeed />}

          {/* Check Today View */}
          {activeView === "checkToday" && (
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Header with Back Button */}
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <h1 className="text-3xl font-bold text-slate-800">Check Today - Event Monitoring</h1>
                  <p className="text-slate-600">Monitor current and upcoming events that may impact disaster response</p>
                </div>
                <Button
                  onClick={handleBackToDashboard}
                  variant="outline"
                  className="ml-4 bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>

              <div className="grid gap-8 lg:grid-cols-3">
                {/* Input Form */}
                <Card className="lg:col-span-1 bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-700 flex items-center">
                      <Search className="h-5 w-5 mr-2 text-blue-600" />
                      Search Parameters
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                      Configure search criteria for event monitoring
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="e.g., New York, NY, USA"
                        value={checkTodayInputs.location}
                        onChange={(e) => setCheckTodayInputs(prev => ({ ...prev, location: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Event Category</Label>
                      <Select 
                        value={checkTodayInputs.category} 
                        onValueChange={(value) => setCheckTodayInputs(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disasters,severe-weather">Disasters & Weather</SelectItem>
                          <SelectItem value="disasters">Disasters Only</SelectItem>
                          <SelectItem value="severe-weather">Severe Weather</SelectItem>
                          <SelectItem value="public-holidays">Public Holidays</SelectItem>
                          <SelectItem value="observances">Observances</SelectItem>
                          <SelectItem value="sports">Sports Events</SelectItem>
                          <SelectItem value="concerts">Concerts</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="radius">Search Radius (km)</Label>
                      <Select 
                        value={checkTodayInputs.radius} 
                        onValueChange={(value) => setCheckTodayInputs(prev => ({ ...prev, radius: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select radius" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 km</SelectItem>
                          <SelectItem value="25">25 km</SelectItem>
                          <SelectItem value="50">50 km</SelectItem>
                          <SelectItem value="100">100 km</SelectItem>
                          <SelectItem value="200">200 km</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={checkTodayInputs.startDate}
                        onChange={(e) => setCheckTodayInputs(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={checkTodayInputs.endDate}
                        onChange={(e) => setCheckTodayInputs(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>

                    <Button 
                      onClick={handleCheckToday}
                      disabled={isPredictHQLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isPredictHQLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Search Events
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Results */}
                <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-700 flex items-center">
                      <Activity className="h-5 w-5 mr-2 text-green-600" />
                      Event Results ({predictHQEvents.length})
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                      Current and upcoming events that may impact operations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="max-h-[600px] overflow-y-auto">
                    {isPredictHQLoading ? (
                      <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      </div>
                    ) : predictHQEvents.length > 0 ? (
                      <div className="space-y-4">
                        {predictHQEvents.map((event) => (
                          <Card key={event.id} className="border border-slate-200/50">
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="text-sm font-semibold text-slate-800">{event.title}</CardTitle>
                                  <CardDescription className="text-xs text-slate-500">
                                    Category: {event.category} • Status: {event.state}
                                  </CardDescription>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  event.category === 'disasters' || event.category === 'severe-weather' 
                                    ? 'bg-red-100 text-red-700' 
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {event.category}
                                </span>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="space-y-2 text-xs text-slate-600">
                                <p><strong>Location:</strong> {event.location?.name || 'N/A'}</p>
                                <p><strong>Start:</strong> {new Date(event.start).toLocaleString()}</p>
                                <p><strong>End:</strong> {new Date(event.end).toLocaleString()}</p>
                                {event.labels && event.labels.length > 0 && (
                                  <div>
                                    <strong>Labels:</strong>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {event.labels.slice(0, 3).map((label, index) => (
                                        <span key={index} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">
                                          {label}
                                        </span>
                                      ))}
                                      {event.labels.length > 3 && (
                                        <span className="text-slate-400 text-xs">+{event.labels.length - 3} more</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {event.impact_patterns && event.impact_patterns.length > 0 && (
                                  <p><strong>Impact Rank:</strong> {event.impact_patterns[0]?.impact_rank || 'N/A'}</p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-500">No events found for the specified criteria.</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your search parameters.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}