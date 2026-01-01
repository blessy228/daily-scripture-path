import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReadingNote } from "@/hooks/useReadingNotes";
import { BIBLE_BOOKS } from "@/lib/bibleData";
import { PenLine, Plus, Trash2, Edit2, X, Check } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface NotesSectionProps {
  notes: ReadingNote[];
  onAddNote: (content: string, bookName?: string, chapter?: number) => Promise<{ error: Error | null }>;
  onUpdateNote: (id: string, content: string) => Promise<{ error: Error | null }>;
  onDeleteNote: (id: string) => Promise<{ error: Error | null }>;
}

export function NotesSection({ notes, onAddNote, onUpdateNote, onDeleteNote }: NotesSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [selectedBook, setSelectedBook] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setLoading(true);
    const { error } = await onAddNote(
      newNote,
      selectedBook || undefined,
      selectedChapter ? parseInt(selectedChapter) : undefined
    );
    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add note. Please try again.",
        variant: "destructive",
      });
    } else {
      setNewNote("");
      setSelectedBook("");
      setSelectedChapter("");
      setIsAdding(false);
      toast({
        title: "Note added!",
        description: "Your reflection has been saved.",
      });
    }
  };

  const handleUpdateNote = async (id: string) => {
    if (!editContent.trim()) return;
    
    setLoading(true);
    const { error } = await onUpdateNote(id, editContent);
    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update note.",
        variant: "destructive",
      });
    } else {
      setEditingId(null);
      setEditContent("");
    }
  };

  const handleDeleteNote = async (id: string) => {
    const { error } = await onDeleteNote(id);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete note.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <PenLine className="w-5 h-5 text-primary" />
          Notes & Reflections
        </CardTitle>
        {!isAdding && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Note
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {/* Add Note Form */}
        {isAdding && (
          <div className="space-y-3 mb-4 p-4 rounded-lg bg-muted/50">
            <div className="flex gap-2">
              <Select value={selectedBook} onValueChange={setSelectedBook}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Book (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {BIBLE_BOOKS.map((b) => (
                    <SelectItem key={b.name} value={b.name}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Chapter"
                className="w-24"
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
              />
            </div>
            <Textarea
              placeholder="Write your reflection..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleAddNote}
                disabled={loading || !newNote.trim()}
                className="gap-1"
              >
                <Check className="w-4 h-4" />
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNewNote("");
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Notes List */}
        {notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <PenLine className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No notes yet. Add your first reflection!</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-lg bg-muted/30 border border-border/50"
                >
                  {editingId === note.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateNote(note.id)}
                          disabled={loading}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          {note.book_name && (
                            <span className="text-sm font-medium text-primary">
                              {note.book_name}
                              {note.chapter && ` ${note.chapter}`}
                            </span>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(note.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingId(note.id);
                              setEditContent(note.note_content);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{note.note_content}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
