import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const SYSTEM_PROMPT = `Du hilfst Networkerinnen und Networkern, die ihr Business ausschließlich über organischen Social-Media-Content und Sog-Marketing aufbauen. Zielgruppe: Menschen im Network Marketing, die wenig Zeit haben, nicht kalt akquirieren, nicht spammen und keine platte Werbung machen wollen. Sie wollen über Instagram-Content sichtbar werden und so Kunden und Partner gewinnen. Antworte immer auf Deutsch, direkt und konkret, ohne leere Phrasen. Vermeide die Wörter "authentisch", "Mindset", "finanzielle Freiheit", "Erfolgsreise", "dein Warum", "auf Augenhöhe", "gemeinsam", "manifestieren". Antworte IMMER ausschließlich mit einem validen JSON-Array aus Strings, ohne Markdown-Formatierung, ohne Code-Fences, ohne zusätzlichen Text davor oder danach.`;

export function parseJsonArray(raw) {
  const clean = raw.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
  try {
    const parsed = JSON.parse(clean);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export async function askClaude(userPrompt) {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }]
  });
  const text = msg.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
  return parseJsonArray(text);
}

export function subtopicsPrompt(oberthema, anzahl) {
  return `Oberthema: "${oberthema}"\n\nErstelle genau ${anzahl} passende Unterthemen (Content-Säulen) für dieses Oberthema. Jedes Unterthema ist ein kurzer, prägnanter Titel (max. 5 Wörter). Antworte nur mit dem JSON-Array, z.B. ["Titel eins", "Titel zwei"].`;
}

export function ideasPrompt(oberthema, unterthema, anzahl) {
  return `Oberthema: "${oberthema}"\nUnterthema: "${unterthema}"\n\nErstelle genau ${anzahl} konkrete Content-Ideen für Instagram (Reels, Posts oder Storys) zu diesem Unterthema. Jede Idee ist kurz und konkret (max. 12 Wörter), ohne Nummerierung im Text selbst. Antworte nur mit dem JSON-Array aus Strings.`;
}
