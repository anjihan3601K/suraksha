"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Hospital, Plus, Edit, Trash2 } from "lucide-react";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

type Member = { name: string; role?: string; skills?: string };
type RescueTeam = {
  id: string;
  teamName: string;
  members: Member[];
  createdAt?: any;
  createdBy?: string | null;
};

export default function RescueAllocationPage() {
  const { toast } = useToast();
  const [showAddAmbulance, setShowAddAmbulance] = useState(false);
  const [showAddTool, setShowAddTool] = useState(false);
  const [showEditTeam, setShowEditTeam] = useState(false);
  const [editingTeam, setEditingTeam] = useState<RescueTeam | null>(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamMembers, setEditTeamMembers] = useState<Member[]>([]);
  const [newAmbulance, setNewAmbulance] = useState({ driver: "", phone: "", eta: "" });
  const [newTool, setNewTool] = useState({ name: "", quantity: 0, location: "" });
  const [addingResource, setAddingResource] = useState(false);
  const [updatingTeam, setUpdatingTeam] = useState(false);

  const [mockResources, setMockResources] = useState({
    ambulances: [
      { id: "AMB-001", driver: "Ravi Kumar", phone: "+91-98765-43210", eta: "5 mins", status: "available" },
      { id: "AMB-002", driver: "Sana Patel", phone: "+91-91234-56789", eta: "12 mins", status: "available" },
      { id: "AMB-003", driver: "Omar Ali", phone: "+91-99887-76655", eta: "20 mins", status: "available" },
    ],
    workers: [
      { id: "WKR-100", name: "Asha Devi", role: "Field Responder", available: true },
      { id: "WKR-101", name: "Vikram Singh", role: "Paramedic", available: false },
      { id: "WKR-102", name: "Meera Joshi", role: "Volunteer", available: true },
    ],
    tools: [
      { id: "TOOL-01", name: "First Aid Kit", quantity: 12, location: "Storage A", reserved: 0 },
      { id: "TOOL-02", name: "Stretchers", quantity: 4, location: "Storage B", reserved: 0 },
      { id: "TOOL-03", name: "Portable Oxygen", quantity: 2, location: "Storage C", reserved: 0 },
    ],
  });

  const [registeredTeams, setRegisteredTeams] = useState<RescueTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState<boolean>(true);
  const [teamMemberStatuses, setTeamMemberStatuses] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const q = query(collection(db, "rescue_teams"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const teams: RescueTeam[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }));
        setRegisteredTeams(teams);
        setLoadingTeams(false);
      },
      (err) => {
        console.error("Failed to load rescue teams:", err);
        setRegisteredTeams([]);
        setLoadingTeams(false);
      }
    );
    return () => unsub();
  }, []);

  // Edit team functions
  const openEditTeam = (team: RescueTeam) => {
    setEditingTeam(team);
    setEditTeamName(team.teamName);
    setEditTeamMembers([...team.members]);
    setShowEditTeam(true);
  };

  const addEditTeamMember = () => {
    setEditTeamMembers(prev => [...prev, { name: "", role: "", skills: "" }]);
  };

  const removeEditTeamMember = (index: number) => {
    setEditTeamMembers(prev => prev.filter((_, i) => i !== index));
  };

  const updateEditTeamMember = (index: number, field: keyof Member, value: string) => {
    setEditTeamMembers(prev => 
      prev.map((member, i) => 
        i === index ? { ...member, [field]: value } : member
      )
    );
  };

  const updateTeam = async () => {
    if (!editingTeam || !editTeamName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Team name is required." });
      return;
    }

    if (editTeamMembers.length === 0 || editTeamMembers.some(m => !m.name.trim())) {
      toast({ variant: "destructive", title: "Error", description: "At least one member with a name is required." });
      return;
    }

    setUpdatingTeam(true);
    try {
      const teamRef = doc(db, "rescue_teams", editingTeam.id);
      await updateDoc(teamRef, {
        teamName: editTeamName.trim(),
        members: editTeamMembers.map(m => ({
          name: m.name.trim(),
          role: m.role?.trim() || "",
          skills: m.skills?.trim() || "",
        })),
        updatedAt: serverTimestamp(),
        updatedBy: localStorage.getItem("userEmail"),
      });

      setShowEditTeam(false);
      setEditingTeam(null);
      toast({ title: "Success", description: "Team updated successfully." });
    } catch (error) {
      console.error("Failed to update team:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to update team." });
    } finally {
      setUpdatingTeam(false);
    }
  };

  // Delete team function
  const deleteTeam = async (teamId: string, teamName: string) => {
    try {
      await deleteDoc(doc(db, "rescue_teams", teamId));
      toast({ title: "Success", description: `Team "${teamName}" deleted successfully.` });
    } catch (error) {
      console.error("Failed to delete team:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to delete team." });
    }
  };

  // Add new ambulance to database
  const addAmbulance = async () => {
    if (!newAmbulance.driver.trim() || !newAmbulance.phone.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Driver name and phone are required." });
      return;
    }

    setAddingResource(true);
    try {
      await addDoc(collection(db, "ambulances"), {
        ...newAmbulance,
        driver: newAmbulance.driver.trim(),
        phone: newAmbulance.phone.trim(),
        eta: newAmbulance.eta.trim() || "Unknown",
        status: "available",
        createdAt: serverTimestamp(),
        createdBy: localStorage.getItem("userEmail"),
      });

      // Update local state
      const newId = `AMB-${String(mockResources.ambulances.length + 1).padStart(3, '0')}`;
      setMockResources(prev => ({
        ...prev,
        ambulances: [...prev.ambulances, { 
          id: newId, 
          ...newAmbulance, 
          status: "available" 
        }]
      }));

      setNewAmbulance({ driver: "", phone: "", eta: "" });
      setShowAddAmbulance(false);
      toast({ title: "Success", description: "Ambulance added successfully." });
    } catch (error) {
      console.error("Failed to add ambulance:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to add ambulance." });
    } finally {
      setAddingResource(false);
    }
  };

  // Add new tool to database
  const addTool = async () => {
    if (!newTool.name.trim() || newTool.quantity <= 0) {
      toast({ variant: "destructive", title: "Error", description: "Tool name and valid quantity are required." });
      return;
    }

    setAddingResource(true);
    try {
      await addDoc(collection(db, "safety_tools"), {
        ...newTool,
        name: newTool.name.trim(),
        location: newTool.location.trim() || "Storage",
        reserved: 0,
        createdAt: serverTimestamp(),
        createdBy: localStorage.getItem("userEmail"),
      });

      // Update local state
      const newId = `TOOL-${String(mockResources.tools.length + 1).padStart(2, '0')}`;
      setMockResources(prev => ({
        ...prev,
        tools: [...prev.tools, { 
          id: newId, 
          ...newTool, 
          reserved: 0 
        }]
      }));

      setNewTool({ name: "", quantity: 0, location: "" });
      setShowAddTool(false);
      toast({ title: "Success", description: "Safety tool added successfully." });
    } catch (error) {
      console.error("Failed to add tool:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to add safety tool." });
    } finally {
      setAddingResource(false);
    }
  };

  // Toggle ambulance status
  const toggleAmbulanceStatus = (ambulanceId: string) => {
    setMockResources(prev => ({
      ...prev,
      ambulances: prev.ambulances.map(amb => 
        amb.id === ambulanceId 
          ? { ...amb, status: amb.status === "available" ? "allocated" : "available" }
          : amb
      )
    }));
    toast({
      title: "Status Updated",
      description: `Ambulance ${ambulanceId} status changed.`,
    });
  };
  
  // Toggle worker availability
  const toggleWorkerAvailability = (workerId: string) => {
    setMockResources(prev => ({
      ...prev,
      workers: prev.workers.map(worker => 
        worker.id === workerId 
          ? { ...worker, available: !worker.available }
          : worker
      )
    }));
    toast({
      title: "Status Updated",
      description: `Worker ${workerId} availability changed.`,
    });
  };
  
  // Reserve/unreserve tools
  const toggleToolReservation = (toolId: string) => {
    setMockResources(prev => ({
      ...prev,
      tools: prev.tools.map(tool => 
        tool.id === toolId 
          ? { 
              ...tool, 
              reserved: tool.reserved > 0 ? 0 : Math.min(1, tool.quantity)
            }
          : tool
      )
    }));
    toast({
      title: "Status Updated",
      description: `Tool ${toolId} reservation status changed.`,
    });
  };
  
  // Toggle team member allocation status
  const toggleTeamMemberStatus = async (teamId: string, memberIndex: number) => {
    const memberKey = `${teamId}-${memberIndex}`;
    const currentStatus = teamMemberStatuses[memberKey] || "available";
    const newStatus = currentStatus === "available" ? "allocated" : "available";
    
    setTeamMemberStatuses(prev => ({
      ...prev,
      [memberKey]: newStatus
    }));

    // Optionally update in Firestore
    try {
      const teamRef = doc(db, "rescue_teams", teamId);
      const team = registeredTeams.find(t => t.id === teamId);
      if (team) {
        const updatedMembers = team.members.map((member, idx) => 
          idx === memberIndex 
            ? { ...member, status: newStatus }
            : member
        );
        await updateDoc(teamRef, { members: updatedMembers });
      }
    } catch (error) {
      console.error("Failed to update member status in Firestore:", error);
    }

    toast({
      title: "Status Updated",
      description: `Team member status changed to ${newStatus}.`,
    });
  };

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Rescue Team Allocation</h1>
            <p className="text-sm text-muted-foreground">
              Manage and view available resources (mock data) and registered rescue teams.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/admin/dashboard" passHref>
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
            <Link href="/admin/rescue-allocation/register" passHref>
              <Button>Register New Team</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Ambulances</CardTitle>
                  <CardDescription className="text-xs">Units currently available</CardDescription>
                </div>
                <Dialog open={showAddAmbulance} onOpenChange={setShowAddAmbulance}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Ambulance</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Driver Name"
                        value={newAmbulance.driver}
                        onChange={(e) => setNewAmbulance(prev => ({ ...prev, driver: e.target.value }))
                        }
                      />
                      <Input
                        placeholder="Phone Number"
                        value={newAmbulance.phone}
                        onChange={(e) => setNewAmbulance(prev => ({ ...prev, phone: e.target.value }))
                        }
                      />
                      <Input
                        placeholder="ETA (e.g., 5 mins)"
                        value={newAmbulance.eta}
                        onChange={(e) => setNewAmbulance(prev => ({ ...prev, eta: e.target.value }))
                        }
                      />
                      <div className="flex space-x-2">
                        <Button onClick={addAmbulance} disabled={addingResource}>
                          {addingResource ? "Adding..." : "Add Ambulance"}
                        </Button>
                        <Button variant="outline" onClick={() => setShowAddAmbulance(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {mockResources.ambulances.map((a) => (
                  <li key={a.id} className="flex items-center justify-between p-3 bg-white rounded shadow-sm">
                    <div>
                      <div className="font-medium">{a.id} — {a.driver}</div>
                      <div className="text-xs text-muted-foreground">{a.phone} • ETA: {a.eta}</div>
                      <div className={`text-xs font-medium ${a.status === 'available' ? 'text-green-600' : 'text-red-600'}`}>
                        Status: {a.status === 'available' ? 'Available' : 'Allocated'}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <a className="text-blue-600 text-sm" href={`tel:${a.phone}`}>Call</a>
                      <Button 
                        size="sm" 
                        variant={a.status === 'available' ? 'default' : 'outline'}
                        onClick={() => toggleAmbulanceStatus(a.id)}
                      >
                        {a.status === 'available' ? 'Allocate' : 'Deallocate'}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Workers</CardTitle>
              <CardDescription className="text-xs">Field responders & paramedics</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {mockResources.workers.map((w) => (
                  <li key={w.id} className="flex items-center justify-between p-3 bg-white rounded shadow-sm">
                    <div>
                      <div className="font-medium">{w.name} — {w.role}</div>
                      <div className="text-xs text-muted-foreground">{w.id} • {w.available ? "Available" : "Busy"}</div>
                    </div>
                    <div>
                      <Button 
                        size="sm" 
                        variant={w.available ? 'default' : 'outline'}
                        onClick={() => toggleWorkerAvailability(w.id)}
                      >
                        {w.available ? "Assign" : "Free"}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Safety Tools</CardTitle>
                  <CardDescription className="text-xs">Kits, stretchers, oxygen</CardDescription>
                </div>
                <Dialog open={showAddTool} onOpenChange={setShowAddTool}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Safety Tool</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Tool Name"
                        value={newTool.name}
                        onChange={(e) => setNewTool(prev => ({ ...prev, name: e.target.value }))
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Quantity"
                        value={newTool.quantity}
                        onChange={(e) => setNewTool(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))
                        }
                      />
                      <Input
                        placeholder="Storage Location"
                        value={newTool.location}
                        onChange={(e) => setNewTool(prev => ({ ...prev, location: e.target.value }))
                        }
                      />
                      <div className="flex space-x-2">
                        <Button onClick={addTool} disabled={addingResource}>
                          {addingResource ? "Adding..." : "Add Tool"}
                        </Button>
                        <Button variant="outline" onClick={() => setShowAddTool(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {mockResources.tools.map((t) => (
                  <li key={t.id} className="flex items-center justify-between p-3 bg-white rounded shadow-sm">
                    <div>
                      <div className="font-medium">{t.name} ({t.quantity - t.reserved} available)</div>
                      <div className="text-xs text-muted-foreground">{t.id} • {t.location}</div>
                      {t.reserved > 0 && (
                        <div className="text-xs text-red-600">Reserved: {t.reserved}</div>
                      )}
                    </div>
                    <div>
                      <Button 
                        size="sm"
                        variant={t.reserved > 0 ? 'outline' : 'default'}
                        onClick={() => toggleToolReservation(t.id)}
                        disabled={t.quantity === 0}
                      >
                        {t.reserved > 0 ? 'Unreserve' : 'Reserve'}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3 flex items-center space-x-2">
            <Hospital className="h-5 w-5" />
            <span>Registered Rescue Teams</span>
          </h2>

          {loadingTeams ? (
            <div className="p-4 bg-white rounded shadow text-sm">Loading teams…</div>
          ) : registeredTeams.length === 0 ? (
            <div className="p-4 bg-white rounded shadow text-sm">No teams registered yet.</div>
          ) : (
            <div className="grid gap-4">
              {registeredTeams.map((team) => (
                <Card key={team.id}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">{team.teamName}</CardTitle>
                      <CardDescription className="text-xs">
                        {team.createdBy ?? "Unknown creator"}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-xs text-muted-foreground">
                        {team.createdAt ? new Date(team.createdAt.seconds * 1000).toLocaleString() : ""}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditTeam(team)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the rescue team "{team.teamName}" and all its data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteTeam(team.id, team.teamName)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete Team
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {team.members.map((m, i) => {
                        const memberKey = `${team.id}-${i}`;
                        const memberStatus = teamMemberStatuses[memberKey] || "available";
                        return (
                          <li key={i} className="flex items-center justify-between p-2 bg-white rounded">
                            <div>
                              <div className="font-medium">{m.name}{m.role ? ` — ${m.role}` : ""}</div>
                              {m.skills && <div className="text-xs text-muted-foreground">Skills: {m.skills}</div>}
                              <div className={`text-xs font-medium ${memberStatus === 'available' ? 'text-green-600' : 'text-red-600'}`}>
                                Status: {memberStatus === 'available' ? 'Available' : 'Allocated'}
                              </div>
                            </div>
                            <div>
                              <Button 
                                size="sm" 
                                variant={memberStatus === 'available' ? 'default' : 'outline'}
                                onClick={() => toggleTeamMemberStatus(team.id, i)}
                              >
                                {memberStatus === 'available' ? 'Allocate' : 'Deallocate'}
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Edit Team Dialog */}
        <Dialog open={showEditTeam} onOpenChange={setShowEditTeam}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Rescue Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Team Name</label>
                <Input
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  placeholder="Team Name"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Team Members</label>
                  <Button type="button" size="sm" onClick={addEditTeamMember}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Member
                  </Button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {editTeamMembers.map((member, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center p-2 border rounded">
                      <Input
                        placeholder="Name"
                        value={member.name}
                        onChange={(e) => updateEditTeamMember(idx, "name", e.target.value)}
                      />
                      <Input
                        placeholder="Role"
                        value={member.role || ""}
                        onChange={(e) => updateEditTeamMember(idx, "role", e.target.value)}
                      />
                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder="Skills"
                          value={member.skills || ""}
                          onChange={(e) => updateEditTeamMember(idx, "skills", e.target.value)}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removeEditTeamMember(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={updateTeam} disabled={updatingTeam}>
                  {updatingTeam ? "Updating..." : "Update Team"}
                </Button>
                <Button variant="outline" onClick={() => setShowEditTeam(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}