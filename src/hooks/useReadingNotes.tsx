import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ReadingNote {
  id: string;
  user_id: string;
  reading_progress_id: string | null;
  book_name: string | null;
  chapter: number | null;
  note_content: string;
  created_at: string;
  updated_at: string;
}

export function useReadingNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<ReadingNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("reading_notes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setNotes(data);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchNotes().finally(() => setLoading(false));
    } else {
      setNotes([]);
      setLoading(false);
    }
  }, [user, fetchNotes]);

  const addNote = async (
    noteContent: string,
    bookName?: string,
    chapter?: number,
    readingProgressId?: string
  ) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error } = await supabase.from("reading_notes").insert({
      user_id: user.id,
      note_content: noteContent,
      book_name: bookName || null,
      chapter: chapter || null,
      reading_progress_id: readingProgressId || null,
    });

    if (!error) {
      await fetchNotes();
    }

    return { error };
  };

  const updateNote = async (id: string, noteContent: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("reading_notes")
      .update({ note_content: noteContent })
      .eq("id", id)
      .eq("user_id", user.id);

    if (!error) {
      await fetchNotes();
    }

    return { error };
  };

  const deleteNote = async (id: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("reading_notes")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (!error) {
      await fetchNotes();
    }

    return { error };
  };

  return {
    notes,
    loading,
    addNote,
    updateNote,
    deleteNote,
    refetch: fetchNotes,
  };
}
