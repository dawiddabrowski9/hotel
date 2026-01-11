// src\components\employee\pages\AdminDashboard.jsx
import React,{useState,useEffect}from "react";






const AdminDashboard = ({ setSelected }) => {

  const [reservationSummary, setReservationSummary] = useState({
    today_reservations: 0,
    total_guests: 0
  });
  const [checkoutSummary, setCheckoutSummary] = useState({
    total_checkouts: 0
  });
  const [roomSummary, setRoomSummary] = useState({
    occupied_beds: 0,
    total_beds: 0,
    total_rooms: 0,
    occupied_rooms: 0,
    free_rooms: 0
    
  });
  const currentDate = new Date();
  const formattedDate = currentDate.toISOString().split('T')[0];
  const currentTime = currentDate.toTimeString().split(' ')[0];
  const [guestCount, setGuestCount] = useState(0);  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const checkoutResponse = await fetch('http://localhost:3000/reservations/checkouts');
        const checkoutData = await checkoutResponse.json();
        setCheckoutSummary(checkoutData);    
        const roomResponse = await fetch('http://localhost:3000/rooms/summary');
        const roomData = await roomResponse.json();
        setRoomSummary(roomData);


        const res = await fetch('http://localhost:3000/reservations/summary');
        const reservationData = await res.json();
        setReservationSummary(reservationData);
      } catch (error) {
        console.error("Błąd podczas pobierania danych:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSummary();
  }, []);
  
  const occupancyPrecentage = roomSummary.total_rooms
    ? ((roomSummary.occupied_rooms / roomSummary.total_rooms) * 100).toFixed(0)
    : 0;

  return (
    <section>
      <h1 className="text-3xl font-bold mb-6">DashBoard</h1>

      {/* GRID Z KAFELKAMI */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-12 mb-8">
        {/* Kafelek 1 */}
        <div
          onClick={() => setSelected("Lista pokoi")}
          className="bg-slate-800 rounded-xl p-16 shadow-lg border border-slate-700 cursor-pointer hover:bg-slate-700 transition"
        >
          <p className="text-l text-slate-400 cente">Obłożenie pokoi</p>
          <p className="mt-2 text-4xl font-bold text-indigo-400">{occupancyPrecentage}%</p>
          
        </div>

        {/* Kafelek 2 */}
        <div
          onClick={() => setSelected("Sprzątanie")}
          className="bg-slate-800 rounded-xl p-16 shadow-lg border border-slate-700 cursor-pointer hover:bg-slate-700 transition"
        >
          <p className="text-l text-slate-400">Dzisiejsze check-outy</p>
          <p className="mt-2 text-4xl font-bold text-red-400">{checkoutSummary.total_checkouts}</p>
          <p className="mt-1 text-xs text-slate-400">
            
          </p>
        </div>

        {/* Kafelek 3 */}
        <div
          onClick={() => setSelected("Członkowie")}
          className="bg-slate-800 rounded-xl p-16 shadow-lg border border-slate-700 cursor-pointer hover:bg-slate-700 transition"
        >
          <p className="text-l text-slate-400">Goście w hotelu</p>
          <p className="mt-2 text-4xl font-bold text-sky-400">{roomSummary.occupied_beds}</p>
          <p className="mt-1 text-xs text-slate-400">{roomSummary.total_beds} dostępnych miejsc</p>
        </div>

        {/* Kafelek 4 */}
        <div className="bg-slate-800 rounded-xl p-16 shadow-lg border border-slate-700">
          <p className="text-l text-slate-400">Dzisiejsze check-iny</p>
          <p className="mt-2 text-4xl font-bold text-amber-400">{reservationSummary.total_guests}</p>
          <p className="mt-1 text-xs text-slate-400">Ostatnia synchronizacja: {formattedDate}       {currentTime}</p>
        </div>
      </div>

      {/* Dalsza część dashboardu – np. tabelki / wykresy */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
        <div className="xl:col-span-2 bg-slate-800 rounded-xl p-16 border border-slate-700">
          <h2 className="text-2xl font-semibold mb-2">Dzisiejsze operacje</h2>
          <p className="text-l text-slate-400">
            Tu możesz później dodać listę dzisiejszych przyjazdów i wyjazdów.
          </p>
        </div>
        <div className="bg-slate-800 rounded-xl p-16 border border-slate-700">
          <h2 className="text-2xl font-semibold mb-2">Alerty</h2>
          <ul className="text-l text-slate-300 list-disc list-inside space-y-1">
            <li>2 pokoje oznaczone jako "do sprzątania"</li>
            <li>1 pokój zgłoszony jako "usterka"</li>
          </ul>
        </div>
      </div>
    </section>
  );
};
export default AdminDashboard;
