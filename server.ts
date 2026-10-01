import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize Google GenAI
const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Provider & system status endpoint
app.get('/api/status', (_req: Request, res: Response) => {
  const geminiAvailable = !!process.env.GEMINI_API_KEY;
  const nvidiaEnvKeyAvailable = !!process.env.NVIDIA_API_KEY;

  res.json({
    geminiAvailable,
    nvidiaEnvKeyAvailable,
    defaultProvider: nvidiaEnvKeyAvailable ? 'nvidia' : geminiAvailable ? 'gemini' : 'nvidia',
  });
});

// Test API Key endpoint (for NVIDIA or Gemini)
app.post('/api/test-key', async (req: Request, res: Response) => {
  const { provider, apiKey, baseUrl } = req.body;

  if (provider === 'nvidia') {
    const keyToTest = apiKey || process.env.NVIDIA_API_KEY;
    if (!keyToTest) {
      return res.status(400).json({
        success: false,
        error: 'No NVIDIA API key provided. Please input your key or set NVIDIA_API_KEY in environment.',
      });
    }

    const host = baseUrl || 'https://integrate.api.nvidia.com/v1';
    const startTime = Date.now();

    try {
      // Test by querying models or a minimal completion
      const testRes = await fetch(`${host}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${keyToTest}`,
          Accept: 'application/json',
        },
      });

      const latencyMs = Date.now() - startTime;

      if (!testRes.ok) {
        // Try fallback completion check if /models gives 404/403
        const fallbackRes = await fetch(`${host}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${keyToTest}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'meta/llama-3.3-70b-instruct',
            messages: [{ role: 'user', content: 'hi' }],
            max_tokens: 1,
          }),
        });

        if (!fallbackRes.ok) {
          const errText = await fallbackRes.text();
          let parsed;
          try {
            parsed = JSON.parse(errText);
          } catch {
            // ignore
          }
          return res.status(fallbackRes.status).json({
            success: false,
            error: parsed?.error?.message || `NVIDIA API responded with status ${fallbackRes.status}`,
          });
        }
      }

      return res.json({
        success: true,
        message: 'Successfully connected to NVIDIA NIM API!',
        latencyMs,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to connect to NVIDIA API endpoint',
      });
    }
  } else if (provider === 'gemini') {
    if (!geminiClient) {
      return res.status(400).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured on server.',
      });
    }

    const startTime = Date.now();
    try {
      const response = await geminiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'Ping',
      });
      const latencyMs = Date.now() - startTime;
      return res.json({
        success: true,
        message: 'Successfully connected to Google Gemini API!',
        latencyMs,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to connect to Gemini API',
      });
    }
  }

  return res.status(400).json({ success: false, error: 'Unknown provider' });
});

// Chat completion streaming endpoint
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  const {
    provider = 'nvidia',
    model,
    messages = [],
    temperature = 0.7,
    systemInstruction,
    maxTokens = 4096,
    baseUrl,
  } = req.body;

  // Set SSE response headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (type: string, data: any) => {
    res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    sendEvent('error', { error: 'No messages provided' });
    sendEvent('done', {});
    return res.end();
  }

  // Handle NVIDIA NIM
  if (provider === 'nvidia') {
    const headerKey = req.headers['x-nvidia-api-key'] as string;
    const apiKey = headerKey || process.env.NVIDIA_API_KEY;

    if (!apiKey) {
      sendEvent('error', {
        error: 'NVIDIA API key required. Click on "NVIDIA Key" in the top bar or settings to configure your key (get one free at build.nvidia.com).',
      });
      sendEvent('done', {});
      return res.end();
    }

    const targetModel = model || 'meta/llama-3.3-70b-instruct';
    const host = baseUrl || 'https://integrate.api.nvidia.com/v1';

    // Format messages for OpenAI-compatible endpoint
    const formattedMessages: any[] = [];
    if (systemInstruction) {
      formattedMessages.push({ role: 'system', content: systemInstruction });
    }

    for (const msg of messages) {
      let content = msg.content || '';
      // If message includes attached code/text files, append content
      if (msg.files && Array.isArray(msg.files) && msg.files.length > 0) {
        for (const file of msg.files) {
          if (file.text) {
            content += `\n\n--- Attached File: ${file.name} ---\n\`\`\`\n${file.text}\n\`\`\``;
          }
        }
      }
      formattedMessages.push({
        role: msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user',
        content,
      });
    }

    try {
      const response = await fetch(`${host}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          model: targetModel,
          messages: formattedMessages,
          temperature: typeof temperature === 'number' ? temperature : 0.7,
          max_tokens: maxTokens,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let parsedError = errorText;
        try {
          const parsed = JSON.parse(errorText);
          parsedError = parsed.error?.message || parsed.message || errorText;
        } catch {
          // ignore
        }
        sendEvent('error', {
          error: `NVIDIA API Error (${response.status}): ${parsedError}`,
        });
        sendEvent('done', {});
        return res.end();
      }

      if (!response.body) {
        sendEvent('error', { error: 'No response stream received from NVIDIA' });
        sendEvent('done', {});
        return res.end();
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.replace(/^data:\s*/, '');
            if (dataStr === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(dataStr);
              const choice = parsed.choices?.[0];
              const delta = choice?.delta;

              if (delta) {
                // Check for DeepSeek R1 reasoning content
                if (delta.reasoning_content) {
                  sendEvent('reasoning', { text: delta.reasoning_content });
                }

                // Check for standard text content
                if (delta.content) {
                  sendEvent('content', { text: delta.content });
                }
              }

              if (choice?.finish_reason) {
                // Finished
              }
            } catch {
              // Ignore malformed JSON chunks
            }
          }
        }
      }

      sendEvent('done', {});
      return res.end();
    } catch (err: any) {
      sendEvent('error', { error: err.message || 'Stream connection error with NVIDIA NIM' });
      sendEvent('done', {});
      return res.end();
    }
  }

  // Handle Google Gemini
  if (provider === 'gemini') {
    if (!geminiClient) {
      sendEvent('error', {
        error: 'Gemini API Key is not set in environment (process.env.GEMINI_API_KEY).',
      });
      sendEvent('done', {});
      return res.end();
    }

    const targetModel = model || 'gemini-3.8-flash';

    try {
      // Build contents array for Gemini
      const contents: any[] = [];

      for (const msg of messages) {
        const parts: any[] = [];

        // Check for attached images
        if (msg.files && Array.isArray(msg.files)) {
          for (const file of msg.files) {
            if (file.base64 && file.type?.startsWith('image/')) {
              parts.push({
                inlineData: {
                  mimeType: file.type,
                  data: file.base64,
                },
              });
            } else if (file.text) {
              parts.push({
                text: `[File Attachment: ${file.name}]\n\`\`\`\n${file.text}\n\`\`\`\n`,
              });
            }
          }
        }

        if (msg.content) {
          parts.push({ text: msg.content });
        }

        if (parts.length > 0) {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts,
          });
        }
      }

      const streamResponse = await geminiClient.models.generateContentStream({
        model: targetModel,
        contents,
        config: {
          systemInstruction: systemInstruction || 'You are an advanced, helpful AI assistant built to operate like ChatGPT.',
          temperature: typeof temperature === 'number' ? temperature : 0.7,
        },
      });

      for await (const chunk of streamResponse) {
        if (chunk.text) {
          sendEvent('content', { text: chunk.text });
        }
      }

      sendEvent('done', {});
      return res.end();
    } catch (err: any) {
      sendEvent('error', { error: err.message || 'Gemini API Stream error' });
      sendEvent('done', {});
      return res.end();
    }
  }

  sendEvent('error', { error: `Unsupported provider: ${provider}` });
  sendEvent('done', {});
  return res.end();
});

// Mount Vite or serve static assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
