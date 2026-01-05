const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const app = express();
app.use(cors());
app.use(express.json());

const port = 3000;
const SECRET_KEY = 'Hotel_Pro_2025'; // przenieść do .env

let db;
// ŻEBY ODPALIĆ APLIKACJE ROBIMY NPM RUN DEV W GŁÓWNYM KATALOGU (HOTEL)
(async () => {
    db = await open({ filename: './hotel.db', driver: sqlite3.Database });
    

    const columns = [
        "data_przyjazdu DATE", "data_wyjazdu DATE", "liczba_gosci INTEGER", 
        "imie_goscia TEXT", "nazwisko_goscia TEXT", "nr_tel TEXT", 
        "email_goscia TEXT", "adres_goscia TEXT", "nazwa_firmy TEXT", 
        "nip_firmy TEXT", "sposob_platnosci TEXT", "typ_pokoju TEXT"
    ];
    for (let colDef of columns) {
        try { await db.run(`ALTER TABLE Rezerwacja ADD COLUMN ${colDef}`); } catch (e) {}
    }
    // Dodanie pól do tabeli Klient dla pełnej rejestracji
    try { await db.run(`ALTER TABLE Klient ADD COLUMN imie TEXT`); } catch (e) {}
    try { await db.run(`ALTER TABLE Klient ADD COLUMN nazwisko TEXT`); } catch (e) {}
    const adminPassword = await bcrypt.hash('admin123', 10);
    await db.run(`INSERT OR IGNORE INTO Pracownik (imie, nazwisko, stanowisko, login, password) 
              VALUES (?, ?, ?, ?, ?)`, 
              ['Jan', 'Kowalski', 'Admin', 'admin', adminPassword]);
    console.log("SERWER DZIAŁA NA PORCIE " + port);

})();

// Pełna rejestracja użytkownika
app.post('/register', async (req, res) => {
    const { imie, nazwisko, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    try {
        await db.run('INSERT INTO Klient (imie, nazwisko, email, password) VALUES (?, ?, ?, ?)', [imie, nazwisko, email, hashed]);
        res.status(201).json({ message: "Rejestracja pomyślna" });
    } catch (e) { res.status(400).json({ message: "Email jest już zajęty" }); }
});

// ENDPOINT LOGOWANIA
app.post('/login', async (req, res) => {
    const { login, password } = req.body;
    try {
        const user = await db.get('SELECT * FROM Pracownik WHERE login = ?', [login]);
        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ id: user.id_pracownik, login: user.login }, SECRET_KEY, { expiresIn: '2h' });
            res.json({ token });
        } else { res.status(401).json({ message: "Błędny login lub hasło" }); }
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// Pobieranie listy pokoi
app.get('/rooms', async (req, res) => {
    const rooms = await db.all('SELECT * FROM Pokoj');
    res.json(rooms);
});

// Utworzenie rezerwacji
app.post('/book', async (req, res) => {
    const d = req.body;
    try {
        await db.run(`INSERT INTO Rezerwacja 
            (id_pokoj, id_klient, data_przyjazdu, data_wyjazdu, liczba_gosci, imie_goscia, nazwisko_goscia, nr_tel, email_goscia, adres_goscia, nazwa_firmy, nip_firmy, sposob_platnosci, typ_pokoju) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [d.id_pokoj, 1, d.od, d.do, d.osoby, d.imie, d.nazwisko, d.tel, d.email, d.adres, d.firma, d.nip, d.platnosc, d.typ]);
        res.status(201).json({ message: "Zarezerwowano pomyślnie!" });
    } catch (err) {
        res.status(500).json({ message: "Błąd bazy danych: " + err.message });
    }
});

app.listen(port);