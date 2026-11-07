# Welle E3b: Die letzte Amtszeit warnt rechtzeitig

Zweig `welle/e3b`, abgezweigt von `welle/ein3`. Spielstand des Inhabers: `scratchpad/spielstand/s2045.json`.

## Befund im Spiel des Inhabers

- **Grenze:** Das Paket „Weitere Wiederwahl“ vom 15.10.2033 erlaubt drei Amtszeiten. Die dritte begann am 05.06.2038 und war die letzte.
- **Nachfolge:**
  - Am 01.03.2044 kam „Wer soll Ihnen nachfolgen?“ (`nachfolge_kuer`, 18 Monate vor der Wahl).
  - Ohne Antwort bestimmte die Partei nach Stärke Uğur Sezer, den Chef des Generalstabs.
- **Verfassung:** Am 01.06.2045 brachte der Inhaber „Keine Begrenzung“ ein. Die Abstimmung war für den 29.06. angesetzt, die Wahl für den 04.06.
- **Ende:** Sezer gewann mit 58,1 %. Die Partie endete mit „Das Lager gewinnt die Nachfolgewahl“.
- **Was fehlte:** Vorher sagten nur Chronik, Protokoll und ein Satz im Hinweis zur Wiederwahl, dass die Amtszeit die letzte ist. Das Paket zeigte keinen Hinweis, dass es nach der Wahl käme.

## Umgesetzt

**1. Ankündigung `amtszeit_letzte`** in der eigenen Datei `sim/ereignisse-letzte.ts`.
- **Zeitpunkte:** zu Beginn der letzten Amtszeit, etwa 19 Monate (570 Tage) und etwa 9 Monate (270 Tage) vor der Wahl, je Stufe einmal. Die 570 Tage liegen bewusst vor der Kür bei 18 Monaten.
- **Platz:** eigener Platz, fester Tag, eigener Wurf. Es wird keine Zufallszahl aus dem Strom der Partie gezogen.
- **Text:** „Dies ist Ihre 3. Amtszeit, die Verfassung erlaubt 3. Bei der Wahl am 4. Juni 2045 dürfen Sie nicht mehr antreten.“ Dazu: wer für das Lager antritt.
- **Wege:**
  - **Verfassung ändern:** Die Grenze wird einen Schritt gelockert (zwei → drei, drei → keine). Das Paket wird wirklich eingebracht; den Preis bucht es selbst, die Plakette nennt denselben. Die Karte zeigt:
    - die nötige Mehrheit: 360 mit Volksabstimmung (63 Tage) oder 400 direkt (28 Tage)
    - die erwarteten Stimmen mit Spanne
    - die Tage bis zur Wahl
    - einen Sprung „Zur Verfassung“
  - **Neuwahl durch das Parlament (Art. 116):** siehe Abschnitt 3.
  - **Den Nachfolger aufbauen:** 1 Kapital, Nachfolgedruck −20, Loyalität der Anwärter +4. Sprung „Zum Machtkreis“.
  - **Abtreten ankündigen:** Legitimität +2, Ansehen +1, Vertrauen +0,5, jeder Minister −1 Loyalität.
  - **Später entscheiden.**

**2. Frist der Verfassung** (`paketFrist` in `sim/verfassung.ts`).
- **Zu spät:** Kommt die Abstimmung erst nach der Wahl (28 Tage oder mehr bei weniger Tagen bis zur Wahl), ist der Weg in der Ankündigung gesperrt. Die Begründung lautet: „Zu spät für diese Wahl: Sie ist in N Tagen, abgestimmt würde frühestens nach 28 Tagen.“
- **Knapp:** Reicht es nur ohne Volksabstimmung, sagt die Prüfung: „Nur mit 400 Stimmen wirkt das Paket rechtzeitig.“
- **Trotzdem eingebracht:** Die Werkstatt zeigt den Hinweis an erster Stelle. Die Meldung beim Einbringen endet mit „Für die Wahl in N Tagen kommt es zu spät: Sie treten dort nicht an.“
- **Gesperrt wird nichts:** Ein Paket kann auch für die Zeit nach der Wahl gewollt sein.

**3. Art. 116 Abs. 3**
- **Quelle:** Anayasa, mevzuat.gov.tr/MevzuatMetin/1.5.2709.pdf, Fassung Gesetz 6771 vom 21.01.2017.
  - Art. 101 Abs. 2: „Bir kimse en fazla iki defa Cumhurbaşkanı seçilebilir.“
  - Art. 116 Abs. 1: Neuwahl durch das Parlament mit drei Fünfteln der Mitglieder (360).
  - Art. 116 Abs. 3: „Cumhurbaşkanının ikinci döneminde Meclis tarafından seçimlerin yenilenmesine karar verilmesi halinde, Cumhurbaşkanı bir defa daha aday olabilir.“
