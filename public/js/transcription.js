// OpenAI Whisper + GPT-4 Transcription Service
class OpenAITranscriptionService {
    constructor() {
        this.isRecording = false;
        this.isTranscribing = false;
        this.transcriptionCallback = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioSegments = [];
        this.openaiApiKey = null;
        
        this.init();
    }

    async init() {
        try {
            await this.loadOpenAIApiKey();
            console.log('🤖 OpenAI Transcription Service initialized with Whisper + GPT-4 processing');
        } catch (error) {
            console.error('❌ Error initializing OpenAI Transcription Service:', error);
        }
    }

    async loadOpenAIApiKey() {
        try {
            // For web deployment, we'll need to handle the API key securely
            // Since this is a serverless web app, we'll use environment variables approach
            this.openaiApiKey = await this.getApiKeyFromEnvironment();
            
            if (!this.openaiApiKey) {
                throw new Error('OpenAI API key not found in environment');
            }
            
            console.log('✅ OpenAI API key loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load OpenAI API key:', error);
            throw error;
        }
    }

    async getApiKeyFromEnvironment() {
        try {
            // For development mode, check window.OPENAI_API_KEY first
            if (window.OPENAI_API_KEY) {
                console.warn('⚠️ Using API key from window.OPENAI_API_KEY (development mode)');
                return window.OPENAI_API_KEY;
            }
            
            // Try serverless endpoint for production
            try {
                console.log('🔐 Fetching OpenAI API key from secure endpoint...');
                
                const response = await fetch('/api/get-openai-key', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    cache: 'no-cache'
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.apiKey) {
                        console.log('✅ OpenAI API key retrieved securely from server');
                        return data.apiKey;
                    }
                }
            } catch (endpointError) {
                console.log('ℹ️ Serverless endpoint not available (development mode)');
            }
            
            throw new Error('OpenAI API key not configured. Please set window.OPENAI_API_KEY in config.js for development.');
            
        } catch (error) {
            console.error('❌ Failed to get API key:', error.message);
            throw error;
        }
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
                        method: 'openai-whisper-gpt4'
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
                method: 'openai-whisper-gpt4'
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

            console.log('🎤 Starting OpenAI Whisper + GPT-4 transcription...');
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
            
            // Prioritize webm format for Whisper compatibility
            let mediaRecorderOptions;
            
