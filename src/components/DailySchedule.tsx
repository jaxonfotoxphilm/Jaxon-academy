import { SoundManager } from '../utils/SoundManager';

interface ScheduleItem {
  title: string;
  desc: string;
  icon: string;
  color: string;
  type: 'lesson' | 'exam';
  subjectId: string;
  lessonTitle: string;
  examId?: string;
}

interface DailyScheduleProps {
  dailySchedule: ScheduleItem[];
  currentUser: string;
  onLaunchLesson: (subjectId: string) => void;
  onLaunchExam: (examId: string) => void;
  onLaunchPdf: (pdfUrl: string) => void;
  schoolDayLabel: string;
}

/**
 * DailySchedule — Renders the student's guided lesson pathway for the day.
 * 
 * Features a sequential locking system: students must complete each lesson
 * before the next one unlocks. Completed state persists in localStorage.
 * Extracted from App.tsx to keep the root component lean.
 */
export function DailySchedule({
  dailySchedule,
  currentUser,
  onLaunchLesson,
  onLaunchExam,
  onLaunchPdf,
  schoolDayLabel,
}: DailyScheduleProps) {
  /**
   * Lesson Locking System:
   * Read localStorage ONCE per render, outside the map loop,
   * so we don't hit the storage API multiple times per frame.
   */
  const completedKey = `jaxon-academy-completed-${currentUser}`;
  const completedLessons: string[] = JSON.parse(localStorage.getItem(completedKey) || '[]');
  const firstIncompleteIdx = dailySchedule.findIndex(s => !completedLessons.includes(s.subjectId));

  const handleLaunch = (subject: ScheduleItem) => {
    SoundManager.playClick();
    if (subject.type === 'exam' && subject.examId) {
      onLaunchExam(subject.examId);
    } else if (typeof subject.subjectId === 'string' && subject.subjectId.endsWith('.pdf')) {
      onLaunchPdf(subject.subjectId);
    } else {
      onLaunchLesson(subject.subjectId);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-14 pb-8 animate-in slide-in-from-top-8 duration-700">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[hsla(224,76%,58%,0.12)] text-[var(--accent-blue)] font-black text-xs rounded-full uppercase tracking-[0.15em] border border-[hsla(224,76%,58%,0.2)]">
            <span>📅</span> Today's Schedule
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[hsla(160,60%,45%,0.1)] text-[var(--accent-emerald)] font-black text-xs rounded-full uppercase tracking-[0.15em] border border-[hsla(160,60%,45%,0.18)]">
            <span>📆</span> {schoolDayLabel}
          </div>
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>Your Learning Pathway</h2>
        <p className="text-lg md:text-xl text-[var(--text-secondary)] font-light max-w-2xl">
          {currentUser === 'Principal'
            ? "Previewing the student's daily guided schedule."
            : `Welcome back, ${currentUser}. Complete these modules in order to finish your school day.`}
        </p>
      </div>

      {/* Lesson Timeline */}
      <div className="space-y-5 animate-in slide-in-from-bottom-8 duration-700 delay-150 relative before:absolute before:inset-0 before:ml-8 md:before:ml-10 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-indigo-500 before:to-transparent">
        {dailySchedule.map((subject, idx) => {
          const isCompleted = completedLessons.includes(subject.subjectId);
          const isUnlocked = isCompleted || idx === firstIncompleteIdx;
          const isLocked = !isUnlocked;

          return (
            <div
              key={idx}
              id={`lesson-card-${idx}`}
              role="button"
              tabIndex={isLocked ? -1 : 0}
              aria-label={`${isCompleted ? 'Completed: ' : isLocked ? 'Locked: ' : 'Start lesson: '}${subject.title} — ${subject.desc}`}
              aria-disabled={isLocked}
              className={`relative flex items-center group ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => { if (!isLocked) handleLaunch(subject); else SoundManager.playClick(); }}
              onKeyDown={(e) => {
                if (isLocked) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleLaunch(subject);
                }
              }}
              onFocus={() => SoundManager.playHover()}
            >
              {/* Step icon */}
              <div className={`flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl border bg-gradient-to-br from-slate-800/80 to-slate-900 text-2xl md:text-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] transition-all duration-500 shrink-0 z-10 ml-0 md:ml-2 backdrop-blur-xl ${
                isCompleted ? 'border-emerald-500/40 group-hover:scale-110' :
                isLocked ? 'border-white/5' :
                'border-white/10 group-hover:scale-110 group-hover:rotate-3 group-hover:border-white/30'
              }`}>
                {isCompleted ? '✅' : isLocked ? '🔒' : subject.icon}
              </div>

              {/* Card */}
              <div className={`flex-1 ml-4 md:ml-8 glass-card card-shine border rounded-2xl md:rounded-3xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 transition-all duration-500 relative overflow-hidden gradient-border ${
                isCompleted ? '!bg-[hsla(160,60%,45%,0.04)] !border-[hsla(160,60%,45%,0.2)]' :
                isLocked ? '!bg-[hsla(0,0%,100%,0.01)] !border-[hsla(0,0%,100%,0.05)]' :
                'hover:-translate-y-1'
              }`}>
                {/* Accent left border */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-3xl bg-gradient-to-b ${isCompleted ? 'from-[var(--accent-emerald)] to-emerald-700' : isLocked ? 'from-slate-700 to-slate-800' : subject.color}`} />

                <div className="flex justify-between items-start w-full relative z-10">
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-lg md:text-xl font-extrabold mb-1 tracking-tight transition-colors ${
                      isCompleted ? 'text-[var(--accent-emerald)]' : isLocked ? 'text-slate-500' : 'text-white group-hover:text-[var(--accent-blue)]'
                    }`}>
                      {subject.title}
                      {isCompleted && <span className="ml-2 text-xs font-bold text-emerald-500 uppercase tracking-[0.15em]">Complete</span>}
                    </h4>
                    <p className={`font-medium text-xs md:text-sm truncate transition-colors ${isLocked ? 'text-slate-600' : 'text-[var(--text-secondary)] group-hover:text-slate-300'}`}>
                      {subject.desc}
                    </p>
                  </div>

                  {/* CTA button */}
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border flex items-center justify-center transition-all duration-500 shadow-inner shrink-0 ml-3 ${
                    isCompleted ? 'bg-[hsla(160,60%,45%,0.1)] border-[hsla(160,60%,45%,0.3)]' :
                    isLocked ? 'bg-[hsla(0,0%,100%,0.02)] border-[hsla(0,0%,100%,0.05)]' :
                    'bg-[hsla(0,0%,100%,0.05)] border-[var(--border-subtle)] group-hover:bg-white group-hover:scale-110 group-hover:shadow-[0_0_24px_var(--glow-blue)]'
                  }`}>
                    <span className={`text-lg md:text-xl font-black ml-0.5 transition-colors duration-500 ${
                      isCompleted ? 'text-[var(--accent-emerald)]' : isLocked ? 'text-slate-700' : 'text-white group-hover:text-black'
                    }`}>
                      {isCompleted ? '✓' : isLocked ? '🔒' : '▶'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
