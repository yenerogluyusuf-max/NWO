import { useState } from "react";
import { emptyProfile, STATIONS, type PlayerProfile } from "../sim/prolog";

export function Prologue({ onDone }: { onDone: (p: PlayerProfile) => void }) {
  const [profile] = useState<PlayerProfile>(emptyProfile);
  const [name, setName] = useState("");
  const [step, setStep] = useState(-1);
  const [chosen, setChosen] = useState<string[]>([]);

  function choose(label: string, apply: (p: PlayerProfile) => void) {
    apply(profile);
    setChosen([...chosen, label]);
    setStep(step + 1);
  }

  function randomRest() {
    let s = step;
    const labels = [...chosen];
    if (s < 0) {
      profile.name = name || "Deniz Aydın";
      s = 0;
    }
    for (; s < STATIONS.length; s++) {
      const answers = STATIONS[s]!.answers;
      const a = answers[Math.floor(Math.random() * answers.length)]!;
      a.apply(profile);
      labels.push(a.label);
    }
    setChosen(labels);
    setStep(STATIONS.length);
  }

  if (step === -1) {
    return (
      <div className="prologue">
        <section className="paper prologue-card">
          <p className="kind-label">Prolog</p>
          <h2>Wer bist du?</h2>
          <p className="story">
            Es ist Frühjahr 2028. In wenigen Wochen wählt die Türkei ein neues Parlament und einen neuen Präsidenten.
            Bevor wir dorthin kommen, erzähl uns, wer du bist und wie du hierhergekommen bist.
          </p>
          <label className="name-input">
            Dein Name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="zum Beispiel Deniz Aydın" autoFocus />
          </label>
          <div className="confirm">
            <button
              className="primary"
              disabled={name.trim().length < 2}
              onClick={() => {
                profile.name = name.trim();
                setStep(0);
              }}
            >
              Weiter
            </button>
            <button onClick={randomRest}>Zufällig und schnell</button>
          </div>
        </section>
      </div>
    );
  }

  if (step < STATIONS.length) {
    const st = STATIONS[step]!;
    return (
      <div className="prologue">
        <section className="paper prologue-card">
          <p className="kind-label">
            Prolog · {step + 1} von {STATIONS.length} · {st.title}
          </p>
          <p className="story">{st.story}</p>
          <h2>{st.question}</h2>
          <div className="answers">
            {st.answers.map((a) => (
              <button key={a.label} className="answer" onClick={() => choose(a.label, a.apply)}>
                <strong>{a.label}</strong>
                <span>{a.text}</span>
              </button>
            ))}
          </div>
          <div className="confirm">
            <button className="link" onClick={randomRest}>
              Rest zufällig wählen
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="prologue">
      <section className="paper prologue-card">
        <p className="kind-label">Prolog · Ende</p>
        <h2>{profile.name}</h2>
        <p className="story">
          Aufgewachsen in {profile.heimat}, von Beruf {profile.beruf}, Gründung der {profile.partei.name}.{" "}
          {profile.versprechen[0] ?? ""}
        </p>
        <ul className="summary">
          {STATIONS.map((s, i) => (
            <li key={s.id}>
              <span className="subtitle">{s.title}:</span> {chosen[i]}
            </li>
          ))}
        </ul>
        <p className="story">Die Wahlnacht ist vorbei. Morgen früh wartet der Schreibtisch.</p>
        <div className="confirm">
          <button className="primary" onClick={() => onDone(profile)}>
            Amtsantritt
          </button>
        </div>
      </section>
    </div>
  );
}
