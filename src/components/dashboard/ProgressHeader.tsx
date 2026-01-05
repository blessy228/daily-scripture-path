import { Progress } from "@/components/ui/progress";
import { BookOpen, Flame, Target, Calendar } from "lucide-react";

interface ProgressHeaderProps {
  progressPercentage: number;
  chaptersRead: number;
  totalChapters: number;
  currentStreak: number;
  longestStreak: number;
  dailyTarget: number;
  daysRemaining: number;
}

export function ProgressHeader({
  progressPercentage,
  chaptersRead,
  totalChapters,
  currentStreak,
  longestStreak,
  dailyTarget,
  daysRemaining,
}: ProgressHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Main Progress */}
      <div className="p-6 rounded-2xl gradient-primary text-primary-foreground shadow-glow">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Bible Reading Progress</h2>
            <p className="text-primary-foreground/80">
              {chaptersRead} of {totalChapters} chapters completed
            </p>
          </div>
          <div className="text-right">
            <span className="text-4xl font-bold">{progressPercentage}%</span>
          </div>
        </div>
        <Progress 
          value={progressPercentage} 
          className="h-3 bg-primary-foreground/20"
          indicatorClassName="bg-primary-foreground/90"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Flame className="w-5 h-5" />}
          label="Current Streak"
          value={`${currentStreak} days`}
          highlight={currentStreak > 0}
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Daily Target"
          value={`${dailyTarget} chapters`}
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Days Remaining"
          value={`${daysRemaining} days`}
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Longest Streak"
          value={`${longestStreak} days`}
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}

function StatCard({ icon, label, value, highlight }: StatCardProps) {
  return (
    <div className={`p-4 rounded-xl border ${highlight ? 'border-accent bg-accent/10' : 'border-border bg-card'}`}>
      <div className={`flex items-center gap-2 mb-2 ${highlight ? 'text-accent' : 'text-muted-foreground'}`}>
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}
