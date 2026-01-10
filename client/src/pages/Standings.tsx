import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, GripVertical, Trophy, Shield, Star } from "lucide-react";
import { TEAMS } from "@/lib/teams";
import { Badge } from "@/components/ui/badge";

interface StandingsEntry {
  id: string;
  rank: number;
  team: string;
  wins: number;
  losses: number;
  pointDifferential?: number;
  division: "AFC_D1" | "AFC_D2" | "NFC_D1" | "NFC_D2";
  manualOrder?: number;
}

interface DropZone {
  divisionId: string;
  position: 'above' | 'below';
  targetId: string;
}

const AVAILABLE_TEAMS = Object.keys(TEAMS);

const CONFERENCES = [
  { name: "AFC", color: "text-blue-500", bg: "bg-blue-500/5", divisions: [{ id: "AFC_D1", label: "Division 1" }, { id: "AFC_D2", label: "Division 2" }] },
  { name: "NFC", color: "text-red-500", bg: "bg-red-500/5", divisions: [{ id: "NFC_D1", label: "Division 1" }, { id: "NFC_D2", label: "Division 2" }] },
];

export default function Standings() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const isAdmin = isAuthenticated && (user as any)?.role === "admin";
  const [standings, setStandings] = useState<StandingsEntry[]>([]);
  const [newTeam, setNewTeam] = useState("");
  const [newDivision, setNewDivision] = useState<"AFC_D1" | "AFC_D2" | "NFC_D1" | "NFC_D2" | "">("");
  const [editingPD, setEditingPD] = useState<Record<string, string | number>>({});
  const [draggedTeam, setDraggedTeam] = useState<string | null>(null);
  const [dropZone, setDropZone] = useState<DropZone | null>(null);

  const { data: dbStandings, isLoading } = useQuery({
    queryKey: ["/api/standings"],
    queryFn: async () => {
      const res = await fetch(`/api/standings?season=2`);
      if (!res.ok) throw new Error("Failed to fetch standings");
      return res.json();
    }
  });

  useEffect(() => {
    if (dbStandings) {
      setStandings(
        dbStandings.map((s: any) => ({
          id: s.id,
          rank: 0,
          team: s.team,
          wins: s.wins,
          losses: s.losses,
          pointDifferential: s.pointDifferential,
          division: s.division,
          manualOrder: s.manualOrder,
        }))
      );
    }
  }, [dbStandings]);

  const upsertMutation = useMutation({
    mutationFn: async (entry: StandingsEntry) => {
      await apiRequest("POST", "/api/standings", {
        team: entry.team,
        division: entry.division,
        wins: entry.wins,
        losses: entry.losses,
        pointDifferential: entry.pointDifferential,
        manualOrder: entry.manualOrder,
        season: 2,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/standings"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/standings/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/standings"] });
    },
  });

  const addTeam = () => {
    if (!isAdmin || !newTeam.trim() || !newDivision) return;
    const divisionTeams = standings.filter(s => s.division === newDivision);
    const maxOrder = divisionTeams.length > 0 
      ? Math.max(...divisionTeams.map(s => s.manualOrder ?? -1)) 
      : -1;
    const newEntry: StandingsEntry = {
      id: Date.now().toString(),
      rank: standings.length + 1,
      team: newTeam,
      wins: 0,
      losses: 0,
      pointDifferential: 0,
      division: newDivision as any,
      manualOrder: maxOrder + 1,
    };
    setStandings([...standings, newEntry]);
    upsertMutation.mutate(newEntry);
    setNewTeam("");
  };

  const updateEntry = (id: string, field: string, value: any) => {
    if (!isAdmin) return;
    const updated = standings.map((entry) =>
      entry.id === id ? { ...entry, [field]: value } : entry
    );
    setStandings(updated);
    const entry = updated.find(e => e.id === id);
    if (entry) {
      upsertMutation.mutate(entry);
    }
  };

  const deleteEntry = (id: string) => {
    if (!isAdmin) return;
    setStandings(standings.filter((entry) => entry.id !== id));
    deleteMutation.mutate(id);
  };

  const getDivisionStandings = (division: string) => {
    return [...standings]
      .filter((entry) => entry.division === division)
      .sort((a, b) => {
        const aOrder = a.manualOrder ?? 999;
        const bOrder = b.manualOrder ?? 999;
        return aOrder - bOrder;
      });
  };

  const handleDragStart = (e: React.DragEvent, teamId: string) => {
    setDraggedTeam(teamId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetTeamId: string) => {
    e.preventDefault();
    if (!draggedTeam || draggedTeam === targetTeamId) return;
    
    const targetEntry = standings.find(s => s.id === targetTeamId);
    if (!targetEntry) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    setDropZone({
      divisionId: targetEntry.division,
      position: e.clientY < midpoint ? 'above' : 'below',
      targetId: targetTeamId,
    });
  };

  const handleDrop = (e: React.DragEvent, targetTeamId: string) => {
    e.preventDefault();
    if (draggedTeam === targetTeamId || !draggedTeam) return;

    const draggedEntry = standings.find(e => e.id === draggedTeam);
    const targetEntry = standings.find(e => e.id === targetTeamId);
    
    if (!draggedEntry || !targetEntry || draggedEntry.division !== targetEntry.division) {
      setDropZone(null);
      return;
    }

    const divisionItems = getDivisionStandings(draggedEntry.division);
    const filteredItems = divisionItems.filter(item => item.id !== draggedTeam);
    const targetIndex = filteredItems.findIndex(item => item.id === targetTeamId);
    let insertIndex = dropZone?.position === 'below' ? targetIndex + 1 : targetIndex;
    
    filteredItems.splice(insertIndex, 0, draggedEntry);
    
    const reorderedItems = filteredItems.map((item, idx) => ({
      ...item,
      manualOrder: idx,
    }));
    
    setStandings(standings.map(entry => reorderedItems.find(r => r.id === entry.id) || entry));
    reorderedItems.forEach(item => upsertMutation.mutate(item));
    setDropZone(null);
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-10 max-w-7xl mx-auto space-y-8 sm:space-y-12">
      <div className="space-y-4">
        <Badge className="bg-primary/10 text-primary border-none font-black uppercase tracking-[0.2em] text-[10px] px-4 py-1.5 rounded-full w-fit">
          League Rankings
        </Badge>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black italic uppercase tracking-tighter leading-[0.9]">
          Standings <span className="text-muted-foreground/20">S2</span>
        </h1>
      </div>

      {isAdmin && (
        <Card className="p-8 bg-card/40 backdrop-blur-xl border-border/40 rounded-[32px] space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Shield className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-accent rounded-full" />
            <h2 className="text-xl font-black italic uppercase tracking-tight">Add Team to Rank</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Team Selection</Label>
              <Select value={newTeam} onValueChange={setNewTeam}>
                <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-2xl">
                  <SelectValue placeholder="Select Team" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/40">
                  {AVAILABLE_TEAMS.map((team) => (
                    <SelectItem key={team} value={team} className="rounded-xl">
                      <div className="flex items-center gap-3">
                        <img src={TEAMS[team as keyof typeof TEAMS]} className="w-5 h-5 object-contain" />
                        <span className="font-bold">{team}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Conference Division</Label>
              <Select value={newDivision} onValueChange={(v) => setNewDivision(v as any)}>
                <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-2xl">
                  <SelectValue placeholder="Select Division" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/40">
                  {CONFERENCES.map((conf) => (
                    <div key={conf.name}>
                      <div className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-3 ${conf.color}`}>{conf.name}</div>
                      {conf.divisions.map((div) => (
                        <SelectItem key={div.id} value={div.id} className="rounded-xl">{div.label}</SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={addTeam} className="w-full h-12 bg-primary hover:scale-105 transition-transform rounded-2xl font-black uppercase tracking-widest text-xs">
                Add to Rankings
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-16">
        {CONFERENCES.map((conference) => (
          <div key={conference.name} className="space-y-8">
            <div className="flex items-center gap-6">
              <h2 className={`text-4xl font-black italic uppercase tracking-tighter ${conference.color}`}>{conference.name} <span className="text-foreground/20">Conference</span></h2>
              <div className="flex-1 h-px bg-gradient-to-r from-border/50 to-transparent" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {(() => {
                let cumulativeIndex = 0;
                return conference.divisions.map((division) => {
                  const divisionStandings = getDivisionStandings(division.id);
                  const startIndex = cumulativeIndex;
                  cumulativeIndex += divisionStandings.length;
                  return (
                    <div key={division.id} className="space-y-4">
                      <div className="flex items-center gap-3 px-4">
                        <Star className={`w-4 h-4 ${conference.color} fill-current`} />
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground">{division.label}</h3>
                      </div>

                      <Card className="bg-card/30 backdrop-blur-xl border-border/40 rounded-[32px] overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b border-border/40 text-[12px] font-black uppercase tracking-[0.2em] text-white bg-white/5">
                                <th className="px-6 py-4 w-16 text-center">#</th>
                                <th className="px-6 py-4">Team</th>
                                <th className="px-6 py-4 text-center">W-L</th>
                                <th className="px-6 py-4 text-center">PD</th>
                                {isAdmin && <th className="px-6 py-4 text-center">Ops</th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                              {divisionStandings.map((entry, idx) => (
                                <tr 
                                  key={entry.id}
                                  draggable={isAdmin}
                                  onDragStart={(e) => handleDragStart(e, entry.id)}
                                  onDragOver={(e) => handleDragOver(e, entry.id)}
                                  onDrop={(e) => handleDrop(e, entry.id)}
                                  className={`group hover:bg-white/5 transition-colors relative ${dropZone?.targetId === entry.id ? 'bg-primary/5' : ''}`}
                                >
                                  <td className="px-6 py-5 text-center font-black italic text-xl text-white/40">
                                    {isAdmin ? (
                                      <div className="flex flex-col items-center gap-1">
                                        <span className="text-sm not-italic text-white">{startIndex + idx + 1}</span>
                                        <GripVertical className="w-4 h-4 mx-auto opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-white" />
                                      </div>
                                    ) : <span className="text-white">{startIndex + idx + 1}</span>}
                                  </td>
                                  <td className="px-6 py-5">
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                                        <img src={TEAMS[entry.team as keyof typeof TEAMS]} className="w-full h-full object-contain drop-shadow-lg" />
                                      </div>
                                      <span className="font-black italic uppercase tracking-tight text-base text-white">{entry.team}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-5 text-center">
                                    {isAdmin ? (
                                      <div className="flex items-center justify-center gap-2">
                                        <Input type="number" value={entry.wins} onChange={(e) => updateEntry(entry.id, "wins", parseInt(e.target.value) || 0)} className="w-12 h-8 text-center bg-white/5 border-none font-bold p-0 text-white" />
                                        <span className="text-white opacity-30">/</span>
                                        <Input type="number" value={entry.losses} onChange={(e) => updateEntry(entry.id, "losses", parseInt(e.target.value) || 0)} className="w-12 h-8 text-center bg-white/5 border-none font-bold p-0 text-white" />
                                      </div>
                                    ) : (
                                      <span className="font-black tabular-nums text-lg text-white">{entry.wins}-{entry.losses}</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-5 text-center">
                                    {isAdmin ? (
                                      <Input 
                                        type="text" 
                                        value={editingPD[entry.id] ?? entry.pointDifferential ?? 0}
                                        onChange={(e) => setEditingPD({ ...editingPD, [entry.id]: e.target.value })}
                                        onBlur={(e) => {
                                          const val = parseInt(e.target.value) || 0;
                                          updateEntry(entry.id, "pointDifferential", val);
                                          const newEditingPD = { ...editingPD };
                                          delete newEditingPD[entry.id];
                                          setEditingPD(newEditingPD);
                                        }}
                                        className="w-14 h-8 mx-auto text-center bg-white/5 border-none font-bold p-0 text-white"
                                      />
                                    ) : (
                                      <span className={`font-bold tabular-nums text-sm ${entry.pointDifferential! >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {entry.pointDifferential! > 0 ? '+' : ''}{entry.pointDifferential}
                                      </span>
                                    )}
                                  </td>
                                  {isAdmin && (
                                    <td className="px-6 py-5 text-center">
                                      <Button variant="ghost" size="icon" onClick={() => deleteEntry(entry.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
