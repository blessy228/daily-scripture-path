import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { BIBLE_BOOKS } from "@/lib/bibleData";
import { ReadingEntry } from "@/hooks/useReadingProgress";
import { toast } from "sonner";

interface EditReadingDialogProps {
  reading: ReadingEntry | null;
  onClose: () => void;
  onSave: (id: string, bookName: string, startChapter: number, endChapter: number, readingDate: Date) => Promise<{ error: Error | null }>;
}

export function EditReadingDialog({ reading, onClose, onSave }: EditReadingDialogProps) {
  const [selectedBook, setSelectedBook] = useState("");
  const [startChapter, setStartChapter] = useState("1");
  const [endChapter, setEndChapter] = useState("1");
  const [date, setDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reading) {
      setSelectedBook(reading.book_name);
      setStartChapter(reading.start_chapter.toString());
      setEndChapter(reading.end_chapter.toString());
      setDate(new Date(reading.reading_date + 'T00:00:00'));
    }
  }, [reading]);

  const selectedBookData = BIBLE_BOOKS.find(b => b.name === selectedBook);
  const maxChapters = selectedBookData?.chapters || 1;

  const handleSave = async () => {
    if (!reading || !selectedBook) return;

    const start = parseInt(startChapter);
    const end = parseInt(endChapter);

    if (end < start) {
      toast.error("End chapter must be greater than or equal to start chapter");
      return;
    }

    setLoading(true);
    const { error } = await onSave(reading.id, selectedBook, start, end, date);
    setLoading(false);

    if (error) {
      toast.error("Failed to update reading");
    } else {
      toast.success("Reading updated!");
      onClose();
    }
  };

  return (
    <Dialog open={!!reading} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Reading</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Book</Label>
            <Select value={selectedBook} onValueChange={(value) => {
              setSelectedBook(value);
              setStartChapter("1");
              setEndChapter("1");
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select a book" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {BIBLE_BOOKS.map((book) => (
                  <SelectItem key={book.name} value={book.name}>
                    {book.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Chapter</Label>
              <Select value={startChapter} onValueChange={setStartChapter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {Array.from({ length: maxChapters }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>End Chapter</Label>
              <Select value={endChapter} onValueChange={setEndChapter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {Array.from({ length: maxChapters }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}