export class SpeechService {
    static isSupported() {
        return 'speechSynthesis' in window && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    }

    static speak(text: string, onEnd?: () => void) {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel(); // Stop any current speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9; // Slightly slower for younger learners
        utterance.pitch = 1.0;
        
        if (onEnd) {
            utterance.onend = onEnd;
        }

        window.speechSynthesis.speak(utterance);
    }

    static stop() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }

    /**
     * Starts continuous speech recognition and returns a function to stop it.
     */
    static startListening(onResult: (text: string) => void, onError: (error: any) => void): () => void {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            onError(new Error("Speech recognition not supported in this browser."));
            return () => {};
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        let finalTranscript = '';

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' ';
                    onResult(finalTranscript);
                } else {
                    interimTranscript += event.results[i][0].transcript;
                    onResult(finalTranscript + interimTranscript);
                }
            }
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            onError(event.error);
        };

        try {
            recognition.start();
        } catch (e) {
            onError(e);
        }

        return () => {
            try {
                recognition.stop();
            } catch (e) {
                // Ignore
            }
        };
    }
}
