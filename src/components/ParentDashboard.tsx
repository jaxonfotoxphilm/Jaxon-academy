import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { ParentManager, type Assignment } from '../utils/ParentManager';
import curriculumData from '../data/curriculum-structure.json';
import { SoundManager } from '../utils/SoundManager';
import { UserManager, type UserProfile } from '../utils/UserManager';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { motion } from 'framer-motion';
import { useBrand } from '../contexts/BrandContext';
import { MigrationTool } from './MigrationTool';

type Tab = 'overview' | 'progress' | 'assignments' | 'enrollment' | 'users' | 'rewards' | 'report-cards' | 'settings';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface ProgressRecord {
  id: number;
  student_name: string;
  subject: string;
  score: number;
  topic?: string;
  completed_at?: string;
}

const STUDENTS = ["Ayla", "Aria", "Ana", "Donyale", "Aiko", "Ace"];

export const ParentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  // Progress State
  const [records, setRecords] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Analytics State
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const { brand, setBrand } = useBrand();

  const [brandForm, setBrandForm] = useState({
      appName: brand.appName,
      logoUrl: brand.logoUrl || '',
      colorPrimary: brand.colorPrimary
  });

  // Enrollment State
  const [enrollments, setEnrollments] = useState<Record<string, string>>({});

  // Assignment State
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignStudent, setAssignStudent] = useState(STUDENTS[0]);
  const [assignGrade, setAssignGrade] = useState(curriculumData.grades[0].id);
  const [assignSubject, setAssignSubject] = useState(curriculumData.grades[0].subjects[0].id);
  const [assignNote, setAssignNote] = useState('');
  const [customSubjectOverride, setCustomSubjectOverride] = useState('');
  const [reportStudent, setReportStudent] = useState(STUDENTS[0]);
  const [controlStudent, setControlStudent] = useState(STUDENTS[0]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  // User Management State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'student' | 'teacher'>('student');
  const [newUserGrade, setNewUserGrade] = useState(curriculumData.grades[0].id);
  /** Show a brief toast notification (auto-dismisses in 3s) */
  const showToast = useCallback((message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const [assignDay, setAssignDay] = useState('Monday');
  const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const fetchProgress = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('student_progress')
      .select('*')
      .order('id', { ascending: false })
      .limit(50); // Get more records for the admin view
    
    if (data) setRecords(data as ProgressRecord[]);
    setLoading(false);
  };

  const loadLocalData = async () => {
    setLoading(true);
    const profs = await ParentManager.getStudentProfiles();
    const map: Record<string, string> = {};
    profs.forEach(p => map[p.studentName] = p.gradeId);
    setEnrollments(map);
    
    setAssignments(await ParentManager.getAllAssignments());
    setUsers(await UserManager.getProfiles());
    setLoading(false);
  };

  useEffect(() => { 
    fetchProgress(); 
    loadLocalData();
  }, []);

  const handleEnrollmentChange = async (student: string, gradeId: string) => {
    SoundManager.playClick();
    await ParentManager.setStudentGrade(student, gradeId);
    loadLocalData();
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    SoundManager.playClick();
    const finalSubject = customSubjectOverride.trim() ? `dynamic:${customSubjectOverride.trim()}` : assignSubject;
    await ParentManager.assignLesson(assignStudent, finalSubject, assignNote, assignDay);
    setAssignNote('');
    setCustomSubjectOverride('');
    loadLocalData();
  };

  const handleDeleteAssignment = async (id: string) => {
    SoundManager.playClick();
    await ParentManager.deleteAssignment(id);
    loadLocalData();
  };

  const handleGrantBadge = async (student: string, badgeId: string) => {
      SoundManager.playReward();
      await ParentManager.grantItem(student, badgeId);
      const badgeNames: Record<string, string> = {
          badge_math: 'Math Master 🧮',
          badge_science: 'Science Explorer 🔬',
          badge_reading: 'Reading Champion 📚',
      };
      showToast(`${badgeNames[badgeId] || badgeId} granted to ${student}!`);
  };

  const handleAddUser = async () => {
      if (!newUserName.trim()) {
          showToast('Please enter a name.', 'info');
          return;
      }
      SoundManager.playClick();
      
      const seed = newUserName.trim();
      const newAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=ffdfbf,c0aede,b6e3f4`;
      
      const newProfile: UserProfile = {
          name: seed,
          role: newUserRole,
          gradeLevel: newUserRole === 'student' ? newUserGrade : undefined,
          avatarUrl: newAvatarUrl,
          themeColor: 'hsl(200, 65%, 58%)'
      };
      
      await UserManager.saveProfile(newProfile);
      if (newUserRole === 'student') {
          await ParentManager.setStudentGrade(seed, newUserGrade);
      }
      
      setNewUserName('');
      setUsers(await UserManager.getProfiles());
      showToast(`${newUserRole === 'teacher' ? 'Teacher' : 'Student'} ${seed} added successfully!`);
  };

  const handleSaveBranding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('accounts')
        .update({
          app_name: brandForm.appName,
          logo_url: brandForm.logoUrl,
          brand_color_primary: brandForm.colorPrimary,
        })
        .eq('id', user.id);

      if (error) throw error;

      setBrand({
        appName: brandForm.appName,
        logoUrl: brandForm.logoUrl,
        colorPrimary: brandForm.colorPrimary
      });
      showToast('Brand settings saved successfully!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to save brand settings.', 'error' as any);
    }
  };

  const handleGenerateReport = async () => {
      setIsGeneratingReport(true);
      SoundManager.playClick();
      try {
          const { data, error } = await supabase.functions.invoke('generate-principal-report', {
              body: { records }
          });
          if (error || !data || data.error) throw new Error("Failed to generate report");
          setAiReport(data.report);
      } catch (e) {
          console.error(e);
          setAiReport("Failed to generate AI insights. Please check your connection.");
      }
      setIsGeneratingReport(false);
  };

  const handleRefreshLessons = () => {
      SoundManager.playClick();
      const storageKey = `jaxon-academy-completed-${controlStudent}`;
      localStorage.removeItem(storageKey);
      showToast(`Daily lessons refreshed for ${controlStudent}. They will start from the beginning today.`);
  };

  const handleUnlockLesson = async () => {
      SoundManager.playClick();
      // To unlock the NEXT lesson, we need to artificially complete the FIRST incomplete lesson for them.
      // We look up their grade and find what lessons they should have today.
      const studentGradeId = enrollments[controlStudent];
      const gradeData = curriculumData.grades.find(g => g.id === studentGradeId) || curriculumData.grades[0];
      
      // We don't have access to the specific schoolDay here, so we will just blindly pop the first available subject into localStorage.
      const storageKey = `jaxon-academy-completed-${controlStudent}`;
      const completedStr = localStorage.getItem(storageKey);
      const completed: string[] = completedStr ? JSON.parse(completedStr) : [];
      
      // Filter out unadopted
      const subjects = gradeData.subjects.filter(s => localStorage.getItem(`adopted-${s.name}`) !== 'false');
      const uniqueSubjects = subjects.filter((s, i, a) => a.findIndex(t => t.name === s.name) === i).slice(0, 6);
      
      const nextToComplete = uniqueSubjects.find(s => !completed.includes(s.id));
      
      if (!nextToComplete) {
          showToast(`${controlStudent} has already completed all lessons for today!`, 'info');
          return;
      }
      
      // Update local storage
      completed.push(nextToComplete.id);
      localStorage.setItem(storageKey, JSON.stringify(completed));
      
      // Update database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
          await supabase.from('Student_Progress').insert([{
              account_id: user.id,
              student_name: controlStudent,
              subject: nextToComplete.id,
              score: 100,
              topic: `Principal Autocomplete Override`
          }]);
      }
      
      fetchProgress(); // Reload dashboard numbers
      showToast(`Successfully unlocked next lesson by auto-completing ${nextToComplete.name} for ${controlStudent}!`);
  };

  // Metrics
  const totalModules = records.length;
  const examRecords = records.filter(r => r.subject?.includes('[EXAM]'));
  const lessonRecords = records.filter(r => !r.subject?.includes('[EXAM]'));
  
  const averageExamScore = examRecords.length > 0 ? Math.round(examRecords.reduce((acc, curr) => acc + curr.score, 0) / examRecords.length) : 0;
  const averageLessonScore = lessonRecords.length > 0 ? Math.round(lessonRecords.reduce((acc, curr) => acc + curr.score, 0) / lessonRecords.length) : 0;

  // Calculate average scores by subject for the bar chart
  const subjectScores: Record<string, { total: number, count: number }> = {};
  records.forEach(r => {
      const sub = r.subject?.replace('[EXAM] ', '') || 'Unknown';
      if (!subjectScores[sub]) subjectScores[sub] = { total: 0, count: 0 };
      subjectScores[sub].total += r.score;
      subjectScores[sub].count += 1;
  });
  
  const chartData = Object.entries(subjectScores).map(([sub, data]) => ({
      subject: sub,
      average: Math.round(data.total / data.count)
  })).sort((a, b) => b.average - a.average).slice(0, 5); // Top 5 subjects

  return (
    <div className="w-full max-w-[1400px] mx-auto min-h-[85vh] bg-[#0A0D18] rounded-2xl border border-slate-800 shadow-2xl flex overflow-hidden animate-in fade-in duration-500 relative">

      {/* ── In-App Toast Notification ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-300 ${
          toast.type === 'success'
            ? 'bg-[hsl(228,40%,8%)] border-emerald-500/30 text-emerald-300'
            : 'bg-[hsl(228,40%,8%)] border-blue-500/30 text-blue-300'
        }`}>
          <span className="text-xl">{toast.type === 'success' ? '✅' : 'ℹ️'}</span>
          <span className="text-white font-semibold text-sm">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-500 hover:text-white text-lg transition-colors">✕</button>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[hsl(228,40%,7%)] border border-slate-700 rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-white mb-2">Remove Assignment?</h3>
            <p className="text-slate-400 text-sm mb-6">Delete <span className="text-white font-semibold">{deleteConfirm.title}</span>? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all">Cancel</button>
              <button
                onClick={() => { handleDeleteAssignment(deleteConfirm.id); setDeleteConfirm(null); }}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all"
              >Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* --- SIDEBAR --- */}
      <div className="w-64 bg-[#05070D] border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-extrabold text-transparent bg-clip-text uppercase tracking-widest" style={{ backgroundImage: `linear-gradient(to right, ${brand.colorPrimary}, #818cf8)` }}>
                Principal
            </h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Control Panel</p>
        </div>
        
        <div className="flex-1 py-6 flex flex-col gap-2 px-4 overflow-y-auto">
            <button 
                onClick={() => { SoundManager.playClick(); setActiveTab('overview'); }}
                className={`text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3 ${activeTab === 'overview' ? 'text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                style={activeTab === 'overview' ? { backgroundColor: brand.colorPrimary } : {}}
            >
                <span>📈</span> Overview
            </button>
            <button 
                onClick={() => { SoundManager.playClick(); setActiveTab('progress'); }}
                className={`text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3 ${activeTab === 'progress' ? 'text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                style={activeTab === 'progress' ? { backgroundColor: brand.colorPrimary } : {}}
            >
                <span>📋</span> Academics & Exams
            </button>
            <button 
                onClick={() => { SoundManager.playClick(); setActiveTab('assignments'); }}
                className={`text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3 ${activeTab === 'assignments' ? 'text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                style={activeTab === 'assignments' ? { backgroundColor: brand.colorPrimary } : {}}
            >
                <span>📅</span> Scheduling
            </button>
            <button 
                onClick={() => { SoundManager.playClick(); setActiveTab('enrollment'); }}
                className={`text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3 ${activeTab === 'enrollment' ? 'text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                style={activeTab === 'enrollment' ? { backgroundColor: brand.colorPrimary } : {}}
            >
                <span>🎓</span> Enrollment
            </button>
            <button 
                onClick={() => { SoundManager.playClick(); setActiveTab('rewards'); }}
                className={`text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3 ${activeTab === 'rewards' ? 'text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                style={activeTab === 'rewards' ? { backgroundColor: brand.colorPrimary } : {}}
            >
                <span>🏆</span> Rewards Vault
            </button>
            <button 
                onClick={() => { SoundManager.playClick(); setActiveTab('report-cards'); }}
                className={`text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3 ${activeTab === 'report-cards' ? 'text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                style={activeTab === 'report-cards' ? { backgroundColor: brand.colorPrimary } : {}}
            >
                <span>📄</span> Report Cards
            </button>
            <button 
                onClick={() => { SoundManager.playClick(); setActiveTab('users'); }}
                className={`text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3 ${activeTab === 'users' ? 'text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                style={activeTab === 'users' ? { backgroundColor: brand.colorPrimary } : {}}
            >
                <span>👥</span> Manage Users
            </button>
            <button 
                onClick={() => { SoundManager.playClick(); setActiveTab('settings'); }}
                className={`text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3 mt-4 border-t border-slate-800/50 pt-4 ${activeTab === 'settings' ? 'text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                style={activeTab === 'settings' ? { backgroundColor: brand.colorPrimary } : {}}
            >
                <span>⚙️</span> Brand Settings
            </button>
        </div>

        <div className="p-6 border-t border-slate-800">
            <button onClick={fetchProgress} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors flex justify-center items-center gap-2">
                <span className={loading ? "animate-spin" : ""}>🔄</span> Sync Cloud
            </button>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 p-10 overflow-y-auto bg-gradient-to-br from-[#0A0D18] to-[#111625]">
        
        {/* --- OVERVIEW TAB --- */}
        {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <MigrationTool />
                <h3 className="text-3xl font-extrabold text-white mb-8">Dashboard Overview</h3>

                {/* Daily Lesson Controls */}
                <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-xl mb-8">
                    <h4 className="text-xl font-extrabold text-white mb-4 flex items-center gap-2"><span>⚙️</span> Daily Lesson Override</h4>
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <select 
                            value={controlStudent} 
                            onChange={(e) => setControlStudent(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-medium focus:border-blue-500 outline-none min-w-[200px]"
                        >
                            {STUDENTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button 
                            onClick={handleRefreshLessons}
                            className="w-full md:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors border border-slate-700"
                        >
                            🔄 Refresh Today's Lessons
                        </button>
                        <button 
                            onClick={handleUnlockLesson}
                            className="w-full md:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        >
                            🔓 Autocomplete & Unlock Next
                        </button>
                    </div>
                    <p className="text-slate-500 text-sm mt-4">
                        <strong className="text-slate-400">Refresh:</strong> Wipes today's local completion cache so the student starts at Subject 1.<br/>
                        <strong className="text-slate-400">Autocomplete:</strong> Forces the currently locked subject to 100% complete, immediately unlocking the next subject for the student.
                    </p>
                </div>
                
                {records.filter(r => r.subject === 'Placement Test').length > 0 && (
                    <div className="bg-indigo-900/50 border border-indigo-500 p-6 rounded-2xl shadow-xl mb-8 flex items-center justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 font-bold text-xs rounded-full uppercase tracking-widest mb-3">
                                <span>🏆</span> New Placement Results
                            </div>
                            <p className="text-white text-lg">
                                <span className="font-bold">{records.filter(r => r.subject === 'Placement Test')[0].student_name}</span> completed the SAT Placement Test with a score of <span className="font-bold text-indigo-400">{records.filter(r => r.subject === 'Placement Test')[0].score}%</span>.
                            </p>
                            <p className="text-indigo-200 mt-1 font-medium">{records.filter(r => r.subject === 'Placement Test')[0].topic}</p>
                        </div>
                        <div className="text-5xl opacity-80">🎓</div>
                    </div>
                )}

                <motion.div 
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
                    initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                >
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                        <h4 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">Total Modules Completed</h4>
                        <p className="text-5xl font-black text-white">{totalModules}</p>
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                        <h4 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">Average Lesson Score</h4>
                        <p className="text-5xl font-black text-blue-400">{averageLessonScore}%</p>
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                        <h4 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">Average Exam Score</h4>
                        <p className="text-5xl font-black text-purple-400">{averageExamScore}%</p>
                    </motion.div>
                </motion.div>

                {/* Advanced Analytics & Activity Feed */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
                    {/* Visual Bar Chart */}
                    <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-xl">
                        <h4 className="text-xl font-extrabold text-white mb-6">Performance by Subject</h4>
                        <div className="flex flex-col gap-5">
                            {chartData.length === 0 ? (
                                <p className="text-slate-500 italic">Not enough data to chart.</p>
                            ) : (
                                chartData.map(data => (
                                    <div key={data.subject}>
                                        <div className="flex justify-between text-sm font-bold text-slate-300 mb-2">
                                            <span className="truncate max-w-[200px]">{data.subject}</span>
                                            <span>{data.average}%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-3">
                                            <div 
                                                className={`h-3 rounded-full transition-all duration-1000 ${data.average >= 90 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : data.average >= 70 ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-yellow-500'}`} 
                                                style={{ width: `${data.average}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Recent Activity Feed */}
                    <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-xl flex flex-col">
                        <h4 className="text-xl font-extrabold text-white mb-6">Recent Activity</h4>
                        <div className="flex-1 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar flex flex-col gap-4">
                            {records.length === 0 ? (
                                <p className="text-slate-500 italic">No recent activity.</p>
                            ) : (
                                records.slice(0, 10).map((r, idx) => (
                                    <div key={idx} className="flex gap-4 items-start pb-4 border-b border-slate-800/50 last:border-0 last:pb-0">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${r.subject.includes('[ALERT]') ? 'bg-red-900/50 border-red-500' : 'bg-slate-800 border-slate-700'}`}>
                                            {r.subject.includes('[ALERT]') ? '🚨' : r.subject.includes('[EXAM]') ? '📝' : '📖'}
                                        </div>
                                        <div>
                                            <p className="text-slate-300 font-medium">
                                                <span className="font-bold text-white">{r.student_name}</span> 
                                                {r.subject.includes('[ALERT]') ? (
                                                    <span className="text-red-400 ml-1">triggered an anti-skip alert!</span>
                                                ) : (
                                                    <span> completed <span className="text-indigo-300">{r.subject.replace('[EXAM] ', '')}</span></span>
                                                )}
                                            </p>
                                            <p className={`text-xs font-bold tracking-widest mt-1 ${r.subject.includes('[ALERT]') ? 'text-red-500' : 'text-slate-500'}`}>
                                                {r.subject.includes('[ALERT]') ? `MESSAGE: ${r.topic}` : (
                                                    <>SCORE: <span className={r.score >= 80 ? 'text-emerald-400' : 'text-yellow-400'}>{r.score}%</span></>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* AI Insights Panel */}
                <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 p-8 rounded-2xl shadow-xl mb-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h4 className="text-2xl font-extrabold text-white flex items-center gap-3">
                                <span>🧠</span> Principal's AI Insights
                            </h4>
                            <p className="text-indigo-200 mt-1">Generate a comprehensive weekly analytics report powered by Gemini.</p>
                        </div>
                        <button 
                            onClick={handleGenerateReport}
                            disabled={isGeneratingReport || records.length === 0}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)] disabled:opacity-50 flex items-center gap-2"
                        >
                            {isGeneratingReport ? (
                                <><span className="animate-spin">🔄</span> Analyzing...</>
                            ) : (
                                <>✨ Generate Report</>
                            )}
                        </button>
                    </div>

                    {aiReport && (
                        <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-slate-200 prose prose-invert max-w-none animate-in fade-in slide-in-from-bottom-4">
                            {/* Simple markdown parsing for bold and bullets */}
                            {aiReport.split('\n').map((line, idx) => {
                                if (line.startsWith('**') && line.endsWith('**')) return <h5 key={idx} className="text-lg font-bold text-indigo-300 mt-4 mb-2">{line.replace(/\*\*/g, '')}</h5>;
                                if (line.startsWith('* ')) return <li key={idx} className="ml-4 mb-1">{line.replace('* ', '').replace(/\*\*(.*?)\*\*/g, '$1')}</li>;
                                if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) return <h5 key={idx} className="text-lg font-bold text-indigo-300 mt-4 mb-2">{line.replace(/\*\*/g, '')}</h5>;
                                if (line.trim() === '') return <br key={idx} />;
                                return <p key={idx} className="mb-2">{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>;
                            })}
                        </div>
                    )}
                </div>

                <h4 className="text-xl font-bold text-white mb-4 border-b border-slate-800 pb-2">Pending Tasks</h4>
                {assignments.filter(a => !a.completed).length === 0 ? (
                    <p className="text-slate-500 italic">No tasks pending! All scheduled work is completed.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {assignments.filter(a => !a.completed).map(a => (
                            <div key={a.id} className="bg-slate-900 border border-yellow-500/20 p-5 rounded-xl flex justify-between items-center">
                                <div>
                                    <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest">{a.studentName}</span>
                                    <h5 className="font-bold text-slate-200 mt-1">{curriculumData.grades.flatMap(g => g.subjects).find(s => s.id === a.subjectId)?.name || a.subjectId}</h5>
                                </div>
                                <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest">{a.dayOfWeek}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* --- ACADEMICS & EXAMS TAB --- */}
        {activeTab === 'progress' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-3xl font-extrabold text-white mb-8">Academic Records</h3>
                
                <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-slate-500 animate-pulse font-bold tracking-widest uppercase">Fetching Secure Records...</div>
                    ) : records.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">No records found. The student must complete a lesson first.</div>
                    ) : (
                        <table className="w-full text-left text-slate-300 border-collapse">
                        <thead>
                            <tr className="bg-slate-950 border-b border-slate-800">
                                <th className="p-5 font-bold text-slate-400 tracking-widest uppercase text-xs">Student</th>
                                <th className="p-5 font-bold text-slate-400 tracking-widest uppercase text-xs">Type</th>
                                <th className="p-5 font-bold text-slate-400 tracking-widest uppercase text-xs">Module / Exam</th>
                                <th className="p-5 font-bold text-slate-400 tracking-widest uppercase text-xs text-right">Final Grade</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {records.map((r, idx) => {
                                const isExam = r.subject?.includes('[EXAM]') || r.subject?.includes('Placement');
                                return (
                                <tr key={r.id || idx} className="hover:bg-slate-800/50 transition-colors duration-200">
                                    <td className="p-5 font-bold text-white">{r.student_name}</td>
                                    <td className="p-5">
                                        {isExam ? (
                                            <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-xs font-bold uppercase tracking-widest">Exam</span>
                                        ) : (
                                            <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-bold uppercase tracking-widest">Lesson</span>
                                        )}
                                    </td>
                                    <td className={`p-5 font-medium ${isExam ? 'text-white' : 'text-slate-400'}`}>
                                        {r.subject?.replace('[EXAM] ', '')}
                                        {r.topic && <div className="text-xs text-indigo-400 mt-1">{r.topic}</div>}
                                    </td>
                                    <td className="p-5 text-right">
                                        <span className={`font-black text-xl ${r.score >= 90 ? 'text-emerald-400' : r.score >= 70 ? 'text-yellow-400' : 'text-rose-400'}`}>
                                            {r.score}%
                                        </span>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                        </table>
                    )}
                </div>
            </div>
        )}

        {/* --- ENROLLMENT TAB --- */}
        {activeTab === 'enrollment' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-3xl font-extrabold text-white mb-8">Student Enrollment</h3>
                <div className="bg-slate-900 border border-slate-700 p-10 rounded-2xl shadow-xl max-w-3xl">
                    <p className="text-slate-400 mb-8 text-lg">Assign a curriculum grade level to each child. Their dashboard will dynamically adjust curriculum complexity when they log in.</p>
                    
                    <div className="space-y-6">
                        {STUDENTS.map(student => (
                            <div key={student} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-950 border border-slate-800 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-xl">👤</div>
                                    <label className="font-bold text-xl text-white">{student}</label>
                                </div>
                                <select 
                                    value={enrollments[student] || ''} 
                                    onChange={(e) => handleEnrollmentChange(student, e.target.value)}
                                    className="w-full md:w-64 bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                >
                                    <option value="" disabled>Select Grade Level...</option>
                                    {curriculumData.grades.map(g => (
                                        <option key={g.id} value={g.id}>{g.label}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-700 p-10 rounded-2xl shadow-xl max-w-3xl mt-8">
                    <h3 className="text-2xl font-extrabold text-white mb-2">Curriculum Adoption</h3>
                    <p className="text-slate-400 mb-8 text-sm">As the local School Board, toggle which subjects are officially adopted into your curriculum. Rejected subjects are completely hidden from the student's Library.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {curriculumData.grades.flatMap(g => g.subjects).filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i).map(s => {
                            const isAdopted = localStorage.getItem(`adopted-${s.name}`) !== 'false';
                            return (
                                <div key={s.name} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{s.icon}</span>
                                        <span className="font-bold text-white">{s.name}</span>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            localStorage.setItem(`adopted-${s.name}`, (!isAdopted).toString());
                                            window.dispatchEvent(new Event('storage'));
                                            loadLocalData(); // force re-render
                                        }}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${isAdopted ? 'bg-emerald-500' : 'bg-slate-700'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isAdopted ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        )}

        {/* --- SCHEDULING TAB --- */}
        {activeTab === 'assignments' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col xl:flex-row gap-8">
                {/* Create Assignment Form */}
                <form onSubmit={handleCreateAssignment} className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-xl flex flex-col gap-6 xl:w-1/3 h-fit shrink-0">
                    <h3 className="text-2xl font-extrabold text-white mb-2">Schedule Module</h3>
                    
                    <div className="flex flex-col gap-2">
                        <label className="font-bold text-slate-400 text-sm tracking-widest uppercase">Day of Week</label>
                        <select value={assignDay} onChange={e => setAssignDay(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none">
                            {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-bold text-slate-400 text-sm tracking-widest uppercase">Student</label>
                        <select value={assignStudent} onChange={e => setAssignStudent(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none">
                            {STUDENTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-bold text-slate-400 text-sm tracking-widest uppercase">Curriculum Level</label>
                        <select value={assignGrade} onChange={e => {
                            setAssignGrade(e.target.value);
                            const grade = curriculumData.grades.find(g => g.id === e.target.value);
                            if (grade && grade.subjects.length > 0) setAssignSubject(grade.subjects[0].id);
                        }} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none">
                            {curriculumData.grades.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-bold text-slate-400 text-sm tracking-widest uppercase">Subject Module</label>
                        <select value={assignSubject} onChange={e => setAssignSubject(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none" disabled={!!customSubjectOverride}>
                            {curriculumData.grades.find(g => g.id === assignGrade)?.subjects.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-800">
                        <label className="font-bold text-slate-400 text-sm tracking-widest uppercase text-rose-400">Override: Custom Lesson</label>
                        <p className="text-xs text-slate-500 mb-1">Bypass the official curriculum and generate a custom lesson topic.</p>
                        <input 
                            type="text" 
                            placeholder="e.g. History of the Family Farm"
                            value={customSubjectOverride}
                            onChange={e => setCustomSubjectOverride(e.target.value)}
                            className="bg-slate-950 border border-rose-500/30 rounded-xl p-3 text-white focus:border-rose-500 outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-bold text-slate-400 text-sm tracking-widest uppercase">Principal's Note</label>
                        <textarea 
                            value={assignNote} 
                            onChange={e => setAssignNote(e.target.value)} 
                            placeholder="e.g. Please finish this before dinner!"
                            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white h-24 resize-none focus:border-blue-500 outline-none"
                        ></textarea>
                    </div>

                    <button type="submit" className="mt-2 px-8 py-4 bg-blue-600 font-extrabold rounded-xl hover:bg-blue-500 transition-colors shadow-lg">
                        Dispatch to Student
                    </button>
                </form>

                {/* Weekly Schedule View */}
                <div className="flex-1 bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-xl flex flex-col min-h-[600px] overflow-hidden">
                    <h3 className="text-2xl font-extrabold text-white mb-8">The Week Ahead</h3>
                    <div className="flex-1 bg-slate-50 text-slate-900 rounded-xl overflow-hidden p-2">
                        <Calendar
                            localizer={localizer}
                            events={assignments.map(a => {
                                const daysMap: Record<string, number> = {
                                    'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6
                                };
                                const d = new Date();
                                const currentDay = d.getDay();
                                const targetDay = daysMap[a.dayOfWeek || 'Monday'] || 1;
                                const diff = targetDay - currentDay;
                                const start = new Date(d);
                                start.setDate(d.getDate() + diff);
                                start.setHours(9, 0, 0, 0);
                                
                                const end = new Date(start);
                                end.setHours(10, 0, 0, 0);

                                return {
                                    id: a.id,
                                    title: `${a.studentName} - ${curriculumData.grades.flatMap(g => g.subjects).find(s => s.id === a.subjectId)?.name || a.subjectId}`,
                                    start,
                                    end,
                                    allDay: false,
                                    resource: a
                                };
                            })}
                            startAccessor="start"
                            endAccessor="end"
                            defaultView="work_week"
                            views={['month', 'work_week', 'day']}
                            eventPropGetter={(event) => {
                                const a = event.resource as Assignment;
                                return {
                                    className: a.completed ? 'bg-emerald-500' : 'bg-blue-600',
                                    style: {
                                        borderRadius: '6px',
                                        border: 'none',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '11px',
                                        padding: '4px'
                                    }
                                };
                            }}
                            onSelectEvent={(event) => {
                                setDeleteConfirm({ id: event.id as string, title: event.title });
                            }}
                        />
                    </div>
                </div>
            </div>
        )}

        {/* --- REWARDS VAULT TAB --- */}
        {activeTab === 'rewards' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-3xl font-extrabold text-white mb-8 flex items-center gap-4">
                    <span>🏆</span> Rewards Vault
                </h3>
                <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-xl max-w-4xl">
                    <p className="text-slate-400 mb-8 text-lg">Grant digital badges to your students' Backpacks for their achievements!</p>
                    
                    <div className="flex flex-col gap-6">
                        {STUDENTS.map(student => (
                            <div key={student} className="bg-slate-950 border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-slate-700 transition-colors">
                                <div className="flex items-center gap-4 min-w-[150px]">
                                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-xl shadow-inner">👤</div>
                                    <h4 className="text-xl font-bold text-white">{student}</h4>
                                </div>
                                <div className="flex flex-wrap gap-4 flex-1">
                                    <button 
                                        onClick={() => handleGrantBadge(student, 'badge_math')}
                                        className="px-4 py-3 bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 rounded-xl font-bold transition-all flex items-center gap-2 hover:scale-105 shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                                    >
                                        <span className="text-2xl drop-shadow-lg">🧮</span>
                                        <span className="hidden sm:inline">Math Master</span>
                                    </button>
                                    <button 
                                        onClick={() => handleGrantBadge(student, 'badge_science')}
                                        className="px-4 py-3 bg-emerald-500/10 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 rounded-xl font-bold transition-all flex items-center gap-2 hover:scale-105 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                    >
                                        <span className="text-2xl drop-shadow-lg">🔬</span>
                                        <span className="hidden sm:inline">Science Explorer</span>
                                    </button>
                                    <button 
                                        onClick={() => handleGrantBadge(student, 'badge_reading')}
                                        className="px-4 py-3 bg-amber-500/10 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 rounded-xl font-bold transition-all flex items-center gap-2 hover:scale-105 shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                                    >
                                        <span className="text-2xl drop-shadow-lg">📚</span>
                                        <span className="hidden sm:inline">Reading Champion</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* --- REPORT CARDS TAB --- */}
        {activeTab === 'report-cards' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <h3 className="text-3xl font-extrabold text-white flex items-center gap-4">
                        <span>📄</span> Report Cards
                    </h3>
                    <div className="flex items-center gap-4">
                        <select
                            value={reportStudent}
                            onChange={(e) => { SoundManager.playClick(); setReportStudent(e.target.value); }}
                            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold focus:border-blue-500 outline-none"
                        >
                            {STUDENTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button
                            onClick={() => window.print()}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg"
                        >
                            🖨️ Print Transcript
                        </button>
                    </div>
                </div>

                {(() => {
                    const studentRecords = records.filter(r => r.student_name === reportStudent);
                    const enrolledGrade = enrollments[reportStudent];
                    const gradeData = curriculumData.grades.find(g => g.id === enrolledGrade);
                    const subjects = gradeData?.subjects || [];
                    const uniqueSubjects = subjects.filter((s: any, i: number, arr: any[]) => arr.findIndex((t: any) => t.name === s.name) === i);

                    // Build per-subject grade breakdown
                    const subjectGrades = uniqueSubjects.map((subj: any) => {
                        const subjectRecords = studentRecords.filter(r =>
                            r.subject?.toLowerCase().includes(subj.name.toLowerCase())
                        );
                        const count = subjectRecords.length;
                        const avg = count > 0 ? Math.round(subjectRecords.reduce((acc: number, r: ProgressRecord) => acc + r.score, 0) / count) : null;
                        const letter = avg === null ? '—' : avg >= 93 ? 'A' : avg >= 85 ? 'B' : avg >= 77 ? 'C' : avg >= 70 ? 'D' : 'F';
                        const color = avg === null ? 'text-slate-600' : avg >= 93 ? 'text-emerald-400' : avg >= 85 ? 'text-blue-400' : avg >= 77 ? 'text-yellow-400' : avg >= 70 ? 'text-orange-400' : 'text-rose-400';
                        return { name: subj.name, icon: subj.icon || '📖', count, avg, letter, color };
                    });

                    const overallAvg = studentRecords.length > 0
                        ? Math.round(studentRecords.reduce((acc, r) => acc + r.score, 0) / studentRecords.length)
                        : 0;
                    const gpa = overallAvg >= 93 ? '4.0' : overallAvg >= 85 ? '3.0' : overallAvg >= 77 ? '2.0' : overallAvg >= 70 ? '1.0' : '0.0';

                    return (
                        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-xl overflow-hidden print:shadow-none print:border-black" id="report-card-printable">
                            {/* Report Card Header */}
                            <div className="bg-gradient-to-r from-indigo-900/60 to-purple-900/60 p-8 border-b border-slate-800 print:bg-white print:text-black">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-2xl font-black text-white print:text-black">Jaxon Academy — Official Report Card</h4>
                                        <p className="text-indigo-200 font-medium mt-1 print:text-gray-600">{gradeData?.label || 'Unassigned'} • Academic Year {new Date().getFullYear()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-4xl font-black text-white print:text-black">{reportStudent}</p>
                                        <p className="text-indigo-300 font-bold text-sm print:text-gray-500">GPA: {gpa} / 4.0</p>
                                    </div>
                                </div>
                            </div>

                            {/* Grade Table */}
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-950 border-b border-slate-800 print:bg-gray-100">
                                        <th className="p-5 font-bold text-slate-400 tracking-widest uppercase text-xs print:text-black">Subject</th>
                                        <th className="p-5 font-bold text-slate-400 tracking-widest uppercase text-xs text-center print:text-black">Modules</th>
                                        <th className="p-5 font-bold text-slate-400 tracking-widest uppercase text-xs text-center print:text-black">Average</th>
                                        <th className="p-5 font-bold text-slate-400 tracking-widest uppercase text-xs text-center print:text-black">Grade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {subjectGrades.map((sg: any) => (
                                        <tr key={sg.name} className="hover:bg-slate-800/50 transition-colors print:hover:bg-transparent">
                                            <td className="p-5 font-bold text-white print:text-black flex items-center gap-3">
                                                <span className="text-lg">{sg.icon}</span> {sg.name}
                                            </td>
                                            <td className="p-5 text-center text-slate-400 font-medium print:text-gray-600">{sg.count}</td>
                                            <td className="p-5 text-center">
                                                {sg.avg !== null ? (
                                                    <span className={`font-bold ${sg.color} print:text-black`}>{sg.avg}%</span>
                                                ) : (
                                                    <span className="text-slate-600">—</span>
                                                )}
                                            </td>
                                            <td className="p-5 text-center">
                                                <span className={`text-2xl font-black ${sg.color} print:text-black`}>{sg.letter}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-950 border-t-2 border-slate-700 print:bg-gray-100">
                                        <td className="p-5 font-black text-white text-lg print:text-black">Overall</td>
                                        <td className="p-5 text-center font-bold text-white print:text-black">{studentRecords.length}</td>
                                        <td className="p-5 text-center font-black text-white text-lg print:text-black">{overallAvg}%</td>
                                        <td className="p-5 text-center">
                                            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 print:text-black">
                                                {overallAvg >= 93 ? 'A' : overallAvg >= 85 ? 'B' : overallAvg >= 77 ? 'C' : overallAvg >= 70 ? 'D' : studentRecords.length > 0 ? 'F' : '—'}
                                            </span>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>

                            {/* Footer */}
                            <div className="p-6 bg-slate-950 border-t border-slate-800 text-slate-500 text-xs font-medium flex justify-between print:bg-white print:text-gray-400">
                                <span>Generated {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                <span>Jaxon Academy • Accredited Home Education Program</span>
                            </div>
                        </div>
                    );
                })()}
            </div>
        )}

        {activeTab === 'users' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
                        <h3 className="text-2xl font-black text-white mb-6 tracking-tight">Manage Users</h3>
                        
                        {/* Add User Form */}
                        <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-xl mb-8">
                            <h4 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">Add New Profile</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div className="lg:col-span-2">
                                    <input 
                                        type="text" 
                                        value={newUserName}
                                        onChange={e => setNewUserName(e.target.value)}
                                        placeholder="Name (e.g. Jaxon)" 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                <select 
                                    value={newUserRole}
                                    onChange={e => setNewUserRole(e.target.value as 'student' | 'teacher')}
                                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                >
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher (Admin)</option>
                                </select>
                                
                                {newUserRole === 'student' && (
                                    <select 
                                        value={newUserGrade}
                                        onChange={e => setNewUserGrade(e.target.value)}
                                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    >
                                        {curriculumData.grades.map(g => (
                                            <option key={g.id} value={g.id}>{g.label}</option>
                                        ))}
                                    </select>
                                )}
                                
                                <button 
                                    onClick={handleAddUser}
                                    className="lg:col-span-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                                >
                                    + Add
                                </button>
                            </div>
                        </div>

                        {/* Existing Users List */}
                        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-950 border-b border-slate-800">
                                    <tr>
                                        <th className="p-4 font-bold text-slate-400 tracking-widest uppercase text-xs">Profile</th>
                                        <th className="p-4 font-bold text-slate-400 tracking-widest uppercase text-xs">Role</th>
                                        <th className="p-4 font-bold text-slate-400 tracking-widest uppercase text-xs">Grade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {users.map(u => (
                                        <tr key={u.name} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4 font-bold text-white flex items-center gap-3">
                                                <img src={u.avatarUrl} alt={u.name} className="w-10 h-10 rounded-full bg-slate-800" />
                                                {u.name}
                                            </td>
                                            <td className="p-4 text-slate-300 capitalize">{u.role}</td>
                                            <td className="p-4 text-slate-400">{u.gradeLevel || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
                        <h3 className="text-2xl font-black text-white mb-6 tracking-tight">Brand Settings</h3>
                        <p className="text-slate-400 mb-8">Customize your platform's appearance. These settings will apply to your dashboard and login screen (if using a custom domain).</p>
                        
                        <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-xl space-y-6">
                            <div>
                                <label className="block text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">School / Platform Name</label>
                                <input 
                                    type="text" 
                                    value={brandForm.appName}
                                    onChange={e => setBrandForm({...brandForm, appName: e.target.value})}
                                    placeholder="e.g. Oakbridge Academy" 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none transition-colors"
                                    style={{ focusVisible: { borderColor: brand.colorPrimary } } as any}
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Logo URL (Optional)</label>
                                <input 
                                    type="text" 
                                    value={brandForm.logoUrl}
                                    onChange={e => setBrandForm({...brandForm, logoUrl: e.target.value})}
                                    placeholder="https://example.com/logo.png" 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Primary Brand Color (HSL or Hex)</label>
                                <div className="flex gap-4">
                                    <input 
                                        type="text" 
                                        value={brandForm.colorPrimary}
                                        onChange={e => setBrandForm({...brandForm, colorPrimary: e.target.value})}
                                        placeholder="hsl(224, 76%, 58%) or #3b82f6" 
                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none transition-colors"
                                    />
                                    <div 
                                        className="w-12 h-12 rounded-xl border border-slate-700 shrink-0 shadow-inner"
                                        style={{ backgroundColor: brandForm.colorPrimary }}
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handleSaveBranding}
                                className="w-full py-4 text-white font-bold rounded-xl transition-all shadow-xl hover:brightness-110 mt-4"
                                style={{ backgroundColor: brand.colorPrimary }}
                            >
                                Save Brand Settings
                            </button>
                        </div>
                    </div>
                )}
            </div>
      </div>
  );
};