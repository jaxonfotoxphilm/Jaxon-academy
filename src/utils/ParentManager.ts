import { supabase } from '../supabaseClient';

export interface Assignment {
    id: string;
    studentName: string;
    subjectId: string;
    note: string;
    completed: boolean;
    assignedAt: string;
    dayOfWeek?: string;
}

export interface StudentProfile {
    studentName: string;
    gradeId: string;
}

class ParentManagerClass {
    // --- Profiles (Enrollment) ---
    public async getStudentProfiles(): Promise<StudentProfile[]> {
        const { data, error } = await supabase.from('student_profiles').select('*');
        if (error || !data) return [];
        return data.map(d => ({ studentName: d.student_name, gradeId: d.grade_id }));
    }

    public async getStudentGrade(studentName: string): Promise<string | null> {
        const { data, error } = await supabase.from('student_profiles').select('grade_id').eq('student_name', studentName).single();
        if (error || !data) return null;
        return data.grade_id;
    }

    public async setStudentGrade(studentName: string, gradeId: string) {
        // Upsert based on unique student_name
        await supabase.from('student_profiles').upsert({ student_name: studentName, grade_id: gradeId }, { onConflict: 'student_name' });
    }

    // --- Backpack / Inventory (Gamification) ---
    public async getStudentInventory(studentName: string): Promise<string[]> {
        const { data, error } = await supabase.from('student_inventory').select('item_id').eq('student_name', studentName);
        if (error || !data) return [];
        return data.map(d => d.item_id);
    }

    public async grantItem(studentName: string, itemId: string) {
        // Upsert based on unique (student_name, item_id)
        await supabase.from('student_inventory').upsert({ student_name: studentName, item_id: itemId }, { onConflict: 'student_name,item_id' });
    }

    // --- Assignments ---
    public async getAllAssignments(): Promise<Assignment[]> {
        const { data, error } = await supabase.from('assignments').select('*');
        if (error || !data) return [];
        return data.map(d => ({
            id: d.id,
            studentName: d.student_name,
            subjectId: d.subject_id,
            note: d.note || '',
            completed: d.completed,
            assignedAt: d.assigned_at,
            dayOfWeek: d.day_of_week || 'Today'
        }));
    }

    public async getActiveAssignmentsForStudent(studentName: string): Promise<Assignment[]> {
        const { data, error } = await supabase.from('assignments')
            .select('*')
            .eq('student_name', studentName)
            .eq('completed', false);
        if (error || !data) return [];
        return data.map(d => ({
            id: d.id,
            studentName: d.student_name,
            subjectId: d.subject_id,
            note: d.note || '',
            completed: d.completed,
            assignedAt: d.assigned_at,
            dayOfWeek: d.day_of_week || 'Today'
        }));
    }

    public async assignLesson(studentName: string, subjectId: string, note: string, dayOfWeek?: string) {
        await supabase.from('assignments').insert({
            student_name: studentName,
            subject_id: subjectId,
            note: note,
            completed: false,
            day_of_week: dayOfWeek || 'Today'
        });
    }

    public async completeAssignmentBySubject(studentName: string, subjectId: string) {
        await supabase.from('assignments')
            .update({ completed: true })
            .eq('student_name', studentName)
            .eq('subject_id', subjectId)
            .eq('completed', false);
    }
    
    public async deleteAssignment(id: string) {
        await supabase.from('assignments').delete().eq('id', id);
    }
}

export const ParentManager = new ParentManagerClass();
