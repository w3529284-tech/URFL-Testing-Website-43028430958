import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface BreakingNewsData {
  message: string;
  active: boolean;
  expiresAt: string | null;
}

export function BreakingNewsBanner() {
  const [isVisible, setIsVisible] = useState(false);

  const { data: breakingNews } = useQuery<BreakingNewsData>({
    queryKey: ["/api/settings/breaking-news"],
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (breakingNews?.active && breakingNews?.message) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [breakingNews]);

  if (!isVisible || !breakingNews?.message) {
    return null;
  }

  return (
    <div className="sticky top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground overflow-hidden">
      <div className="py-2 px-4">
        <div className="marquee-container">
          <div className="marquee-content">
            <span className="font-bold mr-4">BREAKING NEWS:</span>
            <span>{breakingNews.message}</span>
            <span className="mx-8">•</span>
            <span className="font-bold mr-4">BREAKING NEWS:</span>
            <span>{breakingNews.message}</span>
            <span className="mx-8">•</span>
            <span className="font-bold mr-4">BREAKING NEWS:</span>
            <span>{breakingNews.message}</span>
            <span className="mx-8">•</span>
            <span className="font-bold mr-4">BREAKING NEWS:</span>
            <span>{breakingNews.message}</span>
            <span className="mx-8">•</span>
          </div>
        </div>
      </div>
      <style>{`
        .marquee-container {
          width: 100%;
          overflow: hidden;
        }
        .marquee-content {
          display: inline-block;
          white-space: nowrap;
          padding-left: 100%;
          animation: marquee 25s linear infinite;
        }
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
