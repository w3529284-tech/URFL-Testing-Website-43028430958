import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { NewYearPopup } from "./NewYearPopup";

export function NewYearCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isNewYear, setIsNewYear] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const newYearDate = new Date(now.getFullYear() + 1, 0, 1); // January 1, next year

      const difference = newYearDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
        setIsNewYear(false);
      } else {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        setIsNewYear(true);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {isNewYear && <NewYearPopup />}
      <Card className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl">🎆</span>
            <h3 className="text-2xl font-bold">New Year Countdown</h3>
            <span className="text-3xl">✨</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <div className="text-3xl font-black text-blue-600">{timeLeft.days}</div>
              <div className="text-xs font-semibold text-muted-foreground">Days</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black text-purple-600">{timeLeft.hours}</div>
              <div className="text-xs font-semibold text-muted-foreground">Hours</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black text-blue-600">{timeLeft.minutes}</div>
              <div className="text-xs font-semibold text-muted-foreground">Minutes</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black text-purple-600">{timeLeft.seconds}</div>
              <div className="text-xs font-semibold text-muted-foreground">Seconds</div>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
