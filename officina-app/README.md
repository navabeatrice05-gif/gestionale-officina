# Gestionale Officina — guida alla pubblicazione

Questa è una vera app web, indipendente da Claude. Una volta pubblicata avrai un link
(tipo `https://gestionale-officina.vercel.app`) che chiunque può aprire da telefono
**senza bisogno di account** — Cesare compreso.

Serve circa 20-30 minuti la prima volta. Dopo, per eventuali aggiornamenti futuri,
bastano pochi click.

Ti servono due account gratuiti (bastano email + password, nessuna carta richiesta):

- **Supabase** → il database dove vengono salvati clienti e appuntamenti
- **Vercel** → dove "vive" il sito, ti dà il link pubblico
- **GitHub** → serve solo come "deposito" del codice, fa da tramite tra i due

---

## Passo 1 — Crea il database su Supabase

1. Vai su **supabase.com** → **Start your project** → registrati (anche con Google)
2. Crea un nuovo progetto: dagli un nome tipo "officina-cesare", scegli una password
   per il database (salvala da parte, non serve nell'app ma non si sa mai) e la
   regione più vicina (es. Frankfurt/EU)
3. Aspetta 1-2 minuti che il progetto si prepari
4. Nel menu a sinistra vai su **SQL Editor** → **New query**
5. Apri il file `supabase-schema.sql` (incluso in questo pacchetto), copia **tutto**
   il contenuto, incollalo nell'editor e premi **Run** (o Ctrl/Cmd+Invio)
6. Dovrebbe dire "Success". Le tabelle sono create.
7. Vai su **Project Settings** (icona ingranaggio) → **API**
8. Tieni questa pagina aperta, ti servono due valori tra un attimo:
   - **Project URL** (tipo `https://abcdefgh.supabase.co`)
   - **anon public key** (una stringa lunga che inizia con `eyJ...`)

## Passo 2 — Metti il codice su GitHub

1. Vai su **github.com** → registrati se non hai già un account
2. In alto a destra premi **+** → **New repository**
3. Nome: `gestionale-officina` (o quello che preferisci) → **Create repository**
4. Nella pagina del repository appena creato, premi **uploading an existing file**
5. Trascina dentro **tutti i file e le cartelle** di questo pacchetto (tranne il
   file `.env` se lo hai già creato — quello NON va mai caricato online)
6. Scorri in basso, premi **Commit changes**

## Passo 3 — Pubblica su Vercel

1. Vai su **vercel.com** → **Sign Up** → scegli **Continue with GitHub** (così sono
   già collegati)
2. Premi **Add New** → **Project**
3. Trova il repository `gestionale-officina` che hai appena creato → **Import**
4. Prima di premere Deploy, apri **Environment Variables** e aggiungi questi due:

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | il Project URL copiato dal Passo 1 |
   | `VITE_SUPABASE_ANON_KEY` | la anon public key copiata dal Passo 1 |

5. Premi **Deploy**. Dopo 1-2 minuti ti dà un link tipo
   `https://gestionale-officina-xxxx.vercel.app`
6. Aprilo dal telefono: **funziona subito, nessun account richiesto**

## Passo 4 — Manda il link a Cesare

Il link ottenuto al Passo 3 è quello definitivo da mandare a Cesare. Dal suo
telefono, apre il link in Safari/Chrome, poi:

- **iPhone**: pulsante di condivisione (quadrato con freccia) → **Aggiungi a Home**
- **Android**: menu ⋮ del browser → **Aggiungi a schermata Home**

Da quel momento ha un'icona sul telefono che apre l'app a schermo intero, come
un'app vera. Entrambi (tu e Cesare) vedete e modificate **gli stessi dati**, in
tempo reale, perché condividete lo stesso database su Supabase.

---

## Aggiornamenti futuri

Se in futuro vorrai modifiche al codice (nuove funzioni, correzioni), ti basterà:
1. Sostituire i file nel repository GitHub (stesso metodo del Passo 2)
2. Vercel ripubblica automaticamente in 1-2 minuti, stesso link, nessuna
   configurazione da rifare

## Backup

Dentro l'app, l'icona a forma di ingranaggio in alto a destra apre **Backup dati**:
puoi scaricare in qualsiasi momento un file con tutti i clienti e gli appuntamenti,
utile come copia di sicurezza personale oltre al database.

## Nota su privacy e sicurezza

Non essendoci un login per Cesare, chiunque abbia il link può usare l'app. Questo
va benissimo per l'uso interno di un'officina, ma tienilo a mente: non condividere
il link pubblicamente. Se in futuro vorrai una protezione con password, è possibile
aggiungerla.
