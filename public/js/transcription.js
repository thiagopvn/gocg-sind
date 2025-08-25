// Serverless OpenAI Transcription Service
// Now uses secure serverless proxy for OpenAI API calls
class OpenAITranscriptionService {
    constructor() {
        this.isRecording = false;
        this.isTranscribing = false;
        this.transcriptionCallback = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        
        console.log('🤖 OpenAI Transcription Service initialized with serverless proxy architecture');
    }

    async testMicrophone() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                return { success: false, error: 'MediaDevices API not supported' };
            }

            console.log('Testing microphone access for OpenAI transcription...');
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(device => device.kind === 'audioinput');
            
            if (audioInputs.length === 0) {
                try {
                    console.log('Requesting microphone permissions...');
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    stream.getTracks().forEach(track => track.stop());
                    
                    const newDevices = await navigator.mediaDevices.enumerateDevices();
                    const newAudioInputs = newDevices.filter(device => device.kind === 'audioinput');
                    
                    if (newAudioInputs.length === 0) {
                        return { 
                            success: false, 
                            error: 'No microphone devices found after permission request'
                        };
                    }
                    
                    return { 
                        success: true, 
                        deviceCount: newAudioInputs.length,
                        devices: newAudioInputs.map(d => ({ 
                            id: d.deviceId, 
                            label: d.label || 'Unknown Device' 
                        })),
                        method: 'openai-serverless-proxy'
                    };
                } catch (permissionError) {
                    return { 
                        success: false, 
                        error: `Permission denied: ${permissionError.message}`
                    };
                }
            }

            // Test basic access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            
            return { 
                success: true, 
                deviceCount: audioInputs.length,
                devices: audioInputs.map(d => ({ 
                    id: d.deviceId, 
                    label: d.label || 'Unknown Device' 
                })),
                method: 'openai-serverless-proxy'
            };
        } catch (error) {
            return { 
                success: false, 
                error: error.name === 'NotAllowedError' ? 'Permission denied' : error.message
            };
        }
    }

    async startTranscription(callback) {
        if (this.isTranscribing) {
            return { success: false, error: 'Transcription already running' };
        }

        try {
            this.transcriptionCallback = callback;
            this.isTranscribing = true;

            // Test microphone first
            const micTest = await this.testMicrophone();
            if (!micTest.success) {
                throw new Error(`Microphone test failed: ${micTest.error}`);
            }

            console.log('🎤 Starting OpenAI transcription via serverless proxy...');
            return await this.startSegmentedRecording();
        } catch (error) {
            console.error('Error starting transcription:', error);
            this.isTranscribing = false;
            return { success: false, error: error.message };
        }
    }

    async startSegmentedRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            // Prioritize webm format for better compatibility
            let mediaRecorderOptions;
            
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mediaRecorderOptions = { mimeType: 'audio/webm;codecs=opus' };
                console.log('✅ Using audio format: audio/webm;codecs=opus');
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                mediaRecorderOptions = { mimeType: 'audio/webm' };
                console.log('✅ Using audio format: audio/webm');
            } else {
                console.warn('⚠️ WebM not supported, using browser default format');
                mediaRecorderOptions = undefined;
            }
            
            this.mediaRecorder = mediaRecorderOptions 
                ? new MediaRecorder(stream, mediaRecorderOptions)
                : new MediaRecorder(stream);
            
            console.log('📹 MediaRecorder initialized with mimeType:', this.mediaRecorder.mimeType || 'browser default');

            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = async () => {
                if (this.audioChunks.length > 0) {
                    const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
                    const audioBlob = new Blob(this.audioChunks, { type: mimeType });
                    
                    if (audioBlob.size > 1024) { // Only process if there's meaningful audio data
                        console.log('📹 Processing audio segment via serverless proxy...', audioBlob.size, 'bytes, MIME:', mimeType);
                        await this.processAudioSegment(audioBlob);
                    } else {
                        console.log('⚠️ Audio segment too small, skipping:', audioBlob.size, 'bytes');
                    }
                    
                    this.audioChunks = [];
                }
                
                // Continue recording if still transcribing
                if (this.isTranscribing) {
                    setTimeout(() => {
                        if (this.isTranscribing) {
                            this.mediaRecorder.start(5000); // Record in 5-second segments
                        }
                    }, 100);
                }
            };

            // Start recording in segments
            this.mediaRecorder.start(5000); // 5-second segments
            this.isRecording = true;

            return { success: true, method: 'openai-serverless-proxy' };
        } catch (error) {
            console.error('Error starting segmented recording:', error);
            throw error;
        }
    }

    async processAudioSegment(audioBlob) {
        try {
            console.log('🔄 Sending audio to serverless proxy for processing...');
            
            // Create form data to send to our serverless function
            const formData = new FormData();
            formData.append('audio', audioBlob, 'audio.webm');

            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Proxy API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Unknown proxy error');
            }

            const formattedText = data.formattedText;
            const rawText = data.rawText;

            if (!formattedText || formattedText.trim().length === 0) {
                console.log('⚠️ No text returned from proxy');
                return;
            }

            console.log('📝 Raw transcription:', rawText?.substring(0, 100) + '...');
            console.log('✨ Formatted text:', formattedText.substring(0, 100) + '...');

            // Call the callback with the final result
            if (this.transcriptionCallback) {
                this.transcriptionCallback({
                    text: formattedText,
                    rawText: rawText,
                    confidence: 0.95,
                    isFinal: true,
                    enhanced: true,
                    processingMethod: 'openai-serverless-proxy'
                });
            }
        } catch (error) {
            console.error('❌ Error processing audio via proxy:', error);
            
            // In case of processing error, still try to return something useful
            if (this.transcriptionCallback) {
                this.transcriptionCallback({
                    text: `[Erro no processamento: ${error.message}]`,
                    confidence: 0.0,
                    isFinal: true,
                    error: true,
                    errorMessage: error.message
                });
            }
        }
    }

    stopTranscription() {
        if (!this.isTranscribing) {
            return { success: false, error: 'No transcription running' };
        }

        try {
            this.isTranscribing = false;
            this.isRecording = false;

            if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
                this.mediaRecorder.stop();
                
                // Stop all tracks to release microphone
                if (this.mediaRecorder.stream) {
                    this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
                }
            }

            this.transcriptionCallback = null;
            this.audioChunks = [];

            console.log('🛑 OpenAI transcription stopped successfully');
            return { success: true };
        } catch (error) {
            console.error('Error stopping OpenAI transcription:', error);
            return { success: false, error: error.message };
        }
    }

    isActive() {
        return this.isTranscribing;
    }

    // Enhanced text improvement using serverless proxy
    async enhanceSelectedText(selectedText) {
        try {
            console.log('🔄 Enhancing selected text via serverless proxy...');

            const formData = new FormData();
            formData.append('text', selectedText);
            formData.append('action', 'enhance');

            const response = await fetch('/api/enhance-text', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Text enhancement API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Unknown enhancement error');
            }

            console.log('✨ Text enhanced successfully via serverless proxy');
            return data.enhancedText;

        } catch (error) {
            console.error('❌ Error enhancing text via proxy:', error);
            throw new Error(`Failed to enhance text: ${error.message}`);
        }
    }
}

// Export for use
export { OpenAITranscriptionService };

// Global compatibility - replace the previous services
window.OpenAITranscriptionService = OpenAITranscriptionService;
window.TranscriptionService = OpenAITranscriptionService;
window.GoogleSpeechService = OpenAITranscriptionService; // Override previous service

console.log('🤖 OpenAI Transcription Service (Serverless Proxy) loaded successfully');