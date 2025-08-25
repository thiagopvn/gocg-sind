// Serverless function to securely provide OpenAI API key
// This endpoint runs on Vercel's serverless infrastructure
export default function handler(req, res) {
    // Only allow POST requests for additional security
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get OpenAI API key from environment variables
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            console.error('OPENAI_API_KEY environment variable not set');
            return res.status(500).json({ error: 'API key not configured' });
        }

        // Basic validation that it looks like an OpenAI key
        if (!apiKey.startsWith('sk-')) {
            console.error('Invalid OpenAI API key format');
            return res.status(500).json({ error: 'Invalid API key format' });
        }

        // Add security headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        // Return the API key securely
        return res.status(200).json({ 
            apiKey: apiKey,
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('Error in get-openai-key endpoint:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}