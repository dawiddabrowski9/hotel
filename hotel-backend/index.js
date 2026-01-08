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
    console.log("SERWER DZIAŁA NA PORCIE " + port);
})();

// Pełna rejestracja użytkownika
app.post('/register', async (req, res) => {
    const { imie, nazwisko, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    try {
        await db.run('INSERT INTO Pracownik(imie, nazwisko, stanowisko, login, password) VALUES (?, ?, ?, ?, ?)', [imie, nazwisko, stanowisko, login, hashed]);
        res.status(201).json({ message: "Rejestracja pomyślna" });
    } catch (e) { res.status(400).json({ message: "Login jest zajęty!" }); }
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
       
        const resultKlient = await db.run(
            `INSERT INTO Klient (imie, nazwisko, nr_tel, email) VALUES (?, ?, ?, ?)`,
            [d.imie, d.nazwisko, d.nr_tel,d.email]
        );

        const idKlienta = resultKlient.lastID;

    
        await db.run(
            `INSERT INTO Rezerwacja 
            (id_klient, id_pokoj, data_przyjazdu, data_wyjazdu, liczba_gosci) 
            VALUES (?, ?, ?, ?, ?)`,
            [idKlienta, d.id_pokoj, d.data_przyjazdu, d.data_wyjazdu, d.liczba_gosci]
        );

        res.status(201).json({ message: "Zarezerwowano pomyślnie!" });
    } catch (err) {
        console.error("Błąd bazy:", err.message); // To pokaże Ci dokładny błąd w konsoli serwera (node)
        res.status(500).json({ message: "Błąd bazy danych: " + err.message });
    }
});
app.listen(port);