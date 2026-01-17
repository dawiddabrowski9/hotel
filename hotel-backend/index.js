const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
require('dotenv').config({ path: 'secrets.env' });

const app = express();
app.use(cors());
app.use(express.json());

const port = 3000
const SECRET_KEY = ('process.secrets.env.SECRET_KEY')

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
            const token = jwt.sign({ id: user.id_pracownik, login: user.login }, SECRET_KEY, { expiresIn: '8h' });
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
    
    console.log(data)
});

app.get('/reservations/checkouts', async (req,res)=>{
    const data = await db.get(`
        SELECT 
            COUNT(*) AS total_checkouts
        FROM Rezerwacja
        WHERE date('now') LIKE data_wyjazdu`);
    console.log (data);
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
            [typ,ilosc_lozek,pietro,status || 'Wolny']
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
            id_pokoj as id,
            typ as type,
            pietro as name, 
            status,
            ilosc_lozek as capacity
        FROM Pokoj
    `);
    res.json(data);
});
app.get('/rooms/summary', async (req, res) => {
    const data = await db.get(`
        
        SELECT 
            SUM(ilosc_lozek) AS total_beds,
            SUM(CASE WHEN status = 'Zajęty' THEN ilosc_lozek ELSE 0 END) AS occupied_beds,
            COUNT(*) AS total_rooms,
            SUM(CASE WHEN status = 'Zajęty' THEN 1 ELSE 0 END) AS occupied_rooms,
            SUM(CASE WHEN status = 'Wolny' THEN 1 ELSE 0 END) AS free_rooms
        FROM Pokoj
    `);
    res.json(data);
});

app.get('/cleaning/list', async (req, res)=>{
    const data = await db.all(`
        SELECT
            id_pokoj AS id,
            id_pracownik AS people,
            status 
        FROM Sprzatanie

        `);
    res.json(data);
});

app.post('/breakfast/add', async(req,res)=>{
    const d = req.body;
    try{
        const resultBreakfast = await db.run(
            `INSERT INTO Sniadanie (data, id_pokoju, id_dania) VALUES (? ,? ,?)`,
            [d.data,d.id_pokoju,d.id_dania]
        );
    }
    catch(err){
        console.error("Wystąpił błąd podczas dodawania"); 
        res.status(500).json({ message: "Błąd bazy danych: " + err.message });
    }
});

app.get('/book/list',  async(req,res)=>{
    const bookData = await db.all(`
        SELECT 
            R.id_rezerwacja as id,
            R.id_klient,
            R.id_pokoj,
            R.data_przyjazdu,
            R.data_wyjazdu,
            R.liczba_gosci,
            K.imie,
            K.nazwisko,
            K.nr_tel, 
            K.email, 
            P.typ
        FROM Rezerwacja AS R
        JOIN Klient AS K ON R.id_klient = K.id_klient
        JOIN Pokoj AS P ON R.id_pokoj = P.id_pokoj
    `);
    res.json(bookData);
});

app.put('/book/update/:id', async(req,res)=>{
    const { id } = req.params;
    const data = req.body;
    try{
        await db.run('BEGIN TRANSACTION');
        await db.run(`
            UPDATE Klient
                SET imie = ?,
                nazwisko = ?, 
                nr_tel = ?, 
                email = ?
            WHERE id_klient = (SELECT id_klient FROM Rezerwacja WHERE id_rezerwacja = ?)
        `, [data.imie, data.nazwisko, data.nr_tel, data.email, id]);
        await db.run(`
            UPDATE Rezerwacja
            SET data_przyjazdu = ?, data_wyjazdu = ?, liczba_gosci = ?
            WHERE id_rezerwacja = ? 
        `,[data.data_przyjazdu,data.data_wyjazdu,data.liczba_gosci,id]);
        await db.run(`
            UPDATE Rezerwacja
            SET id_pokoj = (SELECT id_pokoj FROM Pokoj WHERE typ = ?)
            WHERE id_rezerwacja = ?
        `, [data.typ_pokoju, id]);
        await db.run('COMMIT');
        res.json({success:true});
    }catch(err){
        await db.run('ROLLBACK');
        res.status(500).json({error: err.message})
    }


});
app.delete('/book/delete/:id', async(req,res)=>{
    const { id } = req.params; 

    try {
        await db.run('BEGIN TRANSACTION');

        const reservation = await db.get(
            `SELECT id_pokoj,id_klient FROM Rezerwacja WHERE id_rezerwacja = ?`,
            [id]
        );

        if (!reservation) {
            await db.run('ROLLBACK');
            return res.status(404).json({ message: "Nie znaleziono rezerwacji" });
        }

        await db.run(
            `UPDATE Pokoj SET status = 'Wolny' WHERE id_pokoj = ?`,
            [reservation.id_pokoj]
        );
        await db.run(`
            DELETE FROM Klient WHERE id_klient = ?
        `, [reservation.id_klient]);
        await db.run(
            `DELETE FROM Rezerwacja WHERE id_rezerwacja = ?`,
            [id]
        );

        await db.run('COMMIT');
        res.json({ message: "Rezerwacja usunięta, pokój jest teraz wolny." });

    } catch (err) {
        if (db) await db.run('ROLLBACK').catch(() => {});
        console.error(err);
        res.status(500).json({ error: "Błąd podczas usuwania: " + err.message });
    }
});

app.post('/book', async (req, res) => {
    const d = req.body;
    try {
        await db.run('BEGIN TRANSACTION');

        const resultKlient = await db.run(
            `INSERT INTO Klient (imie, nazwisko, nr_tel, email) VALUES (?, ?, ?, ?)`,
            [d.imie, d.nazwisko, d.nr_tel, d.email]
        );
        const idKlienta = resultKlient.lastID;

        

        const room = await db.get(
            `SELECT id_pokoj FROM Pokoj WHERE typ = ? AND status = 'Wolny' LIMIT 1`,
            [d.typ_pokoju]
        );

        
        if (!room) {
            await db.run('ROLLBACK');
            return res.status(400).json({ message: "Brak dostępnych pokoi tego typu" });
        }

   
        await db.run(
            `INSERT INTO Rezerwacja 
            (id_klient, id_pokoj, data_przyjazdu, data_wyjazdu, liczba_gosci) 
            VALUES (?, ?, ?, ?, ?)`,
            [idKlienta, room.id_pokoj, d.data_przyjazdu, d.data_wyjazdu, d.liczba_gosci]
        );

    
        await db.run(
            `UPDATE Pokoj SET status = 'Zajęty' WHERE id_pokoj = ?`,
            [room.id_pokoj]
        );

        await db.run('COMMIT');
        res.status(201).json({ message: "Zarezerwowano pomyślnie!" });

    } catch (err) {
        if (db) await db.run('ROLLBACK').catch(() => {}); 
        console.error("FULL ERROR:", err); 
        res.status(500).json({ message: "Błąd bazy danych: " + err.message });
    }
});


app.listen(port);