import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatComponent } from "@/components/ChatComponent";
import { Skeleton } from "@/components/ui/skeleton";
import { FootballField } from "@/components/FootballField";
import type { Game, ChatMessage, Prediction, Standings, StreamRequest, User, GamePlay } from "@shared/schema";
import { formatInTimeZone } from "date-fns-tz";
import { ArrowLeft, AlertCircle, Video, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { TEAMS } from "@/lib/teams";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { calculateWinProbability, getWinProbabilityFactors, getConferenceRanking } from "@/lib/winProbability";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useUserPreferences } from "@/hooks/useUserPreferences";

export default function GameDetail() {
  const [, params] = useRoute("/game/:id");
  const gameId = params?.id;
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [celebrationTriggered, setCelebrationTriggered] = useState(false);
  const [streamLinkInput, setStreamLinkInput] = useState("");
  const [playDescription, setPlayDescription] = useState("");
  const [playType, setPlayType] = useState("pass");
  const [yardsGained, setYardsGained] = useState(0);
  const [pointsAdded, setPointsAdded] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const confettiTimeoutsRef = useRef<number[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const preferences = useUserPreferences();

  const { data: game, isLoading: gameLoading, error: gameError, refetch } = useQuery<Game>({
    queryKey: ["/api/games", gameId],
    enabled: !!gameId,
    refetchInterval: 2000,
    staleTime: 0,
    gcTime: 0,
  });
  
  // Force refetch when component mounts or gameId changes
  useEffect(() => {
    if (gameId) {
      refetch();
    }
  }, [gameId, refetch]);

  const { data: initialMessages } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat", gameId],
    enabled: !!gameId,
  });

  const { data: predictions, refetch: refetchPredictions } = useQuery<Prediction[]>({
    queryKey: ["/api/predictions", gameId],
    enabled: !!gameId,
  });

  const { data: standings } = useQuery<Standings[]>({
    queryKey: ["/api/standings"],
  });

  const { data: allGames } = useQuery<Game[]>({
    queryKey: ["/api/games/all"],
  });

  const { data: streamRequests, refetch: refetchStreamRequests } = useQuery<StreamRequest[]>({
    queryKey: ["/api/stream-requests/game", gameId],
    enabled: !!gameId,
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: !!user,
    retry: false,
  });

  const { data: myStreamRequests } = useQuery<StreamRequest[]>({
    queryKey: ["/api/stream-requests"],
    enabled: !!user,
    retry: false,
  });

  const { data: plays = [] } = useQuery<GamePlay[]>({
    queryKey: ["/api/games", gameId, "plays"],
    enabled: !!gameId,
    refetchInterval: 1000,
  });

  const requestStreamMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/stream-requests", {
        gameId: gameId,
      });
    },
    onSuccess: () => {
      toast({ title: "Stream request submitted", description: "Waiting for admin approval" });
      queryClient.invalidateQueries({ queryKey: ["/api/stream-requests"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit stream request", variant: "destructive" });
    },
  });

  const updateStreamLinkMutation = useMutation({
    mutationFn: async ({ requestId, streamLink }: { requestId: string; streamLink: string }) => {
      return await apiRequest("PATCH", `/api/stream-requests/${requestId}`, { streamLink });
    },
    onSuccess: () => {
      toast({ title: "Stream link updated", description: "Your stream link is now live!" });
      setStreamLinkInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/stream-requests"] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to update stream link";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (teamVote: string) => {
      return await apiRequest("POST", "/api/predictions", {
        gameId: gameId,
        votedFor: teamVote,
      });
    },
    onSuccess: () => {
      refetchPredictions();
    },
  });

  const addPlayMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/games/${gameId}/plays`, {
        quarter: game?.quarter || "Q1",
        playType,
        team: selectedTeam,
        description: playDescription,
        yardsGained,
        pointsAdded,
      });
    },
    onSuccess: () => {
      toast({ title: "Play added", description: "Game stats updated" });
      setPlayDescription("");
      setPlayType("pass");
      setYardsGained(0);
      setPointsAdded(0);
      setSelectedTeam("");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/games", gameId] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Failed to add play";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (initialMessages) {
      setChatMessages(initialMessages);
    }
  }, [initialMessages]);

  // Cleanup confetti when component unmounts
  useEffect(() => {
    return () => {
      confettiTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      confettiTimeoutsRef.current = [];
      const containers = document.querySelectorAll('.confetti-container');
      containers.forEach(container => container.remove());
    };
  }, []);

  useEffect(() => {
    if (game?.isFinal && !celebrationTriggered && !preferences.reduceAnimations) {
      setCelebrationTriggered(true);
      createConfetti();
    }
  }, [game?.isFinal, celebrationTriggered, preferences.reduceAnimations]);

  const createConfetti = () => {
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    // Create falling confetti - faster spawn for flash effect
    for (let i = 0; i < 400; i++) {
      const timeoutId = window.setTimeout(() => {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.top = -20 + 'px';
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        // Mix of sizes - some bigger for impact
        const size = Math.random() > 0.8 ? Math.random() * 18 + 10 : Math.random() * 12 + 4;
        piece.style.width = size + 'px';
        piece.style.height = size + 'px';
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '20%';
        if (container.parentNode) {
          container.appendChild(piece);
        }
      }, i * 3);
      confettiTimeoutsRef.current.push(timeoutId);
    }

    const cleanupTimeoutId = window.setTimeout(() => {
      if (container.parentNode) {
        container.remove();
      }
    }, 5500);
    confettiTimeoutsRef.current.push(cleanupTimeoutId);
  };

  useEffect(() => {
    if (!gameId) return;
    
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const hostname = window.location.hostname;
      const port = window.location.port || "";
      
      if (!hostname) return;
      
      const wsUrl = port && port !== "" && port !== "undefined" ? `${protocol}//${hostname}:${port}/ws` : `${protocol}//${hostname}/ws`;
      if (wsUrl.includes("undefined") || wsUrl.includes("localhost:")) return;
      
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("WebSocket connected");
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "chat" && data.gameId === gameId) {
            setChatMessages((prev) => [...prev, data.message]);
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      socket.onclose = () => {
        console.log("WebSocket disconnected");
      };

      wsRef.current = socket;

      return () => {
        socket.close();
        confettiTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
        confettiTimeoutsRef.current = [];
      };
    } catch (err) {
      console.error("Failed to establish WebSocket:", err);
    }
  }, [gameId]);

  const handleSendMessage = (username: string, message: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "chat",
          username,
          message,
          gameId,
        })
      );
    }
  };

  if (gameError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center gap-3 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <p>Failed to load game details</p>
        </div>
      </div>
    );
  }

  if (gameLoading || !game) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Skeleton className="h-96 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[600px] lg:col-span-2" />
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    );
  }

  const isScheduled = game.quarter === "Scheduled";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link href="/scores">
        <Button variant="ghost" className="mb-6 gap-2" data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
          Back to Scores
        </Button>
      </Link>

      {/* Football Field */}
      {(game?.isLive || game?.isFinal) && (
        <Card className="p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Live Field</h2>
          <FootballField 
            plays={plays}
            team1={game.team1}
            team2={game.team2}
            team1Score={game.team1Score || 0}
            team2Score={game.team2Score || 0}
          />
        </Card>
      )}

      {/* Plays Display */}
      {plays.length > 0 && (
        <Card className="p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Play-by-Play</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {[...plays].reverse().map((play) => (
              <div
                key={play.id}
                className="p-3 bg-muted rounded border-l-4 border-primary"
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="font-semibold text-sm">{play.team}</p>
                  <Badge variant="outline">{play.quarter}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  {play.playType.charAt(0).toUpperCase() + play.playType.slice(1)}
                </p>
                <p className="text-sm font-medium">{play.description}</p>
                {play.yardsGained !== 0 && (
                  <p className="text-xs text-primary mt-1">
                    {play.yardsGained > 0 ? '+ ' : ''}{play.yardsGained} yards
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Badge
                variant={game.isLive ? "default" : game.isFinal ? "secondary" : "outline"}
                className={`text-lg px-4 py-2 ${game.isLive ? 'animate-pulse' : ''}`}
                data-testid="badge-game-status"
              >
                {game.isLive ? `LIVE${game.quarter && game.quarter !== "Scheduled" ? ` - ${game.quarter}` : ""}` : game.isFinal ? "FINAL" : game.quarter || "Scheduled"}
              </Badge>
              <span className="text-sm text-muted-foreground" data-testid="text-game-time">
                {game.gameTime ? formatInTimeZone(new Date(game.gameTime), "America/New_York", "EEEE, MMMM d 'at' h:mm a 'EST'") : "Time TBD"}
              </span>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between py-4 border-b gap-4">
                <div className="flex-1 flex items-center gap-4 min-w-0">
                  {preferences.showTeamLogos !== false && TEAMS[game.team2 as keyof typeof TEAMS] && (
                    <img src={TEAMS[game.team2 as keyof typeof TEAMS]} alt={game.team2} className="w-16 h-16 object-contain flex-shrink-0" />
                  )}
                  <h2 className={`text-2xl md:text-3xl font-bold truncate ${game.team2Score! > game.team1Score! && game.isFinal ? 'text-primary' : ''}`} data-testid="text-team2">
                    {game.team2}
                  </h2>
                </div>
                <div className={`text-6xl md:text-7xl font-black tabular-nums flex-shrink-0 ${game.team2Score! > game.team1Score! && game.isFinal ? 'text-primary celebration-score' : ''}`} data-testid="text-team2-score">
                  {game.team2Score}
                </div>
              </div>

              <div className="flex items-center justify-between py-4 gap-4">
                <div className="flex-1 flex items-center gap-4 min-w-0">
                  {preferences.showTeamLogos !== false && TEAMS[game.team1 as keyof typeof TEAMS] && (
                    <img src={TEAMS[game.team1 as keyof typeof TEAMS]} alt={game.team1} className="w-16 h-16 object-contain flex-shrink-0" />
                  )}
                  <h2 className={`text-2xl md:text-3xl font-bold truncate ${game.team1Score! > game.team2Score! && game.isFinal ? 'text-primary' : ''}`} data-testid="text-team1">
                    {game.team1}
                  </h2>
                </div>
                <div className={`text-6xl md:text-7xl font-black tabular-nums flex-shrink-0 ${game.team1Score! > game.team2Score! && game.isFinal ? 'text-primary celebration-score' : ''}`} data-testid="text-team1-score">
                  {game.team1Score}
                </div>
              </div>
            </div>

            {game.location && (
              <div className="pt-4 border-t">
                <p className="text-muted-foreground" data-testid="text-game-location">
                  <span className="font-semibold">Location:</span> {game.location}
                </p>
              </div>
            )}

            {/* Admin Play Controls */}
            {!game.isFinal && game.isLive && currentUser && (currentUser.role === "admin" || currentUser.role === "streamer") && (
              <div className="pt-4 border-t mb-4">
                <p className="font-semibold mb-3">📊 Add Play</p>
                <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-2">
                    <select 
                      value={selectedTeam} 
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      className="border rounded px-2 py-1 text-sm bg-background"
                    >
                      <option value="">Select Team</option>
                      <option value={game.team1}>{game.team1}</option>
                      <option value={game.team2}>{game.team2}</option>
                    </select>
                    <select 
                      value={playType} 
                      onChange={(e) => setPlayType(e.target.value)}
                      className="border rounded px-2 py-1 text-sm bg-background"
                    >
                      <option value="pass">Pass</option>
                      <option value="rush">Rush</option>
                      <option value="sack">Sack</option>
                      <option value="interception">Interception</option>
                      <option value="touchdown">Touchdown</option>
                      <option value="field_goal">Field Goal</option>
                    </select>
                  </div>
                  <input 
                    type="text"
                    placeholder="Play description (e.g., 'Pass completion for 50 yards')"
                    value={playDescription}
                    onChange={(e) => setPlayDescription(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm bg-background"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="number"
                      placeholder="Yards gained"
                      value={yardsGained}
                      onChange={(e) => setYardsGained(parseInt(e.target.value) || 0)}
                      className="border rounded px-2 py-1 text-sm bg-background"
                    />
                    <input 
                      type="number"
                      placeholder="Points added"
                      value={pointsAdded}
                      onChange={(e) => setPointsAdded(parseInt(e.target.value) || 0)}
                      className="border rounded px-2 py-1 text-sm bg-background"
                    />
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => addPlayMutation.mutate()}
                    disabled={!selectedTeam || !playDescription || addPlayMutation.isPending}
                    className="w-full"
                  >
                    Add Play
                  </Button>
                </div>
              </div>
            )}

            {/* Stream Link Section */}
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-3">
                <Video className="w-5 h-5 text-primary" />
                <span className="font-semibold">Watch Live</span>
              </div>
              
              {game.streamLink ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = game.streamLink.startsWith('http://') || game.streamLink.startsWith('https://') 
                      ? game.streamLink 
                      : `https://${game.streamLink}`;
                    window.open(url, '_blank');
                  }}
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Watch Stream
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground mb-3">No stream available yet</p>
              )}

              {/* Streamer controls - show if user is logged in and is a streamer/admin */}
              {currentUser && (currentUser.role === "streamer" || currentUser.role === "admin") && (
                <div className="mt-3 pt-3 border-t">
                  {(() => {
                    const myRequest = myStreamRequests?.find(r => r.gameId === gameId);
                    
                    if (!myRequest) {
                      return (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => requestStreamMutation.mutate()}
                          disabled={requestStreamMutation.isPending}
                        >
                          Request to Stream This Game
                        </Button>
                      );
                    }
                    
                    if (myRequest.status === "pending") {
                      return (
                        <div className="text-sm">
                          <Badge variant="secondary">Pending Approval</Badge>
                          <p className="text-muted-foreground mt-1">Your stream request is awaiting admin approval</p>
                        </div>
                      );
                    }
                    
                    if (myRequest.status === "rejected") {
                      return (
                        <div className="text-sm">
                          <Badge variant="destructive">Request Rejected</Badge>
                        </div>
                      );
                    }
                    
                    if (myRequest.status === "approved") {
                      return (
                        <div className="space-y-2">
                          <Badge variant="default">Approved</Badge>
                          <div className="flex gap-2">
                            <Input 
                              placeholder="Enter your stream link..."
                              value={streamLinkInput}
                              onChange={(e) => setStreamLinkInput(e.target.value)}
                              className="flex-1"
                            />
                            <Button 
                              size="sm"
                              onClick={() => updateStreamLinkMutation.mutate({ 
                                requestId: myRequest.id, 
                                streamLink: streamLinkInput 
                              })}
                              disabled={!streamLinkInput || updateStreamLinkMutation.isPending}
                            >
                              Post Link
                            </Button>
                          </div>
                          {myRequest.streamLink && (
                            <p className="text-xs text-muted-foreground">
                              Current link: {myRequest.streamLink}
                            </p>
                          )}
                        </div>
                      );
                    }
                    
                    return null;
                  })()}
                </div>
              )}
            </div>

            {!game.isFinal && (isScheduled || game.isLive) && (
              <div className="pt-4 border-t">
                <p className="font-semibold mb-4">Win Probability & Predictions</p>
                
                {(() => {
                  const team1Standing = standings?.find(s => s.team === game.team1);
                  const team2Standing = standings?.find(s => s.team === game.team2);
                  
                  const team1PD = team1Standing?.pointDifferential || 0;
                  const team2PD = team2Standing?.pointDifferential || 0;
                  
                  // Calculate dynamic win probability using all factors
                  const team1Percent = calculateWinProbability(game, "team1", standings, allGames);
                  const team2Percent = calculateWinProbability(game, "team2", standings, allGames);
                  
                  // Get detailed factors for display
                  const factors = standings ? {
                    team1Rank: getConferenceRanking(game.team1, standings),
                    team2Rank: getConferenceRanking(game.team2, standings),
                  } : { team1Rank: "N/A", team2Rank: "N/A" };
                  
                  return (
                    <div className="mb-6 space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold">{game.team1}</span>
                          <span className="text-lg font-bold text-primary">{team1Percent}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-primary h-full transition-all duration-300"
                            style={{ width: `${team1Percent}%` }}
                            data-testid={`winprob-bar-${game.team1}`}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {factors.team1Rank} • {team1Standing?.wins || 0}-{team1Standing?.losses || 0} • PD: {team1PD > 0 ? '+' : ''}{team1PD}
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold">{game.team2}</span>
                          <span className="text-lg font-bold text-primary">{team2Percent}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-primary h-full transition-all duration-300"
                            style={{ width: `${team2Percent}%` }}
                            data-testid={`winprob-bar-${game.team2}`}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {factors.team2Rank} • {team2Standing?.wins || 0}-{team2Standing?.losses || 0} • PD: {team2PD > 0 ? '+' : ''}{team2PD}
                        </p>
                      </div>
                      
                      <p className="text-xs text-muted-foreground text-center mt-3 pt-2 border-t">
                        {game.isLive ? `Updated live during ${game.quarter}` : 'Based on ranking, record, point differential & schedule strength'}
                      </p>
                      
                      {(() => {
                        const factorData = getWinProbabilityFactors(game, standings, allGames);
                        if (!factorData) return null;
                        
                        return (
                          <div className="mt-4 pt-4 border-t space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Factor Breakdown:</p>
                            
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="text-left font-medium">Factor</div>
                              <div className="text-center font-medium">{game.team1}</div>
                              <div className="text-center font-medium">{game.team2}</div>
                              
                              <div className="text-left text-muted-foreground">Ranking</div>
                              <div className={`text-center ${factorData.factors.ranking.advantage === game.team1 ? 'text-primary font-semibold' : ''}`}>
                                {factorData.factors.ranking.team1Rank}
                              </div>
                              <div className={`text-center ${factorData.factors.ranking.advantage === game.team2 ? 'text-primary font-semibold' : ''}`}>
                                {factorData.factors.ranking.team2Rank}
                              </div>
                              
                              <div className="text-left text-muted-foreground">Record</div>
                              <div className={`text-center ${factorData.factors.record.advantage === game.team1 ? 'text-primary font-semibold' : ''}`}>
                                {factorData.factors.record.team1Record}
                              </div>
                              <div className={`text-center ${factorData.factors.record.advantage === game.team2 ? 'text-primary font-semibold' : ''}`}>
                                {factorData.factors.record.team2Record}
                              </div>
                              
                              <div className="text-left text-muted-foreground">Point Diff</div>
                              <div className={`text-center ${factorData.factors.pointDiff.advantage === game.team1 ? 'text-primary font-semibold' : ''}`}>
                                {factorData.factors.pointDiff.team1PD > 0 ? '+' : ''}{factorData.factors.pointDiff.team1PD}
                              </div>
                              <div className={`text-center ${factorData.factors.pointDiff.advantage === game.team2 ? 'text-primary font-semibold' : ''}`}>
                                {factorData.factors.pointDiff.team2PD > 0 ? '+' : ''}{factorData.factors.pointDiff.team2PD}
                              </div>
                              
                              <div className="text-left text-muted-foreground">Schedule</div>
                              <div className={`text-center ${factorData.factors.schedule.advantage === game.team1 ? 'text-primary font-semibold' : ''}`}>
                                {factorData.factors.schedule.team1SOS >= 0 ? `${factorData.factors.schedule.team1SOS}%` : 'N/A'}
                              </div>
                              <div className={`text-center ${factorData.factors.schedule.advantage === game.team2 ? 'text-primary font-semibold' : ''}`}>
                                {factorData.factors.schedule.team2SOS >= 0 ? `${factorData.factors.schedule.team2SOS}%` : 'N/A'}
                              </div>
                            </div>
                            
                            <p className="text-xs text-muted-foreground italic mt-2">
                              Bold = Advantage in that factor
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}
                
                {!user ? (
                  <div className="p-4 rounded-lg bg-muted border border-muted-foreground/20 text-center">
                    <p className="text-sm text-muted-foreground mb-3">You must log in to make a prediction</p>
                    <a href="/login">
                      <Button size="sm" className="w-full">Login to Predict</Button>
                    </a>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="gap-2 flex-col md:flex-row h-auto md:h-auto py-3 md:py-2"
                      onClick={() => voteMutation.mutate(game.team2)}
                      disabled={voteMutation.isPending || predictions?.some(p => p.votedFor === game.team2 && (p as any).userId === user.id) || predictions?.some(p => (p as any).userId === user.id)}
                      data-testid={`button-predict-${game.team2}`}
                    >
                      <span className="flex-1 break-words">{game.team2}</span>
                      <Badge variant="secondary" className="mt-2 md:mt-0 md:ml-auto flex-shrink-0">
                        {predictions?.filter(p => p.votedFor === game.team2).length || 0}
                      </Badge>
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2 flex-col md:flex-row h-auto md:h-auto py-3 md:py-2"
                      onClick={() => voteMutation.mutate(game.team1)}
                      disabled={voteMutation.isPending || predictions?.some(p => p.votedFor === game.team1 && (p as any).userId === user.id) || predictions?.some(p => (p as any).userId === user.id)}
                      data-testid={`button-predict-${game.team1}`}
                    >
                      <span className="flex-1 break-words">{game.team1}</span>
                      <Badge variant="secondary" className="mt-2 md:mt-0 md:ml-auto flex-shrink-0">
                        {predictions?.filter(p => p.votedFor === game.team1).length || 0}
                      </Badge>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          </Card>
        </div>

        <Card className="h-[600px] flex flex-col overflow-hidden">
          <ChatComponent
            gameId={gameId}
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            username={currentUser?.username}
            isAuthenticated={!!user}
          />
        </Card>
      </div>
    </div>
  );
}
