import { useEffect, useState, useRef } from "react";
import type { GamePlay, Game } from "@shared/schema";
import { motion, useMotionValue } from "framer-motion";
import fieldBg from "@assets/Football_field_diagram_1767142475671.webp";
import { apiRequest } from "@/lib/queryClient";

interface FootballFieldProps {
  plays: GamePlay[];
  team1: string;
  team2: string;
  team1Score: number;
  team2Score: number;
  onPositionChange?: (position: number) => void;
  isAdmin?: boolean;
  game?: Game;
}

export function FootballField({ plays, team1, team2, team1Score, team2Score, onPositionChange, isAdmin, game }: FootballFieldProps) {
  const [ballPosition, setBallPosition] = useState(50); // 0-100 scale, 50 = midfield
  const fieldRef = useRef<HTMLDivElement>(null);

  // Ball position on field is 10-110 (including endzones)
  // We'll map 0-100 yards to 8.33% - 91.66% of the container width
  const x = useMotionValue(50);
  
  useEffect(() => {
    // Sync external ball position (from props/DB) to motion value
    const pos = game?.ballPosition ?? 50;
    x.set(pos);
    setBallPosition(pos);
    console.log("[FIELD] Initial ball position set:", pos);
  }, [game?.ballPosition, x]);

  const handleDrag = () => {
    const currentX = x.get();
    const roundedX = Math.round(currentX);
    
    // Broadcast position live while dragging if it changed
    if (game?.id && roundedX !== ballPosition) {
      setBallPosition(roundedX);
      const payload = { 
        type: "ball_move",
        gameId: game.id,
        ballPosition: roundedX 
      };
      
      const wss = (window as any).socket;
      if (wss && wss.readyState === WebSocket.OPEN) {
        wss.send(JSON.stringify(payload));
      }
    }
  };

  const handleDragEnd = () => {
    const currentX = x.get();
    const roundedX = Math.round(currentX);
    
    setBallPosition(roundedX);
    x.set(roundedX);
    
    if (onPositionChange) {
      onPositionChange(roundedX);
    }
    
    if (game?.id) {
      const payload = { ballPosition: roundedX };
      apiRequest("PATCH", `/api/games/${game.id}`, payload)
        .catch(err => console.error("[FIELD] Final save failed:", err));
    }
  };

  return (
    <div className="w-full rounded-lg overflow-hidden shadow-lg border-4 border-white">
      <div 
        ref={fieldRef}
        className="relative w-full aspect-[16/9] bg-cover bg-center"
        style={{ backgroundImage: `url(${fieldBg})` }}
      >
        {/* Draggable Ball */}
        <motion.div
          drag={isAdmin ? "x" : false}
          dragConstraints={fieldRef}
          dragElastic={0}
          dragMomentum={false}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          style={{ 
            x: `${x.get()}%`,
            left: 0,
            top: "50%",
            transform: "translate(-50%, -50%)"
          }}
          className={`absolute w-4 h-6 bg-amber-900 rounded-full shadow-xl cursor-grab active:cursor-grabbing z-20 flex items-center justify-center border border-white/30 ${isAdmin ? 'ring-2 ring-primary ring-offset-2' : ''}`}
        >
          <div className="w-full h-[1px] bg-white/50 absolute top-1/4" />
          <div className="w-full h-[1px] bg-white/50 absolute top-3/4" />
        </motion.div>
      </div>
    </div>
  );
}
