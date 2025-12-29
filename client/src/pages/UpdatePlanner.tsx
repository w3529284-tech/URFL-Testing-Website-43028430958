import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from "date-fns";
import type { UpdatePlan } from "@shared/schema";

export default function UpdatePlanner() {
  const { data: plans } = useQuery<UpdatePlan[]>({
    queryKey: ["/api/update-plans"],
  });

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(2026, 11, 31);
  
  const months: Date[] = [];
  for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
    months.push(new Date(d));
  }

  const plansSet = new Set(plans?.map(p => p.updateDate) || []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl md:text-5xl font-black mb-2">Update Planner</h1>
      <p className="text-muted-foreground mb-8">See when we have updates planned</p>

      <Card className="p-4 mb-8 bg-muted/30 border-muted">
        <h3 className="font-semibold mb-3">Color Guide:</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary" />
            <span className="text-sm">Update Planned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded border border-border" />
            <span className="text-sm">No Update</span>
          </div>
        </div>
      </Card>

      <div className="grid gap-6">
        {months.map((month) => (
          <Card key={format(month, "yyyy-MM")} className="p-6">
            <h2 className="text-2xl font-bold mb-4">{format(month, "MMMM yyyy")}</h2>
            <div className="grid grid-cols-7 gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center font-semibold text-xs text-muted-foreground py-2">
                  {day}
                </div>
              ))}
              {eachDayOfInterval({
                start: startOfMonth(month),
                end: endOfMonth(month),
              }).map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const hasUpdate = plansSet.has(dateStr);
                const isCurrentMonth = isSameMonth(day, month);
                
                return (
                  <div
                    key={dateStr}
                    className={`aspect-square flex items-center justify-center rounded-lg border text-sm font-medium transition-all ${
                      !isCurrentMonth
                        ? "opacity-30 text-muted-foreground"
                        : hasUpdate
                        ? "bg-primary text-primary-foreground border-primary shadow-lg"
                        : "text-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
