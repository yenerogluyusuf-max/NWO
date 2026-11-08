# Gemeinsamer Projektstand – 2. November 2026

Der Nutzer hat die Sicherung der lokalen Entwicklung auf GitHub und die Übernahme der dort vorhandenen Analysen ausdrücklich beauftragt.

## Umfang

- Die bisher nicht eingecheckte Entwicklung umfasst 101 geänderte und 198 neue Dateien: Versorgung und Transport, parlamentarische Mehrheiten, Zusagen und Koalitionsfolgen, Haushalt und Monatsberichte, Ministerinitiativen und Ressorterholung, Regierungsschreibtisch, Gestaltung, Übersetzungen und Tests.
- Die drei Analyse-Commits bis `b918624` aus `claude/clever-tesla-wi4jq6` werden mit ihrer ursprünglichen Historie übernommen. Sie enthalten sieben Dokumente zum Stand vom 29. Oktober; ihre damaligen Befunde sind keine erneute Prüfung des heutigen Codes.
- Die 66 außerhalb des Repositorys gespeicherten Prüfberichte und vorhandenen älteren Screenshots liegen zusätzlich unter `reports/`. Historische Zwischenstände bleiben erhalten; die Abschlussnachweise ordnen frühere Fehler ein.
- 62 weitere Projektunterlagen aus dem übergeordneten Arbeitsbereich liegen unverändert unter `dokumentation/arbeitsbereich-2026-11-02/`. Abweichende Versionen ersetzen keine vorhandenen Dokumente. Das dortige Sicherungsverzeichnis enthält Herkunft, Zielpfad und SHA-256 jeder kopierten Datei.

## Sicherung und Abgleich

Vor der Zusammenführung wurde das vollständige Arbeitsverzeichnis einschließlich ignorierter Build-Dateien und vorhandener Verknüpfungen in einem separaten lokalen Archiv gesichert. Verknüpfte Abhängigkeiten werden dabei als Verknüpfungen erhalten; sie sind keine auf GitHub zu versionierenden Projektquellen. Ein zusätzliches Verzeichnis hält die ursprünglichen Dateiprüfsummen, den Git-Status und einen binären Änderungs-Patch fest.

Der Abgleich erfolgt ohne Zurücksetzen oder Umschreiben bestehender Commits. Der Arbeitszweig ist `codex/spiel-konsistenz`; der bisherige GitHub-Standardzweig heißt `claude/weiter-b91y4u`. Beide sollen denselben zusammengeführten Stand enthalten. Andere lokale Checkouts werden nicht überschrieben.

## Prüfstand und offene Arbeit

Diese Synchronisierung verändert keine Spielmechanik. Die neun im letzten Finanz-Abschlussnachweis festgehaltenen Quelldateien stimmen bei Beginn der Sicherung exakt mit ihren gespeicherten Prüfsummen überein. Der Nachweis dokumentiert 282 erfolgreiche gezielte Tests, zwei ausgelassene optionale Langtests sowie erfolgreiche TypeScript- und Produktionsprüfungen. Eine erneute Vollsuite ist allein wegen der zusätzlichen Dokumente nicht erforderlich.

Zum Zeitpunkt dieser ersten Synchronisierung blieben drei im Projektbericht festgehaltene Finanzlücken offen: einheitliche aktuelle BIP-Basis in Devisen und Gütern, Anbindung der neuen Ressortbudgets an Behörden sowie konsistente Schuldenbestände und Geldströme. Synchronisierung bedeutet Sicherung des tatsächlichen Entwicklungsstands, keine Fertigstellung oder neue fachliche Abnahme. Die visuelle Browserprüfung der jüngsten Oberfläche bleibt ebenfalls offen; ältere Screenshots belegen sie nicht.


## Nachtrag: Finanzkorrektur auf Nutzerauftrag

Im anschließenden Entwicklungsschritt sind die drei genannten Finanzlücken behoben und mit 242 unterschiedlichen gezielten Tests sowie TypeScript/Produktionsbuild geprüft. Der [Projektbericht](VERSORGUNG_PARLAMENT_2026-10-30.md#drei-finanzlücken-geschlossen-2-november) beschreibt Änderungen, Quellen, Altstandbehandlung und verbleibende Modellgrenzen. Der aktuelle Nachweis liegt unter `reports/Finanz-Konsistenz-Stand-2026-11-02.json`.

Die neuen Änderungen und Nachweise werden gemeinsam auf `codex/spiel-konsistenz` und den GitHub-Standardzweig `claude/weiter-b91y4u` übertragen. Andere lokale Checkouts bleiben unangetastet. Die visuelle Abnahme bleibt offen.
