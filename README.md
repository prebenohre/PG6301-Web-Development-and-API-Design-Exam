# PG6301 Kontinuasjonksamen H2024

**App deployet på Heroku:** https://pg6301-exam-news-app-a622156424c6.herokuapp.com/

## Sjekkliste

### Læringsmål:
- [x] Lage en app med parcel, express, concurrently, prettier, Jest
- [x] Sette opp en fungerende React app med React Router, håndtering av loading state og feilhåndtering
- [x] Sette opp en fungerende Express app inkludert Routes i egen fil
- [x] Kommunikasjon mellom klient og server med GET og POST inkludert feilhåndtering
- [x] Deployment til Heroku
- [x] Lagring, henting og endring av data i Mongodb
- [x] Login med OpenID Connect med Google
- [x] Web Sockets

### Funksjonelle krav:
- [x] Når en ny sak publiseres, skal alle brukerne få se den nye saken umiddelbart (bruk websockets for å sende oppdateringer)
- [x] Brukere kan logge seg inn. Du kan velge brukere skal kunne registrere seg med brukernavn og passord (anbefales ikke) eller om brukere skal logge inn med Google eller Facebook
  - *Jeg valgte å bruke Google da oppgaveteksten forteller at brukernavn og passrod ikke anbefales å bruke.*
- [x] En bruker som er logget inn kan se på sin profilside
- [x] Brukere skal forbli logget inn når de refresher websiden
- [x] En bruker som er logget inn kan klikke på en nyhetssak for å se detaljene om nyhetssaken. Detaljene skal inkludere en overskrift, tekst, navn og bilde (om tilgjengelig) på den som publiserte den
- [x] Brukere kan publisere nye nyhetsartikler
- [x] Nyhetsartikkel skal inneholde en kategori valgt fra en nedtrekksliste (`<select>`), tittel (`<input>`) og tekst (`<textarea>`)
- [x] Brukeren skal forhindres fra å sende inn en nyhetsartikkel som mangler kategori, tittel eller tekst
- [x] Dersom noen allerede har publisert en nyhetsartikkel med samme tittel skal serveren sende HTTP status kode 400 og en feilmelding
- [x] En bruker skal kunne redigere en artikkel de selv har publisert
- [x] En bruker skal kunne slette en bruker de selv har publisert
  - *Her antar jeg at det er en skrivefeil og at det egentlig menes at brukeren skal kunne slette sin egen artikkel*
- [x] Alle feil fra server skal presenteres til bruker på en pen måte, med mulighet for brukeren til å prøve igjen

### Tekniske krav:
- [x] Besvarelsen skal inneholde en README-fil med link til Heroku og test coverage
- [x] `npm start` skal starte server og klient. Concurrently og parcel anbefales
- [x] `npm test` skal kjøre tester. Testene skal ikke feile
  - *`npm test` kjører to dummy-tester som ikke feiler.*
- [x] Koden skal ha konsistent formattering. Prettier og Husky anbefales
- [x] Nettsidene skal ha god layout med CSS Grid og horisontal navigasjonsmeny. Brukeren må kunne navigere overalt uten å bruke "back" eller redigere URL
  - *Valgte å bruke flexbox istedenfor grid, men dekker ellers kravet.*
- [x] Serveren validerer at brukeren er logget inn
- [x] Innleveringen skal være i form av en ZIP-fil. Maks størrelse på fila er 1MB
- [x] Data skal lagres i MongoDB
- [x] Applikasjonen skal deployes til Heroku






