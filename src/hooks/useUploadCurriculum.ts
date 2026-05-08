import { useState } from 'react';
import { supabase } from '../supabaseClient';

export interface UploadState {
    isLoading: boolean;
    error: string | null;
    publicUrl: string | null;
}

export const useUploadCurriculum = () => {
    const [uploadState, setUploadState] = useState<UploadState>({
        isLoading: false,
        error: null,
        publicUrl: null,
    });

    const uploadFile = async (file: File) => {
        setUploadState({ isLoading: true, error: null, publicUrl: null });

        if (file.type !== 'application/pdf') {
            setUploadState({ isLoading: false, error: 'Only PDF files are supported.', publicUrl: null });
            return;
        }

        try {
            // Retrieve session to pass Authorization header
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) throw sessionError;

            const token = sessionData.session?.access_token;

            const formData = new FormData();
            formData.append('file', file);

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wqdutfydbpauecefaswi.supabase.co';

            let attempt = 0;
            const maxRetries = 2;
            let success = false;
            let resultUrl: string | null = null;
            let lastError: Error | null = null;

            while (attempt <= maxRetries && !success) {
                try {
                    const response = await fetch(`${supabaseUrl}/functions/v1/upload-pdf`, {
                        method: 'POST',
                        headers: {
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                        },
                        body: formData,
                    });

                    if (!response.ok) {
                        const errText = await response.text();
                        throw new Error(`Upload failed: ${errText}`);
                    }

                    const result = await response.json();
                    
                    if (result.error) {
                        throw new Error(result.error);
                    }

                    resultUrl = result.url;
                    success = true;
                } catch (err: unknown) {
                    lastError = err instanceof Error ? err : new Error(String(err));
                    attempt++;
                    if (attempt <= maxRetries) {
                        // Exponential backoff retry
                        await new Promise(res => setTimeout(res, 1000 * attempt));
                    }
                }
            }

            if (!success && lastError) {
                throw lastError;
            }

            setUploadState({ isLoading: false, error: null, publicUrl: resultUrl });
        } catch (error: unknown) {
            const errObj = error instanceof Error ? error : new Error(String(error));
            setUploadState({ isLoading: false, error: errObj.message, publicUrl: null });
        }
    };

    const resetState = () => {
        setUploadState({ isLoading: false, error: null, publicUrl: null });
    };

    return { ...uploadState, uploadFile, resetState };
};
