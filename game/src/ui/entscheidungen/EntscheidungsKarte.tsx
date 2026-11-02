import { useId, type ReactNode } from "react";
import "./entscheidung.css";

/** Vorschlag, Preis, Durchsetzung und Folgen stehen immer vor der verbindlichen Handlung. */
export function EntscheidungsKarte({kicker,titel,einleitung,fakten,children,aktion,gesperrt,hinweis,onAusfuehren}:{
  kicker:string;titel:ReactNode;einleitung:ReactNode;
  fakten:{label:string;wert:ReactNode;hinweis?:string}[];
  children:ReactNode;aktion?:string;gesperrt?:string;hinweis:string;onAusfuehren?:()=>void;
}) {
  const id=useId();
  return <section className="ek-entscheidung" aria-labelledby={`${id}-titel`}>
    <header><span className="ek-kicker">{kicker}</span><h4 id={`${id}-titel`}>{titel}</h4><p>{einleitung}</p></header>
    <dl className="ek-fakten">{fakten.map(f=><div key={f.label}><dt>{f.label}</dt><dd>{f.wert}{f.hinweis&&<small>{f.hinweis}</small>}</dd></div>)}</dl>
    <div className="ek-abwaegung">{children}</div>
    <footer><p id={`${id}-hinweis`}>{gesperrt||hinweis}</p>{aktion&&onAusfuehren&&<button type="button" disabled={!!gesperrt} aria-describedby={`${id}-hinweis`} onClick={onAusfuehren}>{aktion}<span aria-hidden="true">→</span></button>}</footer>
  </section>;
}
