# Únikovka & Matematický souboj

Jednoduchá statická webová aplikace se dvěma nástroji:

- Únikovka: odpověz správně na 10 matematických otázek a za každou získáš nápovědu k finálnímu tajemství.
- Matematický souboj: dva hráči soutěží, kdo rychleji správně spočítá příklad. První správná odpověď získává bod a ihned se vygeneruje další příklad.

## Jak spustit

Protože jde o čistě statické soubory, stačí otevřít `index.html` v prohlížeči.

Volitelně lze spustit jednoduchý lokální server (např. v Pythonu):

```
python3 -m http.server 8000
```

A poté otevřít http://localhost:8000 v prohlížeči.

## Obsah

- `index.html` – rozhraní a navigace mezi Únikovkou a Soubojem
- `styles.css` – základní vzhled (tmavý režim)
- `script.js` – logika otázek, nápověd, generátor příkladů a skóre

## Poznámky

- Finální odpověď v Únikovce: „Vídeňský řízek“ (akceptují se i varianty bez diakritiky či anglicky „Wiener schnitzel“).
- V souboji lze zvolit typ operací (sčítání, násobení, mix) a velikost čísel (2–3 cifry).
- Klávesové zkratky: N = další otázka / nový příklad, Enter = odeslat odpověď v aktivním formuláři.
- Veškerá logika běží jen v prohlížeči, nic se neodesílá na server.