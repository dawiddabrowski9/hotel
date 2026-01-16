// src/components/employee/pages/AdminRooms.jsx
import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTableSearchSort } from "../hook/useTableSearchSort";

const statusColors = {
  Wolny: "bg-emerald-500/15 text-emerald-400",
  Zajęty: "bg-red-500/15 text-red-400",
  Sprzątanie: "bg-amber-500/15 text-amber-400",
  Oczekujący: "bg-sky-500/15 text-sky-400",
};

const roomTypes = [
  "POKÓJ CLASSIC",
  "POKÓJ DELUXE",
  "APARTAMET PAŁACOWY",
  "APARTAMENT DELUXE",
];

const AdminRooms = () => {
  const [filter, setFilter] = useState("Wszystkie");
  const [rooms, setRooms] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("add"); // add | edit
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null); // podświetlenie

  const [error, setError] = useState("");

  // ✅ form dopasowany do tego co backend zwraca / przyjmuje
  // rooms/list zwraca: { id, type, name (pietro), status, capacity (lozka) }
  const [form, setForm] = useState({
    type: "",
    capacity: "",
    name: "",
    status: "Wolny",
  });

  const { search, setSearch, handleSort, data: sortedData, renderSortIcon } =
    useTableSearchSort({
      data: rooms,
      searchableFields: ["id", "type", "name", "status", "capacity"],
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

  const openAddModal = () => {
    setMode("add");
    setSelectedRoom(null);
    setError("");
    setForm({ type: "", capacity: "", name: "", status: "Wolny" });
    setIsModalOpen(true);
  };

  const openEditModal = (room) => {
    setMode("edit");
    setSelectedRoom(room);
    setSelectedRoomId(room.id); // ✅ podświetlenie
    setError("");
    setForm({
      type: room.type ?? "",
      capacity: String(room.capacity ?? ""),
      name: String(room.name ?? ""),
      status: room.status ?? "Wolny",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
    setError("");
    // jeśli chcesz żeby znikało podświetlenie po zamknięciu:
    // setSelectedRoomId(null);
  };

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const validate = () => {
    const capNum = parseInt(form.capacity, 10);
    const floorNum = parseInt(form.name, 10);

    if (!form.type) {
      setError("Wybierz typ pokoju.");
      return false;
    }
    if (isNaN(capNum) || capNum <= 0) {
      setError("Podaj poprawną ilość łóżek (liczba > 0).");
      return false;
    }
    if (form.name === "" || isNaN(floorNum)) {
      setError("Podaj poprawny numer piętra.");
      return false;
    }
    if (!form.status) {
      setError("Wybierz status.");
      return false;
    }
    return true;
  };

  // ✅ add / edit w zależności od trybu
  const handleSave = async () => {
    setError("");
    if (!validate()) return;

    const capNum = parseInt(form.capacity, 10);
    const floorNum = parseInt(form.name, 10);

    // ADD
    if (mode === "add") {
      try {
        const response = await fetch("http://localhost:3000/rooms/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            typ: form.type,
            ilosc_lozek: capNum,
            pietro: floorNum,
            status: form.status,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.message || "Błąd serwera");
        }

        // backend nie zwraca id pokoju w Twoim kodzie,
        // więc robimy fallback: nextId w frontendzie
        const nextId = rooms.length
          ? Math.max(...rooms.map((r) => Number(r.id) || 0)) + 1
          : 1;

        const newRoom = {
          id: result?.id ?? result?.id_pokoj ?? result?.insertId ?? nextId,
          type: form.type,
          capacity: capNum,
          name: floorNum,
          status: form.status,
        };

        setRooms((prev) => [...prev, newRoom]);
        setSelectedRoomId(newRoom.id);
        setIsModalOpen(false);
      } catch (err) {
        console.error("Błąd podczas dodawania pokoju:", err);
        setError(err.message || "Błąd podczas dodawania pokoju.");
      }
      return;
    }

    // EDIT (frontend-only, kolega podepnie endpoint)
    if (!selectedRoom) return;

    const updatedRoom = {
      ...selectedRoom,
      type: form.type,
      capacity: capNum,
      name: floorNum,
      status: form.status,
    };

    setRooms((prev) => prev.map((r) => (r.id === selectedRoom.id ? updatedRoom : r)));
    setSelectedRoomId(selectedRoom.id);
    setIsModalOpen(false);
    setSelectedRoom(null);

    // backend (opcjonalnie, kolega podepnie):
    // await fetch(`http://localhost:3000/rooms/${selectedRoom.id}`, { method:"PUT", ... })
  };

  const handleDelete = async () => {
    if (!selectedRoom) return;

    setRooms((prev) => prev.filter((r) => r.id !== selectedRoom.id));
    setSelectedRoomId((prev) => (prev === selectedRoom.id ? null : prev));
    setIsModalOpen(false);
    setSelectedRoom(null);

    // backend (opcjonalnie):
    // await fetch(`http://localhost:3000/rooms/${selectedRoom.id}`, { method:"DELETE" })
  };

  const fetchedRooms = async () => {
    try {
      const response = await fetch("http://localhost:3000/rooms/list");
      const data = await response.json();
      setRooms(Array.isArray(data) ? data : []);
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
            Kliknij w wiersz, aby edytować (edytowany wiersz będzie podświetlony).
          </p>
        </div>

        <button
          onClick={openAddModal}
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
            placeholder="Szukaj po numerze, piętrze, typie, statusie..."
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
                  Nr pokoju {renderSortIcon("id")}
                </button>
              </th>

              <th className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort("name")}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Piętro {renderSortIcon("name")}
                </button>
              </th>

              <th className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort("capacity")}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Ilość łóżek {renderSortIcon("capacity")}
                </button>
              </th>

              <th className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort("type")}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Typ {renderSortIcon("type")}
                </button>
              </th>

              <th className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort("status")}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Status {renderSortIcon("status")}
                </button>
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredByStatus.length > 0 ? (
              filteredByStatus.map((room) => {
                const isSelected = room.id === selectedRoomId;

                return (
                  <tr
                    key={room.id}
                    onClick={() => openEditModal(room)}
                    className={[
                      "border-t border-slate-700/60 transition cursor-pointer",
                      isSelected
                        ? "bg-indigo-500/10 ring-1 ring-indigo-500/30"
                        : "hover:bg-slate-800/70",
                    ].join(" ")}
                    title="Kliknij aby edytować"
                  >
                    <td className="px-4 py-3 text-slate-100">{room.id}</td>
                    <td className="px-4 py-3 text-slate-300">{room.name}</td>
                    <td className="px-4 py-3 text-slate-100">{room.capacity}</td>
                    <td className="px-4 py-3 text-slate-300">{room.type}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusColors[room.status] || "bg-slate-700 text-slate-200"
                        }`}
                      >
                        {room.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr className="border-t border-slate-700/60">
                <td colSpan="5" className="px-4 py-6 text-center text-slate-400 italic">
                  Brak wyników.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal add/edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 p-6 rounded-xl w-full max-w-md border border-slate-700 shadow-2xl"
          >
            <h2 className="text-xl font-semibold mb-1 text-white">
              {mode === "add" ? "Dodaj nowy pokój" : `Edytuj pokój #${selectedRoom?.id}`}
            </h2>
            <p className="text-xs text-slate-400 mb-6 uppercase tracking-wider">
              Formularz zasobów
            </p>

            {error && (
              <div className="mb-4 p-2 bg-red-500/20 border border-red-500/50 text-red-200 text-xs rounded">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold">
                  TYP POKOJU
                </label>
                <select
                  className="w-full p-2.5 rounded bg-slate-900 border border-slate-700 text-white outline-none focus:border-indigo-500"
                  value={form.type}
                  onChange={handleChange("type")}
                >
                  <option value="">— wybierz typ —</option>
                  {roomTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-semibold">
                    ILOŚĆ ŁÓŻEK
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="np. 2"
                    className="w-full p-2.5 rounded bg-slate-900 border border-slate-700 text-white outline-none focus:border-indigo-500"
                    value={form.capacity}
                    onChange={handleChange("capacity")}
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-semibold">
                    PIĘTRO
                  </label>
                  <input
                    type="number"
                    placeholder="np. 1"
                    className="w-full p-2.5 rounded bg-slate-900 border border-slate-700 text-white outline-none focus:border-indigo-500"
                    value={form.name}
                    onChange={handleChange("name")}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold">
                  STATUS
                </label>
                <select
                  className="w-full p-2.5 rounded bg-slate-900 border border-slate-700 text-white outline-none focus:border-indigo-500"
                  value={form.status}
                  onChange={handleChange("status")}
                >
                  {Object.keys(statusColors).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              {mode === "edit" && (
                <button
                  onClick={handleDelete}
                  className="mr-auto px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-500 transition text-white text-sm"
                >
                  Usuń
                </button>
              )}

              <button
                onClick={closeModal}
                className="px-4 py-2 text-slate-400 hover:text-white transition text-sm"
              >
                Anuluj
              </button>

              <button
                onClick={handleSave}
                className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-medium transition shadow-lg shadow-indigo-500/20 text-sm"
              >
                {mode === "add" ? "Dodaj pokój" : "Zapisz zmiany"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
};

export default AdminRooms;
