import express from 'express';
import cors from 'cors';
import path from 'path';
import Groq from 'groq-sdk';
import 'dotenv/config';
import { toolDefinitions, runTool } from './tools.js';
import { connectDB } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const sessions = new Map<string, Groq.Chat.ChatCompletionMessageParam[]>();

function getOrCreateSession(sessionId: string): Groq.Chat.ChatCompletionMessageParam[] {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, [
      {
        role: 'system',
        content: `You are HousingIQ, an expert AI assistant that helps people make smart housing decisions globally.
You have access to tools for calculating true housing costs, comparing cities, and generating moving checklists.
When users ask about costs, always use the calculateTrueCost tool with realistic estimates if they don't provide exact numbers.
When comparing cities, use the compareCities tool.
For general housing advice, answer directly from your knowledge.
Always be specific, data-driven, and helpful. Use USD for all costs.
If the user provides costs in another currency, convert to USD first.`
      }
    ]);
  }
  return sessions.get(sessionId)!;
}

app.post('/chat', async (req, res) => {
  const { message, sessionId = 'default' } = req.body;
  if (!message) { res.status(400).json({ error: 'message is required' }); return; }

  try {
    const history = getOrCreateSession(sessionId);
    history.push({ role: 'user', content: message });

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: history,
      tools: toolDefinitions,
      tool_choice: 'auto',
    });

    const agentMessage = response.choices[0].message;

    if (agentMessage.tool_calls && agentMessage.tool_calls.length > 0) {
      const toolCall = agentMessage.tool_calls[0];
      const toolArgs = JSON.parse(toolCall.function.arguments || '{}');
      console.log(`🔧 Tool: ${toolCall.function.name}`, toolArgs);
      const toolResult = await runTool(toolCall.function.name, toolArgs);

      history.push({ role: 'assistant', content: null, tool_calls: agentMessage.tool_calls });
      history.push({ role: 'tool', tool_call_id: toolCall.id, content: toolResult });

      const finalResponse = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: history,
      });

      const finalText = finalResponse.choices[0].message.content!;
      history.push({ role: 'assistant', content: finalText });
      res.json({ reply: finalText, toolUsed: toolCall.function.name, toolData: JSON.parse(toolResult) });
    } else {
      const text = agentMessage.content!;
      history.push({ role: 'assistant', content: text });
      res.json({ reply: text, toolUsed: null, toolData: null });
    }
  } catch (err: any) {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB();
  app.listen(PORT, () => console.log(`🏠 HousingIQ Agent running at http://localhost:${PORT}`));
}

start();