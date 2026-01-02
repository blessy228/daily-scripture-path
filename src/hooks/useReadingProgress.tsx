import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { TOTAL_CHAPTERS, calculateChaptersRead, getDayOfYear, getDaysInYear, calculateDailyTarget } from "@/lib/bibleData";

export interface ReadingEntry {
  id: string;
  user_id: string;
  reading_date: string;
  book_name: string;
  start_chapter: number;
  end_chapter: number;
  start_verse: number | null;
  end_verse: number | null;
  chapters_count: number;
  created_at: string;
}

export interface UserStreak {
  current_streak: number;
  longest_streak: number;
  last_reading_date: string | null;
}

export function useReadingProgress() {
  const { user } = useAuth();
  const [readings, setReadings] = useState<ReadingEntry[]>([]);
  const [streak, setStreak] = useState<UserStreak>({ current_streak: 0, longest_streak: 0, last_reading_date: null });
  const [loading, setLoading] = useState(true);

  const fetchReadings = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("reading_progress")
      .select("*")
      .eq("user_id", user.id)
      .order("reading_date", { ascending: false });

    if (!error && data) {
      setReadings(data);
    }
  }, [user]);

  const fetchStreak = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      setStreak({
        current_streak: data.current_streak,
        longest_streak: data.longest_streak,
        last_reading_date: data.last_reading_date,
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([fetchReadings(), fetchStreak()]).finally(() => setLoading(false));
    } else {
      setReadings([]);
      setStreak({ current_streak: 0, longest_streak: 0, last_reading_date: null });
      setLoading(false);
    }
  }, [user, fetchReadings, fetchStreak]);

  // Helper to format date as YYYY-MM-DD in local timezone
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const addReading = async (
    readingDate: Date,
    bookName: string,
    startChapter: number,
    endChapter: number,
    startVerse?: number,
    endVerse?: number
  ) => {
    if (!user) return { error: new Error("Not authenticated") };

    const chaptersCount = endChapter - startChapter + 1;
    const dateStr = formatLocalDate(readingDate);

    const { error } = await supabase.from("reading_progress").insert({
      user_id: user.id,
      reading_date: dateStr,
      book_name: bookName,
      start_chapter: startChapter,
      end_chapter: endChapter,
      start_verse: startVerse || null,
      end_verse: endVerse || null,
      chapters_count: chaptersCount,
    });

    if (!error) {
      await updateStreak(dateStr);
      await fetchReadings();
      await fetchStreak();
    }

    return { error };
  };

  const updateStreak = async (readingDate: string) => {
    if (!user) return;

    const today = formatLocalDate(new Date());
    const yesterday = formatLocalDate(new Date(Date.now() - 86400000));
    
    // Parse the dates for comparison
    const readingDateObj = new Date(readingDate + 'T00:00:00');
    const lastReadingDateObj = streak.last_reading_date 
      ? new Date(streak.last_reading_date + 'T00:00:00') 
      : null;

    let newStreak = streak.current_streak;
    
    // If no previous reading, start streak at 1
    if (!lastReadingDateObj) {
      newStreak = 1;
    } else {
      // Calculate the difference in days between reading date and last reading date
      const diffTime = readingDateObj.getTime() - lastReadingDateObj.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        // Same day, streak stays the same
        newStreak = streak.current_streak;
      } else if (diffDays === 1) {
        // Consecutive day, increment streak
        newStreak = streak.current_streak + 1;
      } else if (diffDays === -1) {
        // Reading for yesterday (backfilling), keep streak
        newStreak = streak.current_streak;
      } else {
        // Gap in reading, reset streak to 1
        newStreak = 1;
      }
    }

    const newLongest = Math.max(streak.longest_streak, newStreak);

    // Check if streak record exists
    const { data: existingStreak } = await supabase
      .from("user_streaks")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingStreak) {
      await supabase
        .from("user_streaks")
        .update({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_reading_date: readingDate,
        })
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("user_streaks")
        .insert({
          user_id: user.id,
          current_streak: newStreak,
          longest_streak: newLongest,
          last_reading_date: readingDate,
        });
    }
  };

  const deleteReading = async (id: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("reading_progress")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (!error) {
      await fetchReadings();
    }

    return { error };
  };

  const chaptersRead = calculateChaptersRead(readings);
  const progressPercentage = Math.round((chaptersRead / TOTAL_CHAPTERS) * 100);
  
  const now = new Date();
  const dayOfYear = getDayOfYear(now);
  const daysInYear = getDaysInYear(now.getFullYear());
  const daysRemaining = daysInYear - dayOfYear;
  const chaptersRemaining = TOTAL_CHAPTERS - chaptersRead;
  const dailyTarget = calculateDailyTarget(chaptersRemaining, daysRemaining);

  return {
    readings,
    streak,
    loading,
    addReading,
    deleteReading,
    chaptersRead,
    progressPercentage,
    dailyTarget,
    chaptersRemaining,
    daysRemaining,
    totalChapters: TOTAL_CHAPTERS,
    refetch: () => Promise.all([fetchReadings(), fetchStreak()]),
  };
}
