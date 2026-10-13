import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Grenzen, damit niemand das Tool mit riesigen Anfragen belastet
export const MAX_THEMA = 300;
export const MAX_STECKBRIEF = 6000;

export function clampZahl(wert, min, max, standard) {
  const n = parseInt(wert, 10);
  if (Number.isNaN(n)) return standard;
  return Math.min(max, Math.max(min, n));
}

export function kuerzen(text, max) {
  return String(text || '').trim().slice(0, max);
}

export const SYSTEM_PROMPT = `Du hilfst Networkern, die ihr Business ausschließlich über organischen Social-Media-Content und Sog-Marketing aufbauen. Sie wollen nicht kalt akquirieren, nicht spammen und keine platte Werbung machen. Sie wollen über Instagram sichtbar werden und so Kunden und Partner gewinnen.

SPRACHE
- Deutsch, du-Form, nahbar, so wie man redet. "halt", "eigentlich", "ehrlich gesagt" sind willkommen.
- Keine Gedankenstriche. Bindestriche nur in zusammengesetzten Wörtern wie Content-Säule.
- Das Muster "nicht X, sondern Y" und "kein X, sondern Y" ist verboten. Sag einfach, was ist.
- Keine Dreierreihen von Adjektiven. Keine Floskeln wie "entscheidend", "Schlüssel", "Reise", "nächstes Level", "Fundament".
- Verboten: "authentisch", "Mindset", "finanzielle Freiheit", "Erfolgsreise", "dein Warum", "auf Augenhöhe", "manifestieren".
- Kein Gendern, keine Sternchen.
- Zitierte Sätze in deutschen Anführungszeichen: „so“.

NICHTS ERFINDEN
- Keine Erlebnisse, Zahlen, Kundinnen oder Namen, die nicht in der Eingabe stehen.
- Ich-Ideen bleiben offene Impulse, die der Nutzer mit seiner eigenen Geschichte füllt, zum Beispiel "Der Fehler, den ich am Anfang lange gemacht habe".
- Keine Heil- oder Wirkversprechen (kein "heilt", "hilft gegen", "nimmst ab"). Keine Einkommensversprechen, keine Beträge, kein "passives Einkommen". Kein Firmenname.
- 100 Prozent Sog: Keine Idee, bei der jemand Leute anschreibt.

Antworte IMMER ausschließlich mit validem JSON, ohne Markdown, ohne Code-Fences, ohne Text davor oder danach.`;

export function parseJson(raw) {
  let clean = raw.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
  const start = clean.search(/[\[{]/);
  const end = Math.max(clean.lastIndexOf(']'), clean.lastIndexOf('}'));
  if (start !== -1 && end !== -1) clean = clean.substring(start, end + 1);
  try {
    return JSON.parse(clean);
  } catch (e) {
    return null;
  }
}

export async function askClaude(userPrompt) {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }]
  });
  const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  return parseJson(text);
}

// Bringt Ideen in eine feste Form: { idee, hooks: [] }
export function normIdeen(liste) {
  if (!Array.isArray(liste)) return [];
  return liste
    .map((x) => {
      if (typeof x === 'string') return { idee: x.trim(), hooks: [] };
      const idee = String(x?.idee || '').trim();
      const hooks = Array.isArray(x?.hooks) ? x.hooks.map((h) => String(h).trim()).filter(Boolean).slice(0, 2) : [];
      return { idee, hooks };
    })
    .filter((x) => x.idee);
}

function kontextBlock(steckbrief) {
  if (!steckbrief) return '';
  return `\n\nSein Ergebnis aus dem Positionierungs-Tool (nutze Kernthema, Zielgruppe und Säulen daraus, erfinde nichts dazu):\n"""\n${steckbrief}\n"""`;
}

export function subtopicsPrompt(oberthema, anzahl, steckbrief) {
  const themaZeile = oberthema ? `Oberthema: "${oberthema}"` : 'Oberthema: nicht angegeben, nimm das Kernthema aus dem Ergebnis unten.';
  const saeulenRegel = steckbrief
    ? `Stehen im Ergebnis Content-Säulen, übernimm ihre Namen und Reihenfolge als Unterthemen (höchstens 5 Wörter, kürze wenn nötig). Hat es weniger als ${anzahl}, ergänze passende Unterthemen zum Oberthema.`
    : 'Die Unterthemen sind Bereiche des Oberthemas, die zusammengehören, so wie bei einer Pizzeria Pizza, Pasta und Antipasti. Eines davon darf eine Persönlichkeits-Säule sein (Alltag, eigener Weg, Familie), aber nur mit klarem Bezug zum Oberthema.';
  return `${themaZeile}${kontextBlock(steckbrief)}

Erstelle genau ${anzahl} Unterthemen (Content-Säulen). Jedes ist ein kurzer, konkreter Titel mit höchstens 5 Wörtern. ${saeulenRegel}

Antworte nur mit diesem JSON:
{"oberthema": "das Oberthema in wenigen Wörtern", "unterthemen": ["Titel eins", "Titel zwei"]}`;
}

export function ideasPrompt(oberthema, unterthema, anzahl, steckbrief) {
  return `Oberthema: "${oberthema}"
Unterthema: "${unterthema}"${kontextBlock(steckbrief)}

Erstelle genau ${anzahl} Content-Ideen zu diesem Unterthema.

SO SIEHT EINE GUTE IDEE AUS
- Eine echte Situation aus dem Alltag der Zielgruppe oder ein konkreter Inhalt. Konkrete Details statt Kategorien: "Brotdosen um 6:40, das Kind will plötzlich keine Gurke mehr" statt "Tipps für den Familienalltag".
- Höchstens 15 Wörter, so wie man es in die Notizen-App schreibt.
- Nur die Idee. Nenn nie ein Format, also kein Reel, Post, Story, Karussell oder Umfrage. Der Nutzer entscheidet selbst, wofür er sie nutzt.
- Jede Idee bringt eine eigene Situation. Zwei Ideen, die nur anders formuliert sind, zählen als eine.
- Mische: Tipps zum direkt Umsetzen, Irrtümer, Alltagsszenen, ehrliche Eingeständnisse als offene Impulse, Haltung.

HOOKS
Zu jeder Idee 1 oder 2 Hooks. Der Hook ist der Text auf dem Cover oder die erste Einblendung im Video. Höchstens 10 Wörter, so wie man es sagt.
- Er wiederholt die Idee nicht, er macht neugierig darauf.
- Er hat ein greifbares Detail aus der Idee (eine Uhrzeit, ein Satz, ein Gegenstand, eine Handlung). Allgemeine Hooks wie „Das steckt dahinter“ sind zu schwach.
- Gern so: erst Druck rausnehmen, dann eine Lücke öffnen, die man schließen will.
- Ein zweiter Hook nur, wenn er die Idee von einer anderen Seite packt.

Alle Beispiele zeigen nur die Art. Übernimm sie nie.

Antworte nur mit einem JSON-Array:
[{"idee": "...", "hooks": ["..."]}, {"idee": "...", "hooks": ["...", "..."]}]`;
}
