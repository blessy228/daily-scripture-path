import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReadingEntry } from "@/hooks/useReadingProgress";
import { BIBLE_BOOKS } from "@/lib/bibleData";
import { BarChart3, BookOpen, TrendingUp, CheckCircle2, ChevronDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
interface StatsDashboardProps {
  readings: ReadingEntry[];
  chaptersRead: number;
  totalChapters: number;
}

export function StatsDashboard({ readings, chaptersRead, totalChapters }: StatsDashboardProps) {
  const stats = useMemo(() => {
    // Calculate chapters per book - store as numbers for range calculation
    const chaptersByBook = new Map<string, Set<number>>();
    
    readings.forEach((reading) => {
      if (!chaptersByBook.has(reading.book_name)) {
        chaptersByBook.set(reading.book_name, new Set());
      }
      for (let ch = reading.start_chapter; ch <= reading.end_chapter; ch++) {
        chaptersByBook.get(reading.book_name)!.add(ch);
      }
    });

    // Helper to format chapter ranges like "1-10, 15, 20-25"
    const formatChapterRanges = (chapters: Set<number>): string => {
      if (chapters.size === 0) return "";
      const sorted = Array.from(chapters).sort((a, b) => a - b);
      const ranges: string[] = [];
      let start = sorted[0];
      let end = sorted[0];

      for (let i = 1; i <= sorted.length; i++) {
        if (sorted[i] === end + 1) {
          end = sorted[i];
        } else {
          if (start === end) {
            ranges.push(`${start}`);
          } else {
            ranges.push(`${start}-${end}`);
          }
          start = sorted[i];
          end = sorted[i];
        }
      }
      return ranges.join(", ");
    };

    // Book progress with percentage and chapter ranges
    const bookProgress = BIBLE_BOOKS.map((book) => {
      const readChaptersSet = chaptersByBook.get(book.name) || new Set<number>();
      const readChapters = readChaptersSet.size;
      const percentage = Math.round((readChapters / book.chapters) * 100);
      return {
        name: book.name,
        chapters: book.chapters,
        read: readChapters,
        percentage,
        testament: book.testament,
        chapterRanges: formatChapterRanges(readChaptersSet),
      };
    }).filter((b) => b.read > 0);

    // Weekly stats - calculate last 7 days breakdown
    const now = new Date();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    // Helper to format date as YYYY-MM-DD in local timezone
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    // Build array of last 7 days ending with today
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateStr = formatLocalDate(date);
      
      dailyData.push({
        day: i === 0 ? "Today" : dayNames[date.getDay()],
        chapters: 0,
        date: dateStr,
      });
    }

    // Fill in the chapters for each day
    readings.forEach((reading) => {
      const readingDateStr = reading.reading_date;
      const dayEntry = dailyData.find(d => d.date === readingDateStr);
      if (dayEntry) {
        dayEntry.chapters += reading.chapters_count;
      }
    });

    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeekReadings = readings.filter(
      (r) => new Date(r.reading_date) >= oneWeekAgo
    );
    const thisWeekChapters = thisWeekReadings.reduce(
      (sum, r) => sum + r.chapters_count,
      0
    );

    // Old vs New Testament progress
    const oldTestamentTotal = BIBLE_BOOKS.filter((b) => b.testament === "old").reduce(
      (sum, b) => sum + b.chapters,
      0
    );
    const newTestamentTotal = BIBLE_BOOKS.filter((b) => b.testament === "new").reduce(
      (sum, b) => sum + b.chapters,
      0
    );

    let oldTestamentRead = 0;
    let newTestamentRead = 0;

    // Calculate total books per testament
    const oldTestamentBooksTotal = BIBLE_BOOKS.filter(b => b.testament === "old").length;
    const newTestamentBooksTotal = BIBLE_BOOKS.filter(b => b.testament === "new").length;

    // Calculate chapters read and completed books per testament
    let oldTestamentBooksCompleted = 0;
    let newTestamentBooksCompleted = 0;

    BIBLE_BOOKS.forEach((book) => {
      const readChapters = chaptersByBook.get(book.name)?.size || 0;
      if (book.testament === "old") {
        oldTestamentRead += readChapters;
        if (readChapters === book.chapters) {
          oldTestamentBooksCompleted++;
        }
      } else {
        newTestamentRead += readChapters;
        if (readChapters === book.chapters) {
          newTestamentBooksCompleted++;
        }
      }
    });

    // Separate in-progress and completed books
    const inProgressBooks = bookProgress
      .filter((b) => b.percentage > 0 && b.percentage < 100)
      .sort((a, b) => b.percentage - a.percentage);
    
    // Get completed books in biblical order
    const biblicalOrder = BIBLE_BOOKS.map(b => b.name);
    const completedBooks = bookProgress
      .filter((b) => b.percentage === 100)
      .sort((a, b) => biblicalOrder.indexOf(a.name) - biblicalOrder.indexOf(b.name));

    return {
      bookProgress: bookProgress.sort((a, b) => b.percentage - a.percentage).slice(0, 10),
      inProgressBooks,
      completedBooks,
      thisWeekChapters,
      dailyData,
      oldTestamentRead,
      oldTestamentTotal,
      oldTestamentBooksCompleted,
      oldTestamentBooksTotal,
      newTestamentRead,
      newTestamentTotal,
      newTestamentBooksCompleted,
      newTestamentBooksTotal,
      booksStarted: bookProgress.length,
      booksCompleted: bookProgress.filter((b) => b.percentage === 100).length,
    };
  }, [readings]);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weekly Chart */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">This Week's Reading</h4>
          <ChartContainer
            config={{
              chapters: {
                label: "Chapters",
                color: "hsl(var(--primary))",
              },
            }}
            className="h-[120px] w-full"
          >
            <BarChart data={stats.dailyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <XAxis 
                dataKey="day" 
                tickLine={false} 
                axisLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                allowDecimals={false}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
              />
              <Bar 
                dataKey="chapters" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <p className="text-3xl font-bold text-primary">{stats.thisWeekChapters}</p>
            <p className="text-sm text-muted-foreground">Chapters this week</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <p className="text-3xl font-bold text-accent">{stats.booksCompleted}</p>
            <p className="text-sm text-muted-foreground">Books completed</p>
          </div>
        </div>

        {/* Testament Progress */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Testament Progress
          </h4>
          <div className="space-y-4">
            {/* Old Testament */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Old Testament</span>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Books</span>
                  <span className="text-muted-foreground">
                    {stats.oldTestamentBooksCompleted}/{stats.oldTestamentBooksTotal}
                  </span>
                </div>
                <Progress
                  value={(stats.oldTestamentBooksCompleted / stats.oldTestamentBooksTotal) * 100}
                  className="h-1.5"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Chapters</span>
                  <span className="text-muted-foreground">
                    {stats.oldTestamentRead}/{stats.oldTestamentTotal}
                  </span>
                </div>
                <Progress
                  value={(stats.oldTestamentRead / stats.oldTestamentTotal) * 100}
                  className="h-1.5"
                />
              </div>
            </div>

            {/* New Testament */}
            <div className="space-y-2">
              <span className="text-sm font-medium">New Testament</span>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Books</span>
                  <span className="text-muted-foreground">
                    {stats.newTestamentBooksCompleted}/{stats.newTestamentBooksTotal}
                  </span>
                </div>
                <Progress
                  value={(stats.newTestamentBooksCompleted / stats.newTestamentBooksTotal) * 100}
                  className="h-1.5"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Chapters</span>
                  <span className="text-muted-foreground">
                    {stats.newTestamentRead}/{stats.newTestamentTotal}
                  </span>
                </div>
                <Progress
                  value={(stats.newTestamentRead / stats.newTestamentTotal) * 100}
                  className="h-1.5"
                />
              </div>
            </div>
          </div>
        </div>

        {/* In-Progress Books */}
        {stats.inProgressBooks.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              In Progress ({stats.inProgressBooks.length})
            </h4>
            <div className="space-y-2">
              {stats.inProgressBooks.slice(0, 8).map((book) => (
                <div key={book.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="truncate">{book.name}</span>
                    <span className="text-muted-foreground">
                      {book.read}/{book.chapters} ({book.percentage}%)
                    </span>
                  </div>
                  <Progress
                    value={book.percentage}
                    className="h-1.5"
                  />
                  <p className="text-xs text-muted-foreground truncate">
                    Ch. {book.chapterRanges}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Books - Collapsible */}
        {stats.completedBooks.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between py-2 hover:bg-muted/50 rounded-md px-2 transition-colors">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  Completed ({stats.completedBooks.length})
                </h4>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 [&[data-state=open]]:rotate-180" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-1.5 pt-2">
                {stats.completedBooks.map((book) => (
                  <div 
                    key={book.name} 
                    className="flex justify-between items-center py-1.5 px-3 rounded-md bg-accent/10 border border-accent/20"
                  >
                    <span className="text-sm font-medium">{book.name}</span>
                    <span className="text-sm text-accent font-medium">
                      ({book.chapters}/{book.chapters}) Completed!
                    </span>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {stats.bookProgress.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Stats will appear as you log readings</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
