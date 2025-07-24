import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * POST /api/oracle  { prompt: string }
 * Proxies the request to OpenAI chat completions using the
 * server-side environment variable OPENAI_API_KEY.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body as { prompt?: string };
  // optional ISRM metrics payload
  const { metrics } = req.body as {
    metrics?: {
      predictionError?: number;
      coherenceTension?: number;
      utility?: number;
      energy?: number;
    };
  };

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt missing' });
  }

  try {
    // ------------------------------------------------------------
    // Build system prompt that embeds current ISRM metrics (if any)
    // ------------------------------------------------------------
    const systemPrompt = metrics
      ? `You are Aura, an adaptive agent. Current internal state:
ΔS (prediction error) = ${metrics.predictionError ?? 'N/A'}
ΔC (coherence tension) = ${metrics.coherenceTension ?? 'N/A'}
U(t) (utility)        = ${metrics.utility ?? 'N/A'}
Energy                = ${metrics.energy ?? 'N/A'}

Use these values to shape your response.`
      : 'You are Aura, an adaptive agent built on the Interactionist Self-Regulation Model.';

    const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // Upgraded to use GPT-4o (mini) for richer, faster responses
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    /* ----------------------------------------------------------
       Verbose debug: print status and body regardless of success
       ---------------------------------------------------------- */
    console.log('▶︎ OpenAI status', apiRes.status);
    const rawBody = await apiRes.text();
    if (apiRes.status !== 200) {
      console.error('▼ OpenAI error body', rawBody);
      return res.status(apiRes.status).json({ error: rawBody });
    }

    // status 200 – parse JSON
    const data = JSON.parse(rawBody);
    if (!data.choices?.[0]?.message?.content) {
      return res.status(500).json({ error: 'No valid response from GPT' });
    }

    res.status(200).json({ message: data.choices[0].message.content });
  } catch (error: any) {
    console.error('Oracle API error', error);
    res.status(500).json({ error: 'Oracle proxy failed' });
  }
}
