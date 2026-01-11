// src\components\employee\pages\AdminRooms.jsx
import React, { useMemo, useState, useEffect} from "react";
import { motion } from "framer-motion";
import { useTableSearchSort } from "../hook/useTableSearchSort";

const initialRoomsData = [
  { id: 101, name: "Pokój 101", capacity: 2, floor: "1", status: "Wolny" },
  { id: 102, name: "Pokój 102", capacity: 3, floor: "2", status: "Zajęty" },
  { id: 103, name: "Pokój 103", capacity: 1, floor: "3", status: "Sprzątanie" },
  { id: 104, name: "Pokój 104", capacity: 4, floor: "4", status: "Oczekujący" },
  { id: 105, name: "Pokój 105", capacity: 2, floor: "5", status: "Wolny" },
];

const statusColors = {
  Wolny: "bg-emerald-500/15 text-emerald-400",
  Zajęty: "bg-red-500/15 text-red-400",
  Sprzątanie: "bg-amber-500/15 text-amber-400",
  Oczekujący: "bg-sky-500/15 text-sky-400",
};

const roomTypes = ["POKÓJ CLASSIC", "POKÓJ DELUXE", "APARTAMET PAŁACOWY", "APARTAMENT DELUXE"];

const AdminRooms = () => {
  const [filter, setFilter] = useState("Wszystkie");

  // dane jako state, żeby dało się dodawać
  const [rooms, setRooms] = useState(initialRoomsData);


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    id: "",
    name: "",
    capacity: "",
    floor: "",
    status: "Wolny",
  });
  const [error, setError] = useState("");

  const {
    search,
    setSearch,
    handleSort,
    data: sortedData,
    renderSortIcon,
  } = useTableSearchSort({
    data: rooms,
    searchableFields: ["id", "name", "capacity", "type", "status"],
    defaultSortKey: "id",
    defaultSortDirection: "asc",
  });

  const filteredByStatus =
    filter === "Wszystkie"
      ? sortedData
      : sortedData.filter((room) => room.status === filter);

  const statusOptions = useMemo(
    () => ["Wszystkie", "Wolny", "Zajęty", "Sprzątanie", "Oczekujący"],
    []
  );

  const openModal = () => {
    setError("");
    setForm({
      id: "",
      name: "",
      capacity: "",
      type: "",
      status: "Wolny",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError("");
  };

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSave = async (e) => { 

  const idNum = Number(form.id);
  const capNum = Number(form.capacity);

// 1. Walidacja typu pokoju
  if (!form.typ) {
    setError("Wybierz typ pokoju.");
    return;
  }

  // 2. Walidacja ilości łóżek
  if (isNaN(capNum) || capNum <= 0) {
    setError("Podaj poprawną ilość łóżek (liczba większa od 0).");
    return;
  }

  // 3. Walidacja piętra (używamy floorNum zamiast idNum)
  if (form.pietro === "" || isNaN(floorNum)) {
    setError("Podaj poprawny numer piętra.");
    return;
  }
  

  try {
    const response = await fetch('http://localhost:3000/rooms/add', { 
    
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        typ: form.type.trim(),
        ilosc_lozek: capNum,
        pietro: 1, 
        status: form.status,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Błąd serwera");
    }

  
    const newRoom = {
      typ: form.typ,
      ilosc_lozek: capNum,
      pietro: floorNum,
      status: form.status,
    };

    setRooms((prev) => [...prev, newRoom]);
    setIsModalOpen(false);
    
  } catch (error) {
    console.error("Błąd podczas dodawania pokoju:", error);
    setError(error.message); 
  }
};
  const fetchedRooms = async () => {
    try {
      const response = await fetch('http://localhost:3000/rooms/list');
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error("Błąd podczas pobierania listy pokoi:", error);
    }
  };

  useEffect(() => {
    fetchedRooms();
  }, []);


  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Lista i status pokoi</h1>
          <p className="text-sm text-slate-400">
            Lista pokoi hotelowych oraz ich aktualny status.
          </p>
        </div>

        <button
          onClick={openModal}
          className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-sm font-medium text-white transition"
        >
          + Dodaj pokój
        </button>
      </div>

      {/* Pasek wyszukiwania / filtrów */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Szukaj po numerze, nazwie, typie, statusie..."
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg border transition ${
                filter === s
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela pokoi */}
      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/60">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-800">
            <tr className="text-left text-slate-300">
              <th className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort("id")}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Nr pokoju
                  {renderSortIcon("id")}
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort("name")}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Piętro
                  {renderSortIcon("name")}
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort("capacity")}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Iloosoobowy
                  {renderSortIcon("capacity")}
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort("type")}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Typ
                  {renderSortIcon("type")}
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort("status")}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Status
                  {renderSortIcon("status")}
                </button>
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredByStatus.length > 0 ? (
              filteredByStatus.map((room) => (
                <tr
                  key={room.id}
                  className="border-t border-slate-700/60 hover:bg-slate-800/70 transition"
                >
                  <td className="px-4 py-3 text-slate-100">{room.id}</td>
                  <td className="px-4 py-3 text-slate-300">{room.name}</td>
                  <td className="px-4 py-3 text-slate-100">{room.capacity}</td>
                  <td className="px-4 py-3 text-slate-300">{room.type}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[room.status] ||
                        "bg-slate-700 text-slate-200"
                      }`}
                    >
                      {room.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="border-t border-slate-700/60">
                <td
                  colSpan="5"
                  className="px-4 py-6 text-center text-slate-400 italic"
                >
                  Brak wyników.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal dodawania pokoju */}
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-800 p-6 rounded-xl w-full max-w-md border border-slate-700 shadow-2xl">
            <h2 className="text-xl font-semibold mb-1 text-white">Dodaj nowy pokój</h2>
            <p className="text-xs text-slate-400 mb-6 uppercase tracking-wider">Formularz zasobów</p>
            
            {error && <div className="mb-4 p-2 bg-red-500/20 border border-red-500/50 text-red-200 text-xs rounded">{error}</div>}

            <div className="space-y-4">
        
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold">TYP POKOJU</label>
                <select className="w-full p-2.5 rounded bg-slate-900 border border-slate-700 text-white outline-none focus:border-indigo-500" value={form.typ} onChange={handleChange("typ")}>
                  <option value="">— wybierz typ —</option>
                  {roomTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-semibold">ILOŚĆ ŁÓŻEK</label>
                  <input type="number" min="1" placeholder="np. 2" className="w-full p-2.5 rounded bg-slate-900 border border-slate-700 text-white outline-none focus:border-indigo-500" value={form.ilosc_lozek} onChange={handleChange("ilosc_lozek")} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-semibold">PIĘTRO</label>
                  <input type="number" placeholder="np. 1" className="w-full p-2.5 rounded bg-slate-900 border border-slate-700 text-white outline-none focus:border-indigo-500" value={form.pietro} onChange={handleChange("pietro")} />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold">STATUS POCZĄTKOWY</label>
                <select className="w-full p-2.5 rounded bg-slate-900 border border-slate-700 text-white outline-none focus:border-indigo-500" value={form.status} onChange={handleChange("status")}>
                  {Object.keys(statusColors).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={closeModal} className="px-4 py-2 text-slate-400 hover:text-white transition text-sm">Anuluj</button>
              <button onClick={handleSave} className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-medium transition shadow-lg shadow-indigo-500/20 text-sm">
                Dodaj pokój
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
};

export default AdminRooms;
