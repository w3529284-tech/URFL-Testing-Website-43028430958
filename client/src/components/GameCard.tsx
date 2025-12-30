import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Game } from "@shared/schema";
import { formatInTimeZone } from "date-fns-tz";
import { TEAMS } from "@/lib/teams";
import { Video } from "lucide-react";
import { useUserPreferences } from "@/hooks/useUserPreferences";

interface GameCardProps {
  game: Game;
  onClick?: () => void;
}

export function GameCard({ game, onClick }: GameCardProps) {
  const preferences = useUserPreferences();
  const showLogos = preferences.showTeamLogos !== false;
  const team2Logo = showLogos ? TEAMS[game.team2 as keyof typeof TEAMS] : null;
  const team1Logo = showLogos ? TEAMS[game.team1 as keyof typeof TEAMS] : null;

  return (
    <Card
      className={`p-6 cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all ${game.isLive ? 'border-primary' : ''}`}
      onClick={onClick}
      data-testid={`card-game-${game.id}`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Badge
            variant={game.isLive ? "default" : game.isFinal ? "secondary" : "outline"}
            className={game.isLive ? "animate-pulse" : ""}
            data-testid={`badge-status-${game.id}`}
          >
            {game.isLive ? `LIVE${game.quarter && game.quarter !== "Scheduled" ? ` - ${game.quarter}` : ""}` : game.isFinal ? "FINAL" : game.quarter || "Scheduled"}
          </Badge>
          <span className="text-xs text-muted-foreground" data-testid={`text-gametime-${game.id}`}>
            {game.gameTime ? formatInTimeZone(new Date(game.gameTime), "America/New_York", "EEE, MMM d 'at' h:mm a 'EST'") : "Time TBD"}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {team2Logo && <img src={team2Logo} alt={game.team2} className="w-8 h-8 object-contain flex-shrink-0" />}
              <span className={`text-lg font-bold truncate ${game.team2Score! > game.team1Score! && game.isFinal ? 'text-primary' : ''}`} data-testid={`text-team2-${game.id}`}>
                {game.team2}
              </span>
            </div>
            <span className={`text-4xl font-black tabular-nums flex-shrink-0 ${game.team2Score! > game.team1Score! && game.isFinal ? 'text-primary' : ''}`} data-testid={`text-team2-score-${game.id}`}>
              {game.team2Score}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {team1Logo && <img src={team1Logo} alt={game.team1} className="w-8 h-8 object-contain flex-shrink-0" />}
              <span className={`text-lg font-bold truncate ${game.team1Score! > game.team2Score! && game.isFinal ? 'text-primary' : ''}`} data-testid={`text-team1-${game.id}`}>
                {game.team1}
              </span>
            </div>
            <span className={`text-4xl font-black tabular-nums flex-shrink-0 ${game.team1Score! > game.team2Score! && game.isFinal ? 'text-primary' : ''}`} data-testid={`text-team1-score-${game.id}`}>
              {game.team1Score}
            </span>
          </div>
        </div>

        {game.location && (
          <div className="text-sm text-muted-foreground" data-testid={`text-location-${game.id}`}>
            {game.location}
          </div>
        )}

        {game.streamLink && (
          <div className="pt-3 border-t">
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full gap-2"
              onClick={(e) => {
                e.stopPropagation();
                const url = game.streamLink.startsWith('http://') || game.streamLink.startsWith('https://') 
                  ? game.streamLink 
                  : `https://${game.streamLink}`;
                window.open(url, '_blank');
              }}
            >
              <Video className="w-4 h-4" />
              Watch Stream
            </Button>
          </div>
        )}

        {game.lastPlay && (
          <div className="mt-3 p-3 bg-muted/50 rounded-md border border-border/50">
            <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Last Play</div>
            <p className="text-sm font-medium leading-snug">{game.lastPlay}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
