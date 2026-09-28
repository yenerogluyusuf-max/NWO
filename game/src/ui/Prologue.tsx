import { useState } from "react";
import { emptyProfile, STATIONS, type PlayerProfile } from "../sim/prolog";
import { Vignette, type Scene } from "./art/Vignette";
import { Corners } from "./art/Ornament";
import { Cameo } from "./art/Cameo";
import { plakaByName } from "./atlas/overlay";

const SCENE: Record<string, Scene> = {
  kindheit: "anatolien",
  jugend: "istanbul",
  beruf: "bank",
  liebe: "istanbul",
  politik: "parlament",
  partei: "parlament",
  wahlkampf: "wahlnacht",
  wahlnacht: "wahlnacht",
};

export function Prologue({ onDone, onFocus }: { onDone: (p: PlayerProfile) => void; onFocus?: (plaka: number | undefined) => void }) {
  const [profile] = useState<PlayerProfile>(emptyProfile);
  const [name, setName] = useState("");
  const [step, setStep] = useState(-1);
  const [chosen, setChosen] = useState<string[]>([]);

  function choose(label: string, apply: (p: PlayerProfile) => void) {
    apply(profile);
    setChosen([...chosen, label]);
    setStep(step + 1);
    onFocus?.(profile.heimatPlaka || undefined);
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
    onFocus?.(profile.heimatPlaka || undefined);
  }

  const total = STATIONS.length;

  const card = (scene: Scene, kicker: string, body: React.ReactNode) => (
    <div className="prologue">
      <section className="frame prologue-card">
        <Corners />
        <Vignette scene={scene} />
        <div className="prologue-body">
          <div className="prologue-progress" aria-label={kicker}>
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={i < step ? "done" : i === step ? "now" : ""} />
            ))}
          </div>
          <p className="kicker">{kicker}</p>
          {body}
        </div>
      </section>
    </div>
  );

  if (step === -1) {
    return card(
      "anatolien",
      "Prolog",
      <>
        <h2>Wer bist du?</h2>
        <p className="story">
          Es ist Frühjahr 2028. In wenigen Wochen wählt die Türkei ein neues Parlament und einen neuen Präsidenten. Bevor wir dorthin
          kommen, erzähl uns, wer du bist und wie du hierhergekommen bist.
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
      </>,
    );
  }

  if (step < total) {
    const st = STATIONS[step]!;
    const isHome = st.id === "kindheit";
    return card(
      SCENE[st.id] ?? "anatolien",
      `${st.title} · ${step + 1} von ${total}`,
      <>
        <p className="story">{st.story}</p>
        <h2>{st.question}</h2>
        <div className="answers">
          {st.answers.map((a) => (
            <button
              key={a.label}
              className="answer"
              onClick={() => choose(a.label, a.apply)}
              onPointerEnter={() => isHome && onFocus?.(plakaByName(a.label))}
            >
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
      </>,
    );
  }

  return card(
    "wahlnacht",
    "Wahlnacht",
    <>
      <div className="prologue-hero">
        <Cameo seed={profile.name} size={78} tint={profile.partei.farbe} />
        <div>
          <h2>{profile.name}</h2>
          <p className="subtitle">
            {profile.partei.name} · gewählt {profile.wahl.runde === 1 ? "im ersten Wahlgang" : "in der Stichwahl"} mit{" "}
            {profile.wahl.anteil.toLocaleString("de-DE")} %
          </p>
        </div>
      </div>
      <p className="story">
        Aufgewachsen in {profile.heimat}, von Beruf {profile.beruf}. {profile.versprechen[0] ?? ""}
      </p>
      <dl className="summary">
        {STATIONS.map((s, i) => (
          <div key={s.id}>
            <dt>{s.title}</dt>
            <dd>{chosen[i]}</dd>
          </div>
        ))}
      </dl>
      <p className="story">Die Wahlnacht ist vorbei. Morgen früh wartet der Schreibtisch in Ankara.</p>
      <div className="confirm">
        <button className="primary" onClick={() => onDone(profile)}>
          Amtsantritt
        </button>
      </div>
    </>,
  );
}
