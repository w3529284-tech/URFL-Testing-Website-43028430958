import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Game, News as NewsType, Pickem, PickemRules, Changelog, InsertChangelog, StreamRequest, User } from "@shared/schema";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Plus, Trash2, Edit, Save, Wrench } from "lucide-react";
import { TEAMS } from "@/lib/teams";

const AVAILABLE_TEAMS = Object.keys(TEAMS);

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user as any)?.role !== "admin")) {
      toast({
        title: "Unauthorized",
        description: "Admin access only. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, (user as any)?.role, isLoading, toast]);

  if (!isAuthenticated || (user as any)?.role !== "admin") {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl md:text-5xl font-black mb-8" data-testid="text-page-title">
        Admin Dashboard
      </h1>

      <Tabs defaultValue="games" className="space-y-6">
        <div className="w-full overflow-x-auto">
          <TabsList className="grid grid-cols-10 w-max">
            <TabsTrigger value="games" data-testid="tab-games">Games</TabsTrigger>
            <TabsTrigger value="scores" data-testid="tab-scores">Scores</TabsTrigger>
            <TabsTrigger value="news" data-testid="tab-news">News</TabsTrigger>
            <TabsTrigger value="coins" data-testid="tab-coins">Coins</TabsTrigger>
            <TabsTrigger value="bracket" data-testid="tab-bracket">Bracket</TabsTrigger>
            <TabsTrigger value="changelogs" data-testid="tab-changelogs">Changelogs</TabsTrigger>
            <TabsTrigger value="streams" data-testid="tab-streams">Streams</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
            <TabsTrigger value="partners" data-testid="tab-partners">Partners</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="games">
          <GamesManager />
        </TabsContent>

        <TabsContent value="scores">
          <ScoresManager />
        </TabsContent>

        <TabsContent value="news">
          <NewsManager />
        </TabsContent>

        <TabsContent value="coins">
          <CoinsManager />
        </TabsContent>

        <TabsContent value="bracket">
          <BracketManager />
        </TabsContent>

        <TabsContent value="changelogs">
          <ChangelogManager />
        </TabsContent>

        <TabsContent value="streams">
          <StreamRequestsManager />
        </TabsContent>

        <TabsContent value="users">
          <UsersManager />
        </TabsContent>

        <TabsContent value="partners">
          <PartnersManager />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GamesManager() {
  const { toast } = useToast();
  const [week, setWeek] = useState(1);
  const [filterWeek, setFilterWeek] = useState<string>("all");
  const [gamesList, setGamesList] = useState<Array<{ team1: string; team2: string; date: string; time: string; isPrimetime: boolean }>>([
    { team1: "", team2: "", date: "", time: "", isPrimetime: false },
  ]);
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  const { data: games } = useQuery<Game[]>({
    queryKey: ["/api/games/all"],
  });

  const createMutation = useMutation({
    mutationFn: async (games: Array<{ week: number; team1: string; team2: string; date: string; time: string; isPrimetime: boolean }>) => {
      await Promise.all(games.map((game) => {
        const payload: any = {
          week: game.week,
          team1: game.team1,
          team2: game.team2,
          gameTime: null,
          isPrimetime: game.isPrimetime,
        };
        if (game.date && game.time) {
          const gameTime = new Date(`${game.date}T${game.time}`);
          payload.gameTime = gameTime.toISOString();
        }
        return apiRequest("POST", "/api/games", payload);
      }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey;
        return typeof key[0] === 'string' && key[0]?.startsWith('/api/games');
      }});
      toast({ title: "Success", description: "Week scheduled successfully" });
      setGamesList([{ team1: "", team2: "", date: "", time: "", isPrimetime: false }]);
      setWeek(1);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({ title: "Error", description: "Failed to schedule week", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/games/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey;
        return typeof key[0] === 'string' && key[0]?.startsWith('/api/games');
      }});
      toast({ title: "Success", description: "Game deleted successfully" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({ title: "Error", description: "Failed to delete game", variant: "destructive" });
    },
  });

  const updateTimeMutation = useMutation({
    mutationFn: async ({ id, date, time }: { id: string; date: string; time: string }) => {
      if (date && time) {
        const gameTime = new Date(`${date}T${time}`);
        await apiRequest("PATCH", `/api/games/${id}`, { gameTime: gameTime.toISOString() });
      } else {
        await apiRequest("PATCH", `/api/games/${id}`, { gameTime: null });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey;
        return typeof key[0] === 'string' && key[0]?.startsWith('/api/games');
      }});
      toast({ title: "Success", description: "Game time updated successfully" });
      setEditingGameId(null);
      setEditDate("");
      setEditTime("");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({ title: "Error", description: "Failed to update game time", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validGames = gamesList.filter((g) => g.team1.trim() && g.team2.trim()).map((g) => {
      // If date or time is empty, clear both to ensure gameTime stays null
      if (!g.date || !g.time) {
        return { ...g, date: "", time: "" };
      }
      return g;
    });
    if (validGames.length === 0) {
      toast({ title: "Error", description: "Add at least one game with teams", variant: "destructive" });
      return;
    }
    createMutation.mutate(validGames.map((g) => ({ week, ...g })));
  };

  const handleGameChange = (index: number, field: "team1" | "team2" | "date" | "time", value: string) => {
    const updated = [...gamesList];
    updated[index] = { ...updated[index], [field]: value };
    setGamesList(updated);
  };

  const handlePrimetimeChange = (index: number, value: boolean) => {
    const updated = [...gamesList];
    updated[index] = { ...updated[index], isPrimetime: value };
    setGamesList(updated);
  };

  const addGameRow = () => {
    setGamesList([...gamesList, { team1: "", team2: "", date: "", time: "", isPrimetime: false }]);
  };

  const removeGameRow = (index: number) => {
    setGamesList(gamesList.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Schedule Week</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="week">Week</Label>
            <Input
              id="week"
              type="number"
              min="1"
              max="18"
              value={week}
              onChange={(e) => setWeek(parseInt(e.target.value))}
              required
              data-testid="input-week"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Games</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addGameRow}
                className="gap-2"
                data-testid="button-add-game-row"
              >
                <Plus className="w-4 h-4" />
                Add Game
              </Button>
            </div>

            {gamesList.map((game, index) => {
              const usedTeams = gamesList.map(g => g.team1).concat(gamesList.map(g => g.team2)).filter(t => t && (t !== game.team1 || t === game.team1) && (t !== game.team2 || t === game.team2));
              const availableTeams = AVAILABLE_TEAMS.filter(t => !usedTeams.includes(t) || t === game.team1 || t === game.team2);
              return (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 border rounded-md bg-muted/30" data-testid={`game-row-${index}`}>
                <div>
                  <Label htmlFor={`team2-${index}`}>Team 2</Label>
                  <Select value={game.team2} onValueChange={(value) => handleGameChange(index, "team2", value)}>
                    <SelectTrigger id={`team2-${index}`} data-testid={`select-team2-${index}`}>
                      <SelectValue placeholder="Select Team 2" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTeams.map((team) => (
                        <SelectItem key={team} value={team}>
                          {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`team1-${index}`}>Team 1</Label>
                  <Select value={game.team1} onValueChange={(value) => handleGameChange(index, "team1", value)}>
                    <SelectTrigger id={`team1-${index}`} data-testid={`select-team1-${index}`}>
                      <SelectValue placeholder="Select Team 1" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTeams.map((team) => (
                        <SelectItem key={team} value={team}>
                          {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`date-${index}`}>Date</Label>
                  <Input
                    id={`date-${index}`}
                    type="date"
                    value={game.date}
                    onChange={(e) => handleGameChange(index, "date", e.target.value)}
                    data-testid={`input-date-${index}`}
                  />
                </div>
                <div>
                  <Label htmlFor={`time-${index}`}>Time</Label>
                  <Input
                    id={`time-${index}`}
                    type="time"
                    value={game.time}
                    onChange={(e) => handleGameChange(index, "time", e.target.value)}
                    data-testid={`input-time-${index}`}
                  />
                </div>
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={game.isPrimetime}
                      onCheckedChange={(checked) => handlePrimetimeChange(index, checked)}
                      data-testid={`switch-primetime-${index}`}
                    />
                    <Label htmlFor={`primetime-${index}`}>Primetime</Label>
                  </div>
                </div>
                {gamesList.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeGameRow(index)}
                    className="md:col-span-5 justify-self-end"
                    data-testid={`button-remove-game-${index}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            );
            })}
          </div>

          <Button type="submit" className="gap-2 w-full" disabled={createMutation.isPending} data-testid="button-schedule-week">
            <Plus className="w-4 h-4" />
            {createMutation.isPending ? "Scheduling..." : `Schedule Week ${week}`}
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">All Games</h2>
          <div className="w-40">
            <Select value={filterWeek} onValueChange={setFilterWeek}>
              <SelectTrigger data-testid="select-filter-week">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Weeks</SelectItem>
                {[...Array(14)].map((_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    Week {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-3">
          {games?.filter(game => filterWeek === "all" || game.week === parseInt(filterWeek)).map((game) => (
            <div key={game.id} data-testid={`game-item-${game.id}`}>
              {editingGameId === game.id ? (
                <div className="p-4 border rounded-md bg-muted/30 space-y-3">
                  <p className="font-semibold">{game.team2} vs {game.team1}</p>
                  <p className="text-sm text-muted-foreground">
                    {editDate && editTime ? `${editDate} at ${editTime}` : "Time TBD"}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor={`edit-date-${game.id}`}>Date</Label>
                      <Input
                        id={`edit-date-${game.id}`}
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        data-testid={`input-edit-date-${game.id}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-time-${game.id}`}>Time</Label>
                      <Input
                        id={`edit-time-${game.id}`}
                        type="time"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        data-testid={`input-edit-time-${game.id}`}
                      />
                    </div>
                    <div className="flex gap-2 items-end">
                      <Button
                        size="sm"
                        onClick={() => updateTimeMutation.mutate({ id: game.id, date: editDate, time: editTime })}
                        disabled={updateTimeMutation.isPending || !editDate || !editTime}
                        data-testid={`button-save-time-${game.id}`}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateTimeMutation.mutate({ id: game.id, date: "", time: "" })}
                        disabled={updateTimeMutation.isPending}
                        data-testid={`button-clear-time-${game.id}`}
                      >
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingGameId(null);
                          setEditDate("");
                          setEditTime("");
                        }}
                        data-testid={`button-cancel-edit-${game.id}`}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge>Week {game.week}</Badge>
                      {game.isLive && <Badge variant="default">LIVE</Badge>}
                      {game.isFinal && <Badge variant="secondary">FINAL</Badge>}
                    </div>
                    <p className="font-semibold">{game.team2} vs {game.team1}</p>
                    <p className="text-sm text-muted-foreground">
                      {game.gameTime ? formatInTimeZone(new Date(game.gameTime), "America/Chicago", "MMM d, yyyy 'at' h:mm a 'CST'") : "Time TBD"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setEditingGameId(game.id);
                        setEditDate("");
                        setEditTime("");
                      }}
                      data-testid={`button-edit-time-${game.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteMutation.mutate(game.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${game.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ScoresManager() {
  const { toast } = useToast();
  const [filterWeek, setFilterWeek] = useState<string>("all");
  const { data: games } = useQuery<Game[]>({
    queryKey: ["/api/games/all"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Game> }) => {
      await apiRequest("PATCH", `/api/games/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey;
        return typeof key[0] === 'string' && key[0]?.startsWith('/api/games');
      }});
      toast({ title: "Success", description: "Score updated successfully" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({ title: "Error", description: "Failed to update score", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Update Scores</h2>
          <div className="w-40">
            <Select value={filterWeek} onValueChange={setFilterWeek}>
              <SelectTrigger data-testid="select-scores-filter-week">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Weeks</SelectItem>
                {[...Array(14)].map((_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    Week {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-4">
          {games?.filter(game => filterWeek === "all" || game.week === parseInt(filterWeek)).map((game) => (
            <Card key={game.id} className="p-4" data-testid={`score-card-${game.id}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{game.team2} vs {game.team1}</p>
                    <p className="text-sm text-muted-foreground">Week {game.week}</p>
                  </div>
                  <Badge>{game.quarter}</Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor={`team2-${game.id}`}>Team 2 Score</Label>
                    <Input
                      id={`team2-${game.id}`}
                      type="number"
                      min="0"
                      defaultValue={game.team2Score || 0}
                      onBlur={(e) => {
                        const newScore = parseInt(e.target.value) || 0;
                        if (newScore !== game.team2Score) {
                          updateMutation.mutate({ id: game.id, data: { team2Score: newScore } });
                        }
                      }}
                      data-testid={`input-team2-score-${game.id}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`team1-${game.id}`}>Team 1 Score</Label>
                    <Input
                      id={`team1-${game.id}`}
                      type="number"
                      min="0"
                      defaultValue={game.team1Score || 0}
                      onBlur={(e) => {
                        const newScore = parseInt(e.target.value) || 0;
                        if (newScore !== game.team1Score) {
                          updateMutation.mutate({ id: game.id, data: { team1Score: newScore } });
                        }
                      }}
                      data-testid={`input-team1-score-${game.id}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`quarter-${game.id}`}>Quarter/Status</Label>
                    <Input
                      id={`quarter-${game.id}`}
                      defaultValue={game.quarter || "Scheduled"}
                      onBlur={(e) => {
                        if (e.target.value !== game.quarter) {
                          updateMutation.mutate({ id: game.id, data: { quarter: e.target.value } });
                        }
                      }}
                      data-testid={`input-quarter-${game.id}`}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={game.isLive || false}
                        onCheckedChange={(checked) => {
                          updateMutation.mutate({ id: game.id, data: { isLive: checked } });
                        }}
                        data-testid={`switch-live-${game.id}`}
                      />
                      <Label>Live</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={game.isFinal || false}
                        onCheckedChange={(checked) => {
                          updateMutation.mutate({ id: game.id, data: { isFinal: checked } });
                        }}
                        data-testid={`switch-final-${game.id}`}
                      />
                      <Label>Final</Label>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}

function NewsManager() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
  });

  const { data: news } = useQuery<NewsType[]>({
    queryKey: ["/api/news"],
  });

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData & { authorId: string }) => {
      await apiRequest("POST", "/api/news", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({ title: "Success", description: "News posted successfully" });
      setFormData({ title: "", content: "", excerpt: "" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({ title: "Error", description: "Failed to post news", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/news/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({ title: "Success", description: "News deleted successfully" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({ title: "Error", description: "Failed to delete news", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }
    if (!formData.excerpt.trim()) {
      toast({ title: "Error", description: "Excerpt is required", variant: "destructive" });
      return;
    }
    const authorId = (user as any)?.id || "anonymous";
    createMutation.mutate({ title: formData.title, content: formData.excerpt, excerpt: formData.excerpt, authorId });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Create News Post</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              data-testid="input-news-title"
            />
          </div>

          <div>
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              rows={6}
              required
              data-testid="input-news-excerpt"
            />
          </div>

          <Button type="submit" className="gap-2" disabled={createMutation.isPending} data-testid="button-post-news">
            <Plus className="w-4 h-4" />
            {createMutation.isPending ? "Posting..." : "Post News"}
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">All News Posts</h2>
        <div className="space-y-3">
          {news?.map((post) => (
            <div key={post.id} className="flex items-start justify-between p-4 border rounded-md" data-testid={`news-item-${post.id}`}>
              <div className="flex-1">
                <h3 className="font-semibold mb-1 dark:!text-white">{post.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(post.createdAt!), "MMM d, yyyy")}
                </p>
              </div>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => deleteMutation.mutate(post.id)}
                disabled={deleteMutation.isPending}
                data-testid={`button-delete-news-${post.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function CoinsManager() {
  const { toast } = useToast();
  const [addUserId, setAddUserId] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [removeUserId, setRemoveUserId] = useState("");
  const [removeAmount, setRemoveAmount] = useState("");

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const addCoinsMutation = useMutation({
    mutationFn: async (data: { userId: string; amount: number }) => {
      await apiRequest("POST", "/api/admin/add-coins", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Success", description: "Coins added successfully" });
      setAddUserId("");
      setAddAmount("");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({ title: "Error", description: "Failed to add coins", variant: "destructive" });
    },
  });

  const removeCoinsMutation = useMutation({
    mutationFn: async (data: { userId: string; amount: number }) => {
      await apiRequest("POST", "/api/admin/remove-coins", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Success", description: "Coins removed successfully" });
      setRemoveUserId("");
      setRemoveAmount("");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({ title: "Error", description: "Failed to remove coins", variant: "destructive" });
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUserId || !addAmount) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    const coinsAmount = parseInt(addAmount);
    if (coinsAmount <= 0) {
      toast({ title: "Error", description: "Amount must be greater than 0", variant: "destructive" });
      return;
    }
    addCoinsMutation.mutate({ userId: addUserId, amount: coinsAmount });
  };

  const handleRemoveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!removeUserId || !removeAmount) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    const coinsAmount = parseInt(removeAmount);
    if (coinsAmount <= 0) {
      toast({ title: "Error", description: "Amount must be greater than 0", variant: "destructive" });
      return;
    }
    removeCoinsMutation.mutate({ userId: removeUserId, amount: coinsAmount });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Add Coins to Account</h2>
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <Label htmlFor="user-select-add">Select User</Label>
            <Select value={addUserId} onValueChange={setAddUserId}>
              <SelectTrigger id="user-select-add" data-testid="select-user-add-coins">
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.username} (ID: {user.id.substring(0, 8)}...)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="coins-amount-add">Amount of Coins</Label>
            <Input
              id="coins-amount-add"
              type="number"
              min="1"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              placeholder="Enter amount"
              required
              data-testid="input-coins-amount-add"
            />
          </div>

          <Button type="submit" className="gap-2" disabled={addCoinsMutation.isPending} data-testid="button-add-coins">
            <Plus className="w-4 h-4" />
            {addCoinsMutation.isPending ? "Adding..." : "Add Coins"}
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Remove Coins from Account</h2>
        <form onSubmit={handleRemoveSubmit} className="space-y-4">
          <div>
            <Label htmlFor="user-select-remove">Select User</Label>
            <Select value={removeUserId} onValueChange={setRemoveUserId}>
              <SelectTrigger id="user-select-remove" data-testid="select-user-remove-coins">
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.username} (ID: {user.id.substring(0, 8)}...)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="coins-amount-remove">Amount of Coins</Label>
            <Input
              id="coins-amount-remove"
              type="number"
              min="1"
              value={removeAmount}
              onChange={(e) => setRemoveAmount(e.target.value)}
              placeholder="Enter amount"
              required
              data-testid="input-coins-amount-remove"
            />
          </div>

          <Button type="submit" variant="destructive" className="gap-2" disabled={removeCoinsMutation.isPending} data-testid="button-remove-coins">
            <Trash2 className="w-4 h-4" />
            {removeCoinsMutation.isPending ? "Removing..." : "Remove Coins"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function ChangelogManager() {
  const { toast } = useToast();
  const [version, setVersion] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string[]>(["NEW"]);
  const [changes, setChanges] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: changelogs = [] } = useQuery<Changelog[]>({
    queryKey: ["/api/changelogs"],
  });

  // Auto-calculate next version
  useEffect(() => {
    if (changelogs.length === 0) {
      setVersion("1.0");
    } else {
      const latestVersion = changelogs[0].version;
      const parts = latestVersion.split(".");
      const major = parseInt(parts[0], 10);
      const minor = parseInt(parts[1], 10);
      setVersion(`${major}.${minor + 1}`);
    }
  }, [changelogs]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertChangelog) => {
      await apiRequest("POST", "/api/changelogs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/changelogs"] });
      toast({ title: "Success", description: "Changelog created successfully" });
      setVersion("");
      setTitle("");
      setDescription("");
      setStatus(["NEW"]);
      setChanges("");
      setDate(new Date().toISOString().split('T')[0]);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({ title: "Error", description: "Failed to create changelog", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/changelogs/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/changelogs"] });
      toast({ title: "Success", description: "Changelog deleted successfully" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({ title: "Error", description: "Failed to delete changelog", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!version || !title || !date) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    
    const changeList = changes.split('\n').filter(line => line.trim());
    createMutation.mutate({
      version,
      title,
      description,
      status: JSON.stringify(status),
      changes: JSON.stringify(changeList),
      date,
    });
  };

  const toggleStatus = (value: string) => {
    setStatus(prev => 
      prev.includes(value) 
        ? prev.filter(s => s !== value)
        : [...prev, value]
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Create New Changelog</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="version">Version (auto-generated) *</Label>
              <Input
                id="version"
                value={version}
                disabled
                className="bg-muted cursor-not-allowed"
                data-testid="input-version"
              />
              <p className="text-xs text-muted-foreground mt-1">Next version: {version}</p>
            </div>
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                data-testid="input-date"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Major Update"
              required
              data-testid="input-title"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of the update"
              rows={3}
              data-testid="input-description"
            />
          </div>

          <div>
            <Label>Status Tags (select all that apply) *</Label>
            <div className="space-y-2 mt-2">
              {[
                { value: "NEW", label: "NEW - New feature or functionality" },
                { value: "IMPROVED", label: "IMPROVED - Enhancement to existing feature" },
                { value: "FIXED", label: "FIXED - Bug fix or issue resolution" },
                { value: "DESIGN", label: "DESIGN - Visual or UI changes" },
              ].map(s => (
                <div key={s.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`status-${s.value}`}
                    checked={status.includes(s.value)}
                    onChange={() => toggleStatus(s.value)}
                    className="rounded border border-input"
                    data-testid={`checkbox-status-${s.value.toLowerCase()}`}
                  />
                  <Label htmlFor={`status-${s.value}`} className="cursor-pointer font-normal">
                    {s.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="changes">Changes (one per line) *</Label>
            <Textarea
              id="changes"
              value={changes}
              onChange={(e) => setChanges(e.target.value)}
              placeholder="- Added new feature&#10;- Fixed bug&#10;- Improved performance"
              rows={6}
              required
              data-testid="input-changes"
            />
          </div>

          <Button type="submit" className="gap-2" disabled={createMutation.isPending} data-testid="button-create-changelog">
            <Plus className="w-4 h-4" />
            {createMutation.isPending ? "Creating..." : "Create Changelog"}
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Recent Changelogs</h2>
        <div className="space-y-3">
          {changelogs.map((changelog) => (
            <div key={changelog.id} className="flex items-start justify-between p-3 border rounded-md">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold">{changelog.version}</span>
                  <span className="text-sm text-muted-foreground">{changelog.date}</span>
                </div>
                <p className="font-semibold mb-1">{changelog.title}</p>
                {changelog.description && <p className="text-sm text-muted-foreground mb-2">{changelog.description}</p>}
                <div className="flex gap-1 flex-wrap mb-2">
                  {JSON.parse(changelog.status).map((s: string) => (
                    <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                  ))}
                </div>
                <ul className="text-sm space-y-1">
                  {JSON.parse(changelog.changes).map((change: string, idx: number) => (
                    <li key={idx} className="text-muted-foreground">{change}</li>
                  ))}
                </ul>
              </div>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => deleteMutation.mutate(changelog.id)}
                disabled={deleteMutation.isPending}
                data-testid={`button-delete-changelog-${changelog.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function BracketManager() {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState("");

  const { data: bracketImage } = useQuery<{ imageUrl?: string }>({
    queryKey: ["/api/bracket-image"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await apiRequest("POST", "/api/bracket-image", { imageUrl: url });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bracket-image"] });
      setImageUrl("");
      toast({
        title: "Success",
        description: "Bracket image updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bracket image",
        variant: "destructive",
      });
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      uploadMutation.mutate(base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Playoff Bracket</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="bracket-upload" className="mb-2 block">Upload Bracket Image</Label>
              <Input
                id="bracket-upload"
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploadMutation.isPending}
                data-testid="input-bracket-upload"
              />
            </div>

            {bracketImage?.imageUrl && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Current Bracket:</p>
                <img 
                  src={bracketImage.imageUrl} 
                  alt="Current bracket" 
                  className="max-w-full max-h-96 rounded"
                  data-testid="img-bracket-preview"
                />
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function StreamRequestsManager() {
  const { toast } = useToast();

  const { data: streamRequests = [], refetch } = useQuery<StreamRequest[]>({
    queryKey: ["/api/stream-requests"],
  });

  const { data: games = [] } = useQuery<Game[]>({
    queryKey: ["/api/games/all"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, streamLink }: { id: string; status: string; streamLink?: string }) => {
      const res = await apiRequest("PATCH", `/api/stream-requests/${id}`, { status, streamLink });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stream-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({ title: "Success", description: "Stream request updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update stream request", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/stream-requests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stream-requests"] });
      toast({ title: "Success", description: "Stream request deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete stream request", variant: "destructive" });
    },
  });

  const getGameInfo = (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    return game ? `${game.team1} vs ${game.team2} (Week ${game.week})` : gameId;
  };

  const getUserInfo = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || userId : userId;
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Stream Requests</h2>
          <p className="text-muted-foreground mb-4">
            Manage streaming requests from secondary admin accounts. Approve requests to allow streamers to post their stream links.
          </p>
          
          {streamRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No stream requests yet</p>
          ) : (
            <div className="space-y-4">
              {streamRequests.map((request) => (
                <div 
                  key={request.id} 
                  className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="font-semibold">{getGameInfo(request.gameId)}</p>
                    <p className="text-sm text-muted-foreground">Requested by: {getUserInfo(request.userId)}</p>
                    {request.streamLink && (
                      <a 
                        href={request.streamLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {request.streamLink}
                      </a>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {request.createdAt ? format(new Date(request.createdAt), "MMM d, yyyy 'at' h:mm a") : ''}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        request.status === "approved" ? "default" : 
                        request.status === "rejected" ? "destructive" : 
                        "secondary"
                      }
                      className={request.status === "approved" ? "bg-primary" : ""}
                    >
                      {request.status}
                    </Badge>
                    
                    {request.status === "pending" && (
                      <>
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => updateMutation.mutate({ id: request.id, status: "approved" })}
                          disabled={updateMutation.isPending}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => updateMutation.mutate({ id: request.id, status: "rejected" })}
                          disabled={updateMutation.isPending}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(request.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function UsersManager() {
  const { toast } = useToast();
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "streamer">("admin");

  const { data: users = [], refetch } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createUserMutation = useMutation({
    mutationFn: async ({ username, password, role }: { username: string; password: string; role: string }) => {
      const res = await apiRequest("POST", "/api/users", { username, password, role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Success", description: "User created successfully" });
      setNewUsername("");
      setNewPassword("");
      setNewRole("admin");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to create user", variant: "destructive" });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}/role`, { role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Success", description: "User role updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user role", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/users/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Success", description: "User deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to delete user", variant: "destructive" });
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      toast({ title: "Error", description: "Username and password are required", variant: "destructive" });
      return;
    }
    createUserMutation.mutate({ username: newUsername, password: newPassword, role: newRole });
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Add New User</h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter username"
                  disabled={createUserMutation.isPending}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled={createUserMutation.isPending}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={newRole} onValueChange={(value: any) => setNewRole(value)}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="streamer">Streamer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full gap-2" 
              disabled={createUserMutation.isPending || !newUsername.trim() || !newPassword.trim()}
            >
              <Plus className="w-4 h-4" />
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </form>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Existing Users</h2>
          <p className="text-muted-foreground mb-4">
            Manage user roles. <strong>Admin</strong> users have full access. <strong>Streamer</strong> users can only request and post stream links.
          </p>
          
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No users found</p>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div 
                  key={user.id} 
                  className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {user.firstName || user.lastName 
                        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() 
                        : 'Unknown User'}
                    </p>
                    <p className="text-sm text-muted-foreground">{user.username}</p>
                    <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Select 
                      value={user.role || "admin"} 
                      onValueChange={(role) => updateRoleMutation.mutate({ id: user.id, role })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="streamer">Streamer</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Badge 
                      variant={user.role === "admin" ? "default" : "secondary"}
                    >
                      {user.role || "admin"}
                    </Badge>
                    
                    <Button 
                      size="icon"
                      variant="destructive"
                      onClick={() => deleteUserMutation.mutate(user.id)}
                      disabled={deleteUserMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function PartnersManager() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [quote, setQuote] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const { data: partners = [] } = useQuery<any[]>({
    queryKey: ["/api/partners"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/partners", { name, quote, imageUrl: imageUrl || undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      setName("");
      setQuote("");
      setImageUrl("");
      toast({ title: "Success", description: "Partner added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add partner", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/partners/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({ title: "Success", description: "Partner deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete partner", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Add Partner</h2>
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
          <div>
            <Label htmlFor="name">Partner Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter partner name"
              required
            />
          </div>
          <div>
            <Label htmlFor="quote">Quote</Label>
            <Textarea
              id="quote"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="Enter partner quote"
              required
            />
          </div>
          <div>
            <Label htmlFor="image">Image URL</Label>
            <Input
              id="image"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Enter image URL (optional)"
            />
          </div>
          <Button type="submit" disabled={createMutation.isPending || !name || !quote} className="w-full gap-2">
            <Plus className="w-4 h-4" />
            Add Partner
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Partners</h2>
        <div className="space-y-3">
          {partners.map((partner) => (
            <div key={partner.id} className="flex items-center justify-between p-4 border rounded-md">
              <div className="flex-1">
                <p className="font-semibold">{partner.name}</p>
                <p className="text-sm text-muted-foreground italic">"{partner.quote}"</p>
              </div>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => deleteMutation.mutate(partner.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SettingsManager() {
  const { toast } = useToast();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [breakingNewsMessage, setBreakingNewsMessage] = useState("");
  const [breakingNewsActive, setBreakingNewsActive] = useState(false);
  const [breakingNewsDuration, setBreakingNewsDuration] = useState<string>("0");
  
  const { data: maintenanceStatus } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/settings/maintenance-mode"],
  });

  const { data: breakingNewsData } = useQuery<{ message: string; active: boolean; expiresAt: string | null }>({
    queryKey: ["/api/settings/breaking-news"],
  });

  const maintenanceMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      await apiRequest("POST", "/api/settings/maintenance-mode", { enabled });
    },
    onSuccess: (_, enabled) => {
      setMaintenanceMode(enabled);
      toast({
        title: "Success",
        description: `Maintenance mode ${enabled ? "enabled" : "disabled"}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/maintenance-mode"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update maintenance mode",
        variant: "destructive",
      });
    },
  });

  const breakingNewsMutation = useMutation({
    mutationFn: async (data: { message: string; active: boolean; durationMinutes: number }) => {
      await apiRequest("POST", "/api/settings/breaking-news", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Breaking news updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/breaking-news"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update breaking news",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (maintenanceStatus?.enabled !== undefined) {
      setMaintenanceMode(maintenanceStatus.enabled);
    }
  }, [maintenanceStatus]);

  useEffect(() => {
    if (breakingNewsData) {
      setBreakingNewsMessage(breakingNewsData.message || "");
      setBreakingNewsActive(breakingNewsData.active);
    }
  }, [breakingNewsData]);

  const handleStartBreakingNews = () => {
    if (!breakingNewsMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a breaking news message",
        variant: "destructive",
      });
      return;
    }
    breakingNewsMutation.mutate({
      message: breakingNewsMessage,
      active: true,
      durationMinutes: parseInt(breakingNewsDuration) || 0,
    });
  };

  const handleStopBreakingNews = () => {
    breakingNewsMutation.mutate({
      message: breakingNewsMessage,
      active: false,
      durationMinutes: 0,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Maintenance Mode</h2>
            </div>
            <p className="text-muted-foreground max-w-lg">
              When enabled, users will only see the home page with a maintenance notification. All other pages will be locked. Admins can still access the admin panel.
            </p>
          </div>
          <Switch
            checked={maintenanceMode}
            onCheckedChange={(checked) => maintenanceMutation.mutate(checked)}
            disabled={maintenanceMutation.isPending}
          />
        </div>
      </Card>

      {maintenanceMode && (
        <Card className="p-4 border-yellow-500/20 bg-yellow-500/5">
          <p className="text-sm text-yellow-800">
            ⚠️ Maintenance mode is currently <span className="font-semibold">ENABLED</span>. Users will see a maintenance message on the home page.
          </p>
        </Card>
      )}

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📢</span>
            <h2 className="text-2xl font-bold">Breaking News Announcement</h2>
          </div>
          <p className="text-muted-foreground">
            Display a scrolling breaking news banner at the top of every page. Great for important announcements!
          </p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="breaking-news-message">Message</Label>
              <Textarea
                id="breaking-news-message"
                placeholder="Enter your breaking news announcement..."
                value={breakingNewsMessage}
                onChange={(e) => setBreakingNewsMessage(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="breaking-news-duration">Auto-stop timer</Label>
              <Select value={breakingNewsDuration} onValueChange={setBreakingNewsDuration}>
                <SelectTrigger id="breaking-news-duration" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No timer (manual stop)</SelectItem>
                  <SelectItem value="1">1 minute</SelectItem>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              {!breakingNewsActive ? (
                <Button
                  onClick={handleStartBreakingNews}
                  disabled={breakingNewsMutation.isPending || !breakingNewsMessage.trim()}
                  variant="default"
                >
                  {breakingNewsMutation.isPending ? "Starting..." : "Start Announcement"}
                </Button>
              ) : (
                <Button
                  onClick={handleStopBreakingNews}
                  disabled={breakingNewsMutation.isPending}
                  variant="outline"
                >
                  {breakingNewsMutation.isPending ? "Stopping..." : "Stop Announcement"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {breakingNewsActive && (
        <Card className="p-4 border-primary/20 bg-primary/5">
          <p className="text-sm text-primary/80">
            📢 Breaking news is currently <span className="font-semibold">LIVE</span>: "{breakingNewsMessage}"
          </p>
        </Card>
      )}

      <Card className="p-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Update Planner</h2>
          <p className="text-muted-foreground">Toggle which months have updates planned</p>
          
          <UpdatePlanManager />
        </div>
      </Card>
    </div>
  );
}

function UpdatePlanManager() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const { data: plans } = useQuery<any[]>({
    queryKey: ["/api/update-plans"],
  });

  const mutation = useMutation({
    mutationFn: async (updateDate: string) => {
      await apiRequest("POST", "/api/update-plans", { updateDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/update-plans"] });
      toast({ title: "Success", description: "Update date added" });
      setSelectedDate("");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({ title: "Error", description: "Failed to save update date", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (updateDate: string) => {
      await apiRequest("DELETE", `/api/update-plans/${updateDate}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/update-plans"] });
      toast({ title: "Success", description: "Update date removed" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to remove update date", variant: "destructive" });
    },
  });

  const plansSet = new Set(plans?.map(p => p.updateDate) || []);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="flex-1"
        />
        <Button
          onClick={() => mutation.mutate(selectedDate)}
          disabled={mutation.isPending || !selectedDate}
        >
          Add Date
        </Button>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Scheduled Updates:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {plans && plans.length > 0 ? (
            plans.map((plan) => {
              // Parse the date string and adjust for timezone to display correct date
              const date = new Date(plan.updateDate);
              const offset = date.getTimezoneOffset() * 60000;
              const adjustedDate = new Date(date.getTime() + offset);
              return (
              <div
                key={plan.updateDate}
                className="flex items-center justify-between p-3 bg-primary/10 border border-primary/30 rounded-lg"
              >
                <span className="text-sm font-medium">{format(adjustedDate, "MMM d, yyyy")}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(plan.updateDate)}
                  disabled={deleteMutation.isPending}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
            );
            })
          ) : (
            <p className="text-sm text-muted-foreground col-span-full">No updates scheduled</p>
          )}
        </div>
      </div>
    </div>
  );
}
