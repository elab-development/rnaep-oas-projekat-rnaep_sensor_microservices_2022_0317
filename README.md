#  Pametno navodnjavanje - Smart Irrigation System

Mikroservisna aplikacija za automatsko i ručno upravljanje navodnjavanjem na bazi senzora, vremenske prognoze i podataka o zemljištu.

---

##  Opis projekta

**Smart Irrigation System** je mikroservisna aplikacija dizajnirana za pametnu poljoprivredu. Sistem omogućava poljoprivrednicima da:

- **Prate** vlažnost zemljišta, temperaturu i vlažnost vazduha u realnom vremenu
- **Automatski zalivaju** useve na osnovu unapred definisanih pravila i vremenske prognoze
- **Ručno upravljaju** zalivanjem putem web interfejsa
- **Dobijaju alertove** kada vlažnost padne ispod kritičnog nivoa
- **Planiraju** zalivanje na osnovu 7-dnevne vremenske prognoze
- **Upravljaju** više zona (parcela) sa različitim podešavanjima

Projekat je rađen kao drugi domaći zadatak na predmetu **Razvoj i nadogradnja aplikacija elektronskog poslovanja (RNAEP)** na Fakultetu organizacionih nauka, Univerziteta u Beogradu.

---


### **Tehnologije**

| Sloj | Tehnologije |
|------|-------------|
| **Backend** | Node.js, Express |
| **Baze podataka** | MongoDB, PostgreSQL |
| **Frontend** | React, Vite, React Router |
| **Kontejnerizacija** | Docker, Docker Compose |
| **Kontrola verzija** | Git, GitHub |
| **Eksterni API-ji** | OpenWeatherMap, Open-Meteo |

### **Mikroservisi**

| Servis | Port | Baza | Opis |
|--------|------|------|------|
| **Sensor Service** | 3001 | MongoDB | Prijem i čuvanje podataka sa senzora |
| **Irrigation Service** | 3002 | PostgreSQL | Logika zalivanja, pravila, vremenska prognoza |
| **Alert Service** | 3003 | PostgreSQL | Detekcija kritičnih nivoa i slanje notifikacija |
| **API Gateway** | 8080 | - | Jedinstvena ulazna tačka za sve zahteve |
| **UI** | 5173 | - | React korisnički interfejs |
| **Simulator** | 3005 | - | Simulacija slanja podataka sa senzora |

---

##  Preduslovi

Pre pokretanja aplikacije, potrebno je instalirati:

