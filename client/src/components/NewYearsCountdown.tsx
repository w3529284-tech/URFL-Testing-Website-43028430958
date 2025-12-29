import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isNewYear: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
}

export function NewYearsCountdown() {
  const [time, setTime] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isNewYear: false,
  });
  const [showFireworks, setShowFireworks] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [particleId, setParticleId] = useState(0);

  const calculateTimeRemaining = (): TimeRemaining => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const newYear = new Date(currentYear + 1, 0, 1);

    if (now >= newYear) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isNewYear: true,
      };
    }

    const diff = newYear.getTime() - now.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return { days, hours, minutes, seconds, isNewYear: false };
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = calculateTimeRemaining();
      setTime(newTime);

      // Trigger fireworks when countdown hits 0 but only once
      if (newTime.isNewYear && !showFireworks) {
        setShowFireworks(true);
        // Show fireworks for 10 seconds
        setTimeout(() => {
          setShowFireworks(false);
        }, 10000);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [showFireworks]);

  useEffect(() => {
    if (!showFireworks) return;

    // Create fireworks particles
    const createParticles = () => {
      const newParticles: Particle[] = [];
      const colors = [
        "#ff0000",
        "#00ff00",
        "#0000ff",
        "#ffff00",
        "#ff00ff",
        "#00ffff",
        "#ffa500",
        "#ff1493",
      ];

      // Create multiple bursts
      for (let burst = 0; burst < 5; burst++) {
        const burstX = Math.random() * window.innerWidth;
        const burstY = Math.random() * (window.innerHeight * 0.6);

        for (let i = 0; i < 50; i++) {
          const angle = (i / 50) * Math.PI * 2;
          const velocity = 4 + Math.random() * 6;

          newParticles.push({
            id: particleId + newParticles.length,
            x: burstX,
            y: burstY,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 2 + Math.random() * 4,
          });
        }
      }

      setParticles(newParticles);
      setParticleId((prev) => prev + 250);
    };

    createParticles();

    // Animate particles
    const animationInterval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy + 0.2, // gravity
            vy: p.vy + 0.2, // apply gravity
          }))
          .filter(
            (p) =>
              p.y < window.innerHeight && p.x > -50 && p.x < window.innerWidth + 50
          )
      );
    }, 20);

    return () => clearInterval(animationInterval);
  }, [showFireworks, particleId]);

  return (
    <>
      {/* Fireworks particles */}
      {showFireworks && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}px`,
                top: `${p.y}px`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              }}
            />
          ))}
        </div>
      )}

      {/* Countdown Card */}
      <Card className="p-8 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-2 border-blue-400/30 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,#3b82f6,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,#a855f7,transparent_50%)]"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black mb-2">🎉 New Year Countdown</h2>
              <p className="text-muted-foreground">
                {time.isNewYear ? "Happy New Year 2026! 🎊" : "Countdown to 2026"}
              </p>
            </div>
            <div className="text-5xl">{time.isNewYear ? "🎆" : "⏰"}</div>
          </div>

          {!time.isNewYear ? (
            <div className="grid grid-cols-4 gap-4">
              {[
                { value: time.days, label: "Days" },
                { value: time.hours, label: "Hours" },
                { value: time.minutes, label: "Minutes" },
                { value: time.seconds, label: "Seconds" },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="bg-blue-600/30 rounded-lg p-3 md:p-4 backdrop-blur-sm border border-blue-400/20">
                    <div className="text-2xl md:text-4xl font-black text-blue-300">
                      {String(item.value).padStart(2, "0")}
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground mt-1">
                      {item.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-6xl font-black mb-4 animate-pulse">🎆 🎇 ✨</div>
              <p className="text-xl font-bold text-primary">Welcome to 2026!</p>
              <p className="text-muted-foreground mt-2">Here's to another amazing year!</p>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
