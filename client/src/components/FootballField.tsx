import { useEffect, useState, useRef } from "react";
import type { GamePlay } from "@shared/schema";
import { motion, useMotionValue, useTransform } from "framer-motion";
import fieldBg from "@/assets/field.jpg";

interface FootballFieldProps {
  plays: GamePlay[];
  team1: string;
  team2: string;
  team1Score: number;
  team2Score: number;
  onPositionChange?: (position: number) => void;
  isAdmin?: boolean;
}

export function FootballField({ plays, team1, team2, team1Score, team2Score, onPositionChange, isAdmin }: FootballFieldProps) {
  const [ballPosition, setBallPosition] = useState(50); // 0-100 scale, 50 = midfield
  const fieldRef = useRef<HTMLDivElement>(null);

  // Ball position on field is 10-110 (including endzones)
  // We'll map 0-100 yards to 8.33% - 91.66% of the container width
  const x = useMotionValue(50);
  
  useEffect(() => {
    if (plays.length === 0) {
      setBallPosition(50);
      x.set(50);
      return;
    }
    const lastPlay = plays[plays.length - 1];
    // Simple logic for now: keep track of position
    // In a real app we'd probably have ballPosition in the DB
    // For this demo we'll use the last known state or default
  }, [plays]);

  const handleDragEnd = () => {
    const currentX = x.get();
    setBallPosition(currentX);
    if (onPositionChange) {
      onPositionChange(currentX);
    }
  };

  return (
    <div className="w-full rounded-lg overflow-hidden shadow-lg border-4 border-white">
      <div 
        ref={fieldRef}
        className="relative w-full aspect-[2/1] bg-cover bg-center"
        style={{ backgroundImage: `url(${fieldBg})` }}
      >
        {/* Draggable Ball */}
        <motion.div
          drag={isAdmin ? "x" : false}
          dragConstraints={fieldRef}
          dragElastic={0}
          dragMomentum={false}
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
