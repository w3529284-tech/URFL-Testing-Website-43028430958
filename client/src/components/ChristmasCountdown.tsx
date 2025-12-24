import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

export function ChristmasCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      let christmasDate = new Date(now.getFullYear(), 11, 25); // December 25

      const difference = christmasDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="p-6 bg-gradient-to-r from-red-500/10 to-green-500/10 border-red-500/30">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <span className="text-3xl">🎄</span>
          <h3 className="text-2xl font-bold">Christmas Countdown</h3>
          <span className="text-3xl">🎅</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div className="space-y-1">
            <div className="text-3xl font-black text-red-600">{timeLeft.days}</div>
            <div className="text-xs font-semibold text-muted-foreground">Days</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-green-600">{timeLeft.hours}</div>
            <div className="text-xs font-semibold text-muted-foreground">Hours</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-red-600">{timeLeft.minutes}</div>
            <div className="text-xs font-semibold text-muted-foreground">Minutes</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-green-600">{timeLeft.seconds}</div>
            <div className="text-xs font-semibold text-muted-foreground">Seconds</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
