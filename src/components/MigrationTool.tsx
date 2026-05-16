import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { UserManager, type UserProfile } from '../utils/UserManager';
import { ParentManager } from '../utils/ParentManager';

export const MigrationTool: React.FC = () => {
    const [isMigrating, setIsMigrating] = useState(false);
    const [progress, setProgress] = useState<string>('');
    const [done, setDone] = useState(false);

    const migrateData = async () => {
        setIsMigrating(true);
        setProgress('Starting migration...');
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('You must be logged in to migrate data.');
            const accountId = user.id;

            setProgress('Migrating users...');
            const usersStr = localStorage.getItem('jaxon-academy-users');
            const localUsers: UserProfile[] = usersStr ? JSON.parse(usersStr) : [];
            
            for (const u of localUsers) {
                await UserManager.saveProfile(u);
                if (u.role === 'student' && u.gradeLevel) {
                    await ParentManager.setStudentGrade(u.name, u.gradeLevel);
                }
            }

            setProgress('Migrating progress and adopted subjects...');
            // We'll iterate through all localStorage keys
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key) continue;

                // Migrate completed daily subjects
                if (key.startsWith('jaxon-academy-completed-')) {
                    const studentName = key.replace('jaxon-academy-completed-', '');
                    const val = localStorage.getItem(key);
                    if (val) {
                        const completedSubjects: string[] = JSON.parse(val);
                        for (const sub of completedSubjects) {
                            // Insert dummy record for past progress to maintain state
                            const { error } = await supabase.from('Student_Progress').upsert([{
                                account_id: accountId,
                                student_name: studentName,
                                subject: sub,
                                score: 100,
                                topic: 'Legacy Migration'
                            }], { onConflict: 'account_id,student_name,subject' }).select();
                            if (error) console.error('Migration error:', error);
                        }
                    }
                }

                // Migrate gamification inventory
                if (key.startsWith('jaxon-academy-inventory-')) {
                    const studentName = key.replace('jaxon-academy-inventory-', '');
                    const val = localStorage.getItem(key);
                    if (val) {
                        const items: string[] = JSON.parse(val);
                        for (const item of items) {
                            await ParentManager.grantItem(studentName, item);
                        }
                    }
                }
            }

            setProgress('Migrating assignments...');
            const assignmentsStr = localStorage.getItem('jaxon-academy-assignments');
            if (assignmentsStr) {
                const assignments = JSON.parse(assignmentsStr);
                for (const a of assignments) {
                    const { error } = await supabase.from('assignments').insert({
                        account_id: accountId,
                        student_name: a.studentName,
                        subject_id: a.subjectId,
                        note: a.note || '',
                        completed: a.completed || false,
                        day_of_week: a.dayOfWeek || 'Today'
                    });
                    if (error) console.error('Migration error:', error);
                }
            }

            setProgress('Migration complete! Safe to remove this tool.');
            setDone(true);
        } catch (e: any) {
            console.error(e);
            setProgress(`Error: ${e.message}`);
        } finally {
            setIsMigrating(false);
        }
    };

    return (
        <div className="bg-[hsl(228,40%,10%)] border border-amber-500/50 rounded-2xl p-6 shadow-xl mb-8">
            <h3 className="text-xl font-bold text-amber-400 mb-2">⚠️ Legacy Data Migration Tool</h3>
            <p className="text-slate-300 text-sm mb-4">
                Clicking this button will scan your browser's local storage and safely upload all of your original students, grades, inventory, and assignments into your new secure SaaS account. 
                Do not close the page until it finishes.
            </p>
            <button 
                onClick={migrateData} 
                disabled={isMigrating || done}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg"
            >
                {isMigrating ? 'Migrating...' : done ? 'Migration Finished' : 'Migrate Local Data to Cloud'}
            </button>
            {progress && (
                <p className="mt-4 text-sm font-mono text-slate-400 p-3 bg-black/30 rounded-lg">{progress}</p>
            )}
        </div>
    );
};
