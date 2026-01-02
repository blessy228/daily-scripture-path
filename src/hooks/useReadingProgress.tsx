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
      await recalculateStreak();
      await fetchReadings();
      await fetchStreak();
    }

    return { error };
  };

  const editReading = async (
    id: string,
    bookName: string,
    startChapter: number,
    endChapter: number,
    readingDate: Date
  ) => {
    if (!user) return { error: new Error("Not authenticated") };

    const chaptersCount = endChapter - startChapter + 1;
    const dateStr = formatLocalDate(readingDate);

    const { error } = await supabase
      .from("reading_progress")
      .update({
        book_name: bookName,
        start_chapter: startChapter,
        end_chapter: endChapter,
        chapters_count: chaptersCount,
        reading_date: dateStr,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (!error) {
      await recalculateStreak();
      await fetchReadings();
      await fetchStreak();
    }

    return { error };
  };

  const recalculateStreak = async () => {
    if (!user) return;

    // Get all unique reading dates sorted descending
    const { data: allReadings } = await supabase
      .from("reading_progress")
      .select("reading_date")
      .eq("user_id", user.id)
      .order("reading_date", { ascending: false });

    if (!allReadings || allReadings.length === 0) {
      // No readings, reset streak
      await supabase
        .from("user_streaks")
        .upsert({
          user_id: user.id,
          current_streak: 0,
          longest_streak: streak.longest_streak,
          last_reading_date: null,
        }, { onConflict: 'user_id' });
      return;
    }

    // Get unique dates
    const uniqueDates = [...new Set(allReadings.map(r => r.reading_date))].sort().reverse();
    
    // Calculate streak from most recent date going backwards
    let currentStreak = 1;
    const today = formatLocalDate(new Date());
    const yesterday = formatLocalDate(new Date(Date.now() - 86400000));
    const mostRecentDate = uniqueDates[0];

    // Only count streak if most recent reading is today or yesterday
    if (mostRecentDate !== today && mostRecentDate !== yesterday) {
      currentStreak = 0;
    } else {
      // Count consecutive days
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        const currentDate = new Date(uniqueDates[i] + 'T00:00:00');
        const prevDate = new Date(uniqueDates[i + 1] + 'T00:00:00');
        const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    const newLongest = Math.max(streak.longest_streak, currentStreak);

    await supabase
      .from("user_streaks")
      .upsert({
        user_id: user.id,
        current_streak: currentStreak,
        longest_streak: newLongest,
        last_reading_date: mostRecentDate,
      }, { onConflict: 'user_id' });
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
    editReading,
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
