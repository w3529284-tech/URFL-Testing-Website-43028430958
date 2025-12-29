import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Zap, Bug, Palette, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import type { Changelog } from "@shared/schema";

const calculateNextVersion = (changelogs: Changelog[]): string => {
  if (changelogs.length === 0) return "1.0";
  
  const latestVersion = changelogs[0].version;
  const parts = latestVersion.split(".");
  const major = parseInt(parts[0], 10);
  const minor = parseInt(parts[1], 10);
  
  return `${major}.${minor + 1}`;
};

export default function Changelogs() {
  const { isAuthenticated } = useAuth();

  const { data: dbChangelogs = [], isLoading } = useQuery<Changelog[]>({
    queryKey: ["/api/changelogs"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/changelogs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/changelogs"] });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "NEW":
        return <Plus className="w-4 h-4" />;
      case "IMPROVED":
        return <Zap className="w-4 h-4" />;
      case "FIXED":
        return <Bug className="w-4 h-4" />;
      case "DESIGN":
        return <Palette className="w-4 h-4" />;
      default:
        return <Plus className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "IMPROVED":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "FIXED":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      case "DESIGN":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  const parseStatuses = (statusStr: string): string[] => {
    try {
      const parsed = JSON.parse(statusStr);
      return Array.isArray(parsed) ? parsed : [statusStr];
    } catch {
      return [statusStr];
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-4" data-testid="text-page-title">
          Changelogs
        </h1>
        <p className="text-muted-foreground text-lg">Track all updates, improvements, and fixes to the URFL platform</p>
      </div>
      <div className="space-y-8">
        {isLoading ? (
          <Card className="p-6"><div className="text-muted-foreground">Loading changelogs...</div></Card>
        ) : dbChangelogs.length > 0 ? (
          dbChangelogs.map((changelog) => (
            <Card
              key={changelog.id}
              className="p-6 hover-elevate"
              data-testid={`card-changelog-${changelog.version}`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold" data-testid={`text-version-${changelog.version}`}>
                      v{changelog.version}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {parseStatuses(changelog.status).map((s) => (
                        <Badge
                          key={s}
                          className={`flex items-center gap-1 ${getStatusColor(s)}`}
                          data-testid={`badge-status-${changelog.version}-${s}`}
                        >
                          {getStatusIcon(s)}
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground" data-testid={`text-date-${changelog.version}`}>
                    {changelog.date}
                  </p>
                </div>
                {isAuthenticated && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(changelog.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${changelog.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2" data-testid={`text-title-${changelog.version}`}>
                  {changelog.title}
                </h3>
                {changelog.description && (
                  <p className="text-muted-foreground" data-testid={`text-description-${changelog.version}`}>
                    {changelog.description}
                  </p>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground">What's Included:</h4>
                <ul className="space-y-2">
                  {JSON.parse(changelog.changes).map((change: string, index: number) => (
                    <li
                      key={index}
                      className="text-sm flex items-start gap-3"
                      data-testid={`text-change-${changelog.version}-${index}`}
                    >
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center bg-muted/50">
            <p className="text-muted-foreground">No changelogs yet. Create your first one!</p>
          </Card>
        )}
      </div>
    </div>
  );
}
