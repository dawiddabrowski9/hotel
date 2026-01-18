// src\components\employee\pages\AdminSpaReservation.jsx
import React, { useState } from "react";
import BackButton from "../components/BackButton";


const SERVICE_DETAILS = {
  "MASAŻ KLASYCZNY CAŁOŚCIOWY": 250,
  "MASAŻ RELAKSACYJNY": 199,
  "MASAŻ BASKIJSKI": 320,
  "MASAŻ CIEPŁĄ CZEKOLADĄ": 280,
  "KOBIDO": 280,
  "BODY PEELING": 170,
};

export default function AdminSpaReservation({ onBack }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    service: "MASAŻ KLASYCZNY CAŁOŚCIOWY",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
       
        const selectedPrice= SERVICE_DETAILS[form.service];

        const data = {
            imie: form.firstName,
            nazwisko: form.lastName,
            email: form.email,
            nr_tel: form.phone,
            data: form.date,
            godzina: form.time,
            typ: form.service,
            cena: selectedPrice
        };
       
        const response = await fetch("http://localhost:3000/spa/book", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (response.ok) {
            alert(`Sukces! Rezerwacja na ${form.service} zapisana.`);
            
        } else {
          console.log("Błąd serwera: " + result.message);
        }

    } catch (err) {

        alert("Wystąpił błąd podczas wysyłania: " + err.message);
    }
};

  return (
    <div className="p-8 text-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Rezerwacja SPA</h1>
          <p className="text-sm text-slate-400">
            Wybierz termin i rodzaj usługi.
          </p>
        </div>
        <BackButton onClick={onBack} label="Powrót" />
      </div>
      <form
        onSubmit={handleSubmit}
        className="bg-slate-800/70 border border-slate-700 rounded-xl p-8 space-y-4"
      >
        <div>
          <label className="block text-sm mb-1">Imię</label>
          <input
            type="text"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Nazwisko</label>
          <input
            type="text"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">E-mail</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Telefon</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Data</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Godzina</label>
          <input
            type="time"
            name="time"
            value={form.time}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Usługa</label>
          <select
            name="service"
            value={form.service}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
          >
            {Object.keys(SERVICE_DETAILS).map((serviceName) => (
                <option key={serviceName} value={serviceName}>
                    {serviceName} - {SERVICE_DETAILS[serviceName]} PLN
                </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg"
        >
          Zapisz rezerwację
        </button>
      </form>
    </div>
  );
}
