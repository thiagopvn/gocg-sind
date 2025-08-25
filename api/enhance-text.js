import formidable from 'formidable';
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
            maxFieldsSize: 50 * 1024 * 1024, // 50MB limit for text
        });

        const [fields, files] = await form.parse(req);
        
        if (!fields.text || !fields.text[0]) {
            return res.status(400).json({ 
                success: false, 
                error: 'No text found in request' 
            });
        }

        const selectedText = fields.text[0];
        
        console.log('🔄 Enhancing text via GPT-4...');
        console.log('   Text length:', selectedText.length, 'characters');

        const enhancedText = await enhanceWithGPT4(selectedText, apiKey);

        return res.status(200).json({ 
            success: true, 
            enhancedText: enhancedText,
            originalText: selectedText
        });

    } catch (error) {
        console.error('❌ Error in enhance-text API:', error);
        return res.status(500).json({ 
            success: false, 
            error: `Server error: ${error.message}` 
        });
    }
}

async function enhanceWithGPT4(selectedText, apiKey) {
    try {
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
                'Authorization': `Bearer ${apiKey}`,
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