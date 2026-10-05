#!/bin/bash
# Baut „Staatsräson.app“ aus dem aktuellen Stand des Spiels und legt sie nach ~/Applications.
#   ./app/bauen.sh           baut neu (Spiel, Hülle, Symbol) und ersetzt die App
# Schwere Dateien (Electron, Zwischenstand) liegen in ~/.staatsraeson-app, nicht im iCloud-Schreibtisch.
# Die App ist ein Abbild des Spiels zum Zeitpunkt des Baus; nach Änderungen am Spiel einfach erneut bauen.
set -euo pipefail

HIER="$(cd "$(dirname "$0")" && pwd)"
QUELLE="$(cd "$HIER/.." && pwd)"
WERK="$HOME/.staatsraeson-app"
ZIEL="$HOME/Applications/Staatsräson.app"

mkdir -p "$WERK" "$HOME/Applications"
cd "$WERK"

# Läuft die App, spielt jemand: Sie wird NICHT beendet (ein Abbruch kann ungesicherten Fortschritt kosten). Erst Cmd+Q, dann bauen.
# Mit ERZWINGEN=1 wird sie trotzdem beendet (das App-Fenster sichert vorher den Stand, siehe main.cjs).
# Das Muster ist rein ASCII, weil macOS den Umlaut im Pfad zerlegt speichert und ein Muster mit „ä“ nicht trifft.
if pgrep -f "Applications/Staatsr.*Contents/MacOS/Electron" > /dev/null 2>&1; then
  if [ "${ERZWINGEN:-0}" != "1" ]; then
    echo "✗ Die App läuft noch. Bitte mit Cmd+Q beenden (sie sichert dabei den Stand) und dann erneut bauen." >&2
    echo "  Oder: ERZWINGEN=1 ./app/bauen.sh  (beendet die App geordnet)" >&2
    exit 2
  fi
  osascript -e 'tell application id "local.staatsraeson.spiel" to quit' > /dev/null 2>&1 || true
  for i in 1 2 3 4 5 6 7 8 9 10; do pgrep -f "Applications/Staatsr.*Contents/MacOS/Electron" > /dev/null 2>&1 || break; sleep 1; done
fi

echo "→ Spiel wird gebaut …"
(cd "$QUELLE/game" && npx vite build --outDir "$WERK/stage/dist" --emptyOutDir)

echo "→ Anbieterliste wird übersetzt …"
rm -rf "$WERK/stage/ki"
(cd "$QUELLE/game" && npx tsc --ignoreConfig src/ki/anbieterliste.ts --outDir "$WERK/stage/ki" --module es2022 --target es2022 --skipLibCheck)
mv "$WERK/stage/ki/anbieterliste.js" "$WERK/stage/ki/anbieterliste.mjs"

cp "$HIER/main.cjs" "$HIER/package.json" "$WERK/stage/"

echo "→ Symbol wird erzeugt …"
if [ ! -f "$WERK/staatsraeson.icns" ] || [ "$HIER/symbol.svg" -nt "$WERK/staatsraeson.icns" ]; then
  rm -rf "$WERK/symbol.iconset" && mkdir "$WERK/symbol.iconset"
  (cd "$QUELLE/game" && node "$HIER/symbol.mjs" "$HIER/symbol.svg" "$WERK/symbol-1024.png")
  for g in 16 32 64 128 256 512; do
    sips -z $g $g "$WERK/symbol-1024.png" --out "$WERK/symbol.iconset/icon_${g}x${g}.png" > /dev/null
    sips -z $((g*2)) $((g*2)) "$WERK/symbol-1024.png" --out "$WERK/symbol.iconset/icon_${g}x${g}@2x.png" > /dev/null
  done
  iconutil -c icns "$WERK/symbol.iconset" -o "$WERK/staatsraeson.icns"
fi

echo "→ App wird zusammengesetzt …"
rm -rf "$ZIEL"
cp -R node_modules/electron/dist/Electron.app "$ZIEL"
rm -f "$ZIEL/Contents/Resources/default_app.asar"
mkdir -p "$ZIEL/Contents/Resources/app"
cp -R "$WERK/stage/." "$ZIEL/Contents/Resources/app/"
cp "$WERK/staatsraeson.icns" "$ZIEL/Contents/Resources/electron.icns"
PL="$ZIEL/Contents/Info.plist"
/usr/libexec/PlistBuddy -c "Set :CFBundleName Staatsräson" "$PL"
/usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName Staatsräson" "$PL" 2>/dev/null || /usr/libexec/PlistBuddy -c "Add :CFBundleDisplayName string Staatsräson" "$PL"
/usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier local.staatsraeson.spiel" "$PL"
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString 0.1.0" "$PL" 2>/dev/null || true
xattr -cr "$ZIEL"
codesign --force --deep --sign - "$ZIEL" > /dev/null 2>&1 || echo "(Hinweis: Signieren übersprungen)"
echo "✓ Fertig: $ZIEL"
if [ "${NICHT_STARTEN:-0}" != "1" ]; then open "$ZIEL"; fi
