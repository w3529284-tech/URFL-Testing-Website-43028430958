import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface TourStep {
  title: string;
  description: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to BFFL!",
    description: "Your home for the ultimate football league experience. Let's show you around.",
  },
  {
    title: "Live Scores & Real-time Updates",
    description: "Catch every touchdown as it happens! Our live scoreboards update in real-time with drive details and scoring plays.",
  },
  {
    title: "Interactive Game Chat",
    description: "Talk trash or cheer with other fans! Each game has its own dedicated chat room for live discussion.",
  },
  {
    title: "Weekly Pick'ems",
    description: "Put your football knowledge to the test. Join our weekly prediction challenges and climb the leaderboard.",
  },
  {
    title: "Dynamic Standings",
    description: "Track the playoff race with our automatically updated division standings and point differentials.",
  },
  {
    title: "Playoff Brackets",
    description: "Visualize the road to the championship! Follow the bracket from the play-in games all the way to the Super Bowl.",
  },
  {
    title: "Latest News & Analysis",
    description: "Stay informed with breaking news, post-game analysis, and league-wide updates from our dedicated writers.",
  },
  {
    title: "Personalized Settings",
    description: "Make it yours! Customize your experience with dark mode, favorite teams, and notification preferences.",
  },
];

export function SiteTour({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const queryClient = useQueryClient();

  const tourMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/user/tour", { completed: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onComplete();
    },
  });

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsOpen(false);
    tourMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🏈</span>
            {TOUR_STEPS[currentStep].title}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {TOUR_STEPS[currentStep].description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-4">
          <div className="flex gap-1">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  i === currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
        <DialogFooter className="flex sm:justify-between gap-2">
          <Button variant="ghost" onClick={handleSkip}>
            Skip Tour
          </Button>
          <Button onClick={handleNext}>
            {currentStep === TOUR_STEPS.length - 1 ? "Get Started" : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