- **Vorher im Spiel:**
  - Die „Vorgezogene Neuwahl“ gab es nur als Verfassungspaket (360 mit Volksabstimmung, 400 direkt).
  - Der Präsident durfte danach nicht antreten, weil die Zahl der Amtszeiten blieb. Abs. 3 war nicht abgebildet.
- **Jetzt:**
  - Eine Neuwahl allein ist ein Beschluss des Parlaments: Ab 360 Stimmen gilt sie ohne Volksabstimmung.
  - Fällt sie in der letzten erlaubten Amtszeit, darf der Präsident einmal mehr antreten (`zusatzKandidatur`, `amtszeitGrenze`). Die Nachfolge wird zurückgenommen, wie es `regelPruefen` schon tut.
  - Gewählt wird binnen 60 Tagen, wie bisher.
  - In diesem Fall stimmt die Opposition dagegen (−1) und der Partner dafür (+1). Das ist ein Spielparameter.
  - Nach „Weitere Wiederwahl“ gilt die Ausnahme im Spiel auch für die dritte Amtszeit. Auch das ist ein Spielparameter: Die Verfassung spricht von der zweiten.

## Antworten für den Inhaber

**Was geschieht, wenn der Präsident nicht mehr antreten darf?**
- **Kür:** 18 Monate vor der Wahl kommt die Nachfolgefrage. Sie ist eine echte Entscheidung: einen der drei stärksten Minister küren (3 Kapital), die Partei entscheiden lassen oder es später entscheiden.
  - Ohne Antwort innerhalb von 60 Tagen entscheidet die Partei nach Stärke der Anwärter. So kam Sezer ins Rennen.
  - Wer übergangen wird und ehrgeizig ist, grollt und tritt vielleicht als Rivale an.
- **Wahlkampf:** Er läuft für den Nachfolger. Der Präsident hilft mit Auftritten, sein Rückhalt überträgt sich nur zum Teil.

**Spielt man mit dem Nachfolger weiter?** Nein.
- Nach der Nachfolgewahl endet die Partie (`beende`, Art „amtszeitende“).
- Gewinnt das Lager, steht „Das Lager gewinnt die Nachfolgewahl … die Macht wird geordnet übergeben“, verliert es, „abwahl“.
- Danach folgen Bilanz und Vermächtnis und der Knopf „Neue Partie“. Ein Weiterspielen mit dem Nachfolger gibt es nicht.

## Geänderte Dateien

- **Neu:**
  - `sim/ereignisse-letzte.ts`
  - Katalog `welle_e3b.json` (de, en, tr, 33 Schlüssel)
  - `test/welle-e3b.test.ts`
- **Kleinste Stellen:**
  - `sim/verfassung.ts`: Grenze, Frist, Art. 116, Hinweise
  - `sim/amtszeit.ts`: `maxAmtszeiten` aus `amtszeitGrenze`
  - `sim/spiel-typen.ts`: `zusatzKandidatur`
  - `sim/machtkreis.ts`: Stand der Ankündigung
  - `sim/ereignisse.ts`: Registrierung
  - `sim/ereignis-hilfen.ts`, `ui/Stage.tsx`, `ui/ereignis/kontext.ts`: Sprung „Zur Verfassung“

## Zur Bestätigung durch den Inhaber

- **Ankündigung:**
  - Zeitpunkte 570 und 270 Tage vor der Wahl.
  - Ein eigener Platz wie bei der Stufe des Nachfolgedrucks. Die Ankündigung ist ein Termin des Amtes.
- **Aufbauen und Abtreten:** Zahlen wie in Abschnitt 1, Spielparameter.
- **Art. 116 Abs. 3:**
  - Er gilt im Spiel auch nach „Weitere Wiederwahl“.
  - Opposition −1, Partner +1.
- **Weiterspielen:** Mit dem Nachfolger nach der Wahl weiterzuspielen wäre ein neuer Spielteil, der nicht gebaut ist.

## Tests

- **Typprüfung:** `npx tsc --noEmit` sauber.
- **Neu:** `welle-e3b` mit 6 Tests:
  - Ankündigung je Stufe einmal, nur in der letzten Amtszeit
  - die Wege und ihr gebuchter Preis
  - „zu spät“ und „nur mit 400“
  - Art. 116 Abs. 3 öffnet einmal eine Kandidatur, ohne Volksabstimmung
  - Spielstand 2043: Die Ankündigung wäre gekommen, drei Tage vor der Wahl ist „zu spät“.
- **Grün:**
  - `amtszeit`, `verfassung`, `unbegrenzt`, `enden`, `enden-katalog`
  - `datentexte`, `reparaturen-welle2`, `ressortpolitik`, `umbildung-tisch`
  - `vermaechtnis-ansicht`, `wahl-ansichten`, `wahl-katalog`, `katastrophe-sprachen`
  - `ereignisse-texte`, `ereignisse-sprachen`, `welle-e3`, `spielbarkeit`, `linsen`
  - `schau-antworten`: unter Last mehrfach über die Zeit, einzeln grün.
