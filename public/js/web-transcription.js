// Web Transcription Service (Browser-based Speech Recognition)
class WebTranscriptionService {
    constructor() {
        this.isRecording = false;
        this.isTranscribing = false;
        this.recognition = null;
        this.transcriptionCallback = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.init();
    }

    init() {
        try {
            // Check for Web Speech API support
            if ('webkitSpeechRecognition' in window) {
                this.recognition = new webkitSpeechRecognition();
            } else if ('SpeechRecognition' in window) {
                this.recognition = new SpeechRecognition();
            } else {
                console.warn('🚨 Web Speech API not supported - using fallback');
                return;
            }

            // Configure speech recognition
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'pt-BR';
            
            // Add alternative languages
            this.recognition.alternativeLanguages = ['pt-PT', 'en-US'];

            console.log('🎤 Web Speech Recognition initialized');
        } catch (error) {
            console.error('❌ Error initializing Web Speech Recognition:', error);
        }
    }

    async testMicrophone() {
        try {
            // Check if mediaDevices is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                return { success: false, error: 'MediaDevices API not supported' };
            }

            // Enumerate devices with detailed logging
            console.log('Enumerating media devices...');
            const devices = await navigator.mediaDevices.enumerateDevices();
            console.log('All detected devices:', devices);
            
            const audioInputs = devices.filter(device => device.kind === 'audioinput');
            const videoInputs = devices.filter(device => device.kind === 'videoinput');
            const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
            
            console.log('Audio inputs:', audioInputs);
            console.log('Video inputs:', videoInputs);
            console.log('Audio outputs:', audioOutputs);
            
            if (audioInputs.length === 0) {
                // Try to request permissions first to see if that reveals devices
                try {
                    console.log('No audio inputs found, trying to request permissions...');
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    stream.getTracks().forEach(track => track.stop());
                    
                    // Re-enumerate after permission request
                    const newDevices = await navigator.mediaDevices.enumerateDevices();
                    const newAudioInputs = newDevices.filter(device => device.kind === 'audioinput');
                    console.log('Devices after permission request:', newDevices);
                    console.log('Audio inputs after permission:', newAudioInputs);
                    
                    if (newAudioInputs.length === 0) {
                        return { 
                            success: false, 
                            error: 'No microphone devices found even after permission request',
                            debugInfo: {
                                totalDevices: devices.length,
                                audioInputs: audioInputs.length,
                                videoInputs: videoInputs.length,
                                audioOutputs: audioOutputs.length,
                                allDevices: devices
                            }
                        };
                    }
                    
                    return { 
                        success: true, 
                        deviceCount: newAudioInputs.length,
                        devices: newAudioInputs.map(d => ({ id: d.deviceId, label: d.label || 'Unknown Device' }))
                    };
                } catch (permissionError) {
                    console.error('Permission request failed:', permissionError);
                    return { 
                        success: false, 
                        error: `No microphone devices found. Permission error: ${permissionError.message}`,
                        debugInfo: {
                            totalDevices: devices.length,
                            audioInputs: audioInputs.length,
                            videoInputs: videoInputs.length,
                            audioOutputs: audioOutputs.length,
                            permissionError: permissionError.name
                        }
                    };
                }
            }

            // Test basic access with existing devices
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop()); // Clean up immediately
            
            return { 
                success: true, 
                deviceCount: audioInputs.length,
                devices: audioInputs.map(d => ({ id: d.deviceId, label: d.label || 'Unknown Device' }))
            };
        } catch (error) {
            return { 
                success: false, 
                error: error.name === 'NotAllowedError' ? 'Permission denied' : error.message,
                debugInfo: { errorName: error.name, errorMessage: error.message }
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

            if (this.recognition) {
                // Use Web Speech API
                return this.startWebSpeechRecognition();
            } else {
                // Fallback to MediaRecorder
                return this.startMediaRecorderTranscription();
            }
        } catch (error) {
            console.error('Error starting transcription:', error);
            this.isTranscribing = false;
            return { success: false, error: error.message };
        }
    }

    startWebSpeechRecognition() {
        return new Promise((resolve, reject) => {
            this.recognition.onstart = () => {
                console.log('🎤 Web Speech Recognition started');
                this.isRecording = true;
                resolve({ success: true });
            };

            this.recognition.onresult = (event) => {
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    const transcript = result[0].transcript;
                    
                    if (this.transcriptionCallback) {
                        this.transcriptionCallback({
                            text: transcript,
                            confidence: result[0].confidence,
                            isFinal: result.isFinal
                        });
                    }
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'not-allowed') {
                    reject(new Error('Microphone access denied'));
                } else if (event.error === 'no-speech') {
                    console.warn('No speech detected, continuing...');
                } else {
                    reject(new Error(`Speech recognition error: ${event.error}`));
                }
            };

            this.recognition.onend = () => {
                console.log('🛑 Speech recognition ended');
                if (this.isTranscribing) {
                    // Restart recognition if still transcribing
                    setTimeout(() => {
                        if (this.isTranscribing) {
                            this.recognition.start();
                        }
                    }, 100);
                }
            };

            this.recognition.start();
        });
    }

    async startMediaRecorderTranscription() {
        // Fallback implementation using MediaRecorder
        // This would need server-side processing or client-side speech-to-text library
        console.log('🎤 Starting MediaRecorder transcription (fallback)');
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (event) => {
            this.audioChunks.push(event.data);
        };

        this.mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
            // Here you would send the audio to a transcription service
            console.log('📹 Audio recorded, would send to transcription service');
            
            if (this.transcriptionCallback) {
                this.transcriptionCallback({
                    text: '[Transcrição seria processada por serviço externo]',
                    confidence: 0.8,
                    isFinal: true
                });
            }
        };

        this.mediaRecorder.start(1000); // Record in 1-second chunks
        this.isRecording = true;

        return { success: true };
    }

    stopTranscription() {
        if (!this.isTranscribing) {
            return { success: false, error: 'No transcription running' };
        }

        try {
            this.isTranscribing = false;
            this.isRecording = false;

            if (this.recognition) {
                this.recognition.stop();
            }

            if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
                this.mediaRecorder.stop();
                this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            }

            this.transcriptionCallback = null;
            this.audioChunks = [];

            console.log('🛑 Transcription stopped successfully');
            return { success: true };
        } catch (error) {
            console.error('Error stopping transcription:', error);
            return { success: false, error: error.message };
        }
    }

    isActive() {
        return this.isTranscribing;
    }
}

// Export for use
export { WebTranscriptionService };

// Global compatibility
window.TranscriptionService = WebTranscriptionService;

console.log('🌐 Web Transcription Service loaded');