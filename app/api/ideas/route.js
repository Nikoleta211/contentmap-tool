export const maxDuration = 300;
import { askClaude, ideasPrompt, normIdeen, clampZahl, kuerzen, MAX_THEMA, MAX_STECKBRIEF } from '../../lib/claude';

export async function POST(req) {
  try {
    const body = await req.json();
    const oberthema = kuerzen(body.oberthema, MAX_THEMA);
    const unterthema = kuerzen(body.unterthema, MAX_THEMA);
    const steckbrief = kuerzen(body.steckbrief, MAX_STECKBRIEF);
    const anzahl = clampZahl(body.anzahl, 5, 30, 15);

    if (!oberthema || !unterthema) {
      return Response.json({ error: 'Oberthema oder Unterthema fehlt' }, { status: 400 });
    }

    const ideen = normIdeen(await askClaude(ideasPrompt(oberthema, unterthema, anzahl, steckbrief)));
    if (!ideen.length) {
      return Response.json({ error: 'Da kamen keine Ideen zurück. Versuch es nochmal.' }, { status: 502 });
    }
    return Response.json({ ideen });
  } catch (err) {
    return Response.json({ error: err.message || 'Serverfehler' }, { status: 500 });
  }
}
