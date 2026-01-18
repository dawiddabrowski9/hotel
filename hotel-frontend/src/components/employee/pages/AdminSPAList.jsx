// src/components/employee/pages/AdminSpaReservations.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTableSearchSort } from "../hook/useTableSearchSort";

// tylko te usługi
const serviceOptions = [
  "MASAŻ KLASYCZNY CAŁOŚCIOWY",
  "MASAŻ RELAKSACYJNY",
  "MASAŻ BASKIJSKI",
  "MASAŻ CIEPŁĄ CZEKOLADĄ",
  "KOBIDO",
  "BODY PEELING",
];

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
  if (status === "W trakcie")
    return "bg-amber-500/15 text-amber-300 border border-amber-500/20";
  // Oczekuje
  return "bg-sky-500/15 text-sky-300 border border-sky-500/20";
};
// dane demo (frontend)
const demoReservations = [
  {
    id: 1,
    firstName: "Jan",
    lastName: "Kowalski",
    email: "jan.kowalski@mail.com",
    phone: "600700800",
    date: "2026-01-18",
    time: "10:30",
    service: "Masaż klasyczny całościowy",
    status: "Oczekuje",
  }
];

export default function AdminSpaReservations() {
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading]  = useState(true);
  const [filterStatus, setFilterStatus] = useState("Wszystkie"); // Wszystkie | Oczekuje | W trakcie | Zrealizowane
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [selectedReservationId, setSelectedReservationId] = useState(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    service: serviceOptions[0],
    status: "Oczekuje",
  });

  //AUTO STATUS 
  useEffect(() => {
    const tick = () => {
      setReservations((prev) =>
        prev.map((r) => {
          if (r.status === "Zrealizowane") return r;
          if (isPast(r.date, r.time)) return { ...r, status: "Zrealizowane" };
          return r;
        })
      );
    };

    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const {
    search,
    setSearch,
    handleSort,
    data: sortedData,
    renderSortIcon,
  } = useTableSearchSort({
    data: reservations,
    searchableFields: [
      "firstName",
      "lastName",
      "email",
      "phone",
      "date",
      "time",
      "service",
      "status",
    ],
    defaultSortKey: "date",
    defaultSortDirection: "desc",
  });

  const filteredReservations = useMemo(() => {
    return filterStatus === "Wszystkie"
      ? sortedData
      : sortedData.filter((r) => r.status === filterStatus);
  }, [sortedData, filterStatus]);

  const statusOptions = ["Wszystkie", "Oczekuje", "W trakcie", "Zrealizowane"];

  const openEditModal = (reservation) => {
    setSelectedReservation(reservation);
    setSelectedReservationId(reservation.id);
    setError("");

    const autoStatus = isPast(reservation.date, reservation.time)
      ? "Zrealizowane"
      : reservation.status;

    const safeService = serviceOptions.includes(reservation.service)
      ? reservation.service
      : serviceOptions[0];

    setForm({
      firstName: reservation.firstName || "",
      lastName: reservation.lastName || "",
      email: reservation.email || "",
      phone: reservation.phone || "",
      date: reservation.date || "",
      time: reservation.time || "",
      service: safeService,
      status: autoStatus || "Oczekuje"
    });

    setIsModalOpen(true);
  };
const fetchReservations = async () => {
  try {
    setIsLoading(true);
    const res = await fetch("http://localhost:3000/spa/list");
    
    // Jeśli status nie jest 200-299, rzuć błąd
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Błąd serwera");
    }

    const data = await res.json();

    // Dodatkowe sprawdzenie, czy data to na pewno tablica
    if (Array.isArray(data)) {
      const mapped = data.map(r => ({
        ...r,
        status: isPast(r.date, r.time) ? "Zrealizowane" : (r.status || "Oczekuje")
      }));
      setReservations(mapped);
    } else {
      console.error("Otrzymano dane w złym formacie:", data);
      setReservations([]);
    }

  } catch (err) {
    console.error("Błąd pobierania:", err.message);
    setError("Problem z połączeniem: " + err.message);
  } finally {
    setIsLoading(false);
  }
};
useEffect(()=>{fetchReservations();},[]);
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedReservation(null);
    setError("");
  };

  const validate = () => {
    if (!form.firstName.trim()) {
      setError("Podaj imię.");
      return false;
    }
    if (!form.lastName.trim()) {
      setError("Podaj nazwisko.");
      return false;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      setError("Podaj poprawny email.");
      return false;
    }
    if (!form.phone.trim()) {
      setError("Podaj numer telefonu.");
      return false;
    }
    if (!form.date || !form.time) {
      setError("Podaj datę i godzinę.");
      return false;
    }
    if (!serviceOptions.includes(form.service)) {
      setError("Wybierz usługę z listy.");
      return false;
    }
   
    return true;
  };

  const handleSave = async () => {
    if (!selectedReservation) return;
    if (!validate()) return;

    const forcedStatus = isPast(form.date, form.time) ? "Zrealizowane" : form.status;
    const updatedData = { ...form, status: forcedStatus };

    const backup = [...reservations];

    setReservations(prev => prev.map(r => 
      r.id === selectedReservation.id ? { ...r, ...updatedData } : r
    ));
    setIsModalOpen(false);

    try {
      const res = await fetch(`http://localhost:3000/spa/update/${selectedReservation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });

      if (!res.ok) throw new Error("Serwer odrzucił aktualizację");
    } catch (err) {
      console.error(err);
      setReservations(backup);
      alert("Nie udało się zapisać zmian na serwerze.");
    }
  };

  const handleDelete = async () => {
    if (!selectedReservation) return;
    if (!window.confirm("Czy na pewno chcesz usunąć tę rezerwację?")) return;

    const backup = [...reservations];

    setReservations(prev => prev.filter(r => r.id !== selectedReservation.id));
    setIsModalOpen(false);

    try {
      const res = await fetch(`http://localhost:3000/spa/delete/${selectedReservation.id}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Błąd podczas usuwania");
    } catch (err) {
      console.error(err);
      setReservations(backup); // Przywróć dane
      alert("Nie udało się usunąć rezerwacji.");
    }
  };

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Rezerwacje SPA</h1>
        <p className="text-sm text-slate-400">
          Status automatycznie zmienia się na „Zrealizowane” po upływie czasu.
        </p>
      </div>

      {/* search + status */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <input
          type="text"
          placeholder="Szukaj (imię, nazwisko, email, tel, usługa, data...)"
          className="w-full md:w-1/3 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex gap-2 text-sm flex-wrap">
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg border ${
                filterStatus === s
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700"
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
              <th
                onClick={() => handleSort("lastName")}
                className="px-4 py-3 text-left w-[16%] cursor-pointer select-none"
              >
                Nazwisko {renderSortIcon("lastName")}
              </th>
              <th
                onClick={() => handleSort("firstName")}
                className="px-4 py-3 text-left w-[14%] cursor-pointer select-none"
              >
                Imię {renderSortIcon("firstName")}
              </th>
              <th className="px-4 py-3 text-left w-[22%]">Email</th>
              <th className="px-4 py-3 text-left w-[14%]">Telefon</th>
              <th
                onClick={() => handleSort("date")}
                className="px-4 py-3 text-left w-[12%] cursor-pointer select-none"
              >
                Data {renderSortIcon("date")}
              </th>
              <th
                onClick={() => handleSort("time")}
                className="px-4 py-3 text-left w-[10%] cursor-pointer select-none"
              >
                Godzina {renderSortIcon("time")}
              </th>
              <th className="px-4 py-3 text-left w-[22%]">Usługa</th>
              <th className="px-4 py-3 text-center w-[12%]">Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredReservations.map((r) => (
              <tr
                key={r.id}
                onClick={() => openEditModal(r)}
                className={`border-t border-slate-700/60 cursor-pointer transition ${
                  selectedReservationId === r.id
                    ? "bg-indigo-500/10 ring-1 ring-indigo-500/30"
                    : "hover:bg-slate-800/70"
                }`}
              >
                <td className="px-4 py-3 truncate" title={r.lastName}>
                  {r.lastName}
                </td>
                <td className="px-4 py-3 truncate" title={r.firstName}>
                  {r.firstName}
                </td>
                <td className="px-4 py-3 truncate" title={r.email}>
                  {r.email}
                </td>
                <td className="px-4 py-3 truncate" title={r.phone}>
                  {r.phone}
                </td>
                <td className="px-4 py-3">{r.date}</td>
                <td className="px-4 py-3">{r.time}</td>
                <td className="px-4 py-3 truncate" title={r.service}>
                  {r.service}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClass(
                      r.status
                    )}`}
                  >
                    {r.status}
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
            <h2 className="text-xl font-semibold mb-1">Edytuj rezerwację SPA</h2>

            {selectedReservation && (
              <p className="text-xs text-slate-400 mb-4">
                Edytujesz:{" "}
                <span className="text-slate-200 font-medium">
                  {selectedReservation.firstName} {selectedReservation.lastName}
                </span>{" "}
                • {selectedReservation.date} {selectedReservation.time}
              </p>
            )}

            {error && <div className="mb-3 text-sm text-red-300">{error}</div>}

            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Imię"
                className="p-3 rounded bg-slate-700 text-white"
                value={form.firstName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, firstName: e.target.value }))
                }
              />
              <input
                placeholder="Nazwisko"
                className="p-3 rounded bg-slate-700 text-white"
                value={form.lastName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, lastName: e.target.value }))
                }
              />
            </div>

            <input
              placeholder="Email"
              className="w-full p-3 mt-3 rounded bg-slate-700 text-white"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
            />

            <input
              placeholder="Telefon"
              className="w-full p-3 mt-3 rounded bg-slate-700 text-white"
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
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

        
            <select
              value={form.service}
              onChange={(e) =>
                setForm((p) => ({ ...p, service: e.target.value }))
              }
              className="w-full p-3 mt-3 rounded bg-slate-700 text-white"
            >
              {serviceOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
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
