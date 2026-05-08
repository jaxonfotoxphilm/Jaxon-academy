import { supabase } from '../supabaseClient.ts';

export const saveProgress = async (name: string, subject: string, score: number) => {
  const { error } = await supabase
    .from('Student_Progress')
    .insert([
      { student_name: name, subject: subject, score: score, level_reached: 1 }
    ]);

  if (error) console.error('Error saving excellence score:', error);
};