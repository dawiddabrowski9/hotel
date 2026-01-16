// src/components/employee/pages/AdminRoomCleaning.jsx
import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTableSearchSort } from "../hook/useTableSearchSort";

const statusColors = {
  Wolny: "bg-emerald-500/15 text-emerald-400",
  Zajęty: "bg-red-500/15 text-red-400",
  Sprzątanie: "bg-amber-500/15 text-amber-400",
  Oczekujący: "bg-sky-500/15 text-sky-400",
};

export default function AdminRoomCleaning() {
  const [filter, setFilter] = useState("Wszystkie");
  const [rooms, setRooms] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("add"); // add | edit
  const [selectedRoom, setSelectedRoom] = useState(null);

  // ✅ do podświetlenia wiersza
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  const [form, setForm] = useState({
    id: "",
    people: "",
    status: "Wolny",
  });

  const [error, setError] = useState("");

  const { search, setSearch, handleSort, data: sortedData, renderSortIcon } =
    useTableSearchSort({
      data: rooms,
      searchableFields: ["id", "people", "status"],
      defaultSortKey: "id",
      defaultSortDirection: "asc",
    });

  const filteredRooms =
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
    setForm({ id: "", people: "", status: "Wolny" });
    setIsModalOpen(true);
  };

  const openEditModal = (room) => {
    setMode("edit");
    setSelectedRoom(room);
    setSelectedRoomId(room.id); // ✅ ustaw podświetlenie
    setError("");
    setForm({
      id: room.id,
      people: room.people ?? "",
      status: room.status ?? "Wolny",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
    setError("");
    // jeśli chcesz usuwać podświetlenie po zamknięciu, odkomentuj:
    // setSelectedRoomId(null);
  };

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const validateCommon = () => {
    if (!form.people.trim()) {
      setError("Podaj imię/nazwę pracownika.");
      return false;
    }
    if (!form.status) {
      setError("Wybierz status.");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    setError("");

    if (mode === "add") {
      const idNum = Number(form.id);

      if (!Number.isInteger(idNum) || idNum <= 0) {
        setError("Podaj poprawny numer pokoju (liczba całkowita > 0).");
        return;
      }

      if (!validateCommon()) return;

      if (rooms.some((r) => Number(r.id) === idNum)) {
        setError(`Pokój o numerze ${idNum} już istnieje na liście.`);
        return;
      }

      const newRow = {
        id: idNum,
        people: form.people.trim(),
        status: form.status,
      };

      setRooms((prev) => [...prev, newRow]);
      setSelectedRoomId(idNum); // ✅ po dodaniu też zaznacz
      setIsModalOpen(false);
      return;
    }

    if (!selectedRoom) return;
    if (!validateCommon()) return;

    const updated = {
      ...selectedRoom,
      people: form.people.trim(),
      status: form.status,
    };

    setRooms((prev) => prev.map((r) => (r.id === selectedRoom.id ? updated : r)));
    setSelectedRoomId(selectedRoom.id); // ✅ dalej zaznaczony
    setIsModalOpen(false);
    setSelectedRoom(null);
  };

  const handleDelete = async () => {
    if (!selectedRoom) return;

    setRooms((prev) => prev.filter((r) => r.id !== selectedRoom.id));
    // ✅ jeśli usuwasz zaznaczony, wyczyść zaznaczenie
    setSelectedRoomId((prev) => (prev === selectedRoom.id ? null : prev));

    setIsModalOpen(false);
    setSelectedRoom(null);
  };

  const fetchedCleaning = async () => {
    try {
      const response = await fetch("http://localhost:3000/cleaning/list");
      const data = await response.json();

      const normalized = Array.isArray(data)
        ? data.map((r) => ({
            id: r.id,
            people: r.people,
            status: r.status,
          }))
        : [];

      setRooms(normalized);
    } catch (error) {
      console.error("Błąd podczas pobierania listy pokoi do sprzątania:", error);
    }
  };

  useEffect(() => {
    fetchedCleaning();
  }, []);

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Lista i status pokoi</h1>
          <p className="text-sm text-slate-400">
            Kliknij w wiersz aby edytować – edytowany wiersz podświetli się.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-sm font-medium text-white transition"
        >
          + Dodaj wpis
        </button>
      </div>

      {/* Wyszukiwarka + filtry */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Szukaj pokoju lub pracownika..."
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 text-sm flex-wrap">
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
                  onClick={() => handleSort("people")}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  Przypisany pracownik
                  {renderSortIcon("people")}
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
            {filteredRooms.length > 0 ? (
              filteredRooms.map((room) => {
                const isSelected = room.id === selectedRoomId;

                return (
                  <tr
                    key={room.id}
                    onClick={() => openEditModal(room)}
                    className={[
                      "border-t border-slate-700/60 transition cursor-pointer",
                      isSelected ? "bg-indigo-500/10 ring-1 ring-indigo-500/30" : "hover:bg-slate-800/70",
                    ].join(" ")}
                    title="Kliknij aby edytować"
                  >
                    <td className="px-4 py-3 text-slate-100">{room.id}</td>
                    <td className="px-4 py-3 text-slate-100">{room.people}</td>
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
                <td colSpan="3" className="px-4 py-6 text-center text-slate-400 italic">
                  Brak wyników.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal add/edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-slate-800 p-6 rounded-xl w-full max-w-md shadow-xl"
          >
            <h2 className="text-xl font-semibold mb-4">
              {mode === "add" ? "Dodaj wpis" : `Edytuj pokój ${form.id}`}
            </h2>

            {error && (
              <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}

            <input
              type="number"
              placeholder="Nr pokoju (np. 101)"
              className="w-full p-3 rounded bg-slate-700 placeholder-slate-400 text-white mb-3"
              value={form.id}
              onChange={handleChange("id")}
              disabled={mode === "edit"}
            />

            <input
              type="text"
              placeholder="ID pracownika"
              className="w-full p-3 rounded bg-slate-700 placeholder-slate-400 text-white mb-3"
              value={form.people}
              onChange={handleChange("people")}
            />

            <div className="mb-4">
              <label className="block text-sm mb-1 text-slate-300">Status</label>
              <select
                value={form.status}
                onChange={handleChange("status")}
                className="w-full p-3 rounded bg-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>Wolny</option>
                <option>Zajęty</option>
                <option>Sprzątanie</option>
                <option>Oczekujący</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              {mode === "edit" && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="mr-auto px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-500 transition text-white"
                >
                  Usuń
                </button>
              )}

              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 transition"
              >
                Anuluj
              </button>

              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 transition text-white"
              >
                Zapisz
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}
