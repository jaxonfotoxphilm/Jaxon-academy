import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Login } from './components/Login';
import { SaaSLogin } from './components/SaaSLogin';
import { Pricing } from './components/Pricing';
import { useAuth } from './contexts/AuthContext';
import { SoundManager } from './utils/SoundManager';
import curriculumData from './data/curriculum-structure.json';
import { ParentManager, type Assignment } from './utils/ParentManager';
import { useSchoolDay } from './hooks/useSchoolDay';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DailySchedule } from './components/DailySchedule';
import { UserManager } from './utils/UserManager';

/**
 * Code-split heavy view components with React.lazy.
 * Each chunk is only downloaded when the user first navigates to that view.
 */
const ParentDashboard = lazy(() =>
    import('./components/ParentDashboard').then(m => ({ default: m.ParentDashboard }))
);
const StoryLessonEngine = lazy(() =>
    import('./components/StoryLessonEngine').then(m => ({ default: m.StoryLessonEngine }))
);
const YoungLearnerEngine = lazy(() =>
    import('./components/YoungLearnerEngine').then(m => ({ default: m.YoungLearnerEngine }))
);
const ConcentratedStudy = lazy(() =>
    import('./components/ConcentratedStudy').then(m => ({ default: m.ConcentratedStudy }))
);
const ExamEngine = lazy(() =>
    import('./components/ExamEngine').then(m => ({ default: m.ExamEngine }))
);
const Library = lazy(() =>
    import('./components/Library').then(m => ({ default: m.Library }))
);
const MultiDraftTutor = lazy(() =>
    import('./components/MultiDraftTutor').then(m => ({ default: m.MultiDraftTutor }))
);
const StudentProgress = lazy(() =>
    import('./components/StudentProgress').then(m => ({ default: m.StudentProgress }))
);

/** Skeleton shown while a lazy view is loading */
const ViewSkeleton = () => (
    <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-t-transparent border-[var(--accent-blue)] animate-spin" />
            <p className="text-[var(--text-secondary)] text-sm font-semibold uppercase tracking-[0.15em] animate-pulse">Loading...</p>
        </div>
    </div>
);

