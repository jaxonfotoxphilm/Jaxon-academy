import { supabase } from '../supabaseClient';

export interface CopyleaksReport {
    originalityScore: number;
    aiProbability: number;
    status: 'pass' | 'fail';
    feedback: string;
}

export class CopyleaksService {
    /**
     * Sends a payload to the backend Edge Function for originality and AI detection checking.
     * The Edge Function securely communicates with the Copyleaks API.
     */
    static async scanDraft(text: string): Promise<CopyleaksReport> {
        try {
            const { data, error } = await supabase.functions.invoke('copyleaks', {
                body: { draftText: text }
            });

            if (error) {
                console.error("Edge Function Error:", error);
                throw error;
            }

            if (data?.error) {
                console.error("Backend Error:", data.error);
                throw new Error(data.error);
            }

            return data as CopyleaksReport;
        } catch (error) {
            console.error("CopyleaksService Error:", error);
            return {
                originalityScore: 0,
                aiProbability: 0,
                status: 'fail',
                feedback: "Unable to verify submission originality at this time. Please try again later."
            };
        }
    }
}
