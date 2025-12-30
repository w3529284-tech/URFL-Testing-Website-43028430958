import { useEffect, useState } from "react";
import type { GamePlay } from "@shared/schema";

interface FootballFieldProps {
  plays: GamePlay[];
  team1: string;
  team2: string;
  team1Score: number;
  team2Score: number;
}

export function FootballField({ plays, team1, team2, team1Score, team2Score }: FootballFieldProps) {
  const [ballPosition, setBallPosition] = useState(50); // 0-100 scale, 50 = midfield
  const [isAnimating, setIsAnimating] = useState(false);

  // Calculate ball position based on plays
  useEffect(() => {
    if (plays.length === 0) return;

    const lastPlay = plays[plays.length - 1];
    setIsAnimating(true);

    // Calculate new position based on yards gained
    // Field is 120 yards total (two 10-yard endzones + 100-yard field)
    const yardMovement = lastPlay.yardsGained || 0;
    const yardScale = 100 / 120; // Convert field yards to percentage

    // Determine direction based on which team is on offense
    let newPosition = ballPosition;
    if (lastPlay.team === team1) {
      // Team1 going toward team2's endzone (right)
      newPosition = Math.min(ballPosition + yardMovement * yardScale, 110);
    } else {
      // Team2 going toward team1's endzone (left)
      newPosition = Math.max(ballPosition - yardMovement * yardScale, -10);
    }

    setBallPosition(newPosition);

    // Reset animation flag after 1 second
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, [plays, ballPosition, team1]);

  // Convert ball position to visual position on field
  const ballPercentage = ((ballPosition + 10) / 120) * 100;

  return (
    <div className="w-full bg-green-700 rounded-lg overflow-hidden border-4 border-white shadow-lg">
      {/* Field Container */}
      <div className="relative w-full pt-[56.25%]">
        <div className="absolute inset-0 flex flex-col">
          {/* Team 1 Endzone (Left) */}
          <div className="flex-1 bg-blue-600 border-r-2 border-white flex items-center justify-center">
            <div className="text-center text-white font-bold text-sm md:text-lg">
              <div className="mb-2">{team1}</div>
              <div className="text-2xl md:text-4xl font-black">{team1Score}</div>
            </div>
          </div>

          {/* Main Field */}
          <div className="flex-[5] bg-green-700 relative border-y-2 border-white">
            {/* Yard Lines */}
            <div className="absolute inset-0 flex">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="flex-1 border-r border-white border-opacity-30 flex flex-col justify-between py-2"
                >
                  {i !== 0 && i !== 11 && (
                    <>
                      <div className="text-white text-[8px] md:text-xs font-bold text-center">
                        {i * 10}
                      </div>
                      <div className="text-white text-[8px] md:text-xs font-bold text-center">
                        {i * 10}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Ball */}
            <div
              className={`absolute w-2 h-3 bg-amber-900 rounded-full transition-all ${
                isAnimating ? "duration-1000" : "duration-0"
              } shadow-lg`}
              style={{
                left: `${ballPercentage}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 10,
              }}
            >
              <div className="absolute inset-0 rounded-full bg-white opacity-30 animate-pulse" />
            </div>

            {/* Yard Markers */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-1">
              <div className="h-1 bg-white bg-opacity-20 w-full" />
              <div className="h-1 bg-white bg-opacity-20 w-full" />
            </div>
          </div>

          {/* Team 2 Endzone (Right) */}
          <div className="flex-1 bg-red-600 border-l-2 border-white flex items-center justify-center">
            <div className="text-center text-white font-bold text-sm md:text-lg">
              <div className="mb-2">{team2}</div>
              <div className="text-2xl md:text-4xl font-black">{team2Score}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
