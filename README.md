# Content-Map Tool

Erstellt aus einem Oberthema automatisch 3-5 Unterthemen mit je 10-30 Instagram-Content-Ideen. Alles direkt bearbeitbar, druckbar als PDF.

## Warum Next.js statt reinem HTML?

Die KI-Generierung braucht einen echten API-Key im Hintergrund. Ein einzelnes HTML-File kann diesen Key nicht sicher speichern und die direkte Browser-Anbindung an die Anthropic-API funktioniert nicht zuverlässig außerhalb von Claude selbst. Deshalb läuft die KI-Anfrage hier über eine kleine Backend-Route (`app/api/generate` und `app/api/ideas`), genau wie bei deinem ManyChat-Generator und dem Heilversprechen-Check.

## Deployment (wie bei deinen anderen Tools)

1. Neues Repo auf GitHub anlegen, diesen Ordner hochladen (oder `git init` lokal und pushen)
2. Bei [vercel.com](https://vercel.com) das Repo importieren
3. Unter **Settings → Environment Variables** hinzufügen:
   - `ANTHROPIC_API_KEY` = dein Anthropic-API-Key (den bekommst du unter [console.anthropic.com](https://console.anthropic.com))
4. Deploy klicken — fertig

## Lokal testen

```bash
npm install
echo "ANTHROPIC_API_KEY=dein-key-hier" > .env.local
npm run dev
```

Dann unter `http://localhost:3000` öffnen.

## Kosten im Blick behalten

Jede Content-Map-Erstellung macht mehrere API-Anfragen (1 für die Unterthemen + 1 pro Unterthema für die Ideen). Bei 4 Unterthemen sind das 5 Anfragen pro Kundin. Die Kosten pro Anfrage sind gering (Sonnet-Modell, kurze Antworten), aber bei vielen Nutzerinnen lohnt sich ein Blick ins Anthropic-Billing-Dashboard.
