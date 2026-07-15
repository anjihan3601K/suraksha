"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppHeader } from "@/components/shared/AppHeader";
import { UserStatusTable } from "@/components/admin/UserStatusTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

export default function AdminUsersPage() {
  const [stats, setStats] = useState({ total: 0, safe: 0, emergency: 0, unknown: 0 });

  useEffect(() => {
    const usersQuery = collection(db, "users");
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      let safeCount = 0;
      let emergencyCount = 0;
      let unknownCount = 0;

      snapshot.docs.forEach((doc) => {
        const status = (doc.data() as any).status?.toLowerCase() || "unknown";
        if (status === "safe") safeCount += 1;
        else if (status === "emergency") emergencyCount += 1;
        else unknownCount += 1;
      });

      setStats({
        total: snapshot.size,
        safe: safeCount,
        emergency: emergencyCount,
        unknown: unknownCount,
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm text-slate-500">Admin / Users</p>
            <h1 className="text-3xl font-bold text-slate-900">User Analytics</h1>
            <p className="mt-2 text-slate-600 max-w-2xl">
              Monitor registered users, emergency alerts, and overall community status from a single admin view.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/dashboard" passHref>
              <Button variant="outline" className="h-11">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm font-medium text-slate-700">Total Users</CardTitle>
                <Users className="h-5 w-5 text-slate-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-slate-900">{stats.total}</div>
              <p className="mt-2 text-sm text-slate-500">Registered users in Firestore</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm font-medium text-slate-700">Emergency</CardTitle>
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-amber-700">{stats.emergency}</div>
              <p className="mt-2 text-sm text-slate-500">Users currently in SOS status</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm font-medium text-slate-700">Safe</CardTitle>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-emerald-700">{stats.safe}</div>
              <p className="mt-2 text-sm text-slate-500">Users marked safe after assistance</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm font-medium text-slate-700">Unknown</CardTitle>
                <Clock className="h-5 w-5 text-slate-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-slate-900">{stats.unknown}</div>
              <p className="mt-2 text-sm text-slate-500">Users without a reported status</p>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">User Status Table</h2>
              <p className="text-sm text-slate-500">View and manage individual user records with real-time updates.</p>
            </div>
          </div>
          <UserStatusTable />
        </section>
      </main>
    </div>
  );
}
