import fetch from 'node-fetch';

// Disable Vercel's default body parser to handle FormData
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(request) {
    // Only allow POST requests
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ 
            success: false, 
            error: 'Method not allowed. Use POST.' 
        }), { 
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error('❌ OPENAI_API_KEY not found in environment variables');
        return new Response(JSON.stringify({ 
            success: false, 
            error: 'OpenAI API key not configured on server' 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Use native FormData parsing (available in Vercel runtime)
        const formData = await request.formData();
        const audioFile = formData.get('audio');

        if (!audioFile) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: 'No audio file found in request' 
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log(`📤 Processing audio file:`);
        console.log(`   Name: '${audioFile.name}'`);
        console.log(`   Type: '${audioFile.type}'`);
        console.log(`   Size: ${audioFile.size} bytes`);

        // Step 1: Transcribe with Whisper
        console.log('🔄 Step 1: Transcribing with Whisper...');
        const rawText = await transcribeWithWhisper(audioFile, apiKey);
        
        if (!rawText || rawText.trim().length === 0) {
            return new Response(JSON.stringify({ 
                success: true, 
                formattedText: '[Nenhum áudio detectado]',
                rawText: ''
            }), { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log('📝 Raw Whisper transcription:', rawText.substring(0, 100) + '...');

        // Step 2: Format with GPT-4
        console.log('🔄 Step 2: Formatting with GPT-4...');
        const formattedText = await formatWithGPT4(rawText, apiKey);

        console.log('✨ GPT-4 formatted text:', formattedText.substring(0, 100) + '...');

        return new Response(JSON.stringify({ 
            success: true, 
            formattedText: formattedText,
            rawText: rawText 
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ Error in transcribe API:', error);
        return new Response(JSON.stringify({ 
            success: false, 
            error: `Server error: ${error.message}` 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function transcribeWithWhisper(audioFile, apiKey) {
    try {
        // Create form data for OpenAI Whisper API
        const openAIFormData = new FormData();
        
        // Determine proper filename based on MIME type
        let fileName = 'audio.webm';
        if (audioFile.type) {
            if (audioFile.type.includes('webm')) fileName = 'audio.webm';
            else if (audioFile.type.includes('mp4')) fileName = 'audio.mp4';
            else if (audioFile.type.includes('ogg')) fileName = 'audio.ogg';
            else if (audioFile.type.includes('wav')) fileName = 'audio.wav';
            else if (audioFile.type.includes('mpeg')) fileName = 'audio.mp3';
        }

        // Append the audio file directly (it's already a File/Blob)
        openAIFormData.append('file', audioFile, fileName);
        openAIFormData.append('model', 'whisper-1');
        openAIFormData.append('language', 'pt');
        openAIFormData.append('response_format', 'json');
        openAIFormData.append('temperature', '0.2');

        console.log(`📤 Sending to Whisper API:`);
        console.log(`   Filename: '${fileName}'`);
        console.log(`   MIME Type: '${audioFile.type}'`);
        console.log(`   Size: ${audioFile.size} bytes`);

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`
                // Note: Don't set Content-Type header, fetch will set it automatically with boundary
            },
            body: openAIFormData
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
        console.log('✅ Whisper transcription successful');
        return data.text || '';

    } catch (error) {
        console.error('❌ Whisper transcription error:', error);
        throw new Error(`Whisper transcription failed: ${error.message}`);
    }
}

async function formatWithGPT4(rawText, apiKey) {
    try {
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
                'Authorization': `Bearer ${apiKey}`,
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
        console.warn('⚠️ Using raw text due to GPT-4 error');
        return rawText;
    }
}