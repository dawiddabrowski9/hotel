// src/components/employee/pages/AdminMeals.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTableSearchSort } from "../hook/useTableSearchSort";

// pomocnicze: sprawdza czy data+godzina minęły
const isPast = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return false;
  const dt = new Date(`${dateStr}T${timeStr}:00`);
  if (Number.isNaN(dt.getTime())) return false;
  return dt.getTime() <= Date.now();
};

const statusBadgeClass = (status) => {
  if (status === "Zrealizowane")
    return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20";
  return "bg-amber-500/15 text-amber-300 border border-amber-500/20";
};

// dane demo (frontend)
const demoMeals = [
  {
    id: 1,
    room: 12,
    guestName: "Jan Kowalski",
    menuNumber: 3,
    date: "2026-01-15",
    time: "18:30",
    portions: 2,
    delivery: "Tak",
    status: "W trakcie",
  },
  {
    id: 2,
    room: 7,
    guestName: "Anna Nowak",
    menuNumber: 1,
    date: "2026-01-15",
    time: "20:00",
    portions: 1,
    delivery: "Nie",
    status: "W trakcie",
  },
];

export default function AdminMeals() {
  const [meals, setMeals] = useState(demoMeals);

  const [filterStatus, setFilterStatus] = useState("Wszystkie"); // Wszystkie | W trakcie | Zrealizowane
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [selectedMealId, setSelectedMealId] = useState(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    room: 1,
    guestName: "",
    menuNumber: 1,
    date: "",
    time: "",
    portions: 1,
    delivery: "Tak",
    status: "W trakcie",
  });

  // auto-przełączanie statusu co 30s
  useEffect(() => {
    const tick = () => {
      setMeals((prev) =>
        prev.map((m) => {
          if (m.status === "Zrealizowane") return m;
          if (isPast(m.date, m.time)) return { ...m, status: "Zrealizowane" };
          return m;
        })
      );
    };

    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const { search, setSearch, handleSort, data: sortedData, renderSortIcon } =
    useTableSearchSort({
      data: meals,
      searchableFields: [
        "room",
        "guestName",
        "menuNumber",
        "date",
        "time",
        "portions",
        "delivery",
        "status",
      ],
      defaultSortKey: "date",
      defaultSortDirection: "desc",
    });

  const filteredMeals = useMemo(() => {
    return filterStatus === "Wszystkie"
      ? sortedData
      : sortedData.filter((m) => m.status === filterStatus);
  }, [sortedData, filterStatus]);

  const statusOptions = ["Wszystkie", "W trakcie", "Zrealizowane"];

  const openEditModal = (meal) => {
    setSelectedMeal(meal);
    setSelectedMealId(meal.id);
    setError("");

    const autoStatus = isPast(meal.date, meal.time)
      ? "Zrealizowane"
      : meal.status;

    setForm({
      room: meal.room,
      guestName: meal.guestName,
      menuNumber: meal.menuNumber,
      date: meal.date,
      time: meal.time,
      portions: meal.portions,
      delivery: meal.delivery,
      status: autoStatus,
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMeal(null);
    setError("");
  };

  const validate = () => {
    if (form.room < 1 || form.room > 100) {
      setError("Numer pokoju musi być w zakresie 1–100.");
      return false;
    }
    if (!form.guestName.trim()) {
      setError("Podaj imię i nazwisko gościa.");
      return false;
    }
    if (form.menuNumber < 1 || form.menuNumber > 10) {
      setError("Numer z menu musi być w zakresie 1–10.");
      return false;
    }
    if (!form.date || !form.time) {
      setError("Podaj datę i godzinę.");
      return false;
    }
    if (form.portions < 1) {
      setError("Ilość porcji musi być ≥ 1.");
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!selectedMeal) return;
    if (!validate()) return;

    const forcedStatus = isPast(form.date, form.time)
      ? "Zrealizowane"
      : form.status;

    const updated = {
      ...selectedMeal,
      ...form,
      status: forcedStatus,
    };

    setMeals((prev) =>
      prev.map((m) => (m.id === selectedMeal.id ? updated : m))
    );

    setIsModalOpen(false);
    setSelectedMeal(null);
  };

  const handleDelete = () => {
    if (!selectedMeal) return;

    setMeals((prev) => prev.filter((m) => m.id !== selectedMeal.id));
    setSelectedMealId(null);
    setIsModalOpen(false);
    setSelectedMeal(null);
  };

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Lista posiłków</h1>
        <p className="text-sm text-slate-400">
          Status automatycznie zmienia się na „Zrealizowane” po upływie czasu.
        </p>
      </div>

      {/* search + status */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <input
          type="text"
          placeholder="Szukaj (pokój, gość, menu, data...)"
          className="w-full md:w-1/3 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex gap-2 text-sm">
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg border ${
                filterStatus === s
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* tabela */}
      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/60">
        <table className="min-w-full text-sm table-fixed">
          <thead className="bg-slate-800 text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left w-[10%]">Pokój</th>
              <th className="px-4 py-3 text-left w-[22%]">Gość</th>
              <th className="px-4 py-3 text-center w-[10%]">Menu</th>
              <th className="px-4 py-3 text-left w-[14%]">Data</th>
              <th className="px-4 py-3 text-left w-[12%]">Godzina</th>
              <th className="px-4 py-3 text-center w-[10%]">Porcje</th>
              <th className="px-4 py-3 text-center w-[12%]">Dostawa</th>
              <th className="px-4 py-3 text-center w-[10%]">Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredMeals.map((m) => (
              <tr
                key={m.id}
                onClick={() => openEditModal(m)}
                className={`border-t border-slate-700/60 cursor-pointer transition ${
                  selectedMealId === m.id
                    ? "bg-indigo-500/10 ring-1 ring-indigo-500/30"
                    : "hover:bg-slate-800/70"
                }`}
              >
                <td className="px-4 py-3">{m.room}</td>
                <td className="px-4 py-3">{m.guestName}</td>
                <td className="px-4 py-3 text-center">{m.menuNumber}</td>
                <td className="px-4 py-3">{m.date}</td>
                <td className="px-4 py-3">{m.time}</td>
                <td className="px-4 py-3 text-center">{m.portions}</td>
                <td className="px-4 py-3 text-center">{m.delivery}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClass(
                      m.status
                    )}`}
                  >
                    {m.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* modal edycji */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 p-6 rounded-xl w-full max-w-md"
          >
            <h2 className="text-xl font-semibold mb-4">Edytuj posiłek</h2>

            {error && (
              <div className="mb-3 text-sm text-red-300">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.room}
                onChange={(e) =>
                  setForm((p) => ({ ...p, room: Number(e.target.value) }))
                }
                className="p-3 rounded bg-slate-700 text-white"
              >
                {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>

              <select
                value={form.menuNumber}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    menuNumber: Number(e.target.value),
                  }))
                }
                className="p-3 rounded bg-slate-700 text-white"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </div>

            <input
              className="w-full p-3 mt-3 rounded bg-slate-700 text-white"
              value={form.guestName}
              onChange={(e) =>
                setForm((p) => ({ ...p, guestName: e.target.value }))
              }
            />

            <div className="grid grid-cols-2 gap-3 mt-3">
              <input
                type="date"
                className="p-3 rounded bg-slate-700 text-white"
                value={form.date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, date: e.target.value }))
                }
              />
              <input
                type="time"
                className="p-3 rounded bg-slate-700 text-white"
                value={form.time}
                onChange={(e) =>
                  setForm((p) => ({ ...p, time: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <input
                type="number"
                min={1}
                className="p-3 rounded bg-slate-700 text-white"
                value={form.portions}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    portions: Number(e.target.value),
                  }))
                }
              />

              <select
                value={form.delivery}
                onChange={(e) =>
                  setForm((p) => ({ ...p, delivery: e.target.value }))
                }
                className="p-3 rounded bg-slate-700 text-white"
              >
                <option>Tak</option>
                <option>Nie</option>
              </select>
            </div>

            <select
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({ ...p, status: e.target.value }))
              }
              className="w-full p-3 mt-3 rounded bg-slate-700 text-white"
            >
              <option>W trakcie</option>
              <option>Zrealizowane</option>
            </select>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={handleDelete}
                className="mr-auto px-4 py-2 bg-red-500/80 text-white rounded"
              >
                Usuń
              </button>
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-slate-600 rounded"
              >
                Anuluj
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-500 text-white rounded"
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
