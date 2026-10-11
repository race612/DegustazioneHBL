# DegustazioneHBL

Scheda di degustazione online che salva le valutazioni su Google Sheets.

- `index.html` – scheda per gli assaggiatori.
- `settings.html` – impostazioni della serata (titolo, descrizione, versioni, loghi) e generazione di link + QR code.
- `apps-script/Code.gs` – Apps Script unico: crea automaticamente un file Google Sheets per ogni serata.

## Configurazione iniziale (una sola volta)

1. Vai su [script.google.com](https://script.google.com) → **Nuovo progetto**.
2. Cancella il contenuto e incolla `apps-script/Code.gs`. Salva.
3. Seleziona la funzione `autorizza` e premi **Esegui**: concedi le autorizzazioni richieste
   (Google mostrerà "App non verificata" → *Avanzate* → *Vai a … (non sicuro)*: è il tuo script).
   Su Drive viene creata la cartella **Degustazioni HBL**.
4. **Esegui il deployment → Nuovo deployment** → tipo **App web**,
   *Esegui come*: **Me**, *Chi ha accesso*: **Chiunque**. Copia l'URL che termina con `/exec`.

Per modificare lo script in futuro senza cambiare URL: **Gestisci deployment** → matita → *Versione*: **Nuova versione**.

## Nuova serata

1. Apri `settings.html`, compila nome serata, titolo, descrizione, versioni e loghi.
2. Incolla l'URL della Web App (viene ricordato sul dispositivo).
3. **Genera link e QR code** → stampa il QR o condividi il link.

Alla prima scheda ricevuta, lo script crea il file `Degustazione - <nome serata>` nella cartella
**Degustazioni HBL**. Le colonne vengono create automaticamente dai campi della scheda.

`index.html` aperto senza parametri mostra la scheda predefinita (Saison) collegata allo script originale.