/** Read the user's saved custom avatar from localStorage */
function getUserAvatar(name: string): string {
  try {
    const data = JSON.parse(localStorage.getItem('jaxon-academy-custom-avatar') || '{}');
    if (data[name]) return data[name];
  } catch { /* ignore */ }
  // Fallback defaults
  const defaults: Record<string, string> = {
    'Principal': '/assets/avatar_knight.png',
  };
  return defaults[name] || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=transparent`;
}

type ViewName = 'menu' | 'dashboard' | 'lesson' | 'exams' | 'exam-runner' | 'library' | 'tutor' | 'pdf-viewer' | 'progress';

export default function App() {
  const { session, isLoading, hasActiveSubscription, user } = useAuth();
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [currentView, setCurrentView] = useState<ViewName>('menu');
  const [selectedGradeId, setSelectedGradeId] = useState<string>(curriculumData.grades[0].id);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [activeAssignments, setActiveAssignments] = useState<Assignment[]>([]);
  const [completionToast, setCompletionToast] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [lockedGradeId, setLockedGradeId] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const { schoolDay, schoolDayLabel } = useSchoolDay();

  useEffect(() => {
    const unsubscribe = SoundManager.subscribe(() => {
        setAudioEnabled(SoundManager.isAudioEnabled());
    });
    // Pre-load Kokoro TTS model in background so it's ready as fallback
    SoundManager.preloadVoiceModels();
    return unsubscribe;
  }, []);

  // On Login, load configurations
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
          const enrolledGrade = await ParentManager.getStudentGrade(currentUser);
          
          // Force-correct grades for students who were previously mapped to non-existent grades
          const gradeCorrections: Record<string, string> = {
              'Aiko': 'grade-PK', 'Ace': 'grade-K', 'Ayla': 'grade-8'
          };
          const correctedGrade = gradeCorrections[currentUser];
          if (correctedGrade && enrolledGrade !== correctedGrade) {
              await ParentManager.setStudentGrade(currentUser, correctedGrade);
              setSelectedGradeId(correctedGrade);
              setLockedGradeId(correctedGrade);
          }
          const profile = await UserManager.getProfileByName(currentUser);
          setCurrentUserProfile(profile);
          if (profile?.role === 'principal' || profile?.role === 'teacher') {
              setLockedGradeId(null);
          } else if (enrolledGrade) {
              setSelectedGradeId(enrolledGrade);
              setLockedGradeId(enrolledGrade);
          } else if (profile?.gradeLevel) {
              await ParentManager.setStudentGrade(currentUser, profile.gradeLevel);
              setLockedGradeId(profile.gradeLevel);
          } else {
              setLockedGradeId('grade-1');
          }
          const assignments = await ParentManager.getActiveAssignmentsForStudent(currentUser);
          setActiveAssignments(assignments);
          
          SoundManager.setUser(currentUser);
          setAudioEnabled(SoundManager.isAudioEnabled());
      }
    };
    fetchUserData();
  }, [currentUser, currentView]);

    // Early return was here

  const navigate = (view: ViewName) => {
    SoundManager.playClick();
    SoundManager.playPageTransition();
    setCurrentView(view);
    setMobileMenuOpen(false);
    if (view === 'menu') {
        setSelectedSubject(null);
    }
    if (view !== 'exam-runner') setSelectedExam(null);
  };

  const launchLesson = (subjectId: string) => {
    SoundManager.playLessonStart();
    setSelectedSubject(subjectId);
    setCurrentView('lesson');
    setMobileMenuOpen(false);
  };

  const CardHover = () => SoundManager.playHover();

  const currentGrade = curriculumData.grades.find(g => g.id === selectedGradeId);

  /** 
   * Build the Daily Schedule — memoized so it only recalculates when
   * grade, school day, or assignments change (not on every render).
   */
  const dailySchedule = useMemo(() => {
    // If Principal has dispatched assignments, those take priority
    if (activeAssignments.length > 0) {
        return activeAssignments.map(a => ({
            title: curriculumData.grades.flatMap(g => g.subjects).find(s => s.id === a.subjectId)?.name || "Assigned Module",
            desc: a.note || "Principal Assigned Lesson",
            icon: a.subjectId.includes('math') ? "📐" : a.subjectId.includes('sci') ? "🔬" : "📚",
            color: "from-indigo-600 to-blue-600",
            type: "lesson" as "lesson" | "exam",
            subjectId: a.subjectId,
            lessonTitle: a.note || "Complete this module",
            teacherGuideUrl: undefined as string | undefined,
            examId: undefined
        }));
    }
    
    // Generate daily schedule from curriculum structure using the school day
    const gradeData = curriculumData.grades.find(g => g.id === lockedGradeId) || curriculumData.grades[0];
    let subjects = gradeData.subjects;
    
    // Filter adopted subjects — read localStorage once outside the loop
    subjects = subjects.filter(s => localStorage.getItem(`adopted-${s.name}`) !== 'false');

    // Deduplicate subjects by name (keep first occurrence which has the lessons array)
    const seen = new Set<string>();
    const uniqueSubjects = subjects.filter(s => {
        if (seen.has(s.name)) return false;
        seen.add(s.name);
        return true;
    });

    // Pick up to 6 core subjects for the day
    const dailySubjects = uniqueSubjects.slice(0, 6);

    const colors = [
        "from-blue-600 to-indigo-600",
        "from-emerald-600 to-teal-600",
        "from-amber-500 to-orange-600",
        "from-purple-600 to-fuchsia-600",
        "from-rose-600 to-pink-600",
        "from-cyan-600 to-sky-600"
    ];

    return dailySubjects.map((subj, i) => {
        // Look up today's specific lesson from the lessons array
        const lessons = (subj as any).lessons || [];
        const todayLesson = lessons.find((l: any) => l.day === schoolDay);
        const lessonTitle = todayLesson?.title?.replace(/^Lesson \d+: /, '') || `Day ${schoolDay} Study`;
        const dynamicQuery = todayLesson?.dynamicQuery || subj.id;

        return {
            title: subj.name,
            desc: `Day ${schoolDay}: ${lessonTitle}`,
            icon: subj.icon || "📚",
            color: colors[i % colors.length],
            type: "lesson" as "lesson" | "exam",
            subjectId: dynamicQuery,
            lessonTitle,
            teacherGuideUrl: todayLesson?.teacherGuideUrl || undefined,
            examId: undefined
        };
    });
  }, [lockedGradeId, schoolDay, activeAssignments]);

  // Navigation items configuration
  const navItems = [
    { id: 'menu', label: "Today's Lessons", icon: '📅', view: 'menu' as ViewName, studentOnly: true },
    { id: 'library', label: 'My Syllabus', icon: '📚', view: 'library' as ViewName, studentOnly: true },
    { id: 'exams', label: 'Study Camp', icon: '📝', view: 'exams' as ViewName, studentOnly: true },
    { id: 'tutor', label: 'Writing Lab', icon: '✍️', view: 'tutor' as ViewName, studentOnly: true },
    { id: 'progress', label: 'My Progress', icon: '📊', view: 'progress' as ViewName, studentOnly: true },
    { id: 'dashboard', label: "Principal's Office", icon: '🏛️', view: 'dashboard' as ViewName, principalOnly: true },
  ];

  const visibleNavItems = navItems.filter(item => {
      const isAdmin = currentUserProfile?.role === 'principal' || currentUserProfile?.role === 'teacher';
      
      if (item.principalOnly && !isAdmin) return false;
      if ((item as any).studentOnly && isAdmin) return false;
      return true;
  });
  if (isLoading) {
      return <ViewSkeleton />;
  }

  if (!session) {
      return <SaaSLogin />;
  }

  // Bypass paywall for the super-admin (you) or if there's an active subscription
  // Replace this email with your actual login email to bypass the paywall
  const isSuperAdmin = user?.email === 'jaxon@example.com' || user?.email === 'test-school@example.com' || user?.email === 'demo@jaxon.com' || user?.email === 'thelionofjudah888@gmail.com';
  
  if (!hasActiveSubscription && !isSuperAdmin) {
      return <Pricing />;
  }

  if (!currentUser) {
      return <Login onLogin={async (name) => {
          setCurrentUser(name);
          const profile = await UserManager.getProfileByName(name);
          setCurrentUserProfile(profile);
          if (profile?.role === 'principal' || profile?.role === 'teacher') setCurrentView('dashboard');
          else setCurrentView('menu');
      }} />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-white font-sans flex flex-col relative overflow-x-hidden grain-overlay" style={{ fontFamily: 'Inter, Outfit, sans-serif' }}>
      
      {/* ── Lesson Completion Toast ── */}
      <AnimatePresence>
        {completionToast && (
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 280 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-4 px-6 py-4 rounded-2xl bg-[hsl(228,40%,8%)] border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.25)] backdrop-blur-xl"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-xl">⭐</div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-400">Lesson Complete!</p>
              <p className="text-white font-semibold text-sm">{completionToast} has been marked done</p>
            </div>
            <button onClick={() => setCompletionToast(null)} className="ml-2 text-slate-500 hover:text-white transition-colors text-xl">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header NavBar */}
      <header className="absolute top-0 w-full z-50 px-4 md:px-8 py-4 md:py-5 bg-[hsla(228,80%,3%,0.7)] backdrop-blur-2xl border-b border-[var(--border-subtle)] flex justify-between items-center transition-all">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('menu')} onMouseEnter={CardHover}>
          <div className="text-2xl md:text-3xl transition-transform group-hover:scale-110 group-hover:rotate-6">🏛️</div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-[0.12em] uppercase" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Jaxon<span className="font-light text-[var(--accent-blue)]">Academy</span>
          </h1>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex gap-4 items-center">
          {visibleNavItems.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.view)}
              onMouseEnter={CardHover}
              className={`font-semibold tracking-wide uppercase text-xs transition-colors flex items-center gap-1.5 px-2 py-1 ${
                currentView === item.view
                  ? 'text-white border-b-2 border-white pb-0.5'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}

          <div className="w-px h-6 bg-white/20 mx-1"></div>

          <button 
            onClick={() => { SoundManager.playClick(); SoundManager.toggleAudio(); }} 
            onMouseEnter={CardHover} 
            className={`font-semibold tracking-wide uppercase text-xs transition-colors flex items-center gap-1.5 ${audioEnabled ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-slate-400'}`}
          >
            <span>{audioEnabled ? '🔊' : '🔇'}</span>
          </button>

          <div className="flex items-center gap-3 ml-2 border-l border-white/20 pl-4 group cursor-pointer" onClick={() => { setCurrentUser(null); setCurrentView('menu'); }} onMouseEnter={CardHover}>
            <span className="font-semibold text-sm group-hover:text-red-400 transition-colors">{currentUser}</span>
            <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-transparent group-hover:border-white transition-all overflow-hidden">
              <img src={getUserAvatar(currentUser)} alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Mobile Hamburger */}
        <div className="lg:hidden flex items-center gap-3">
          <button 
            onClick={() => { SoundManager.playClick(); setMobileMenuOpen(!mobileMenuOpen); }} 
            className="text-white text-2xl p-2"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-[#040714]/98 backdrop-blur-xl flex flex-col items-center justify-center gap-6 p-8"
          >
            <button onClick={() => setMobileMenuOpen(false)} className="absolute top-6 right-6 text-3xl text-white">✕</button>
            {visibleNavItems.map(item => (
              <button
                key={item.id}
                onClick={() => navigate(item.view)}
                className={`text-2xl font-bold tracking-wider uppercase flex items-center gap-4 py-3 transition-colors ${
                  currentView === item.view ? 'text-white' : 'text-slate-400'
                }`}
              >
                <span className="text-3xl">{item.icon}</span> {item.label}
              </button>
            ))}
            <div className="border-t border-white/10 pt-6 mt-4">
              <button 
                onClick={() => { setCurrentUser(null); setCurrentView('menu'); setMobileMenuOpen(false); }}
                className="text-red-400 font-bold tracking-wider uppercase text-lg"
              >
                Sign Out ({currentUser})
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 flex-grow w-full h-full">
        {/* Cinematic Background Effects */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Global Video Background */}
            <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen"
                src="https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4"
            />
            {/* Ambient Glows */}
            <div className="absolute top-[-10%] left-[5%] w-[700px] h-[700px] bg-[hsla(224,76%,58%,0.05)] rounded-full blur-[160px] ambient-glow"></div>
            <div className="absolute bottom-[-15%] right-[10%] w-[600px] h-[600px] bg-[hsla(280,60%,50%,0.04)] rounded-full blur-[140px] ambient-glow-delay"></div>
            <div className="absolute top-[50%] left-[50%] w-[400px] h-[400px] bg-[hsla(160,60%,45%,0.03)] rounded-full blur-[120px] ambient-glow"></div>
        </div>

        <div className="flex-1 overflow-auto relative h-full z-10">

            <AnimatePresence mode="wait">
              {currentView === 'menu' && (
                <motion.div
                    key="menu"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full min-h-full pb-32 pt-24"
                >
                  <DailySchedule
                    dailySchedule={dailySchedule}
                    currentUser={currentUser}
                    schoolDayLabel={schoolDayLabel}
                    onLaunchLesson={launchLesson}
                    onLaunchExam={(examId) => { setSelectedExam(examId); navigate('exam-runner'); }}
                    onLaunchPdf={(url) => { setSelectedPdfUrl(url); setCurrentView('pdf-viewer'); }}
                  />

                  <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in duration-1000 delay-500 pb-12">
                    <button
                      onClick={() => navigate('library')}
                      className="px-8 py-4 bg-transparent border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-hover)] font-bold rounded-2xl transition-all hover:-translate-y-0.5"
                    >
                      Browse Full Syllabus
                    </button>
                    <button
                      onClick={() => navigate('exams')}
                      className="px-8 py-4 bg-transparent border border-[hsla(280,60%,50%,0.2)] text-[hsla(280,60%,60%,1)] hover:text-[hsla(280,60%,70%,1)] hover:border-[hsla(280,60%,50%,0.4)] font-bold rounded-2xl transition-all hover:-translate-y-0.5"
                    >
                      Enter Study Camp
                    </button>
                  </div>
                </motion.div>
              )}

        {currentView !== 'menu' && (
          <motion.div 
            key={currentView}
            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="pt-20 md:pt-24 px-4 md:px-8 pb-12 w-full min-h-screen relative z-40 bg-[#040714]"
          >
          <Suspense fallback={<ViewSkeleton />}>
            {currentView === 'dashboard' && currentUser === 'Principal' && <ParentDashboard />}
            {currentView === 'library' && (
                <Library 
                    onLaunchLesson={(subjectId) => { launchLesson(subjectId); }}
                    lockedGradeId={lockedGradeId}
                    currentUser={currentUser}
                />
            )}
            {currentView === 'pdf-viewer' && selectedPdfUrl && (
                <div className="w-full h-[85vh] bg-slate-900 rounded-2xl overflow-hidden relative border border-slate-700 shadow-2xl flex flex-col">
                    <div className="flex justify-between items-center bg-slate-950 p-4 shrink-0">
                        <h2 className="text-white font-bold tracking-widest uppercase text-sm">Curriculum Viewer</h2>
                        <button 
                            onClick={() => {
                                SoundManager.playClick();
                                setCurrentView('menu');
                            }}
                            className="bg-rose-900/50 hover:bg-rose-900 text-rose-300 hover:text-white px-4 py-2 rounded-lg font-bold transition-all text-sm border border-rose-500/30"
                        >
                            Close Viewer
                        </button>
                    </div>
                    <div className="flex-1 w-full bg-slate-800">
                        <iframe 
                            src={selectedPdfUrl} 
                            className="w-full h-full border-none"
                            title="PDF Viewer"
                        />
                    </div>
                </div>
            )}
            {currentView === 'exams' && (
                <ConcentratedStudy 
                    lockedGradeId={lockedGradeId}
                    onLaunchExam={(examId) => {
                        if (examId.startsWith('dynamic:')) {
                            launchLesson(examId);
                        } else {
                            setSelectedExam(examId);
                            navigate('exam-runner');
                        }
                    }} 
                />
            )}

            {currentView === 'exam-runner' && selectedExam && currentUser && (
                <ErrorBoundary label="Exam Engine" fallback={
                    <div className="flex flex-col items-center gap-6 py-24">
                        <span className="text-5xl">⚠️</span>
                        <p className="text-slate-400 font-semibold">This exam couldn't load. Please try again.</p>
                        <button onClick={() => navigate('exams')} className="px-6 py-3 bg-[var(--accent-blue)] text-white font-bold rounded-xl hover:opacity-90 transition-all">← Back to Study Camp</button>
                    </div>
                }>
                    <ExamEngine examId={selectedExam} currentUser={currentUser} onExit={() => navigate('exams')} />
                </ErrorBoundary>
            )}

            {currentView === 'lesson' && selectedSubject && currentUser && (
              <ErrorBoundary label="Story Lesson" fallback={
                <div className="flex flex-col items-center gap-6 py-24">
                    <span className="text-5xl">📚</span>
                    <p className="text-slate-400 font-semibold">This lesson hit an unexpected error.</p>
                    <button onClick={() => navigate('menu')} className="px-6 py-3 bg-[var(--accent-blue)] text-white font-bold rounded-xl hover:opacity-90 transition-all">← Back to Dashboard</button>
                </div>
              }>
                {/* Route to age-appropriate lesson engine based on grade */}
                {(currentGrade?.id === 'grade-PK' || currentGrade?.id === 'grade-K') ? (
                    <YoungLearnerEngine 
                        subjectId={selectedSubject} 
                        gradeLevel={currentGrade?.label || 'Pre-K'}
                        studentName={currentUser}
                        teacherGuideUrl={dailySchedule.find(s => s.subjectId === selectedSubject)?.teacherGuideUrl}
                        onBack={() => {
                            if (currentUser) {
                                const subjectTitle = dailySchedule.find(s => s.subjectId === selectedSubject)?.title || 'Lesson';
                                ParentManager.completeAssignmentBySubject(currentUser, selectedSubject).then(() => {
                                    navigate('menu');
                                    setCompletionToast(subjectTitle);
                                });
                            } else { navigate('menu'); }
                        }}
                    />
                ) : (
                    <StoryLessonEngine 
                        subjectId={selectedSubject} 
                        gradeLevel={currentGrade?.label || 'Elementary School'}
                        studentName={currentUser}
                        teacherGuideUrl={dailySchedule.find(s => s.subjectId === selectedSubject)?.teacherGuideUrl}
                        onBack={() => {
                            if (currentUser) {
                                const subjectTitle = dailySchedule.find(s => s.subjectId === selectedSubject)?.title || 'Lesson';
                                ParentManager.completeAssignmentBySubject(currentUser, selectedSubject).then(() => {
                                    navigate('menu');
                                    setCompletionToast(subjectTitle);
                                });
                            } else { navigate('menu'); }
                        }}
                    />
                )}
              </ErrorBoundary>
            )}
            {currentView === 'tutor' && currentUser && (
                <MultiDraftTutor 
                    onExit={() => navigate('menu')}
                    studentName={currentUser}
                    assignmentId="Writing Practice"
                />
            )}
            {currentView === 'progress' && currentUser && (
                <StudentProgress
                    studentName={currentUser}
                    gradeId={lockedGradeId}
                />
            )}
          </Suspense>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
      </main>
    </div>
  );
}
