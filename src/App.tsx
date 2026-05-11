import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Login } from './components/Login';
import { ParentDashboard } from './components/ParentDashboard';
import { SoundManager } from './utils/SoundManager';
import curriculumData from './data/curriculum-structure.json';
import { ParentManager } from './utils/ParentManager';
import { StoryLessonEngine } from './components/StoryLessonEngine';
import { ConcentratedStudy } from './components/ConcentratedStudy';
import { ExamEngine } from './components/ExamEngine';
import { Library } from './components/Library';
import { MultiDraftTutor } from './components/MultiDraftTutor';
import { StudentProgress } from './components/StudentProgress';
import { useSchoolDay } from './hooks/useSchoolDay';

type ViewName = 'menu' | 'dashboard' | 'lesson' | 'exams' | 'exam-runner' | 'library' | 'tutor' | 'pdf-viewer' | 'progress';

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewName>('menu');
  const [selectedGradeId, setSelectedGradeId] = useState<string>(curriculumData.grades[0].id);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [activeAssignments, setActiveAssignments] = useState<any[]>([]);
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
          if (enrolledGrade) {
              setSelectedGradeId(enrolledGrade);
              setLockedGradeId(enrolledGrade);
          } else if (currentUser !== 'Principal') {
              // Automatically sync new student profiles with a default assigned grade level
              const defaultGrades: Record<string, string> = {
                  'Ayla': 'grade-1', 'Aria': 'grade-3', 'Ana': 'grade-5',
                  'Donyale': 'grade-7', 'Aiko': 'grade-9', 'Ace': 'grade-11'
              };
              const fallback = defaultGrades[currentUser] || 'grade-1';
              await ParentManager.setStudentGrade(currentUser, fallback);
              setLockedGradeId(fallback);
          } else {
              setLockedGradeId(null);
          }
          const assignments = await ParentManager.getActiveAssignmentsForStudent(currentUser);
          setActiveAssignments(assignments);
          
          SoundManager.setUser(currentUser);
          setAudioEnabled(SoundManager.isAudioEnabled());
      }
    };
    fetchUserData();
  }, [currentUser, currentView]);

  if (!currentUser) {
      return <Login onLogin={setCurrentUser} />;
  }

  const navigate = (view: ViewName) => {
    SoundManager.playClick();
    setCurrentView(view);
    setMobileMenuOpen(false);
    if (view === 'menu') {
        setSelectedSubject(null);
    }
    if (view !== 'exam-runner') setSelectedExam(null);
  };

  const launchLesson = (subjectId: string) => {
    SoundManager.playClick();
    setSelectedSubject(subjectId);
    setCurrentView('lesson');
    setMobileMenuOpen(false);
  };

  const CardHover = () => SoundManager.playHover();

  const currentGrade = curriculumData.grades.find(g => g.id === selectedGradeId);

  /** 
   * Build the Daily Schedule — uses school day number to look up today's specific lesson
   * for each subject in the student's enrolled grade.
   */
  const buildDailySchedule = () => {
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
            examId: undefined
        }));
    }
    
    // Generate daily schedule from curriculum structure using the school day
    const gradeData = curriculumData.grades.find(g => g.id === lockedGradeId) || curriculumData.grades[0];
    let subjects = gradeData.subjects;
    
    // Filter adopted subjects
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
            examId: undefined
        };
    });
  };

  const dailySchedule = buildDailySchedule();

  // Navigation items configuration
  const navItems = [
    { id: 'menu', label: "Today's Lessons", icon: '📅', view: 'menu' as ViewName, always: true },
    { id: 'library', label: 'My Syllabus', icon: '📚', view: 'library' as ViewName, always: true },
    { id: 'exams', label: 'Study Camp', icon: '📝', view: 'exams' as ViewName, always: true },
    { id: 'tutor', label: 'Writing Lab', icon: '✍️', view: 'tutor' as ViewName, always: true },
    { id: 'progress', label: 'My Progress', icon: '📊', view: 'progress' as ViewName, studentOnly: true },
    { id: 'dashboard', label: "Principal's Office", icon: '🏛️', view: 'dashboard' as ViewName, principalOnly: true },
  ];

  const visibleNavItems = navItems.filter(item => {
      if (item.principalOnly && currentUser !== 'Principal') return false;
      if ((item as any).studentOnly && currentUser === 'Principal') return false;
      return true;
  });

  return (
    <div className="min-h-screen bg-[#040714] text-white font-sans flex flex-col relative overflow-x-hidden">
      


      {/* Header NavBar */}
      <header className="absolute top-0 w-full z-50 p-4 md:p-6 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center transition-all">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('menu')} onMouseEnter={CardHover}>
          <div className="text-2xl md:text-3xl">🏛️</div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-widest uppercase">Jaxon<span className="font-light text-blue-400">Academy</span></h1>
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
              <img src="/assets/avatar_astronaut.png" alt="Profile" className="w-full h-full object-cover" />
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
        {/* Cinematic Video Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <video 
                src="https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4" 
                className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen"
                autoPlay loop muted playsInline
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#040614]/95 via-[#0a102e]/85 to-[#040614]/95 backdrop-blur-[2px]"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
            
            {/* Ambient glowing orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen"></div>
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
                    className="w-full min-h-full pb-32"
                >
            
            {/* GUIDED DAILY PATHWAY */}
            <div className="max-w-5xl mx-auto px-6 py-12">
              <div className="mb-12 border-b border-white/10 pb-8 animate-in slide-in-from-top-8 duration-700">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/20 text-blue-400 font-black text-xs rounded-full uppercase tracking-widest border border-blue-500/30">
                    <span>📅</span> Today's Schedule
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/15 text-emerald-400 font-black text-xs rounded-full uppercase tracking-widest border border-emerald-500/25">
                    <span>📆</span> {schoolDayLabel}
                  </div>
                </div>
                <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tighter">Your Learning Pathway</h2>
                <p className="text-lg md:text-xl text-slate-400 font-light max-w-2xl">
                  {currentUser === 'Principal' ? "Previewing the student's daily guided schedule." : `Welcome back, ${currentUser}. Complete these modules in order to finish your school day.`}
                </p>
              </div>

              <div className="space-y-5 animate-in slide-in-from-bottom-8 duration-700 delay-150 relative before:absolute before:inset-0 before:ml-8 md:before:ml-10 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-indigo-500 before:to-transparent">
                
                {dailySchedule.map((subject, idx) => {
                  /**
                   * Lesson Locking System:
                   * - Reads completed lessons from localStorage
                   * - Only the FIRST incomplete lesson is unlocked (clickable)
                   * - Completed lessons show a ✅ checkmark
                   * - Future lessons show a 🔒 lock
                   */
                  const completedKey = `jaxon-academy-completed-${currentUser}`;
                  const completedLessons: string[] = JSON.parse(localStorage.getItem(completedKey) || '[]');
                  const isCompleted = completedLessons.includes(subject.subjectId);

                  // Find the first incomplete lesson index
                  const firstIncompleteIdx = dailySchedule.findIndex(s => !completedLessons.includes(s.subjectId));
                  const isUnlocked = isCompleted || idx === firstIncompleteIdx;
                  const isLocked = !isUnlocked;

                  return (
                  <div key={idx} className={`relative flex items-center group ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      onClick={() => {
                        if (isLocked) {
                            SoundManager.playClick();
                            return;
                        }
                        SoundManager.playClick();
                        if (subject.type === 'exam' && subject.examId) {
                            setSelectedExam(subject.examId);
                            navigate('exam-runner');
                        } else if (typeof subject.subjectId === 'string' && subject.subjectId.endsWith('.pdf')) {
                            setSelectedPdfUrl(subject.subjectId);
                            setCurrentView('pdf-viewer');
                        } else {
                            launchLesson(subject.subjectId);
                        }
                      }}>
                    <div className={`flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl border bg-gradient-to-br from-slate-800/80 to-slate-900 text-2xl md:text-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] transition-all duration-500 shrink-0 z-10 ml-0 md:ml-2 backdrop-blur-xl ${
                        isCompleted ? 'border-emerald-500/40 group-hover:scale-110' : 
                        isLocked ? 'border-white/5' : 
                        'border-white/10 group-hover:scale-110 group-hover:rotate-3 group-hover:border-white/30'
                    }`}>
                      {isCompleted ? '✅' : isLocked ? '🔒' : subject.icon}
                    </div>
                    
                    <div 
                      className={`flex-1 ml-4 md:ml-8 backdrop-blur-2xl border rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 transition-all duration-500 relative overflow-hidden ${
                          isCompleted ? 'bg-emerald-500/[0.04] border-emerald-500/20' :
                          isLocked ? 'bg-white/[0.01] border-white/5' :
                          'bg-white/[0.03] border-white/10 group-hover:border-white/30 hover:bg-white/[0.08] hover:-translate-y-1'
                      }`}
                    >
                      {/* Premium internal glow */}
                      {!isLocked && <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-r ${subject.color}`}></div>}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${isCompleted ? 'from-emerald-500 to-emerald-700' : isLocked ? 'from-slate-700 to-slate-800' : subject.color}`}></div>
                      
                      <div className="flex justify-between items-start w-full relative z-10">
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-lg md:text-xl font-extrabold mb-1 tracking-tight transition-colors ${
                              isCompleted ? 'text-emerald-400' : isLocked ? 'text-slate-500' : 'text-white group-hover:text-blue-300'
                          }`}>
                              {subject.title}
                              {isCompleted && <span className="ml-2 text-xs font-bold text-emerald-500 uppercase tracking-widest">Complete</span>}
                          </h4>
                          <p className={`font-medium text-xs md:text-sm truncate ${isLocked ? 'text-slate-600' : 'text-slate-400 group-hover:text-slate-300'} transition-colors`}>{subject.desc}</p>
                        </div>
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border flex items-center justify-center transition-all duration-500 shadow-inner shrink-0 ml-3 ${
                            isCompleted ? 'bg-emerald-500/10 border-emerald-500/30' :
                            isLocked ? 'bg-white/[0.02] border-white/5' :
                            'bg-white/5 border-white/10 group-hover:bg-white group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                        }`}>
                          <span className={`text-lg md:text-xl font-black ml-0.5 transition-colors duration-500 ${
                              isCompleted ? 'text-emerald-400' : isLocked ? 'text-slate-700' : 'text-white group-hover:text-black'
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
              
              <div className="mt-16 flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in duration-1000 delay-500">
                <button 
                    onClick={() => navigate('library')}
                    className="px-8 py-4 bg-transparent border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 font-bold rounded-xl transition-all"
                >
                    Browse Full Syllabus
                </button>
                <button 
                    onClick={() => navigate('exams')}
                    className="px-8 py-4 bg-transparent border border-purple-700/50 text-purple-400 hover:text-purple-300 hover:border-purple-500/50 font-bold rounded-xl transition-all"
                >
                    Enter Study Camp
                </button>
              </div>

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
            {currentView === 'dashboard' && currentUser === 'Principal' && <ParentDashboard />}
            {currentView === 'library' && (
                <Library 
                    onLaunchLesson={(subjectId) => {
                        launchLesson(subjectId);
                    }}
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
                <ExamEngine examId={selectedExam} currentUser={currentUser} onExit={() => navigate('exams')} />
            )}

            {currentView === 'lesson' && selectedSubject && currentUser && (
              <StoryLessonEngine 
                subjectId={selectedSubject} 
                gradeLevel={currentGrade?.label || 'Elementary School'}
                studentName={currentUser}
                onBack={() => {
                    // Mark assignment complete if it exists
                    if (currentUser) {
                        ParentManager.completeAssignmentBySubject(currentUser, selectedSubject).then(() => {
                            navigate('menu');
                        });
                    } else {
                        navigate('menu');
                    }
                }} 
              />
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
          </motion.div>
        )}
        </AnimatePresence>
      </div>
      </main>
    </div>
  );
}
