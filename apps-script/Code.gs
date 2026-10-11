/**
 * Degustazione HBL - Apps Script unico per tutte le serate.
 *
 * Riceve le schede inviate da index.html e le salva in un file Google Sheets
 * dedicato alla serata (campo "serata" nei dati). Se il file della serata non
 * esiste ancora, viene creato automaticamente nella cartella Drive NOME_CARTELLA.
 *
 * Va pubblicato UNA SOLA VOLTA come App web (Esegui come: Me, Accesso: Chiunque).
 * Per aggiornare il codice senza cambiare URL: Gestisci deployment -> matita ->
 * Versione: "Nuova versione".
 */

const NOME_CARTELLA = 'Degustazioni HBL';
const PREFISSO_FILE = 'Degustazione - ';
const NOME_SCHEDA = 'Schede';
const SERATA_PREDEFINITA = 'Senza nome';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const dati = JSON.parse(e.postData.contents);
    const serata = pulisciNome(dati.serata) || SERATA_PREDEFINITA;
    const foglio = ottieniFoglioSerata(serata);
    scriviRiga(foglio, Object.assign({ ricevuto: new Date() }, dati));
    return risposta({ esito: 'ok', serata: serata });
  } catch (err) {
    console.error(err);
    return risposta({ esito: 'errore', messaggio: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return risposta({ esito: 'ok', messaggio: 'Web App Degustazione HBL attiva' });
}

/**
 * Da eseguire una volta dall'editor (pulsante "Esegui") per concedere le
 * autorizzazioni e creare la cartella su Drive.
 */
function autorizza() {
  const cartella = ottieniCartella();
  console.log('Cartella pronta: ' + cartella.getName() + ' - ' + cartella.getUrl());
}

function ottieniCartella() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('cartellaId');
  if (id) {
    try {
      const cartella = DriveApp.getFolderById(id);
      if (!cartella.isTrashed()) return cartella;
    } catch (err) {
      // cartella eliminata: la ricreiamo sotto
    }
  }
  const trovate = DriveApp.getFoldersByName(NOME_CARTELLA);
  while (trovate.hasNext()) {
    const c = trovate.next();
    if (!c.isTrashed()) {
      props.setProperty('cartellaId', c.getId());
      return c;
    }
  }
  const nuova = DriveApp.createFolder(NOME_CARTELLA);
  props.setProperty('cartellaId', nuova.getId());
  return nuova;
}

function ottieniFoglioSerata(serata) {
  const props = PropertiesService.getScriptProperties();
  const chiave = 'serata:' + serata;
  const nomeFile = PREFISSO_FILE + serata;

  // 1. File già noto
  const id = props.getProperty(chiave);
  if (id) {
    try {
      if (!DriveApp.getFileById(id).isTrashed()) {
        return SpreadsheetApp.openById(id).getSheets()[0];
      }
    } catch (err) {
      // file eliminato: lo cerchiamo o ricreiamo sotto
    }
  }

  // 2. File presente nella cartella (es. creato prima o rinominato a mano)
  const cartella = ottieniCartella();
  const trovati = cartella.getFilesByName(nomeFile);
  while (trovati.hasNext()) {
    const f = trovati.next();
    if (!f.isTrashed()) {
      props.setProperty(chiave, f.getId());
      return SpreadsheetApp.openById(f.getId()).getSheets()[0];
    }
  }

  // 3. Nuovo file per la serata
  const ss = SpreadsheetApp.create(nomeFile);
  DriveApp.getFileById(ss.getId()).moveTo(cartella);
  const foglio = ss.getSheets()[0];
  foglio.setName(NOME_SCHEDA);
  props.setProperty(chiave, ss.getId());
  return foglio;
}

/**
 * Accoda una riga. Le intestazioni vengono create dai nomi dei campi ricevuti;
 * se in futuro la scheda invia campi nuovi, vengono aggiunte nuove colonne.
 */
function scriviRiga(foglio, dati) {
  const ultimaColonna = foglio.getLastColumn();
  const intestazioni = ultimaColonna > 0
    ? foglio.getRange(1, 1, 1, ultimaColonna).getValues()[0].map(String)
    : [];

  let modificate = false;
  Object.keys(dati).forEach(function (k) {
    if (intestazioni.indexOf(k) === -1) {
      intestazioni.push(k);
      modificate = true;
    }
  });

  if (modificate) {
    foglio.getRange(1, 1, 1, intestazioni.length)
      .setValues([intestazioni])
      .setFontWeight('bold');
    foglio.setFrozenRows(1);
  }

  const riga = intestazioni.map(function (h) {
    return proteggiValore(dati[h]);
  });
  foglio.appendRow(riga);
}

// Evita che testi inseriti dagli utenti (es. note che iniziano con "=") vengano
// interpretati come formule.
function proteggiValore(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'string' && /^[=+\-@]/.test(v)) return "'" + v;
  return v;
}

function pulisciNome(nome) {
  return String(nome || '')
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function risposta(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
