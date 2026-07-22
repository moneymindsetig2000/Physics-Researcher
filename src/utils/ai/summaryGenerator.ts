import { SUMMARY_SYSTEM_ROLE } from '../systemroles/summarySystemRole';
import { getAIClient, callWithRetry } from './gemini';
import { AI_CONFIG } from './ai';

interface SummaryMessage {
  sender: 'user' | 'ai';
  text: string;
}

const SUMMARY_MODEL = AI_CONFIG.model;

/**
 * Generate a research summary for a given conversation using the summary AI.
 * Pass an existingSummary to incrementally merge a new exchange into it.
 * Returns the summary string in the defined physics-research format,
 * or null if generation fails.
 */
export async function generateSummary(
  messages: SummaryMessage[],
  signal?: AbortSignal,
  existingSummary?: string | null
): Promise<string | null> {
  if (messages.length === 0) return null;

  const conversationText = messages
    .map(m => `[${m.sender === 'user' ? 'Researcher' : 'Assistant'}]\n${m.text}`)
    .join('\n\n');

  let prompt: string;
  if (existingSummary) {
    prompt = `Below is the existing research summary followed by a new exchange. Merge the new information into the existing summary, updating relevant sections. Output only the updated summary.\n\n---\n\n# Existing Summary\n\n${existingSummary}\n\n---\n\n# New Exchange\n\n${conversationText}`;
  } else {
    prompt = `Review the following research conversation and produce a structured summary following the required format.\n\n---\n\n${conversationText}`;
  }

  try {
    const ai = getAIClient();
    const response = await callWithRetry(
      () =>
        ai.models.generateContent({
          model: SUMMARY_MODEL,
          contents: prompt,
          config: {
            systemInstruction: SUMMARY_SYSTEM_ROLE,
            temperature: 0.3,
            thinkingConfig: { thinkingLevel: 'HIGH' },
          },
        }),
      2,
      1000,
      signal
    );

    const text = response.text?.trim();
    return text || null;
  } catch (err: any) {
    if (err.name === 'AbortError' || err.message?.includes('aborted')) {
      return null;
    }
    console.warn('Summary generation failed:', err);
    return null;
  }
}
