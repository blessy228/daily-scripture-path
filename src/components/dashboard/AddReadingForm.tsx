import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BIBLE_BOOKS, getBookByName } from "@/lib/bibleData";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AddReadingFormProps {
  onAddReading: (
    date: Date,
    bookName: string,
    startChapter: number,
    endChapter: number,
    startVerse?: number,
    endVerse?: number
  ) => Promise<{ error: Error | null }>;
}

export function AddReadingForm({ onAddReading }: AddReadingFormProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [book, setBook] = useState<string>("");
  const [startChapter, setStartChapter] = useState<string>("1");
  const [endChapter, setEndChapter] = useState<string>("1");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const selectedBook = book ? getBookByName(book) : null;
  const maxChapter = selectedBook?.chapters || 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!book || !startChapter || !endChapter) {
      toast({
        title: "Missing information",
        description: "Please select a book and chapter range.",
        variant: "destructive",
      });
      return;
    }

    const start = parseInt(startChapter);
    const end = parseInt(endChapter);

    if (start > end) {
      toast({
        title: "Invalid range",
        description: "Start chapter cannot be greater than end chapter.",
        variant: "destructive",
      });
      return;
    }

    if (start < 1 || end > maxChapter) {
      toast({
        title: "Invalid chapter",
        description: `${book} has chapters 1-${maxChapter}.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await onAddReading(date, book, start, end);
    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add reading. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Reading added!",
        description: `${book} ${start}${start !== end ? `-${end}` : ""} added to your progress.`,
      });
      // Reset form
      setBook("");
      setStartChapter("1");
      setEndChapter("1");
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          Log Today's Reading
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Book Selector */}
            <div className="space-y-2">
              <Label>Book</Label>
              <Select value={book} onValueChange={setBook}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a book" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                    Old Testament
                  </div>
                  {BIBLE_BOOKS.filter(b => b.testament === "old").map((b) => (
                    <SelectItem key={b.name} value={b.name}>
                      {b.name} ({b.chapters} ch)
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground mt-2">
                    New Testament
                  </div>
                  {BIBLE_BOOKS.filter(b => b.testament === "new").map((b) => (
                    <SelectItem key={b.name} value={b.name}>
                      {b.name} ({b.chapters} ch)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Chapter Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Chapter</Label>
              <Input
                type="number"
                min={1}
                max={maxChapter}
                value={startChapter}
                onChange={(e) => setStartChapter(e.target.value)}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label>End Chapter</Label>
              <Input
                type="number"
                min={1}
                max={maxChapter}
                value={endChapter}
                onChange={(e) => setEndChapter(e.target.value)}
                placeholder="1"
              />
            </div>
          </div>

          {selectedBook && (
            <p className="text-sm text-muted-foreground">
              {selectedBook.name} has {selectedBook.chapters} chapters
            </p>
          )}

          <Button
            type="submit"
            className="w-full gradient-primary text-primary-foreground font-semibold"
            disabled={loading || !book}
          >
            {loading ? "Adding..." : "Add Reading"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
