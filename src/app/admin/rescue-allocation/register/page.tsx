"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Member = { name: string; role: string; skills?: string };

export default function RegisterTeamPage() {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState<Member[]>([
    { name: "", role: "", skills: "" },
  ]);
  const [loading, setLoading] = useState(false);

  const addMember = () =>
    setMembers((s) => [...s, { name: "", role: "", skills: "" }]);
  const removeMember = (idx: number) =>
    setMembers((s) => s.filter((_, i) => i !== idx));
  const updateMember = (
    idx: number,
    field: keyof Member,
    value: string
  ) =>
    setMembers((s) =>
      s.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      alert("Team name is required");
      return;
    }
    if (members.length === 0 || members.some((m) => !m.name.trim())) {
      alert("Add at least one member with a name");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "rescue_teams"), {
        teamName: teamName.trim(),
        members: members.map((m) => ({
          name: m.name.trim(),
          role: m.role.trim(),
          skills: (m.skills || "").trim(),
        })),
        createdAt: serverTimestamp(),
        createdBy:
          typeof window !== "undefined" ? localStorage.getItem("userEmail") : null,
      });
      router.push("/admin/rescue-allocation");
    } catch (err) {
      console.error("Failed to register team", err);
      alert("Failed to register team");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Register New Rescue Team</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
          <div>
            <label className="text-sm font-medium">Team Name</label>
            <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Team Members</label>
              <Button type="button" size="sm" onClick={addMember}>
                Add Person
              </Button>
            </div>

            <div className="space-y-3">
              {members.map((m, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                  <Input
                    placeholder="Name"
                    value={m.name}
                    onChange={(e) => updateMember(idx, "name", e.target.value)}
                  />
                  <Input
                    placeholder="Role"
                    value={m.role}
                    onChange={(e) => updateMember(idx, "role", e.target.value)}
                  />
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Skills (comma separated)"
                      value={m.skills}
                      onChange={(e) => updateMember(idx, "skills", e.target.value)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeMember(idx)}
                      className="whitespace-nowrap"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Register Team"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/rescue-allocation")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}