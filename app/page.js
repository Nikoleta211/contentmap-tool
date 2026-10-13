'use client';

import { useState, useRef } from 'react';

export default function Page() {
  const [oberthemaInput, setOberthemaInput] = useState('');
  const [steckbriefInput, setSteckbriefInput] = useState('');
  const [steckbriefOffen, setSteckbriefOffen] = useState(false);
  const [anzahlThemen, setAnzahlThemen] = useState(4);
  const [anzahlIdeen, setAnzahlIdeen] = useState(15);
  const [status, setStatus] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copyConfirm, setCopyConfirm] = useState('');

  const [map, setMap] = useState(null); // { oberthema, steckbrief, unterthemen: [{titel, ideen: [{idee, hooks}]}] }

  async function callApi(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Serverfehler');
    }
    return data;
  }

  async function generateFullMap() {
    const oberthema = oberthemaInput.trim();
    const steckbrief = steckbriefInput.trim();
    if (!oberthema && !steckbrief) {
      setStatus('Bitte zuerst ein Oberthema eingeben.');
      return;
    }

    setLoading(true);
    setMap(null);
    setSpinning(true);
    setStatus('Deine Content-Map wird erstellt...');

    try {
      const data = await callApi('/api/generate', { oberthema, steckbrief, anzahlThemen, anzahlIdeen });
      setMap(data);
      setStatus('');
    } catch (err) {
      setStatus('Fehler: ' + err.message);
    }

    setSpinning(false);
    setLoading(false);
  }

  async function regenerateSubtopic(index) {
    if (!map) return;
    const sub = map.unterthemen[index];
    setSpinning(true);
    setStatus(`Neue Ideen für "${sub.titel}" werden erstellt...`);
    try {
      const data = await callApi('/api/ideas', { oberthema: map.oberthema, unterthema: sub.titel, anzahl: anzahlIdeen, steckbrief: map.steckbrief });
      const updated = { ...map, unterthemen: map.unterthemen.map((s, i) => (i === index ? { ...s, ideen: data.ideen } : s)) };
      setMap(updated);
      setStatus('');
    } catch (err) {
      setStatus('Fehler: ' + err.message);
    }
    setSpinning(false);
  }

  async function addSubtopic() {
    if (!map) return;
    const newSub = { titel: 'Neues Unterthema', ideen: [] };
    setMap({ ...map, unterthemen: [...map.unterthemen, newSub] });
    setSpinning(true);
    setStatus('Neues Unterthema wird erstellt...');
    try {
      const data = await callApi('/api/ideas', { oberthema: map.oberthema, unterthema: map.oberthema, anzahl: anzahlIdeen, steckbrief: map.steckbrief });
      setMap((prev) => ({
        ...prev,
        unterthemen: prev.unterthemen.map((s, i) => (i === prev.unterthemen.length - 1 ? { ...s, ideen: data.ideen } : s))
      }));
      setStatus('');
    } catch (err) {
      setStatus('Fehler: ' + err.message);
    }
    setSpinning(false);
  }

  function updateSubtopicTitle(index, value) {
    setMap((prev) => ({ ...prev, unterthemen: prev.unterthemen.map((s, i) => (i === index ? { ...s, titel: value } : s)) }));
  }

  function updateIdea(subIndex, ideaIndex, value) {
    setMap((prev) => ({
      ...prev,
      unterthemen: prev.unterthemen.map((s, i) =>
        i === subIndex ? { ...s, ideen: s.ideen.map((idea, j) => (j === ideaIndex ? { ...idea, idee: value } : idea)) } : s
      )
    }));
  }

  function removeIdea(subIndex, ideaIndex) {
    setMap((prev) => ({
      ...prev,
      unterthemen: prev.unterthemen.map((s, i) => (i === subIndex ? { ...s, ideen: s.ideen.filter((_, j) => j !== ideaIndex) } : s))
    }));
  }

  function addIdea(subIndex) {
    setMap((prev) => ({
      ...prev,
      unterthemen: prev.unterthemen.map((s, i) => (i === subIndex ? { ...s, ideen: [...s.ideen, { idee: 'Neue Idee', hooks: [] }] } : s))
    }));
  }

  function removeSubtopic(subIndex) {
    setMap((prev) => ({ ...prev, unterthemen: prev.unterthemen.filter((_, i) => i !== subIndex) }));
  }

  function updateOberthema(value) {
    setMap((prev) => ({ ...prev, oberthema: value }));
  }

  function copyAsText() {
    if (!map) return;
    let text = map.oberthema.toUpperCase() + '\n\n';
    map.unterthemen.forEach((sub) => {
      text += sub.titel + '\n';
      sub.ideen.forEach((idea) => {
        text += '  - ' + idea.idee + '\n';
        idea.hooks.forEach((h) => {
          text += '      Hook: ' + h + '\n';
        });
      });
      text += '\n';
    });
    navigator.clipboard.writeText(text).then(() => {
      setCopyConfirm('In die Zwischenablage kopiert.');
      setTimeout(() => setCopyConfirm(''), 2500);
    });
  }

  function copyHook(text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopyConfirm('Hook kopiert.');
      setTimeout(() => setCopyConfirm(''), 2000);
    });
  }

  return (
    <div className="wrap">
      <header>
        <div className="eyebrow">Content Map Tool</div>
        <h1>
          Deine Themen, <em>auf einen Blick</em>
        </h1>
        <p>Ein Oberthema, die passenden Unterthemen und genug Content-Ideen für Wochen. Alles bearbeitbar, alles deins.</p>
      </header>

      <div className="input-card">
        <label htmlFor="oberthema-input">Dein Oberthema</label>
        <input
          type="text"
          id="oberthema-input"
          placeholder="z.B. Abnehmen in den Wechseljahren"
          value={oberthemaInput}
          onChange={(e) => setOberthemaInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && generateFullMap()}
        />

        {!steckbriefOffen ? (
          <button type="button" className="steckbrief-toggle" onClick={() => setSteckbriefOffen(true)}>
            + Du hast schon dein Ergebnis aus dem Positionierungs-Tool? Hier einfügen
          </button>
        ) : (
          <div className="steckbrief-box">
            <label htmlFor="steckbrief-input">Dein Ergebnis aus dem Positionierungs-Tool (freiwillig)</label>
            <textarea
              id="steckbrief-input"
              rows={6}
              maxLength={6000}
              placeholder="Im Positionierungs-Tool auf „Für die Content Map kopieren“ klicken und hier einfügen."
              value={steckbriefInput}
              onChange={(e) => setSteckbriefInput(e.target.value)}
            />
            <div className="steckbrief-hint">Dann werden deine Säulen zu den Unterthemen und die Ideen passen zu deiner Zielgruppe. Das Oberthema kannst du dann auch leer lassen.</div>
          </div>
        )}

        <div className="controls-row">
          <div>
            <label htmlFor="anzahl-themen">Anzahl Unterthemen</label>
            <select id="anzahl-themen" value={anzahlThemen} onChange={(e) => setAnzahlThemen(parseInt(e.target.value, 10))}>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </div>
          <div>
            <label htmlFor="anzahl-ideen">Ideen pro Unterthema</label>
            <select id="anzahl-ideen" value={anzahlIdeen} onChange={(e) => setAnzahlIdeen(parseInt(e.target.value, 10))}>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={25}>25</option>
              <option value={30}>30</option>
            </select>
          </div>
        </div>

        <button className="btn-primary" onClick={generateFullMap} disabled={loading}>
          Content-Map erstellen
        </button>
        <div className="status-text">
          {spinning && <span className="spin"></span>}
          {status}
        </div>
      </div>

      {map && (
        <div id="map">
          <div className="oberthema-node">
            <div className="label">Oberthema</div>
            <div
              className="title"
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => updateOberthema(e.target.textContent)}
            >
              {map.oberthema}
            </div>
          </div>
          <div className="trunk"></div>
          <div className="grid-wrap">
            <div className="horizontal-line"></div>
            <div className="subtopics-grid">
              {map.unterthemen.map((sub, subIndex) => (
                <div className="subtopic-card" key={subIndex}>
                  <div className="subtopic-header">
                    <div
                      className="subtopic-title"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateSubtopicTitle(subIndex, e.target.textContent)}
                    >
                      {sub.titel}
                    </div>
                    <div>
                      <button className="icon-btn" title="Ideen neu vorschlagen" onClick={() => regenerateSubtopic(subIndex)}>
                        ↻
                      </button>
                      <button className="icon-btn" title="Unterthema löschen" onClick={() => removeSubtopic(subIndex)}>
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="idea-count">{sub.ideen.length} Ideen</div>
                  <ul className="idea-list">
                    {sub.ideen.map((idea, ideaIndex) => (
                      <li className="idea-row" key={ideaIndex}>
                        <span className="idea-dot">·</span>
                        <div className="idea-body">
                          <span
                            className="idea-text"
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => updateIdea(subIndex, ideaIndex, e.target.textContent)}
                          >
                            {idea.idee}
                          </span>
                          {idea.hooks.map((h, k) => (
                            <button type="button" className="idea-hook" key={k} title="Hook kopieren" onClick={() => copyHook(h)}>
                              <span className="idea-hook-label">Hook</span> {h}
                            </button>
                          ))}
                        </div>
                        <button className="idea-remove" onClick={() => removeIdea(subIndex, ideaIndex)}>
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button className="add-idea-btn" onClick={() => addIdea(subIndex)}>
                    + Idee hinzufügen
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="global-actions">
            <button className="btn-secondary" onClick={addSubtopic}>
              + Unterthema hinzufügen
            </button>
            <button className="btn-secondary" onClick={generateFullMap}>
              Alles neu generieren
            </button>
            <button className="btn-secondary" onClick={copyAsText}>
              Als Text kopieren
            </button>
            <button className="btn-secondary" onClick={() => window.print()}>
              Drucken / als PDF speichern
            </button>
          </div>
          <div className="copy-confirm">{copyConfirm}</div>
        </div>
      )}

      <footer>Content-Map Tool · für Networkerinnen, die über Sog-Marketing sichtbar werden</footer>
    </div>
  );
}
