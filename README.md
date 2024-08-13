# PG6301 Kontinuasjonksamen H2024

## App deployet på Heroku: https://pg6301-exam-news-app-a622156424c6.herokuapp.com/

## Github repository: [https://github.com/kristiania-pg6301-2023/pg6301-resit2024H2-prebenohre](https://github.com/kristiania-pg6301-2023/pg6301-resit2024H2-prebenohre)

## Testcoverage: HUSK Å LEGGE TIL SENERE

## Kandidatnummer: 13

## Sjekkliste

## Test

### Læringsmål:
- [x] Lage en app med parcel, express, concurrently, prettier, Jest
- [x] Sette opp en fungerende React app med React Router, håndtering av loading state og feilhåndtering
- [x] Sette opp en fungerende Express app inkludert Routes i egen fil
- [x] Kommunikasjon mellom klient og server med GET og POST inkludert feilhåndtering
- [x] Deployment til Heroku
- [x] Lagring, henting og endring av data i Mongodb
- [x] Login med OpenID Connect med Google
- [x] Web Sockets
- [ ] Test coverage på 50-70% eller bedre dokumentert med Github Actions
- For å oppnå A må alle 9 av disse være dekket
- For å oppnå B må 8 av disse være dekket
- For å oppnå C må 6-7 av disse være dekket
- For å oppnå D må 4-5 av disse være dekket
- For å oppnå E må 2-3 av disse være dekket og applikasjonen må enten kjøre på Heroku eller `npm install && npm test && npm start` må kjøre uten feil og gi en brukbar applikasjon.

### Funksjonelle krav:
- [x] Når en ny sak publiseres, skal alle brukerne få se den nye saken umiddelbart (bruk websockets for å sende oppdateringer)
- [x] Brukere kan logge seg inn. Du kan velge brukere skal kunne registrere seg med brukernavn og passord (anbefales ikke) eller om brukere skal logge inn med Google eller Facebook
- [x] En bruker som er logget inn kan se på sin profilside
- [x] Brukere skal forbli logget inn når de refresher websiden
- [ ] En bruker som er logget inn kan klikke på en nyhetssak for å se detaljene om nyhetssaken. Detaljene skal inkludere en overskrift, tekst, navn og bilde (om tilgjengelig) på den som publiserte den
- [x] Brukere kan publisere nye nyhetsartikler
- [x] Nyhetsartikkel skal inneholde en kategori valgt fra en nedtrekksliste (`<select>`), tittel (`<input>`) og tekst (`<textarea>`)
- [x] Brukeren skal forhindres fra å sende inn en nyhetsartikkel som mangler kategori, tittel eller tekst
- [ ] Dersom noen allerede har publisert en nyhetsartikkel med samme tittel skal serveren sende HTTP status kode 400 og en feilmelding
- [x] En bruker skal kunne redigere en artikkel de selv har publisert
- [x] En bruker skal kunne slette en bruker de selv har publisert
  - Her antar jeg at det er en skrivefeil og at det egentlig menes at brukeren skal kunne slette sin egen artikkel
- [ ] Alle feil fra serveres skal presenteres til bruker på en pen måte, med mulighet for brukeren til å prøve igjen

### Tekniske krav:
#### Må-ha:
- [ ] Besvarelsen skal inneholde en README-fil med link til Heroku og test coverage
- [x] `npm start` skal starte server og klient. Concurrently og parcel anbefales
- [ ] `npm test` skal kjøre tester. Testene skal ikke feile
- [x] Koden skal ha konsistent formattering. Prettier og Husky anbefales
- [ ] Nettsidene skal ha god layout med CSS Grid og horisontal navigasjonsmeny. Brukeren må kunne navigere overalt uten å bruke "back" eller redigere URL
- [x] Serveren validerer at brukeren er logget inn
- [ ] Innleveringen skal være i form av en ZIP-fil. Maks størrelse på fila er 1MB
- [x] Data skal lagres i MongoDB
- [x] Applikasjonen skal deployes til Heroku
- [x] Testene skal kjøre på Github Actions

#### Bør-ha:
- [ ] Github Actions bør beregne testcoverage. Testdekningen bør være over 50%. Bruk `collectCoverageFrom` for å inkludere *alle* filer. Kun genererte filer som `coverage` og `dist` skal ekskluderes
  - Vi har fått en rabattkode som gjør det mulig å benytter coveralls. Du kan bruke coveralls eller `jest-coverage-report-action`
  - Om dere bruker coveralls og ikke får til å laste opp coverage for både `client` og `server` er det tilstrekkelig å laste opp for én. Men pass på at `npm test` genererer rapport for begge!
- [ ] Brukere bør alltid se listen over artikler når de navigerer seg rundt på sidene
- [ ] Brukere kan logge seg på med mer enn én OpenID Connect Provider (for eksempel Entra ID, Facebook, LinkedIn, GitHub)
  - NB: Microsoft har endret Entra ID. Dette er derfor ikke lenger et forventet krav, men vil gi bonuspoeng som kan kompensere for andre feil