            // Check for webm support first (most common and Whisper-compatible)
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mediaRecorderOptions = { mimeType: 'audio/webm;codecs=opus' };
                console.log('✅ Using audio format: audio/webm;codecs=opus');
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                mediaRecorderOptions = { mimeType: 'audio/webm' };
                console.log('✅ Using audio format: audio/webm');
            } else {
                // Fallback to browser default
                console.warn('⚠️ WebM not supported, using browser default format');
                mediaRecorderOptions = undefined;
            }
            
            this.mediaRecorder = mediaRecorderOptions 
                ? new MediaRecorder(stream, mediaRecorderOptions)
                : new MediaRecorder(stream);
            
            console.log('📹 MediaRecorder initialized with mimeType:', this.mediaRecorder.mimeType || 'browser default');

            this.audioChunks = [];
            this.audioSegments = [];

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
                        console.log('📹 Processing audio segment with OpenAI...', audioBlob.size, 'bytes, MIME:', mimeType);
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

            return { success: true, method: 'openai-whisper-gpt4' };
        } catch (error) {
            console.error('Error starting segmented recording:', error);
            throw error;
        }
    }

    async processAudioSegment(audioBlob) {
        try {
            // Step 1: Whisper transcription
            console.log('🔄 Step 1: Transcribing with Whisper...');
            const rawText = await this.transcribeWithWhisper(audioBlob);
            
            if (!rawText || rawText.trim().length === 0) {
                console.log('⚠️ No text transcribed from audio segment');
                return;
            }

            console.log('📝 Raw Whisper transcription:', rawText);

            // Step 2: GPT-4 formatting and correction
            console.log('🔄 Step 2: Formatting with GPT-4...');
            const formattedText = await this.formatWithGPT4(rawText);

            console.log('✨ GPT-4 formatted text:', formattedText);

            // Call the callback with the final result
            if (this.transcriptionCallback) {
                this.transcriptionCallback({
                    text: formattedText,
                    rawText: rawText,
                    confidence: 0.95,
                    isFinal: true,
                    enhanced: true,
                    processingMethod: 'openai-whisper-gpt4'
                });
            }
        } catch (error) {
            console.error('❌ Error processing audio segment:', error);
            
            // In case of processing error, still try to return something useful
            if (this.transcriptionCallback) {
                this.transcriptionCallback({
                    text: '[Erro no processamento - verifique conexão com OpenAI]',
                    confidence: 0.0,
                    isFinal: true,
                    error: true,
                    errorMessage: error.message
                });
            }
        }
    }

    async transcribeWithWhisper(audioBlob) {
        try {
            if (!this.openaiApiKey) {
                throw new Error('OpenAI API key not available');
            }

            // Determine correct file extension based on blob type
            let fileName = 'audio.webm'; // Default
            if (audioBlob.type) {
                if (audioBlob.type.includes('webm')) {
                    fileName = 'audio.webm';
                } else if (audioBlob.type.includes('mp4')) {
                    fileName = 'audio.mp4';
                } else if (audioBlob.type.includes('ogg')) {
                    fileName = 'audio.ogg';
                } else if (audioBlob.type.includes('wav')) {
                    fileName = 'audio.wav';
                }
            }
            
            // Debug logs before sending to API
            console.log(`📤 Sending to Whisper API:`);
            console.log(`   Filename: '${fileName}'`);
            console.log(`   MIME Type: '${audioBlob.type}'`);
            console.log(`   Size: ${audioBlob.size} bytes`);
            
            // Create form data with correct filename extension
            const formData = new FormData();
            formData.append('file', audioBlob, fileName);
            formData.append('model', 'whisper-1');
            formData.append('language', 'pt');
            formData.append('response_format', 'json');
            formData.append('temperature', '0.2');

            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Whisper API Error Details:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });
                throw new Error(`Whisper API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            console.log('✅ Whisper transcription successful:', data.text?.substring(0, 100) + '...');
            return data.text || '';
        } catch (error) {
            console.error('❌ Whisper transcription error:', error);
            throw new Error(`Whisper transcription failed: ${error.message}`);
        }
    }


    async formatWithGPT4(rawText) {
        try {
            if (!this.openaiApiKey) {
                throw new Error('OpenAI API key not available');
            }

            const systemPrompt = `Você é um assistente de transcrição jurídica especializado em sindicâncias militares. Sua principal tarefa é receber o texto bruto de uma oitiva e transformá-lo em um documento formal, claro e bem estruturado.

Siga estas regras rigorosamente:

1. **Identificação dos Interlocutores:** Com base no contexto, inicie a linha com "**SINDICANTE:**" ou "**TESTEMUNHA:**".
2. **Correção e Clareza:** Corrija todos os erros gramaticais, de pontuação e ortográficos. Reformule frases hesitantes ou informais para uma linguagem mais clara e concisa, **sem jamais alterar o significado original do depoimento**.
3. **Formatação Profissional:** Organize o diálogo em parágrafos lógicos. Remova interjeições, repetições e vícios de linguagem (como "né?", "tipo assim", "aí") que não agregam valor ao depoimento.
4. **Estrutura:** Mantenha um fluxo de diálogo claro, pergunta-resposta.

O objetivo final é produzir um texto que possa ser diretamente copiado para um Termo de Oitiva oficial.`;

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: `Formate e corrija o seguinte texto transcrito de uma oitiva militar:

"${rawText}"`
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 1000,
                    top_p: 1,
                    frequency_penalty: 0,
                    presence_penalty: 0
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`GPT-4 API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            const formattedText = data.choices?.[0]?.message?.content?.trim();
            
            if (!formattedText) {
                console.warn('⚠️ GPT-4 returned empty response, using raw text');
                return rawText;
            }

            return formattedText;
        } catch (error) {
            console.error('❌ GPT-4 formatting error:', error);
            // Return raw text if formatting fails
            console.warn('⚠️ Using raw text due to GPT-4 error');
            return rawText;
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
            this.audioSegments = [];

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

    // Enhanced text improvement using GPT-4 directly
    async enhanceSelectedText(selectedText) {
        try {
            if (!this.openaiApiKey) {
                throw new Error('OpenAI API key not available');
            }

            console.log('🔄 Enhancing selected text with GPT-4...');

            const enhancementPrompt = `Você é um especialista em redação jurídica militar. Sua tarefa é melhorar o texto fornecido, mantendo seu significado original, mas aprimorando:

1. **Clareza e Concisão**: Torne o texto mais claro e direto
2. **Gramática e Ortografia**: Corrija todos os erros gramaticais e ortográficos
3. **Linguagem Formal**: Use linguagem adequada para documentos oficiais militares
4. **Estrutura**: Organize melhor as ideias e fluxo do texto
5. **Terminologia**: Use terminologia militar/jurídica apropriada quando aplicável

IMPORTANTE: 
- Preserve completamente o significado original
- Mantenha o tom respeitoso e profissional
- NÃO adicione informações que não estavam no texto original
- NÃO remova informações importantes

Texto para melhorar:`;

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: enhancementPrompt
                        },
                        {
                            role: 'user',
                            content: selectedText
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 1500,
                    top_p: 1,
                    frequency_penalty: 0,
                    presence_penalty: 0
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`GPT-4 API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            const enhancedText = data.choices?.[0]?.message?.content?.trim();
            
            if (!enhancedText) {
                console.warn('⚠️ GPT-4 returned empty response for text enhancement');
                return selectedText;
            }

            console.log('✨ Text enhanced successfully with GPT-4');
            return enhancedText;

        } catch (error) {
            console.error('❌ Error enhancing text with GPT-4:', error);
            throw new Error(`Failed to enhance text: ${error.message}`);
        }
    }

    // Helper method to set API key programmatically (for development)
    setApiKey(apiKey) {
        this.openaiApiKey = apiKey;
        console.log('🔑 OpenAI API key set programmatically');
    }
}

// Export for use
export { OpenAITranscriptionService };

// Global compatibility - replace the previous services
window.OpenAITranscriptionService = OpenAITranscriptionService;
window.TranscriptionService = OpenAITranscriptionService;
window.GoogleSpeechService = OpenAITranscriptionService; // Override previous service

console.log('🤖 OpenAI Transcription Service (Whisper + GPT-4) loaded successfully');