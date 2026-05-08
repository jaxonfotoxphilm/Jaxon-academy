import { supabase } from '../supabaseClient';

export class GeminiService {
    /**
     * Sends a student's draft to the backend for evaluation against provided CK-12 context material.
     * Uses Supabase Edge Functions instead of exposing the API key on the client.
     */
    static async getTutoringFeedback(studentDraft: string, ck12Context: string): Promise<string> {
        try {
            const { data, error } = await supabase.functions.invoke('tutor', {
                body: { studentDraft, ck12Context }
            });

            if (error) {
                console.error("Edge Function Error:", error);
                throw error;
            }

            if (data?.error) {
                console.error("Backend Error:", data.error);
                return "The backend reported an error: " + data.error;
            }

            if (data?.feedback) {
                return data.feedback;
            }

            return "Received an unexpected response from the AI Tutor.";
        } catch (error) {
            console.error("GeminiService Error:", error);
            return "I'm having trouble connecting to my neural network right now. Please save your draft and try again later!";
        }
    }
}
