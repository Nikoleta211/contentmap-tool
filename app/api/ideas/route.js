import { askClaude, ideasPrompt } from '../../lib/claude';

export async function POST(req) {
  try {
    const { oberthema, unterthema, anzahl } = await req.json();

    if (!oberthema || !unterthema) {
      return Response.json({ error: 'Oberthema oder Unterthema fehlt' }, { status: 400 });
    }

    const ideen = await askClaude(ideasPrompt(oberthema, unterthema, anzahl || 15));
    return Response.json({ ideen });
  } catch (err) {
    return Response.json({ error: err.message || 'Serverfehler' }, { status: 500 });
  }
}
