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
import { Trash2, GripVertical } from "lucide-react";
import { TEAMS } from "@/lib/teams";

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

const DIVISIONS = ["AFC_D1", "AFC_D2", "NFC_D1", "NFC_D2"] as const;
const CONFERENCES = [
  { name: "AFC", divisions: [{ id: "AFC_D1", label: "Division 1" }, { id: "AFC_D2", label: "Division 2" }] },
  { name: "NFC", divisions: [{ id: "NFC_D1", label: "Division 1" }, { id: "NFC_D2", label: "Division 2" }] },
];

export default function Standings() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const isAdmin = isAuthenticated && (user as any)?.role === "admin";
  const [standings, setStandings] = useState<StandingsEntry[]>([]);
  const [selectedSeason, setSelectedSeason] = useState("1");
  const [newTeam, setNewTeam] = useState("");
  const [newDivision, setNewDivision] = useState<"AFC_D1" | "AFC_D2" | "NFC_D1" | "NFC_D2">("AFC_D1");
  const [editingPD, setEditingPD] = useState<Record<string, string>>({});
  const [draggedTeam, setDraggedTeam] = useState<string | null>(null);
  const [dropZone, setDropZone] = useState<DropZone | null>(null);

  const { data: dbStandings, isLoading } = useQuery({
    queryKey: ["/api/standings", { season: selectedSeason }],
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
        season: parseInt(selectedSeason),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/standings", { season: selectedSeason }] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Failed to save standing";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/standings/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/standings"] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Failed to delete standing";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    },
  });

  const addTeam = () => {
    if (!isAdmin || !newTeam.trim()) return;
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
      division: newDivision,
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
    e.dataTransfer.dropEffect = "move";
    
    if (!draggedTeam || draggedTeam === targetTeamId) return;
    
    const draggedEntry = standings.find(s => s.id === draggedTeam);
    const targetEntry = standings.find(s => s.id === targetTeamId);
    
    if (!draggedEntry || !targetEntry || draggedEntry.division !== targetEntry.division) return;
    
    // Determine drop position based on mouse Y position
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = e.clientY < midpoint ? 'above' : 'below';
    
    setDropZone({
      divisionId: targetEntry.division,
      position,
      targetId: targetTeamId,
    });
  };

  const handleDragLeave = () => {
    setDropZone(null);
  };

  const handleDrop = (e: React.DragEvent, targetTeamId: string) => {
    e.preventDefault();
    if (draggedTeam === targetTeamId || !draggedTeam) return;

    const draggedEntry = standings.find(e => e.id === draggedTeam);
    const targetEntry = standings.find(e => e.id === targetTeamId);
    
    if (!draggedEntry || !targetEntry || draggedEntry.division !== targetEntry.division) {
      setDraggedTeam(null);
      setDropZone(null);
      return;
    }

    // Get all items in this division, sorted by order
    const divisionItems = getDivisionStandings(draggedEntry.division);
    
    // Remove dragged item from its position
    const filteredItems = divisionItems.filter(item => item.id !== draggedTeam);
    
    // Find target index
    const targetIndex = filteredItems.findIndex(item => item.id === targetTeamId);
    
    // Determine insertion index based on drop position
    let insertIndex = targetIndex;
    if (dropZone?.position === 'below') {
      insertIndex = targetIndex + 1;
    }
    
    // Insert dragged item at new position
    filteredItems.splice(insertIndex, 0, draggedEntry);
    
    // Renumber all items with clean sequential order
    const reorderedItems = filteredItems.map((item, idx) => ({
      ...item,
      manualOrder: idx,
    }));
    
    // Update all standings - keep other divisions unchanged
    const newStandings = standings.map(entry => {
      const reordered = reorderedItems.find(r => r.id === entry.id);
      return reordered || entry;
    });

    setStandings(newStandings);
    
    // Save all affected entries
    reorderedItems.forEach(item => {
      upsertMutation.mutate(item);
    });
    
    setDraggedTeam(null);
    setDropZone(null);
  };

  const handleDragEnd = () => {
    setDraggedTeam(null);
    setDropZone(null);
  };

  const availableTeams = AVAILABLE_TEAMS;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black mb-4" data-testid="text-page-title">
            Standings
          </h1>
          <p className="text-muted-foreground text-lg">URFL Season {selectedSeason} Standings</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="season-select" className="shrink-0">Season:</Label>
          <Select value={selectedSeason} onValueChange={setSelectedSeason}>
            <SelectTrigger id="season-select" className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Season 1</SelectItem>
              <SelectItem value="2">Season 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {isAdmin && (
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Add Team</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="team-select">Team Name</Label>
                <Select value={newTeam} onValueChange={setNewTeam}>
                  <SelectTrigger id="team-select" data-testid="select-team">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeams.map((team) => (
                      <SelectItem key={team} value={team}>
                        <div className="flex items-center gap-2">
                          <img src={TEAMS[team as keyof typeof TEAMS]} alt={team} className="w-4 h-4 object-contain" />
                          <span>{team}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="division-select">Division</Label>
                <Select value={newDivision} onValueChange={(v) => setNewDivision(v as "AFC_D1" | "AFC_D2" | "NFC_D1" | "NFC_D2")}>
                  <SelectTrigger id="division-select" data-testid="select-division">
                    <SelectValue placeholder="Select division" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONFERENCES.map((conf) => (
                      <div key={conf.name}>
                        <div className="font-bold text-sm px-2 py-2 text-muted-foreground">{conf.name}</div>
                        {conf.divisions.map((div) => (
                          <SelectItem key={div.id} value={div.id}>
                            {div.label}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={addTeam} className="w-full" data-testid="button-add-team">
                  Add Team
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
      <div className="space-y-8">
        {CONFERENCES.map((conference) => (
          <div key={conference.name}>
            <h2 className="text-3xl font-bold mb-6 text-primary">{conference.name}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {conference.divisions.map((division) => {
                const divisionStandings = getDivisionStandings(division.id);
                return (
                  <div key={division.id}>
                    <h3 className="text-xl font-bold mb-4">{division.label}</h3>
              {divisionStandings.length > 0 ? (
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted border-b">
                        <tr>
                          <th className="px-2 py-3 text-center text-sm font-semibold w-10"></th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Rank</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold">Team</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold">Wins</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold">Losses</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold">PD</th>
                          {isAdmin && <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {divisionStandings.map((entry, index) => (
                          <tr 
                            key={entry.id} 
                            data-testid={`row-team-${entry.id}`}
                            onDragOver={(e) => handleDragOver(e, entry.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, entry.id)}
                            className={`transition-all relative ${
                              draggedTeam === entry.id ? 'opacity-50 bg-muted' : ''
                            } ${
                              draggedTeam && draggedTeam !== entry.id ? 'hover:bg-accent/30' : ''
                            } ${
                              dropZone?.targetId === entry.id ? 'bg-accent/20' : ''
                            }`}
                          >
                            {dropZone?.targetId === entry.id && (
                              <div 
                                className={`absolute left-0 right-0 h-0.5 bg-primary pointer-events-none ${
                                  dropZone.position === 'above' ? 'top-0' : 'bottom-0'
                                }`}
                              />
                            )}
                            <td className="px-2 py-4 text-center">
                              {isAdmin && (
                                <div 
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, entry.id)}
                                  onDragEnd={handleDragEnd}
                                  className="cursor-grab active:cursor-grabbing inline-flex items-center justify-center hover:text-primary transition-colors"
                                  data-testid={`drag-handle-${entry.id}`}
                                >
                                  <GripVertical className="w-5 h-5" />
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm font-bold">{index + 1}</td>
                            <td className="px-6 py-4 text-sm font-semibold">
                              <div className="flex items-center gap-3">
                                {TEAMS[entry.team as keyof typeof TEAMS] && (
                                  <img src={TEAMS[entry.team as keyof typeof TEAMS]} alt={entry.team} className="w-6 h-6 object-contain" />
                                )}
                                <span>{entry.team}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {isAdmin ? (
                                <Input
                                  type="number"
                                  min="0"
                                  value={entry.wins}
                                  onChange={(e) =>
                                    updateEntry(entry.id, "wins", parseInt(e.target.value) || 0)
                                  }
                                  className="w-16 text-center"
                                  data-testid={`input-wins-${entry.id}`}
                                />
                              ) : (
                                <div className="text-center">{entry.wins}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {isAdmin ? (
                                <Input
                                  type="number"
                                  min="0"
                                  value={entry.losses}
                                  onChange={(e) =>
                                    updateEntry(entry.id, "losses", parseInt(e.target.value) || 0)
                                  }
                                  className="w-16 text-center"
                                  data-testid={`input-losses-${entry.id}`}
                                />
                              ) : (
                                <div className="text-center">{entry.losses}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {isAdmin ? (
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  value={editingPD[entry.id] !== undefined ? editingPD[entry.id] : (entry.pointDifferential || 0)}
                                  onChange={(e) => {
                                    setEditingPD({ ...editingPD, [entry.id]: e.target.value });
                                  }}
                                  onBlur={(e) => {
                                    const val = e.target.value;
                                    const numVal = val === '' || val === '-' ? 0 : parseInt(val);
                                    if (!isNaN(numVal)) {
                                      updateEntry(entry.id, "pointDifferential", numVal);
                                    }
                                    setEditingPD({ ...editingPD, [entry.id]: undefined });
                                  }}
                                  className="w-16 text-center"
                                  data-testid={`input-pd-${entry.id}`}
                                />
                              ) : (
                                <div className="text-center">{entry.pointDifferential || 0}</div>
                              )}
                            </td>
                            {isAdmin && (
                              <td className="px-6 py-4 text-sm text-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteEntry(entry.id)}
                                  data-testid={`button-delete-${entry.id}`}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
                ) : (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">No teams in this division yet.</p>
                  </Card>
                )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
