import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { ParentManager, type Assignment } from '../utils/ParentManager';
import curriculumData from '../data/curriculum-structure.json';
import { SoundManager } from '../utils/SoundManager';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'enrollment' | 'assignments'>('overview');
  
  // Progress State
  const [records, setRecords] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Analytics State
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Enrollment State
  const [enrollments, setEnrollments] = useState<Record<string, string>>({});

  // Assignment State
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignStudent, setAssignStudent] = useState(STUDENTS[0]);
  const [assignGrade, setAssignGrade] = useState(curriculumData.grades[0].id);
  const [assignSubject, setAssignSubject] = useState(curriculumData.grades[0].subjects[0].id);
  const [assignNote, setAssignNote] = useState('');
  const [customSubjectOverride, setCustomSubjectOverride] = useState('');

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

  // Metrics
  const totalModules = records.length;
  const examRecords = records.filter(r => r.subject?.includes('[EXAM]'));
  const lessonRecords = records.filter(r => !r.subject?.includes('[EXAM]'));
  
  const averageExamScore = examRecords.length > 0 ? Math.round(examRecords.reduce((acc, curr) => acc + curr.score, 0) / examRecords.length) : 0;
  const averageLessonScore = lessonRecords.length > 0 ? Math.round(lessonRecords.reduce((acc, curr) => acc + curr.score, 0) / lessonRecords.length) : 0;

  return (
    <div className="w-full max-w-[1400px] mx-auto min-h-[85vh] bg-[#0A0D18] rounded-2xl border border-slate-800 shadow-2xl flex overflow-hidden animate-in fade-in duration-500">
      
      {/* --- SIDEBAR --- */}
      <div className="w-64 bg-[#05070D] border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 uppercase tracking-widest">
                Principal
            </h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Control Panel</p>
        </div>
        
        <div className="flex-1 py-6 flex flex-col gap-2 px-4">
            <button 
                onClick={() => { SoundManager.playClick(); setActiveTab('overview'); }}
                className={`text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3 ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
                <span>📈</span> Overview
            </button>
            <button 
                onClick={() => { SoundManager.playClick(); setActiveTab('progress'); }}
                className={`text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3 ${activeTab === 'progress' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
                <span>📋</span> Academics & Exams
            </button>
            <button 
                onClick={() => { SoundManager.playClick(); setActiveTab('assignments'); }}
                className={`text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3 ${activeTab === 'assignments' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
                <span>📅</span> Scheduling
            </button>
            <button 
                onClick={() => { SoundManager.playClick(); setActiveTab('enrollment'); }}
                className={`text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3 ${activeTab === 'enrollment' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
                <span>🎓</span> Enrollment
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
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-3xl font-extrabold text-white mb-8">Dashboard Overview</h3>
                
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                        <h4 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">Total Modules Completed</h4>
                        <p className="text-5xl font-black text-white">{totalModules}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                        <h4 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">Average Lesson Score</h4>
                        <p className="text-5xl font-black text-blue-400">{averageLessonScore}%</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                        <h4 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">Average Exam Score</h4>
                        <p className="text-5xl font-black text-purple-400">{averageExamScore}%</p>
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
                                if(window.confirm(`Delete assignment for ${event.title}?`)) {
                                    handleDeleteAssignment(event.id as string);
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};