import { useEffect, useRef } from "react";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export function useNotifications() {
  const preferences = useUserPreferences();
  const { toast } = useToast();
  const lastCheckRef = useRef<{
    gameIds: Set<string>;
    newsIds: Set<string>;
  }>({ gameIds: new Set(), newsIds: new Set() });

  // Fetch games for live/final notifications
  const { data: games = [] } = useQuery({
    queryKey: ["/api/games/all"],
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Fetch news for news notifications
  const { data: news = [] } = useQuery({
    queryKey: ["/api/news"],
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!games.length) return;

    games.forEach((game: any) => {
      // Notify when game goes live
      if (preferences.notifyGameLive && game.isLive && !lastCheckRef.current.gameIds.has(game.id)) {
        toast({
          title: "Game Live!",
          description: `${game.team1} vs ${game.team2} is now live!`,
        });
        lastCheckRef.current.gameIds.add(game.id);
      }

      // Notify when game goes final
      if (preferences.notifyGameFinal && game.isFinal && !lastCheckRef.current.gameIds.has(`final-${game.id}`)) {
        toast({
          title: "Game Final",
          description: `${game.team1} ${game.team1Score} - ${game.team2} ${game.team2Score}`,
        });
        lastCheckRef.current.gameIds.add(`final-${game.id}`);
      }
    });
  }, [games, preferences.notifyGameLive, preferences.notifyGameFinal, toast]);

  useEffect(() => {
    if (!news.length) return;

    news.forEach((item: any) => {
      if (preferences.notifyNews && !lastCheckRef.current.newsIds.has(item.id)) {
        toast({
          title: "Breaking News",
          description: item.title,
        });
        lastCheckRef.current.newsIds.add(item.id);
      }
    });
  }, [news, preferences.notifyNews, toast]);
}
