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
    title: "Live Scores",
    description: "Keep up with every game in real-time on our Live Scores page.",
  },
  {
    title: "Pick'ems",
    description: "Think you know football? Prove it in our weekly Pick'em challenges.",
  },
  {
    title: "Standings & Playoffs",
    description: "Track your favorite teams and see the road to the championship.",
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
