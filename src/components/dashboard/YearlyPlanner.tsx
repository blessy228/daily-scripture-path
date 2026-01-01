import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ReadingEntry } from "@/hooks/useReadingProgress";
import { BIBLE_BOOKS, TOTAL_CHAPTERS, calculateChaptersRead } from "@/lib/bibleData";
import { Calendar, CheckCircle, Circle } from "lucide-react";
import { format, startOfYear, addDays, isToday, isBefore, isAfter } from "date-fns";

interface YearlyPlannerProps {
  readings: ReadingEntry[];
  chaptersRead: number;
  daysRemaining: number;
}

export function YearlyPlanner({ readings, chaptersRead, daysRemaining }: YearlyPlannerProps) {
  // Create a map of dates to readings
  const readingsByDate = useMemo(() => {
    const map = new Map<string, ReadingEntry[]>();
    readings.forEach((reading) => {
      const dateKey = reading.reading_date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(reading);
    });
    return map;
  }, [readings]);

  // Generate the suggested plan for remaining days
  const suggestedPlan = useMemo(() => {
    const chaptersRemaining = TOTAL_CHAPTERS - chaptersRead;
    const chaptersPerDay = daysRemaining > 0 ? Math.ceil(chaptersRemaining / daysRemaining) : 0;
    
    const today = new Date();
    const year = today.getFullYear();
    const days: Array<{
      date: Date;
      isPast: boolean;
      isToday: boolean;
      hasReading: boolean;
      readingsCount: number;
      suggestedChapters: number;
    }> = [];

    // Generate next 30 days for the preview
    for (let i = 0; i < 30; i++) {
      const date = addDays(today, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayReadings = readingsByDate.get(dateStr) || [];
      
      days.push({
        date,
        isPast: isBefore(date, today) && !isToday(date),
        isToday: isToday(date),
        hasReading: dayReadings.length > 0,
        readingsCount: dayReadings.reduce((sum, r) => sum + r.chapters_count, 0),
        suggestedChapters: chaptersPerDay,
      });
    }

    return { days, chaptersPerDay };
  }, [readingsByDate, chaptersRead, daysRemaining]);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          365-Day Planner
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Suggested: {suggestedPlan.chaptersPerDay} chapters/day to finish on time
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {suggestedPlan.days.map((day, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  day.isToday
                    ? "bg-primary/10 border border-primary"
                    : day.hasReading
                    ? "bg-success/10"
                    : "bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  {day.hasReading ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className={`font-medium ${day.isToday ? "text-primary" : ""}`}>
                      {format(day.date, "EEEE, MMM d")}
                      {day.isToday && <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Today</span>}
                    </p>
                    {day.hasReading && (
                      <p className="text-sm text-success">
                        Read {day.readingsCount} chapters ✓
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {!day.hasReading && (
                    <p className="text-sm text-muted-foreground">
                      Target: {day.suggestedChapters} ch
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
