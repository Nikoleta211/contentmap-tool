import { askClaude, subtopicsPrompt, ideasPrompt } from '../../lib/claude';

export async function POST(req) {
  try {
    const { oberthema, anzahlThemen, anzahlIdeen } = await req.json();

    if (!oberthema || !oberthema.trim()) {
      return Response.json({ error: 'Oberthema fehlt' }, { status: 400 });
    }

    const titles = await askClaude(subtopicsPrompt(oberthema, anzahlThemen));

    if (!titles.length) {
      return Response.json({ error: 'Unterthemen konnten nicht erstellt werden' }, { status: 502 });
    }

    const unterthemen = await Promise.all(
      titles.map(async (titel) => {
        const ideen = await askClaude(ideasPrompt(oberthema, titel, anzahlIdeen));
        return { titel, ideen };
      })
    );

    return Response.json({ oberthema, unterthemen });
  } catch (err) {
    return Response.json({ error: err.message || 'Serverfehler' }, { status: 500 });
  }
}