- **Docker** i **Docker Compose** (preporučeno) – [Instalacija](https://docs.docker.com/get-docker/)
- **Node.js** (v18+) i **npm** (za lokalni razvoj) – [Instalacija](https://nodejs.org/)
- **Git** – [Instalacija](https://git-scm.com/)

---

##  Pokretanje aplikacije

### **Opcija 1: Pokretanje sa Docker-om (PREPORUČENO)**

Ovo je najbrži i najpouzdaniji način za pokretanje celog sistema.

#### **1. Kloniranje repozitorijuma**

```bash
git clone https://github.com/elab-development/rnaep-oas-projekat-rnaep_sensor_microservices_2022_0317.git
cd rnaep-oas-projekat-rnaep_sensor_microservices_2022_0317
```

#### **2. Konfiguracija**

Kreiraj `.env` fajl u root folderu:

```env
WEATHER_API_KEY=tvoj_openweathermap_kljuc
```


#### **3. Pokretanje**

```bash
# Izgradnja i pokretanje svih servisa
docker-compose up --build

# Ili u pozadini (detached mode)
docker-compose up -d
```

#### **4. Pristup aplikaciji**

| Komponenta | URL |
|------------|-----|
| **Korisnički interfejs** | http://localhost:5173 |
| **API Gateway (Health Check)** | http://localhost:8080/health |
| **Sensor Service** | http://localhost:3001/health |
| **Irrigation Service** | http://localhost:3002/health |
| **Alert Service** | http://localhost:3003/health |

#### **5. Gašenje sistema**

```bash
# Zaustavljanje svih servisa
docker-compose down

# Zaustavljanje i brisanje volumena (baza)
docker-compose down -v
```

---

### **Opcija 2: Lokalno pokretanje (bez Docker-a)**

Ova opcija je namenjena razvoju i testiranju.

#### **1. Pokretanje baza podataka**

```bash
# MongoDB
docker run -d --name mongodb -p 27017:27017 mongo:6

# PostgreSQL
docker run -d --name postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=postgres -p 5432:5432 postgres:15
```

#### **2. Pokretanje servisa**

Svaki servis se pokreće u **posebnom terminalu**:

```bash
# Terminal 1 - Sensor Service
cd sensor-service
npm install
npm run dev

# Terminal 2 - Irrigation Service
cd irrigation-service
npm install
npm run dev

# Terminal 3 - Alert Service
cd alert-service
npm install
npm run dev

# Terminal 4 - API Gateway
cd api-gateway
npm install
npm run dev

# Terminal 5 - UI
cd ui
npm install
npm run dev

# Terminal 6 - Simulator
cd simulator
npm install
node simulator.js
```

---

##  Eksterni API-ji

Aplikacija se integriše sa dva eksterna API servisa:

| API | Namena | Tip |
|-----|--------|-----|
| **OpenWeatherMap** | Trenutna vremenska prognoza (temperatura, vlažnost, brzina vetra) | REST API |
| **Open-Meteo** | 7-dnevna vremenska prognoza (min/max temperatura, padavine) | REST API |

Ovi API-ji omogućavaju donošenje pametnih odluka o zalivanju (npr. ne zalivati ako se očekuje kiša).

---

##  Struktura projekta

```
├── api-gateway/               # API Gateway (Node.js + Express)
│   ├── index.js               # Glavni server
│   ├── package.json
│   └── Dockerfile
├── sensor-service/            # Sensor Service (Node.js + MongoDB)
│   ├── src/
│   │   ├── index.js
│   │   ├── models/            # MongoDB modeli
│   │   ├── controllers/       # Kontroleri
│   │   ├── routes/            # Rute
│   │   └── services/          # Servisi (npr. forwardService)
│   ├── package.json
│   └── Dockerfile
├── irrigation-service/        # Irrigation Service (Node.js + PostgreSQL)
│   ├── src/
│   │   ├── index.js
│   │   ├── models/            # PostgreSQL modeli
│   │   ├── controllers/       # Kontroleri
│   │   ├── routes/            # Rute
│   │   └── services/          # Servisi (weatherClient, actuatorService)
│   ├── package.json
│   └── Dockerfile
├── alert-service/             # Alert Service (Node.js + PostgreSQL)
│   ├── src/
│   │   ├── index.js
│   │   ├── models/            # PostgreSQL modeli
│   │   ├── controllers/       # Kontroleri
│   │   ├── routes/            # Rute
│   │   └── services/          # Servisi (notificationService)
│   ├── package.json
│   └── Dockerfile
├── simulator/                 # Simulator senzora
│   ├── simulator.js
│   ├── package.json
│   └── Dockerfile
├── ui/                        # React frontend
│   ├── src/
│   │   ├── pages/             # Dashboard, Rules, Alerts, Zones
│   │   ├── services/          # API komunikacija
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml         # Orkestraciona skripta
├── .gitignore
├── .env                       # Environment varijable
├── README.md                  # Ova dokumentacija
└── Dokumentacija_projektovanja_arhitekture.pdf
```

---

##  Testiranje

### **1. Simulator senzora**

Simulator automatski šalje podatke na svakih 15 sekundi. Možeš da promeniš zonu preko HTTP endpoint-a:

```bash
# Promena zone u simulatoru
curl -X POST http://localhost:3005/set-zone \
  -H "Content-Type: application/json" \
  -d '{"zone_id":"ZONE_2"}'
```

### **2. Ručno testiranje API-ja**

```bash
# Dohvati poslednje očitavanje za zonu ZONE_1
curl http://localhost:8080/api/sensors/latest/ZONE_1

# Dohvati sva pravila
curl http://localhost:8080/api/irrigation/rules

# Dohvati istoriju alerta
curl http://localhost:8080/api/alerts/history/ZONE_1

# Dohvati 7-dnevnu prognozu
curl http://localhost:8080/api/irrigation/forecast/ZONE_1

# Kreiraj novu zonu
curl -X POST http://localhost:8080/api/irrigation/zones \
  -H "Content-Type: application/json" \
  -d '{"zone_id":"ZONE_3","parcel_id":"PARCEL_3","name":"Nova zona","sensor_id":"SENSOR_03","valve_id":"VALVE_03","latitude":44.7866,"longitude":20.4489,"city":"Belgrade"}'
```

---

##  Korisnički interfejs

UI se sastoji od 4 glavne strane:

| Strana | Opis |
|--------|------|
| **📊 Dashboard** | Prikaz senzorskih podataka, trenutne vremenske prognoze i 7-dnevne prognoze |
| **⚙️ Pravila** | Kreiranje, pregled i brisanje pravila zalivanja; ručno upravljanje zalivanjem |
| **🔔 Alerti** | Pregled istorije alerta, postavljanje pragova, resolvovanje alerta |
| **📍 Zone** | Kreiranje i brisanje zona (parcela) sa geografskim koordinatama |

---

##  Razvojni proces (GitFlow)

Projekat je razvijan korišćenjem **GitFlow** metodologije:

- **`main`** – stabilna grana sa tagovanim verzijama
- **`develop`** – razvojna grana za integraciju
- **`feature/*`** – grane za razvoj novih funkcionalnosti

Svi PR-ovi su pregledani i odobreni pre spajanja. Trenutna stabilna verzija je **v1.0.0**.

---

##  Tim

| Ime i prezime | Broj indeksa |
|---------------|--------------|
| Lazar Živanović | 2022/0259 |
| Marko Zečević | 2022/0193 |
| Aleksa Marić | 2022/0317 |

**Mentor:** Miloš Jolović

---

##  Literatura i resursi

- [OpenWeatherMap API](https://openweathermap.org/api)
- [Open-Meteo API](https://open-meteo.com/)
- [Docker Documentation](https://docs.docker.com/)
- [Node.js Documentation](https://nodejs.org/en/docs/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MongoDB Documentation](https://www.mongodb.com/docs/)

---