export const maxDuration = 300;
import { askClaude, subtopicsPrompt, ideasPrompt, normIdeen, clampZahl, kuerzen, MAX_THEMA, MAX_STECKBRIEF } from '../../lib/claude';

export async function POST(req) {
  try {
    const body = await req.json();
    const oberthemaEingabe = kuerzen(body.oberthema, MAX_THEMA);
    const steckbrief = kuerzen(body.steckbrief, MAX_STECKBRIEF);
    const anzahlThemen = clampZahl(body.anzahlThemen, 3, 5, 4);
    const anzahlIdeen = clampZahl(body.anzahlIdeen, 5, 30, 15);

    if (!oberthemaEingabe && !steckbrief) {
      return Response.json({ error: 'Oberthema fehlt' }, { status: 400 });
    }

    const kopf = await askClaude(subtopicsPrompt(oberthemaEingabe, anzahlThemen, steckbrief));
    const titles = Array.isArray(kopf?.unterthemen) ? kopf.unterthemen.map((t) => String(t).trim()).filter(Boolean).slice(0, anzahlThemen) : [];
    const oberthema = oberthemaEingabe || String(kopf?.oberthema || '').trim();

    if (!titles.length || !oberthema) {
      return Response.json({ error: 'Unterthemen konnten nicht erstellt werden' }, { status: 502 });
    }

    const unterthemen = await Promise.all(
      titles.map(async (titel) => {
        const ideen = normIdeen(await askClaude(ideasPrompt(oberthema, titel, anzahlIdeen, steckbrief)));
        return { titel, ideen };
      })
    );

    return Response.json({ oberthema, steckbrief, unterthemen });
  } catch (err) {
    return Response.json({ error: err.message || 'Serverfehler' }, { status: 500 });
  }
}
