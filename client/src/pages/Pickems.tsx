import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import type { Pickem, PickemRules } from "@shared/schema";
import { ExternalLink, FileText, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function Pickems() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "streamer";

  const { data: pickems, isLoading: pickemsLoading } = useQuery<Pickem[]>({
    queryKey: ["/api/pickems"],
  });

  const { data: rules, isLoading: rulesLoading, error: rulesError } = useQuery<PickemRules>({
    queryKey: ["/api/pickems/rules"],
  });

  const currentWeek = pickems && pickems.length > 0 
    ? Math.max(...pickems.map(p => p.week))
    : 1;

  const currentWeekPickem = pickems?.find(p => p.week === currentWeek);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black mb-4" data-testid="text-page-title">
            Weekly Pick'ems
          </h1>
          <p className="text-muted-foreground text-lg">
            Make your predictions and compete with other fans
          </p>
        </div>
        {isAdmin && (
          <Link href="/admin">
            <Button variant="outline" data-testid="button-manage-pickems">
              Manage Pick'ems
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {pickemsLoading ? (
          <Skeleton className="h-64" />
        ) : currentWeekPickem ? (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Current Week</h2>
                <Badge className="text-lg px-4 py-2" data-testid="badge-current-week">
                  Week {currentWeekPickem.week}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Make your picks for this week's games
              </p>
              <a
                href={currentWeekPickem.pickemUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-current-pickem"
              >
                <Button className="w-full gap-2" size="lg">
                  <FileText className="w-5 h-5" />
                  Go to Week {currentWeekPickem.week} Pick'em
                  <ExternalLink className="w-4 h-4 ml-auto" />
                </Button>
              </a>
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No pick'em available for this week yet
              </p>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Official Rules</h2>
          {rulesLoading ? (
            <Skeleton className="h-48" />
          ) : rulesError ? (
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <p>Failed to load rules</p>
            </div>
          ) : rules ? (
            <div className="prose prose-sm max-w-none" data-testid="text-rules">
              <p className="whitespace-pre-wrap text-muted-foreground">{rules.content}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">No rules posted yet</p>
          )}
        </Card>
      </div>

      {pickems && pickems.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Previous Weeks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pickems
              .sort((a, b) => b.week - a.week)
              .map((pickem) => (
                <Card key={pickem.id} className="p-4 hover-elevate" data-testid={`card-pickem-${pickem.week}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Week {pickem.week}</h3>
                    <Badge variant="outline">Archive</Badge>
                  </div>
                  <a
                    href={pickem.pickemUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`link-pickem-${pickem.week}`}
                  >
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      View Pick'em
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </a>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
