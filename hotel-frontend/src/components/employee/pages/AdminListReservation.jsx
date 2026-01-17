// src/components/employee/pages/AdminReservationsList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTableSearchSort } from "../hook/useTableSearchSort";



// Fallback (gdyby backend nie zwrócił listy pokoi)
const FALLBACK_ROOM_TYPES = ["POKÓJ CLASSIC","POKÓJ DELUXE","APARTAMENT PAŁACOWY","APARTAMENT DELUXE"];

const demoReservations = [
  {
    id: 1,
    firstName: "Jan",
    lastName: "Kowalski",
    arrivalDate: "2026-01-16",
    departureDate: "2026-01-19",
    roomType: "Classic",
    people: 2,
    email: "jan.kowalski@example.com",
    phone: "+48 500 200 300",
  },
  {
    id: 2,
    firstName: "Anna",
    lastName: "Nowak",
    arrivalDate: "2026-01-20",
    departureDate: "2026-01-21",
    roomType: "Standard",
    people: 1,
    email: "anna.nowak@example.com",
    phone: "+48 600 111 222",
  },
];

const AdminReservationsList = () => {
  const [reservations, setReservations] = useState(demoReservations);
  const [roomTypes, setRoomTypes] = useState(FALLBACK_ROOM_TYPES);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    arrivalDate: "",
    departureDate: "",
    roomType: FALLBACK_ROOM_TYPES[0],
    people: 1,
    email: "",
    phone: "",
  });

 
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const res = await fetch(`http://localhost:3000/book/list`);
        if (!res.ok) return;
        const data = await res.json();

        const normalized = Array.isArray(data)
  ? data.map((r) => ({
      id: r.id, 
      firstName: r.imie || "",
      lastName: r.nazwisko || "",
      arrivalDate: r.data_przyjazdu || "",
      departureDate: r.data_wyjazdu || "",
      roomType: r.typ || "",
      people: r.liczba_gosci || 1,
      email: r.email || "",
      phone: r.nr_tel || "",
    }))
  : [];

        if (normalized.length) setReservations(normalized);
      } catch (_) {}
    };

    fetchReservations();
  }, []);

  const { search, setSearch, handleSort, data: sortedData, renderSortIcon } =
    useTableSearchSort({
      data: reservations,
      searchableFields: [
        "firstName",
        "lastName",
        "arrivalDate",
        "departureDate",
        "roomType",
        "people",
        "email",
        "phone",
      ],
      defaultSortKey: "arrivalDate",
      defaultSortDirection: "asc",
    });

  const openEditModal = (reservation) => {
    setSelected(reservation);
    setError("");
    setForm({
      firstName: reservation.firstName || "",
      lastName: reservation.lastName || "",
      arrivalDate: reservation.arrivalDate || "",
      departureDate: reservation.departureDate || "",
      // jeśli stary typ nie ma już na liście -> weź pierwszy dostępny
      roomType: roomTypes.includes(reservation.roomType)
        ? reservation.roomType
        : roomTypes[0] || FALLBACK_ROOM_TYPES[0],
      people: reservation.people ?? 1,
      email: reservation.email || "",
      phone: reservation.phone || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelected(null);
    setError("");
  };

  const trimmed = useMemo(() => {
    return {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      arrivalDate: form.arrivalDate,
      departureDate: form.departureDate,
      roomType: form.roomType,
      people: Number(form.people) || 1,
    };
  }, [form]);

  const validate = () => {
    if (!trimmed.firstName || !trimmed.lastName) {
      setError("Podaj imię i nazwisko.");
      return false;
    }
    if (!trimmed.arrivalDate || !trimmed.departureDate) {
      setError("Podaj datę przyjazdu i wyjazdu.");
      return false;
    }
    if (trimmed.departureDate < trimmed.arrivalDate) {
      setError("Data wyjazdu nie może być wcześniejsza niż data przyjazdu.");
      return false;
    }
    if (!trimmed.roomType) {
      setError("Wybierz typ pokoju.");
      return false;
    }
    if (trimmed.people < 1) {
      setError("Liczba osób musi być co najmniej 1.");
      return false;
    }
    return true;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    if (!selected) return;

    if (!validate()) return;

    const updated = {
      ...selected,
      firstName: trimmed.firstName,
      lastName: trimmed.lastName,
      arrivalDate: trimmed.arrivalDate,
      departureDate: trimmed.departureDate,
      roomType: trimmed.roomType,
      people: trimmed.people,
      email: trimmed.email,
      phone: trimmed.phone,
    };

    setReservations((prev) => prev.map((r) => (r.id === selected.id ? updated : r)));
    setIsModalOpen(false);
    setSelected(null);

    try {
      await fetch(`http://localhost:3000/book/update/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imie: updated.firstName,
          nazwisko: updated.lastName,
          data_przyjazdu: updated.arrivalDate,
          data_wyjazdu: updated.departureDate,
          typ_pokoju: updated.roomType,
          liczba_gosci: updated.people,
          email: updated.email,
          nr_tel: updated.phone,
        }),
      });
    } catch (_) {}
  };

 
  const handleDelete = async () => {
  if (!selected) return;


  const backup = [...reservations];


  setReservations((prev) => prev.filter((r) => r.id !== selected.id));
  setIsModalOpen(false);

  try {
    const response = await fetch(`http://localhost:3000/book/delete/${selected.id}`, { 
      method: "DELETE" 
    });

    if (!response.ok) {
      throw new Error("Failed to delete");
    }

    setSelected(null);
  } catch (error) {
    console.error("Delete failed:", error);
    setReservations(backup); 
    alert("Nie udało się usunąć rezerwacji z bazy danych.");
  }
};

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Lista rezerwacji</h1>
          <p className="text-sm text-slate-400">Kliknij w rezerwację, aby edytować.</p>
        </div>
      </div>

      <div className="mb-6 max-w-sm">
        <input
          type="text"
          placeholder="Szukaj po danych rezerwacji..."
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/60">
        <table className="min-w-full text-sm table-fixed">
          <thead className="bg-slate-800 text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left w-[12%]">
                <button
                  type="button"
                  onClick={() => handleSort("firstName")}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Imię {renderSortIcon("firstName")}
                </button>
              </th>
              <th className="px-4 py-3 text-left w-[14%]">
                <button
                  type="button"
                  onClick={() => handleSort("lastName")}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Nazwisko {renderSortIcon("lastName")}
                </button>
              </th>
              <th className="px-4 py-3 text-left w-[13%]">
                <button
                  type="button"
                  onClick={() => handleSort("arrivalDate")}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Data przyjazdu {renderSortIcon("arrivalDate")}
                </button>
              </th>
              <th className="px-4 py-3 text-left w-[13%]">
                <button
                  type="button"
                  onClick={() => handleSort("departureDate")}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Data wyjazdu {renderSortIcon("departureDate")}
                </button>
              </th>
              <th className="px-4 py-3 text-left w-[12%]">
                <button
                  type="button"
                  onClick={() => handleSort("roomType")}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Typ pokoju {renderSortIcon("roomType")}
                </button>
              </th>
              <th className="px-4 py-3 text-center w-[10%]">
                <button
                  type="button"
                  onClick={() => handleSort("people")}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Osoby {renderSortIcon("people")}
                </button>
              </th>
              <th className="px-4 py-3 text-left w-[14%]">
                <button
                  type="button"
                  onClick={() => handleSort("email")}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  E-mail {renderSortIcon("email")}
                </button>
              </th>
              <th className="px-4 py-3 text-left w-[12%]">
                <button
                  type="button"
                  onClick={() => handleSort("phone")}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Telefon {renderSortIcon("phone")}
                </button>
              </th>
            </tr>
          </thead>

          <tbody>
            {sortedData.length ? (
              sortedData.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => openEditModal(r)}
                  className="border-t border-slate-700/60 hover:bg-slate-800/70 transition cursor-pointer"
                  title="Kliknij aby edytować"
                >
                  <td className="px-4 py-3 text-left text-slate-100 truncate">{r.firstName}</td>
                  <td className="px-4 py-3 text-left text-slate-100 truncate">{r.lastName}</td>
                  <td className="px-4 py-3 text-left text-slate-300 truncate">{r.arrivalDate}</td>
                  <td className="px-4 py-3 text-left text-slate-300 truncate">{r.departureDate}</td>
                  <td className="px-4 py-3 text-left text-slate-100 truncate">{r.roomType}</td>
                  <td className="px-4 py-3 text-center text-slate-100">{r.people}</td>
                  <td className="px-4 py-3 text-left text-slate-300 truncate">{r.email}</td>
                  <td className="px-4 py-3 text-left text-slate-300 truncate">{r.phone}</td>
                </tr>
              ))
            ) : (
              <tr className="border-t border-slate-700/60">
                <td colSpan={8} className="px-4 py-6 text-center text-slate-400 italic">
                  Brak wyników.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="bg-slate-800 p-6 rounded-xl w-full max-w-md shadow-xl border border-slate-700"
          >
            <h2 className="text-xl font-semibold mb-4">Edytuj rezerwację</h2>

            {error && (
              <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Imię"
                  className="w-full p-3 rounded bg-slate-700 placeholder-slate-400 text-white"
                  value={form.firstName}
                  onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                />
                <input
                  type="text"
                  placeholder="Nazwisko"
                  className="w-full p-3 rounded bg-slate-700 placeholder-slate-400 text-white"
                  value={form.lastName}
                  onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <input
                  type="date"
                  className="w-full p-3 rounded bg-slate-700 text-white"
                  value={form.arrivalDate}
                  onChange={(e) => setForm((p) => ({ ...p, arrivalDate: e.target.value }))}
                />
                <input
                  type="date"
                  className="w-full p-3 rounded bg-slate-700 text-white"
                  value={form.departureDate}
                  onChange={(e) => setForm((p) => ({ ...p, departureDate: e.target.value }))}
                />
              </div>

              {/* ✅ SELECT typów pokoi */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <select
                  className="w-full p-3 rounded bg-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.roomType}
                  onChange={(e) => setForm((p) => ({ ...p, roomType: e.target.value }))}
                >
                  {roomTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min={1}
                  placeholder="Liczba osób"
                  className="w-full p-3 rounded bg-slate-700 placeholder-slate-400 text-white"
                  value={form.people}
                  onChange={(e) => setForm((p) => ({ ...p, people: e.target.value }))}
                />
              </div>

              <input
                type="email"
                placeholder="E-mail"
                className="w-full p-3 rounded bg-slate-700 placeholder-slate-400 text-white mt-3"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />

              <input
                type="text"
                placeholder="Telefon"
                className="w-full p-3 rounded bg-slate-700 placeholder-slate-400 text-white mt-3"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              />

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="mr-auto px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-500 transition text-white"
                >
                  Usuń
                </button>

                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 transition"
                >
                  Anuluj
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 transition text-white"
                >
                  Zapisz zmiany
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </section>
  );
};

export default AdminReservationsList;
