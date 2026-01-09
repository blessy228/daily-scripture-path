import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BIBLE_BOOKS } from "@/lib/bibleData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Verse {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

interface BibleResponse {
  reference: string;
  verses: Verse[];
  text: string;
  translation_id: string;
  translation_name: string;
}

export default function Bible() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [selectedBook, setSelectedBook] = useState("Genesis");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentBook = BIBLE_BOOKS.find((b) => b.name === selectedBook);
  const maxChapters = currentBook?.chapters || 1;

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchVerses = async () => {
      setLoading(true);
      setError(null);

      try {
        // Format the book name for the API (replace spaces with +)
        const formattedBook = selectedBook.replace(/ /g, "+");
        const response = await fetch(
          `https://bible-api.com/${formattedBook}+${selectedChapter}?translation=web`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch verses");
        }

        const data: BibleResponse = await response.json();
        setVerses(data.verses || []);
      } catch (err) {
        setError("Unable to load verses. Please try again.");
        console.error("Error fetching verses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVerses();
  }, [selectedBook, selectedChapter]);

  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    } else {
      // Go to previous book's last chapter
      const currentIndex = BIBLE_BOOKS.findIndex((b) => b.name === selectedBook);
      if (currentIndex > 0) {
        const prevBook = BIBLE_BOOKS[currentIndex - 1];
        setSelectedBook(prevBook.name);
        setSelectedChapter(prevBook.chapters);
      }
    }
  };

  const handleNextChapter = () => {
    if (selectedChapter < maxChapters) {
      setSelectedChapter(selectedChapter + 1);
    } else {
      // Go to next book's first chapter
      const currentIndex = BIBLE_BOOKS.findIndex((b) => b.name === selectedBook);
      if (currentIndex < BIBLE_BOOKS.length - 1) {
        const nextBook = BIBLE_BOOKS[currentIndex + 1];
        setSelectedBook(nextBook.name);
        setSelectedChapter(1);
      }
    }
  };

  const handleBookChange = (bookName: string) => {
    setSelectedBook(bookName);
    setSelectedChapter(1);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Bible</h1>
              <p className="text-xs text-muted-foreground">World English Bible</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Navigation Controls */}
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* Book Selector */}
              <div className="flex-1 w-full sm:w-auto">
                <Select value={selectedBook} onValueChange={handleBookChange}>
                  <SelectTrigger className="w-full bg-input border-border">
                    <SelectValue placeholder="Select a book" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border max-h-64">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Old Testament
                    </div>
                    {BIBLE_BOOKS.filter((b) => b.testament === "old").map((book) => (
                      <SelectItem key={book.name} value={book.name}>
                        {book.name}
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
                      New Testament
                    </div>
                    {BIBLE_BOOKS.filter((b) => b.testament === "new").map((book) => (
                      <SelectItem key={book.name} value={book.name}>
                        {book.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Chapter Selector */}
              <div className="w-full sm:w-32">
                <Select
                  value={selectedChapter.toString()}
                  onValueChange={(v) => setSelectedChapter(parseInt(v))}
                >
                  <SelectTrigger className="w-full bg-input border-border">
                    <SelectValue placeholder="Chapter" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border max-h-64">
                    {Array.from({ length: maxChapters }, (_, i) => i + 1).map(
                      (chapter) => (
                        <SelectItem key={chapter} value={chapter.toString()}>
                          Chapter {chapter}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevChapter}
                  disabled={selectedBook === "Genesis" && selectedChapter === 1}
                  className="border-border"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextChapter}
                  disabled={
                    selectedBook === "Revelation" && selectedChapter === 22
                  }
                  className="border-border"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bible Content */}
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-2xl text-foreground">
              {selectedBook} {selectedChapter}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-destructive">{error}</div>
            ) : (
              <ScrollArea className="h-[60vh]">
                <div className="space-y-4 pr-4">
                  {verses.map((verse) => (
                    <p key={verse.verse} className="text-foreground leading-relaxed">
                      <span className="text-primary font-semibold text-sm mr-2">
                        {verse.verse}
                      </span>
                      <span className="text-muted-foreground">
                        {verse.text.trim()}
                      </span>
                    </p>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
