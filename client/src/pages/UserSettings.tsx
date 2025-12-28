import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Palette, Bell, Layout, Eye, Zap, Heart } from "lucide-react";
import { TEAMS } from "@/lib/teams";
import { useState, useEffect } from "react";

const AVAILABLE_TEAMS = Object.keys(TEAMS);

interface UserPreferences {
  id?: string;
  darkMode?: boolean;
  compactLayout?: boolean;
  showTeamLogos?: boolean;
  reduceAnimations?: boolean;
  favoriteTeam?: string;
  notifyGameLive?: boolean;
  notifyGameFinal?: boolean;
  notifyNews?: boolean;
}

export default function UserSettings() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(false);
  const [compactLayout, setCompactLayout] = useState(false);
  const [showLogos, setShowLogos] = useState(true);
  const [reduceAnimations, setReduceAnimations] = useState(false);
  const [favoriteTeam, setFavoriteTeam] = useState("");
  const [notifyLive, setNotifyLive] = useState(true);
  const [notifyFinal, setNotifyFinal] = useState(true);
  const [notifyNews, setNotifyNews] = useState(true);

  const { data: preferences, isLoading } = useQuery<UserPreferences>({
    queryKey: ["/api/user/preferences"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user/preferences");
      const data: UserPreferences = await response.json();
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (preferences && Object.keys(preferences).length > 0) {
      setDarkMode(preferences.darkMode || false);
      setShowLogos(preferences.showTeamLogos !== false);
      setReduceAnimations(preferences.reduceAnimations || false);
      setFavoriteTeam(preferences.favoriteTeam || "");
      setNotifyLive(preferences.notifyGameLive !== false);
      setNotifyFinal(preferences.notifyGameFinal !== false);
      setNotifyNews(preferences.notifyNews !== false);
    }
  }, [preferences]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/user/preferences", {
        darkMode,
        showTeamLogos: showLogos,
        reduceAnimations,
        favoriteTeam: favoriteTeam || null,
        notifyGameLive: notifyLive,
        notifyGameFinal: notifyFinal,
        notifyNews,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/preferences"] });
      toast({ title: "Success", description: "Settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-muted-foreground">Please log in to access settings.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-8 h-8 text-primary" />
          <h1 className="text-4xl md:text-5xl font-black">User Settings</h1>
        </div>
        <p className="text-muted-foreground">Customize your experience</p>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold">Display</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Dark Mode</Label>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Team Logos</Label>
              <Switch checked={showLogos} onCheckedChange={setShowLogos} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Reduce Animations (Low-End PC)</Label>
              <Switch checked={reduceAnimations} onCheckedChange={setReduceAnimations} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold">Favorite Team</h2>
          </div>
          <div>
            <Label htmlFor="team-select" className="mb-2 block">Select Your Favorite Team</Label>
            <Select value={favoriteTeam || "none"} onValueChange={(val) => setFavoriteTeam(val === "none" ? "" : val)}>
              <SelectTrigger id="team-select">
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {AVAILABLE_TEAMS.map((team) => (
                  <SelectItem key={team} value={team}>
                    <div className="flex items-center gap-2">
                      <img src={TEAMS[team as keyof typeof TEAMS]} alt={team} className="w-4 h-4 object-contain" />
                      <span>{team}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">This will prioritize games from your favorite team and focus news on them.</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold">Notifications</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Game Goes Live</Label>
                <p className="text-sm text-muted-foreground">Notify when a game starts</p>
              </div>
              <Switch checked={notifyLive} onCheckedChange={setNotifyLive} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Game Goes Final</Label>
                <p className="text-sm text-muted-foreground">Notify when a game ends</p>
              </div>
              <Switch checked={notifyFinal} onCheckedChange={setNotifyFinal} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Breaking News</Label>
                <p className="text-sm text-muted-foreground">Notify about new news articles</p>
              </div>
              <Switch checked={notifyNews} onCheckedChange={setNotifyNews} />
            </div>
          </div>
        </Card>

        <Button
          size="lg"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="w-full"
        >
          {saveMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
