import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { News } from "@shared/schema";
import { format } from "date-fns";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewsDetail() {
  const [, params] = useRoute("/news/:id");
  const newsId = params?.id;

  const { data: news, isLoading, error } = useQuery<News>({
    queryKey: ["/api/news", newsId],
    enabled: !!newsId,
  });

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center gap-3 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <p>Failed to load news post</p>
        </div>
      </div>
    );
  }

  if (isLoading || !news) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/news">
          <Button variant="ghost" className="gap-2 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to News
          </Button>
        </Link>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/news">
        <Button variant="ghost" className="gap-2 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to News
        </Button>
      </Link>

      <Card className="p-8">
        <h1 className="text-4xl font-bold mb-4 dark:!text-white" data-testid={`text-detail-title-${news.id}`}>
          {news.title}
        </h1>
        <p className="text-muted-foreground text-lg mb-8" data-testid={`text-detail-date-${news.id}`}>
          {format(new Date(news.createdAt!), "MMMM d, yyyy")}
        </p>

        <div className="prose prose-lg dark:prose-invert max-w-none dark:text-white" data-testid={`text-detail-content-${news.id}`}>
          {news.content}
        </div>
      </Card>
    </div>
  );
}
