import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Login } from './components/Login';
import { ParentDashboard } from './components/ParentDashboard';
import { SoundManager } from './utils/SoundManager';
import curriculumData from './data/curriculum-structure.json';
import { ParentManager } from './utils/ParentManager';
import { StoryLessonEngine } from './components/StoryLessonEngine';
import { Backpack } from './components/Backpack';
import { ConcentratedStudy } from './components/ConcentratedStudy';
import { ExamEngine } from './components/ExamEngine';
import { AdventureGame } from './components/AdventureGame';
import { Library } from './components/Library';
import { SplashScreen } from './components/SplashScreen';
import { AITutor } from './components/AITutor';
import { MultiDraftTutor } from './components/MultiDraftTutor';
import { SatPlacementTest } from './components/SatPlacementTest';

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'menu' | 'dashboard' | 'lesson' | 'exams' | 'exam-runner' | 'library' | 'tutor' | 'adventure' | 'sat-placement' | 'sat-practice'>('menu');
  const [selectedGradeId, setSelectedGradeId] = useState<string>(curriculumData.grades[0].id);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [showBackpack, setShowBackpack] = useState(false);
  const [activeAssignments, setActiveAssignments] = useState<any[]>([]);
  
  const [lockedGradeId, setLockedGradeId] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const unsubscribe = SoundManager.subscribe(() => {
        setAudioEnabled(SoundManager.isAudioEnabled());
    });
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
  }, [currentUser, currentView, showBackpack]); // re-fetch when returning to menu or closing backpack

  if (!currentUser) {
      if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;
      return <Login onLogin={setCurrentUser} />;
  }

  const navigate = (view: typeof currentView) => {
    SoundManager.playClick();
    setCurrentView(view);
    if (view === 'menu') {
        setSelectedSubject(null);
    }
    if (view !== 'exam-runner') setSelectedExam(null);
  };

  const launchLesson = (subjectId: string) => {
    SoundManager.playClick();
    setSelectedSubject(subjectId);
    setCurrentView('lesson');
  };

  const CardHover = () => SoundManager.playHover();

  const currentGrade = curriculumData.grades.find(g => g.id === selectedGradeId);

  return (
    <div className="min-h-screen bg-[#040714] text-white font-sans flex flex-col relative overflow-x-hidden">
      
      {showBackpack && <Backpack currentUser={currentUser} onClose={() => setShowBackpack(false)} />}

      {/* Header NavBar (Cinematic Transparent) */}
      <header className="absolute top-0 w-full z-50 p-6 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center transition-all">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('menu')} onMouseEnter={CardHover}>
          <div className="text-3xl">🏛️</div>
          <h1 className="text-2xl font-extrabold tracking-widest uppercase">Jaxon<span className="font-light text-blue-400">Academy</span></h1>
        </div>
        <div className="flex gap-6 items-center">
          <button onClick={() => navigate('menu')} onMouseEnter={CardHover} className={`font-semibold tracking-wide uppercase text-sm transition-colors ${currentView === 'menu' ? 'text-white border-b-2 border-white pb-1' : 'text-slate-400 hover:text-white'}`}>
            Curriculum Hub
          </button>
          
          <button onClick={() => navigate('library')} onMouseEnter={CardHover} className={`font-semibold tracking-wide uppercase text-sm transition-colors flex items-center gap-2 ${currentView === 'library' ? 'text-amber-400 border-b-2 border-amber-400 pb-1' : 'text-slate-400 hover:text-amber-400'}`}>
            <span>🏛️</span> Archives
          </button>

          <button onClick={() => navigate('exams')} onMouseEnter={CardHover} className={`font-semibold tracking-wide uppercase text-sm transition-colors ${currentView === 'exams' || currentView === 'exam-runner' ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'text-slate-400 hover:text-blue-400'}`}>
            Study Camp
          </button>

          <button onClick={() => navigate('tutor')} onMouseEnter={CardHover} className={`font-semibold tracking-wide uppercase text-sm transition-colors flex items-center gap-2 ${currentView === 'tutor' ? 'text-rose-400 border-b-2 border-rose-400 pb-1' : 'text-slate-400 hover:text-rose-400'}`}>
            <span>✍️</span> Writing Tutor
          </button>

          <div className="w-px h-6 bg-white/20 mx-2"></div>

          <button 
            onClick={() => { SoundManager.playClick(); SoundManager.toggleAudio(); }} 
            onMouseEnter={CardHover} 
            className={`font-semibold tracking-wide uppercase text-sm transition-colors flex items-center gap-2 ${audioEnabled ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-slate-400'}`}
          >
            <span>{audioEnabled ? '🔊 ON' : '🔇 OFF'}</span>
          </button>

          <button 
            onClick={() => { SoundManager.playClick(); setShowBackpack(true); }} 
            onMouseEnter={CardHover} 
            className="font-semibold tracking-wide uppercase text-sm text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-2"
          >
            <span>🎒</span> Backpack
          </button>

          <button onClick={() => navigate('adventure')} onMouseEnter={CardHover} className={`font-semibold tracking-wide uppercase text-sm transition-colors flex items-center gap-2 ${currentView === 'adventure' ? 'text-green-400 border-b-2 border-green-400 pb-1' : 'text-slate-400 hover:text-green-400'}`}>
            <span>🗡️</span> Adventure Mode
          </button>

          {currentUser === 'Principal' && (
            <button onClick={() => navigate('dashboard')} onMouseEnter={CardHover} className={`font-semibold tracking-wide uppercase text-sm transition-colors ${currentView === 'dashboard' ? 'text-white border-b-2 border-white pb-1' : 'text-slate-400 hover:text-white'}`}>
              Parent Portal
            </button>
          )}
          <div className="flex items-center gap-3 ml-4 border-l border-white/20 pl-6 group cursor-pointer" onClick={() => { setCurrentUser(null); setCurrentView('menu'); }} onMouseEnter={CardHover}>
            <span className="font-semibold text-sm group-hover:text-red-400 transition-colors">{currentUser}</span>
            <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-transparent group-hover:border-white transition-all overflow-hidden">
              <img src="/assets/avatar_astronaut.png" alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

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
            <AITutor currentSubjectContext={selectedSubject || (currentView === 'lesson' ? 'Currently in a dynamic lesson.' : null)} />
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
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/20 text-blue-400 font-black text-xs rounded-full uppercase tracking-widest mb-6 border border-blue-500/30">
                  <span>📅</span> Today's Schedule
                </div>
                <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-4 tracking-tighter">Your Learning Pathway</h2>
                <p className="text-xl text-slate-400 font-light max-w-2xl">
                  {currentUser === 'Principal' ? "Previewing the student's daily guided schedule." : `Welcome back, ${currentUser}. Complete these modules in order to finish your school day.`}
                </p>
              </div>

              <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700 delay-150 relative before:absolute before:inset-0 before:ml-8 md:before:ml-10 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-indigo-500 before:to-transparent">
                
                {/* Dynamically Generate Core Daily Subjects Based on Grade */}
                {(() => {
                    if (activeAssignments.length > 0) {
                        return activeAssignments.map(a => ({
                            title: curriculumData.grades.flatMap(g => g.subjects).find(s => s.id === a.subjectId)?.name || "Assigned Module",
                            desc: a.note || "Principal Assigned Lesson",
                            icon: a.subjectId.includes('math') ? "📐" : a.subjectId.includes('sci') ? "🔬" : "📚",
                            color: "from-indigo-600 to-blue-600",
                            type: "lesson",
                            subjectId: a.subjectId,
                            examId: undefined
                        }));
                    }
                    
                    // Generate dynamic schedule from Core Knowledge curriculum
                    const activeGradeObj = curriculumData.grades.find(g => g.id === "grade-6") || curriculumData.grades[0];
                    const subjects = activeGradeObj.subjects.slice(0, 3);
                    return subjects.map((sub, i) => {
                        const firstLesson = sub.lessons?.[0];
                        const titleText = firstLesson?.title || "Lesson 1: Overview";
                        const colors = [
                            "from-blue-600 to-indigo-600",
                            "from-emerald-600 to-teal-600",
                            "from-amber-500 to-orange-600"
                        ];
                        
                        return {
                            title: sub.name,
                            desc: titleText,
                            icon: sub.icon || "📚",
                            color: colors[i % colors.length],
                            type: "lesson",
                            subjectId: firstLesson?.dynamicQuery || `dynamic:${activeGradeObj.label} ${sub.name}`,
                            examId: undefined
                        };
                    });
                })().map((subject, idx) => (
                  <div key={idx} className="relative flex items-center group cursor-pointer"
                      onClick={() => {
                        SoundManager.playClick();
                        if (subject.type === 'exam' && subject.examId) {
                            setSelectedExam(subject.examId);
                            navigate('exam-runner');
                        } else {
                            launchLesson(`dynamic:${subject.title} ${subject.desc}`);
                        }
                      }}>
                    <div className={`flex items-center justify-center w-16 h-16 rounded-2xl border border-white/10 ${subject.type === 'exam' ? 'bg-gradient-to-br from-rose-900/80 to-rose-950 text-rose-300' : 'bg-gradient-to-br from-slate-800/80 to-slate-900'} text-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] transition-all duration-500 shrink-0 z-10 group-hover:scale-110 group-hover:rotate-3 group-hover:border-white/30 ml-0 md:ml-2 backdrop-blur-xl`}>
                      {subject.icon}
                    </div>
                    
                    <div 
                      className="flex-1 ml-4 md:ml-8 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex flex-col md:flex-row md:items-center justify-between gap-4 group-hover:border-white/30 transition-all duration-500 hover:bg-white/[0.08] hover:-translate-y-1 relative overflow-hidden"
                    >
                      {/* Premium internal glow */}
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-r ${subject.color}`}></div>
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${subject.color}`}></div>
                      
                      <div className="flex justify-between items-start w-full relative z-10">
                        <div>
                          <h4 className="text-xl font-extrabold text-white mb-1 group-hover:text-blue-300 transition-colors tracking-tight">{subject.title}</h4>
                          <p className="text-slate-400 font-medium text-sm group-hover:text-slate-300 transition-colors">{subject.desc}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white transition-all duration-500 shadow-inner group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                          <span className="text-white group-hover:text-black text-xl font-black ml-1 transition-colors duration-500">▶</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-16 text-center animate-in fade-in duration-1000 delay-500">
                <button 
                    onClick={() => navigate('library')}
                    className="px-8 py-4 bg-transparent border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 font-bold rounded-xl transition-all"
                >
                    View Full Syllabus Archive
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
            className="pt-24 px-8 pb-12 w-full min-h-screen relative z-40 bg-[#040714]"
          >
            {currentView === 'dashboard' && currentUser === 'Principal' && <ParentDashboard />}
            {currentView === 'library' && <Library lockedGradeId={lockedGradeId} currentUser={currentUser} launchLesson={launchLesson} />}
            {currentView === 'exams' && (
                <ConcentratedStudy 
                    lockedGradeId={lockedGradeId}
                    onLaunchExam={(examId) => {
                        if (examId === 'sat-placement') {
                            navigate('sat-placement');
                        } else if (examId === 'sat-practice') {
                            navigate('sat-practice');
                        } else if (examId.startsWith('dynamic:')) {
                            launchLesson(examId);
                        } else {
                            setSelectedExam(examId);
                            navigate('exam-runner');
                        }
                    }} 
                />
            )}
            {currentView === 'sat-placement' && currentUser && (
                <SatPlacementTest 
                    studentId={currentUser}
                    onComplete={() => navigate('exams')}
                    mode="placement"
                />
            )}
            {currentView === 'sat-practice' && currentUser && (
                <SatPlacementTest 
                    studentId={currentUser}
                    onComplete={() => navigate('exams')}
                    mode="practice"
                    onReviewNeeded={(missedQuestions) => {
                        const prompt = `AI Remediation for missed SAT questions. The student missed the following: ${JSON.stringify(missedQuestions)}. Please review the core concepts.`;
                        launchLesson(`dynamic:${encodeURIComponent(prompt)}`);
                    }}
                />
            )}
            {currentView === 'exam-runner' && selectedExam && currentUser && (
                <ExamEngine examId={selectedExam} currentUser={currentUser} onExit={() => navigate('exams')} />
            )}
            {currentView === 'adventure' && (
                <AdventureGame playerName={currentUser || 'Explorer'} />
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
          </motion.div>
        )}
        </AnimatePresence>
      </div>
      </main>
    </div>
  );
}
