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
// ENDPOINT REJESTRACJI
app.post('/register', async (req, res) => {
    const { imie, nazwisko, stanowisko, login, password } = req.body;
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


app.get('/currentuserinfo', async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Brak tokena lub nieprawidłowy format" });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
    
        const user = await db.get(
            'SELECT imie, stanowisko FROM Pracownik WHERE id_pracownik = ?', 
            [decoded.id]
        );
        if (!user) {
            return res.status(404).json({ message: "Użytkownik nie istnieje" });
        }
        res.json({
            name: user.imie,
            role: user.stanowisko
        });
      
    } catch (e) {
        console.error("JWT Verification Error:", e.message); 
        res.status(401).json({ message: "Nieprawidłowy lub przedawniony token" });
    }
});


app.get('/reservations/guestcount', async (req, res) => {
    const data = await db.get(`
        SELECT 
            SUM(liczba_gosci) AS total_guests
        FROM Rezerwacja
        WHERE date('now') BETWEEN data_przyjazdu AND data_wyjazdu`);
    res.json(data);
});
app.get('/reservations/summary', async (req, res) => {
    const data = await db.get(`
        SELECT 
            COUNT(*) AS total_reservations,
            SUM(liczba_gosci) AS total_guests
        FROM Rezerwacja
        WHERE date('now') LIKE data_przyjazdu`);
    res.json(data);
});


   
app.get('/users/list', async (req, res) => {

    const data = await db.all(`
        SELECT 
            id_pracownik AS id, 
            imie AS firstName, 
            nazwisko AS lastName, 
            stanowisko AS role,
            login 
        FROM Pracownik
    `);
    res.json(data);
});

app.post('/rooms/add', async (req, res) => {
    const { typ, ilosc_lozek, pietro, status } = req.body;
    try {
        await db.run(
            `INSERT INTO Pokoj (typ,ilosc_lozek, pietro , status) VALUES (?, ?, ?, ?)`,
            [typ,ilosc_lozek,pietro,status || 'wolny']
        );
        res.status(201).json({ message: "Dodano pokój pomyślnie" });
    } catch (e) {
        res.status(400).json({ message: "Błąd podczas dodawania pokoju: " + e.message });
    }
});
app.get('/users/list', async (req, res) => {
    const data = await db.all(`SELECT id_pracownik, imie, nazwisko, stanowisko, login FROM Pracownik`);
    res.json(data);
});

app.get('/rooms/list', async (req, res) => {
        const data = await db.all(`
        SELECT 
            id_pokoj AS id, 
            typ AS name, 
            pietro AS floor,
            status AS status,
            ilosc_lozek AS capacity
        FROM Pokoj
    `);
     
    res.json(data);
});
app.get('/rooms/summary', async (req, res) => {
    const data = await db.get(`
        
        SELECT 
            SUM(ilosc_lozek) AS total_beds,
            SUM(CASE WHEN status = 'zajety' THEN ilosc_lozek ELSE 0 END) AS occupied_beds,
            COUNT(*) AS total_rooms,
            SUM(CASE WHEN status = 'zajety' THEN 1 ELSE 0 END) AS occupied_rooms,
            SUM(CASE WHEN status = 'wolny' THEN 1 ELSE 0 END) AS free_rooms
        FROM Pokoj
    `);
    res.json(data);
});



/*
api.get('/guests/count', async (req, res) => {
    const data = await db.get(`
        SELECT 
            COUNT(*) AS total_guests WHERE INNER JOIN Rezerwacja ON Pokoj.id_pokoj = Rezerwacja.id_pokoj
            WHERE date('now') BETWEEN Rezerwacja.data_przyjazdu AND Rezerwacja.data_wyjazdu
        FROM Klient
        INNER JOIN Rezerwacja ON Klient.id_klient = Rezerwacja.id_klient
        WHERE date('now') BETWEEN Rezerwacja.data_przyjazdu AND Rezerwacja.data_wyjazdu
    `);
    res.json(data);
});
*/

// Utworzenie rezerwacji
app.post('/book', async (req, res) => {
    const d = req.body;
    try {
       
        const resultKlient = await db.run(
            `INSERT INTO Klient (imie, nazwisko, nr_tel, email) VALUES (?, ?, ?, ?)`,
            [d.imie, d.nazwisko, d.nr_tel,d.email]
        );

        const idKlienta = resultKlient.lastID;
        const resultPokoj = await db.get(
            `SELECT id_pokoj FROM Pokoj WHERE typ = ? AND status = 'wolny' LIMIT 1`,
            [d.typ_pokoju]
           
        );
        console.log(d.typ_pokoju);  
        if (!resultPokoj) {
            return res.status(400).json({ message: "Brak dostępnych pokoi tego typu" });
        }
        await db.run(
            `INSERT INTO Rezerwacja 
            (id_klient, id_pokoj, data_przyjazdu, data_wyjazdu, liczba_gosci) 
            VALUES (?, ?, ?, ?, ?)`,
            [idKlienta, resultPokoj.id_pokoj, d.data_przyjazdu, d.data_wyjazdu, d.liczba_gosci]
            
        );
        await db.run(
            `UPDATE Pokoj SET status = 'zajety' WHERE id_pokoj = ?`,
            [resultPokoj.id_pokoj]
        );
        res.status(201).json({ message: "Zarezerwowano pomyślnie!" });
    } catch (err) {
        console.error("Błąd bazy:", err.message); // To pokaże Ci dokładny błąd w konsoli serwera (node)
        res.status(500).json({ message: "Błąd bazy danych: " + err.message });
    }

});

app.listen(port);