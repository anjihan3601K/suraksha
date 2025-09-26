"use client";

import { EmergencyControls } from "@/components/dashboard/EmergencyControls";
import { AlertsFeed } from "@/components/dashboard/AlertsFeed";
import { SafetyIndex } from "@/components/dashboard/SafetyIndex";
import { VoiceSOS } from "@/components/dashboard/VoiceSOS";

import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Loader2, 
  User, 
  Shield, 
  Bell, 
  Phone, 
  Camera,
  Activity,
  Home,
  Menu,
  X,
  ShieldCheck,
  LogOut,
  Users,
  Route,
  Mic,
  MicOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { t } from '@/lib/language';

export default function DashboardPage() {
  // voice activation state for showing stop button beside activate
  const [voiceActive, setVoiceActive] = useState(false);
  // new: expose userId (Firestore doc id = email) for VoiceSOS component
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    if (email) setUserId(email);
  }, []);

  // Alert banner state
  const [latestAlert, setLatestAlert] = useState<any>(null);
  const [alertLoading, setAlertLoading] = useState(true);
  useEffect(() => {
    const alertsQuery = query(collection(db, "alerts"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(alertsQuery, (snapshot) => {
      if (!snapshot.empty) {
        setLatestAlert(snapshot.docs[0].data());
      } else {
        setLatestAlert(null);
      }
      setAlertLoading(false);
    });
    return () => unsub();
  }, []);

  const [isClient, setIsClient] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    setIsClient(true);
    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    if (email) {
      const fetchUser = async () => {
        try {
          const userDocRef = doc(db, 'users', email);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUser(userDoc.data());
          } else {
            // If user doc not found, check admins collection
            const adminDocRef = doc(db, 'admins', email);
            const adminDoc = await getDoc(adminDocRef);
            if (adminDoc.exists()) {
              setUser({ name: 'Admin', ...adminDoc.data() });
            } else {
              setUser(null);
            }
          }
        } catch (e) {
          setUser(null);
        } finally {
          setLoadingUser(false);
        }
      };
      fetchUser();
    } else {
      setLoadingUser(false);
    }
  }, []);


  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // request stop event visual state (brief)
  const [stopRequested, setStopRequested] = useState(false);

  const handleVoiceStop = () => {
    // notify any VoiceSOS component (or other listeners) to stop listening
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("voice-sos-stop"));
    }
    setStopRequested(true);
    setVoiceActive(false); // immediately hide stop button when user clicks
    setTimeout(() => setStopRequested(false), 800);
  };
  
  const handleVoiceStart = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("voice-sos-start"));
    }
    setStopRequested(false);
    setVoiceActive(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md border-b border-gray-200 relative z-30">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link href="/" className="flex items-center space-x-3">
              <div className="bg-blue-800 p-2 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-900">{t('suraksha_portal')}</h1>
                <p className="text-xs text-gray-500">{t('emergency_response_portal')}</p>
              </div>
            </Link>
          </div>
          <div className="text-xs text-gray-500">
            {t('government_of_india')}
          </div>
        </div>
      </nav>
      
      <div className="w-full">
        {alertLoading ? null : latestAlert ? (
          <div className="bg-red-600 text-white py-2 font-bold text-lg overflow-hidden relative">
            <div
              className="whitespace-nowrap animate-scroll px-2"
              style={{ display: "inline-block", minWidth: "100%" }}
            >
              🚨 {latestAlert.title}: {latestAlert.content}
            </div>
          </div>
        ) : (
          <div className="bg-green-600 text-white py-2 font-bold text-lg text-center">
            ✅ All Safe. No active alerts.
          </div>
        )}
      </div>

      <div className="flex flex-1 relative">
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={toggleSidebar}
          />
        )}

        <aside className={`
          fixed top-0 left-0 h-full w-80 bg-white shadow-xl border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-800 p-2 rounded-lg">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-blue-900">{t('suraksha_menu')}</h2>
                  <p className="text-xs text-gray-600">{t('dashboard_navigation')}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={toggleSidebar}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-800 p-2 rounded-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  {loadingUser ? (
                    <span className="text-xs text-gray-500">Loading...</span>
                  ) : user ? (
                    <>
                      <h3 className="font-medium text-gray-900">{user.name || user.email}</h3>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <Badge className="mt-1 bg-green-100 text-green-800 text-xs">Verified</Badge>
                    </>
                  ) : (
                    <>
                      <h3 className="font-medium text-gray-900">Unknown User</h3>
                      <p className="text-xs text-gray-500">Not logged in</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-3 text-sm">{t('main_navigation')}</h4>
                <nav className="space-y-1">
                  <Link href="/dashboard" passHref>
                    <Button variant='default' className="w-full justify-start" onClick={toggleSidebar}>
                      <Home className="h-4 w-4 mr-3" />{t('dashboard')}
                    </Button>
                  </Link>
                   <Link href="/dashboard/alerts" passHref>
                    <Button variant='ghost' className="w-full justify-start" onClick={toggleSidebar}>
                      <Bell className="h-4 w-4 mr-3" />{t('alerts_and_notifications')}
                    </Button>
                  </Link>
                   <Link href="/dashboard/photo-reporter" passHref>
                    <Button variant='ghost' className="w-full justify-start" onClick={toggleSidebar}>
                      <Camera className="h-4 w-4 mr-3" />{t('report_incident')}
                    </Button>
                  </Link>
                  <Link href="/dashboard/safety-index" passHref>
                    <Button variant='ghost' className="w-full justify-start" onClick={toggleSidebar}>
                        <Shield className="h-4 w-4 mr-3" />{t('safety_center')}
                    </Button>
                   </Link>
                </nav>
              </div>

              <div className="p-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3 text-sm">{t('tools_and_features')}</h4>
                <nav className="space-y-1">
                  <Link href="/dashboard/safe-path" passHref>
                    <Button variant='ghost' className="w-full justify-start" onClick={toggleSidebar}>
                      <Route className="h-4 w-4 mr-3" />{t('safe_path_guide')}
                    </Button>
                  </Link>
                  <Link href="/dashboard/community-help" passHref>
                    <Button variant='ghost' className="w-full justify-start" onClick={toggleSidebar}>
                      <Users className="h-4 w-4 mr-3" />{t('community_help')}
                    </Button>
                  </Link>
                  <Link href="/profile" passHref>
                     <Button variant='ghost' className="w-full justify-start" onClick={toggleSidebar}>
                      <User className="h-4 w-4 mr-3" />{t('profile_settings')}
                    </Button>
                  </Link>
                </nav>
              </div>

              <div className="p-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3 text-sm">{t('emergency_contacts')}</h4>
                 <Link href="/contacts" passHref>
                    <Button variant='outline' className="w-full justify-start text-blue-600 border-blue-200 hover:bg-blue-50">
                        <Phone className="h-4 w-4 mr-3" /> See All Contacts
                    </Button>
                 </Link>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-gray-50">
              <Link href="/login">
                <Button variant="outline" className="w-full justify-start text-gray-600 hover:bg-gray-100">
                  <LogOut className="h-4 w-4 mr-3" />{t('logout')}
                </Button>
              </Link>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-6">
          {isClient ? (
            <div className="space-y-8">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('emergency_dashboard')}</h1>
                <p className="text-gray-600">{t('dashboard_desc')}</p>
              </div>
              {/* Emergency controls + Voice SOS side-by-side on large screens */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl shadow p-6">
                  <EmergencyControls t={t} />
                </div>
                {userId && (
                  <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-sm font-medium text-gray-700">Voice SOS</div>
                      <div className="flex items-center space-x-2">
                        {!voiceActive ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleVoiceStart}
                            className="text-green-600"
                            aria-label="Activate listening"
                          >
                            <Mic className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleVoiceStop}
                            className="text-red-600"
                            aria-label="Stop listening"
                          >
                            <MicOff className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <VoiceSOS userId={userId} />
                    {stopRequested && (
                      <div className="mt-3 text-xs text-gray-500">Stop requested</div>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                 <AlertsFeed t={t} />
                <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
                  <div className="flex items-center mb-4">
                    <div className="bg-green-100 p-2 rounded-lg mr-3">
                      <Activity className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{t('ai_safety_index')}</h3>
                  </div>
                  <SafetyIndex />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          )}
        </main>
      </div>

      {/* 
      <div className="fixed right-6 top-24 z-50 pointer-events-auto">
        {sosState === 'listening' && (
          <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow flex items-center space-x-3 animate-pulse">
            <Loader2 className="h-5 w-5 animate-spin text-red-600" />
            <div className="text-sm font-medium text-red-700">Listening… Say "HELP"</div>
            <Button size="sm" variant="ghost" onClick={stopListening}>Stop</Button>
          </div>
        )}
        {sosState === 'triggered' && (
          <div className="bg-red-600/95 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3">
            <span className="inline-block w-3 h-3 bg-white rounded-full animate-pulse" />
            <div className="text-sm font-semibold">SOS triggered successfully</div>
          </div>
        )}
        {sosState === 'completed' && (
          <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="font-semibold">Completed</div>
            <div className="text-sm">Voice processed</div>
          </div>
        )}
      </div>
      */}
    </div>
  );
}
