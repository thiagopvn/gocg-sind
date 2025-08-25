import formidable from 'formidable';
import fs from 'fs';
import fetch from 'node-fetch';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed. Use POST.' 
        });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error('❌ OPENAI_API_KEY not found in environment variables');
        return res.status(500).json({ 
            success: false, 
            error: 'OpenAI API key not configured on server' 
        });
    }

    try {
        // Parse the multipart form data
        const form = formidable({
            maxFileSize: 25 * 1024 * 1024, // 25MB limit
            keepExtensions: true,
        });

        const [fields, files] = await form.parse(req);
        
        if (!files.audio || !files.audio[0]) {
            return res.status(400).json({ 
                success: false, 
                error: 'No audio file found in request' 
            });
        }

        const audioFile = files.audio[0];
        
        console.log(`📤 Processing audio file:`);
        console.log(`   Original name: '${audioFile.originalFilename}'`);
        console.log(`   MIME type: '${audioFile.mimetype}'`);
        console.log(`   Size: ${audioFile.size} bytes`);
        console.log(`   Temp path: '${audioFile.filepath}'`);

        // Step 1: Transcribe with Whisper
        console.log('🔄 Step 1: Transcribing with Whisper...');
        const rawText = await transcribeWithWhisper(audioFile, apiKey);
        
        if (!rawText || rawText.trim().length === 0) {
            // Clean up temp file
            fs.unlink(audioFile.filepath, () => {});
            return res.status(200).json({ 
                success: true, 
                formattedText: '[Nenhum áudio detectado]' 
            });
        }

        console.log('📝 Raw Whisper transcription:', rawText.substring(0, 100) + '...');

        // Step 2: Format with GPT-4
        console.log('🔄 Step 2: Formatting with GPT-4...');
        const formattedText = await formatWithGPT4(rawText, apiKey);

        console.log('✨ GPT-4 formatted text:', formattedText.substring(0, 100) + '...');

        // Clean up temp file
        fs.unlink(audioFile.filepath, (err) => {
            if (err) console.warn('⚠️ Could not clean up temp file:', err.message);
        });

        return res.status(200).json({ 
            success: true, 
            formattedText: formattedText,
            rawText: rawText 
        });

    } catch (error) {
        console.error('❌ Error in transcribe API:', error);
        return res.status(500).json({ 
            success: false, 
            error: `Server error: ${error.message}` 
        });
    }
}

async function transcribeWithWhisper(audioFile, apiKey) {
    try {
        // Create form data for Whisper API
        const formData = new FormData();
        
        // Read the file as a buffer and create a Blob
        const fileBuffer = fs.readFileSync(audioFile.filepath);
        const audioBlob = new Blob([fileBuffer], { type: audioFile.mimetype || 'audio/webm' });
        
        // Determine filename with proper extension
        let fileName = 'audio.webm';
        if (audioFile.originalFilename) {
            fileName = audioFile.originalFilename;
        } else if (audioFile.mimetype) {
            if (audioFile.mimetype.includes('webm')) fileName = 'audio.webm';
            else if (audioFile.mimetype.includes('mp4')) fileName = 'audio.mp4';
            else if (audioFile.mimetype.includes('ogg')) fileName = 'audio.ogg';
            else if (audioFile.mimetype.includes('wav')) fileName = 'audio.wav';
        }

        formData.append('file', audioBlob, fileName);
        formData.append('model', 'whisper-1');
        formData.append('language', 'pt');
        formData.append('response_format', 'json');
        formData.append('temperature', '0.2');

        console.log(`📤 Sending to Whisper API:`);
        console.log(`   Filename: '${fileName}'`);
        console.log(`   MIME Type: '${audioFile.mimetype}'`);
        console.log(`   Size: ${audioFile.size} bytes`);

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`
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