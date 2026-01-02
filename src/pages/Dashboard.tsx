import { Header } from "@/components/dashboard/Header";
import { ProgressHeader } from "@/components/dashboard/ProgressHeader";
import { AddReadingForm } from "@/components/dashboard/AddReadingForm";
import { RecentReadings } from "@/components/dashboard/RecentReadings";
import { YearlyPlanner } from "@/components/dashboard/YearlyPlanner";
import { NotesSection } from "@/components/dashboard/NotesSection";
import { StatsDashboard } from "@/components/dashboard/StatsDashboard";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useReadingNotes } from "@/hooks/useReadingNotes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Calendar, PenLine, BarChart3 } from "lucide-react";

export default function Dashboard() {
  const {
    readings,
    streak,
    loading: progressLoading,
    addReading,
    editReading,
    deleteReading,
    chaptersRead,
    progressPercentage,
    dailyTarget,
    daysRemaining,
    totalChapters,
  } = useReadingProgress();

  const {
    notes,
    loading: notesLoading,
    addNote,
    updateNote,
    deleteNote,
  } = useReadingNotes();

  const loading = progressLoading || notesLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center animate-pulse">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Loading your journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 space-y-6">
        <ProgressHeader
          progressPercentage={progressPercentage}
          chaptersRead={chaptersRead}
          totalChapters={totalChapters}
          currentStreak={streak.current_streak}
          longestStreak={streak.longest_streak}
          dailyTarget={dailyTarget}
          daysRemaining={daysRemaining}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-6">
            <AddReadingForm onAddReading={addReading} />
            
            <Tabs defaultValue="readings" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="readings" className="gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Readings</span>
                </TabsTrigger>
                <TabsTrigger value="planner" className="gap-1">
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Planner</span>
                </TabsTrigger>
                <TabsTrigger value="notes" className="gap-1">
                  <PenLine className="w-4 h-4" />
                  <span className="hidden sm:inline">Notes</span>
                </TabsTrigger>
                <TabsTrigger value="stats" className="gap-1">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Stats</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="readings" className="mt-4">
                <RecentReadings readings={readings} onDelete={deleteReading} onEdit={editReading} />
              </TabsContent>
              
              <TabsContent value="planner" className="mt-4">
                <YearlyPlanner
                  readings={readings}
                  chaptersRead={chaptersRead}
                  daysRemaining={daysRemaining}
                />
              </TabsContent>
              
              <TabsContent value="notes" className="mt-4">
                <NotesSection
                  notes={notes}
                  onAddNote={addNote}
                  onUpdateNote={updateNote}
                  onDeleteNote={deleteNote}
                />
              </TabsContent>
              
              <TabsContent value="stats" className="mt-4">
                <StatsDashboard
                  readings={readings}
                  chaptersRead={chaptersRead}
                  totalChapters={totalChapters}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - 1 column on large screens */}
          <div className="space-y-6">
            <StatsDashboard
              readings={readings}
              chaptersRead={chaptersRead}
              totalChapters={totalChapters}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
