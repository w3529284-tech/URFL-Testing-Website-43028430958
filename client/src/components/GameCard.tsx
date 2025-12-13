import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Game } from "@shared/schema";
import { formatInTimeZone } from "date-fns-tz";
import { TEAMS } from "@/lib/teams";
import { Video } from "lucide-react";

interface GameCardProps {
  game: Game;
  onClick?: () => void;
  showLights?: boolean;
}

export function GameCard({ game, onClick, showLights = true }: GameCardProps) {
  const team2Logo = TEAMS[game.team2 as keyof typeof TEAMS];
  const team1Logo = TEAMS[game.team1 as keyof typeof TEAMS];

  const cardContent = (
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
            <a 
              href={game.streamLink} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                window.open(game.streamLink, '_blank');
              }}
            >
              <Button size="sm" variant="outline" className="w-full gap-2" asChild>
                <span>
                  <Video className="w-4 h-4" />
                  Watch Stream
                </span>
              </Button>
            </a>
          </div>
        )}
      </div>
    </Card>
  );

  if (!showLights) {
    return cardContent;
  }

  return (
    <div className="relative" style={{ margin: '12px' }}>
      {cardContent}

      <div className="absolute -inset-3 pointer-events-none rounded-md" style={{ margin: '-12px' }}>
        <div className="absolute -top-2 left-0 right-0 h-0.5 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700" style={{ top: '-4px' }} />
        <div className="absolute -top-2 left-0 right-0 flex justify-around gap-0.5 px-1" style={{ top: '-6px' }}>
          {Array.from({ length: 16 }).map((_, i) => {
            const color = i % 3 === 0 ? 'hsl(0 78% 48%)' : i % 3 === 1 ? 'hsl(43 96% 56%)' : 'hsl(138 44% 32%)';
            return (
              <div
                key={`top-${i}`}
                className="rounded-full"
                style={{
                  width: '12px',
                  height: '12px',
                  animation: `twinkle 0.8s ease-in-out infinite`,
                  animationDelay: (i * 0.08) + 's',
                  backgroundColor: color,
                  boxShadow: `0 0 12px ${color}, 0 0 20px ${color}, inset -1px -1px 2px rgba(0,0,0,0.3), inset 1px 1px 2px rgba(255,255,255,0.2)`,
                  border: '1px solid rgba(0,0,0,0.1)',
                  flexShrink: 0,
                }}
              />
            );
          })}
        </div>
        <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700" style={{ bottom: '-4px' }} />
        <div className="absolute -bottom-2 left-0 right-0 flex justify-around gap-0.5 px-1" style={{ bottom: '-6px' }}>
          {Array.from({ length: 16 }).map((_, i) => {
            const color = i % 3 === 1 ? 'hsl(0 78% 48%)' : i % 3 === 2 ? 'hsl(43 96% 56%)' : 'hsl(138 44% 32%)';
            return (
              <div
                key={`bottom-${i}`}
                className="rounded-full"
                style={{
                  width: '12px',
                  height: '12px',
                  animation: `twinkle 0.8s ease-in-out infinite`,
                  animationDelay: (i * 0.08 + 0.4) + 's',
                  backgroundColor: color,
                  boxShadow: `0 0 12px ${color}, 0 0 20px ${color}, inset -1px -1px 2px rgba(0,0,0,0.3), inset 1px 1px 2px rgba(255,255,255,0.2)`,
                  border: '1px solid rgba(0,0,0,0.1)',
                  flexShrink: 0,
                }}
              />
            );
          })}
        </div>
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gray-700 via-gray-600 to-gray-700" style={{ left: '-4px' }} />
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-around gap-0.5 py-1" style={{ left: '-6px' }}>
          {Array.from({ length: 10 }).map((_, i) => {
            const color = i % 3 === 0 ? 'hsl(0 78% 48%)' : i % 3 === 1 ? 'hsl(43 96% 56%)' : 'hsl(138 44% 32%)';
            return (
              <div
                key={`left-${i}`}
                className="rounded-full"
                style={{
                  width: '12px',
                  height: '12px',
                  animation: `twinkle 0.8s ease-in-out infinite`,
                  animationDelay: (i * 0.12) + 's',
                  backgroundColor: color,
                  boxShadow: `0 0 12px ${color}, 0 0 20px ${color}, inset -1px -1px 2px rgba(0,0,0,0.3), inset 1px 1px 2px rgba(255,255,255,0.2)`,
                  border: '1px solid rgba(0,0,0,0.1)',
                  flexShrink: 0,
                }}
              />
            );
          })}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gray-700 via-gray-600 to-gray-700" style={{ right: '-4px' }} />
        <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-around gap-0.5 py-1" style={{ right: '-6px' }}>
          {Array.from({ length: 10 }).map((_, i) => {
            const color = i % 3 === 1 ? 'hsl(0 78% 48%)' : i % 3 === 2 ? 'hsl(43 96% 56%)' : 'hsl(138 44% 32%)';
            return (
              <div
                key={`right-${i}`}
                className="rounded-full"
                style={{
                  width: '12px',
                  height: '12px',
                  animation: `twinkle 0.8s ease-in-out infinite`,
                  animationDelay: (i * 0.12 + 0.4) + 's',
                  backgroundColor: color,
                  boxShadow: `0 0 12px ${color}, 0 0 20px ${color}, inset -1px -1px 2px rgba(0,0,0,0.3), inset 1px 1px 2px rgba(255,255,255,0.2)`,
                  border: '1px solid rgba(0,0,0,0.1)',
                  flexShrink: 0,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
