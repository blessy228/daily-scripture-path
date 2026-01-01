import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ReadingEntry } from "@/hooks/useReadingProgress";
import { BookOpen, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";

interface RecentReadingsProps {
  readings: ReadingEntry[];
  onDelete: (id: string) => Promise<{ error: Error | null }>;
}

export function RecentReadings({ readings, onDelete }: RecentReadingsProps) {
  const recentReadings = readings.slice(0, 10);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Recent Readings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentReadings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No readings yet. Start your journey!</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {recentReadings.map((reading) => (
                <div
                  key={reading.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {reading.book_name} {reading.start_chapter}
                        {reading.start_chapter !== reading.end_chapter && `-${reading.end_chapter}`}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(reading.reading_date), "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(reading.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
