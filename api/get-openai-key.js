// Vercel serverless function to securely provide OpenAI API key
// This prevents exposing the API key in client-side code

export default function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get API key from environment variable
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('OPENAI_API_KEY environment variable not set');
      return res.status(500).json({ 
        error: 'OpenAI API key not configured on server' 
      });
    }

    // Return the API key securely
    return res.status(200).json({
      apiKey: apiKey,
      success: true
    });

  } catch (error) {
    console.error('Error in get-openai-key function:', error);
    return res.status(500).json({
      error: 'Internal server error',
      success: false
    });
  }
}