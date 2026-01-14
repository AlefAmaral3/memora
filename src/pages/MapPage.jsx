import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase/firebaseConfig";
import { collection, getDocs, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";

const GOOGLE_MAPS_API_KEY = "AIzaSyCAXUu_954tLnurNrz7P5JAh2l4dBkIbW8";

// Mock data de eventos públicos
const MOCK_PUBLIC_EVENTS = [
	{ id: "pub_1", titulo: "Jazz Night no Café Lisboa", local: "Café Lisboa, Rua da Rosa 45, Lisboa", cidade: "Lisboa", latitude: 38.7223, longitude: -9.1393, data: "2026-01-25", hora: "20:00", descricao: "Noite de jazz ao vivo com entrada livre", categoria: "Música", isPublic: true, source: "eventbrite" },
	{ id: "pub_2", titulo: "Workshop de Fotografia Digital", local: "Escola de Artes, Av. Brasil 100, Lisboa", cidade: "Lisboa", latitude: 38.7241, longitude: -9.1432, data: "2026-01-22", hora: "14:30", descricao: "Aprenda técnicas avançadas de fotografia com profissional", categoria: "Workshop", isPublic: true, source: "eventbrite" },
	{ id: "pub_3", titulo: "Mercado Orgânico do Parque", local: "Parque da Cidade, Lisboa", cidade: "Lisboa", latitude: 38.7611, longitude: -9.1596, data: "2026-01-18", hora: "09:00", descricao: "Feira semanal de produtos biológicos e artesanato", categoria: "Mercado", isPublic: true, source: "eventbrite" },
	{ id: "pub_4", titulo: "Conferência: Sustentabilidade 2026", local: "Centro de Convenções, Lisboa", cidade: "Lisboa", latitude: 38.7282, longitude: -9.1568, data: "2026-02-01", hora: "10:00", descricao: "Discussão sobre práticas sustentáveis no negócio", categoria: "Conferência", isPublic: true, source: "eventbrite" },
	{ id: "pub_5", titulo: "Festival de Vinho do Douro", local: "Ribeira, Porto", cidade: "Porto", latitude: 41.1579, longitude: -8.6291, data: "2026-02-05", hora: "11:00", descricao: "Degustação de vinhos do Douro com produtores locais", categoria: "Festival", isPublic: true, source: "eventbrite" },
	// ... (restante dataset igual ao de MapPageTest)
];

export default function MapPage() {
	const navigate = useNavigate();
	const mapRef = useRef(null);
	const mapInstanceRef = useRef(null);
	const markersRef = useRef([]);
	const [userEvents, setUserEvents] = useState([]);
	const [selectedEvent, setSelectedEvent] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [modalEvent, setModalEvent] = useState(null);
	const [selectedCity, setSelectedCity] = useState("Lisboa");
	const [searchCity, setSearchCity] = useState("");
	const [availableCities] = useState([
		{ name: "Lisboa", lat: 38.7223, lng: -9.1393 },
		{ name: "Porto", lat: 41.1579, lng: -8.6291 },
		{ name: "Covilhã", lat: 40.2847, lng: -7.5019 },
		{ name: "Braga", lat: 41.5505, lng: -8.4264 },
		{ name: "Faro", lat: 37.0141, lng: -7.9365 },
	]);
	const [filteredCities, setFilteredCities] = useState([]);
	const [showCityDropdown, setShowCityDropdown] = useState(false);
	const [formData, setFormData] = useState({ titulo: "", data: "", hora: "", local: "", descricao: "", categoria: "" });

	const visiblePublicEvents = MOCK_PUBLIC_EVENTS.filter((event) => event.cidade === selectedCity);

	useEffect(() => { setFilteredCities(availableCities); }, []);

	const handleCitySearch = (value) => {
		setSearchCity(value);
		const filtered = availableCities.filter((city) => city.name.toLowerCase().includes(value.toLowerCase()));
		setFilteredCities(filtered);
	};

	const handleSelectCity = (city) => {
		setSelectedCity(city.name);
		setSearchCity("");
		setShowCityDropdown(false);
		if (mapInstanceRef.current) {
			mapInstanceRef.current.setCenter({ lat: city.lat, lng: city.lng });
			mapInstanceRef.current.setZoom(12);
		}
		const cityEvents = MOCK_PUBLIC_EVENTS.filter((e) => e.cidade === city.name);
		addMarkersToMap(userEvents, cityEvents);
	};

	useEffect(() => {
		if (!window.google) {
			const script = document.createElement("script");
			script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
			script.async = true;
			script.defer = true;
			script.onload = initMap;
			document.head.appendChild(script);
		} else {
			initMap();
		}
	}, []);

	const initMap = () => {
		if (!mapRef.current) return;
		mapInstanceRef.current = new window.google.maps.Map(mapRef.current, { zoom: 12, center: { lat: 38.7223, lng: -9.1393 }, mapTypeControl: true, fullscreenControl: true, streetViewControl: true });
		loadEvents();
	};

	const loadEvents = async () => {
		try {
			setIsLoading(true);
			const eventsSnap = await getDocs(collection(db, "events"));
			const userEventsData = [];
			for (const eventDoc of eventsSnap.docs) {
				const eventData = eventDoc.data();
				if (eventData.latitude && eventData.longitude) {
					userEventsData.push({ id: eventDoc.id, ...eventData, isPublic: false });
				}
			}
			setUserEvents(userEventsData);
			const lisboaPublicEvents = MOCK_PUBLIC_EVENTS.filter((event) => event.cidade === "Lisboa");
			addMarkersToMap(userEventsData, lisboaPublicEvents);
			setIsLoading(false);
		} catch (error) {
			console.error("Erro ao carregar eventos:", error);
			setIsLoading(false);
		}
	};

	const addMarkersToMap = (userEventsData, publicEventsData) => {
		markersRef.current.forEach((marker) => marker.setMap(null));
		markersRef.current = [];
		if (!mapInstanceRef.current) return;
		const bounds = new window.google.maps.LatLngBounds();
		userEventsData.forEach((event) => {
			if (!event.latitude || !event.longitude) return;
			const marker = new window.google.maps.Marker({ position: { lat: event.latitude, lng: event.longitude }, map: mapInstanceRef.current, title: event.titulo, icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" });
			const infoWindow = new window.google.maps.InfoWindow({ content: `
					<div style="padding: 10px; max-width: 250px;">
						<div style="background: #fee; padding: 4px 8px; border-radius: 4px; margin-bottom: 8px; font-size: 12px; color: #c33;">📌 Seu evento</div>
						<h3 style="margin: 0 0 8px 0;">${event.titulo}</h3>
						<p style="margin: 4px 0; color: #666;"><strong>📅</strong> ${event.hora}</p>
						<p style="margin: 4px 0; color: #666;"><strong>📍</strong> ${event.local || "Sem local"}</p>
						<button onclick="window.location.href='/events/${event.id}'" 
							style="margin-top: 10px; padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
							Ver Evento
						</button>
					</div>
				` });
			marker.addListener("click", () => { infoWindow.open(mapInstanceRef.current, marker); setSelectedEvent(event); });
			markersRef.current.push(marker);
			bounds.extend(marker.getPosition());
		});
		publicEventsData.forEach((event) => {
			if (!event.latitude || !event.longitude) return;
			const marker = new window.google.maps.Marker({ position: { lat: event.latitude, lng: event.longitude }, map: mapInstanceRef.current, title: event.titulo, icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" });
			const infoWindow = new window.google.maps.InfoWindow({ content: `
					<div style="padding: 10px; max-width: 250px;">
						<div style="background: #e3f2fd; padding: 4px 8px; border-radius: 4px; margin-bottom: 8px; font-size: 12px; color: #1976d2;">💡 Sugestão de evento</div>
						<h3 style="margin: 0 0 8px 0;">${event.titulo}</h3>
						<p style="margin: 4px 0; color: #666;"><strong>📅</strong> ${event.hora}</p>
						<p style="margin: 4px 0; color: #666;"><strong>📍</strong> ${event.local || "Sem local"}</p>
						<p style="margin: 4px 0; color: #666; font-size: 12px;">${event.descricao}</p>
					</div>
				` });
			marker.addListener("click", () => { infoWindow.open(mapInstanceRef.current, marker); setSelectedEvent(event); });
			markersRef.current.push(marker);
			bounds.extend(marker.getPosition());
		});
		if ([...userEventsData, ...publicEventsData].length > 0) { mapInstanceRef.current.fitBounds(bounds); }
	};

	const openCreateReminderModal = (publicEvent) => {
		setModalEvent(publicEvent);
		setFormData({ titulo: publicEvent.titulo, data: publicEvent.data, hora: publicEvent.hora, local: publicEvent.local, descricao: publicEvent.descricao, categoria: publicEvent.categoria });
		setShowModal(true);
	};

	const createReminder = async () => {
		try {
			if (!auth.currentUser) { alert("Por favor, faça login para criar lembretes"); navigate("/login"); return; }
			let lat = modalEvent.latitude; let lng = modalEvent.longitude;
			if (!formData.titulo?.trim()) { alert("Preencha o título do lembrete"); return; }
			if (!formData.data?.trim()) { alert("Preencha a data do lembrete"); return; }
			if (!formData.hora?.trim()) { alert("Preencha a hora do lembrete"); return; }
			if (typeof lat !== "number" || typeof lng !== "number") { console.warn("Latitude/Longitude inválidas", modalEvent); alert("Este evento público não possui coordenadas válidas."); return; }
			const dateTime = new Date(`${formData.data}T${formData.hora}:00`); if (isNaN(dateTime.getTime())) { alert("Data ou hora inválida"); return; }
			const newEvent = { ownerId: auth.currentUser.uid, titulo: formData.titulo, data: Timestamp.fromDate(dateTime), hora: formData.hora, local: formData.local, latitude: lat, longitude: lng, descricao: formData.descricao, categoria: formData.categoria, createdAt: serverTimestamp(), visibilidade: false, reminders: [], source: `reminder_from_${modalEvent.source || "mock"}` };
			await addDoc(collection(db, "events"), newEvent);
			alert("✅ Lembrete criado com sucesso!"); setShowModal(false); setModalEvent(null); loadEvents();
		} catch (error) { console.error("Erro ao criar lembrete:", error?.code, error?.message, error); alert(error?.message || "Erro ao criar lembrete"); }
	};

	return (
		<div style={{ display: "flex", height: "calc(100vh - 60px)", position: "relative" }}>
			<div ref={mapRef} style={{ flex: 1, width: "100%", height: "100%", borderRadius: "8px" }} />
			<div style={{ width: "320px", background: "#f5f5f5", borderLeft: "1px solid #ddd", overflow: "auto", padding: "16px", boxSizing: "border-box" }}>
				<h2 style={{ margin: "0 0 16px 0", fontSize: "18px" }}>📍 Mapa de Eventos</h2>
				<div style={{ marginBottom: "16px", position: "relative" }}>
					<label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "6px", color: "#333" }}>🏙️ Selecione uma Cidade:</label>
					<div style={{ position: "relative" }}>
						<input type="text" placeholder="Pesquise uma cidade..." value={searchCity} onChange={(e) => handleCitySearch(e.target.value)} onFocus={() => setShowCityDropdown(true)} style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "13px", boxSizing: "border-box" }} />
						{showCityDropdown && filteredCities.length > 0 && (
							<div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #ddd", borderTop: "none", borderRadius: "0 0 4px 4px", zIndex: 1000, maxHeight: "200px", overflow: "auto", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
								{filteredCities.map((city) => (
									<div key={city.name} onClick={() => handleSelectCity(city)} style={{ padding: "8px 10px", cursor: "pointer", backgroundColor: selectedCity === city.name ? "#e3f2fd" : "white", color: selectedCity === city.name ? "#1976d2" : "#333", borderBottom: "1px solid #f0f0f0", fontSize: "13px", fontWeight: selectedCity === city.name ? "bold" : "normal" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f0f0f0"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = selectedCity === city.name ? "#e3f2fd" : "white"; }}>{city.name}</div>
								))}
							</div>
						)}
					</div>
					{selectedCity && (
						<div style={{ marginTop: "6px", fontSize: "12px", color: "#1976d2", fontWeight: "bold" }}>✓ Exibindo eventos de <strong>{selectedCity}</strong><span style={{ marginLeft: 8, color: "#555", fontWeight: 500 }}>Fonte: Dados de teste</span></div>
					)}
				</div>
				{isLoading ? (<p style={{ color: "#999" }}>Carregando eventos...</p>) : (
					<div>
						{userEvents.length > 0 && (
							<div style={{ marginBottom: "20px" }}>
								<h3 style={{ fontSize: "14px", color: "#c33", margin: "0 0 10px 0" }}>🔴 Seus Eventos ({userEvents.length})</h3>
								{userEvents.map((event) => (
									<div key={event.id} onClick={() => setSelectedEvent(event)} style={{ padding: "10px", marginBottom: "8px", background: "white", border: "1px solid #ddd", borderLeft: "3px solid #c33", borderRadius: "4px", cursor: "pointer" }}>
										<div style={{ fontWeight: 500, fontSize: "13px" }}>{event.titulo}</div>
										<div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>📍 {event.local}</div>
									</div>
								))}
							</div>
						)}
						<div>
							<h3 style={{ fontSize: "14px", color: "#1976d2", margin: "0 0 10px 0" }}>💡 Descobertas Próximas ({visiblePublicEvents.length})</h3>
							<p style={{ fontSize: "11px", color: "#666", marginBottom: "10px" }}>Clique em "Criar Lembrete" para adicionar aos seus eventos</p>
							{visiblePublicEvents.map((event) => (
								<div key={event.id} onClick={() => setSelectedEvent(event)} style={{ padding: "10px", marginBottom: "8px", background: "#e3f2fd", border: "1px solid #90caf9", borderLeft: "3px solid #1976d2", borderRadius: "4px", cursor: "pointer" }}>
									<div style={{ fontWeight: 500, fontSize: "13px", color: "#1976d2" }}>{event.titulo}</div>
									<div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
										<div>📅 {event.data} às {event.hora}</div>
										<div>📍 {event.local}</div>
									</div>
									<button onClick={(e) => { e.stopPropagation(); openCreateReminderModal(event); }} style={{ marginTop: "8px", padding: "6px 10px", fontSize: "11px", background: "#1976d2", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", width: "100%", fontWeight: "bold" }}>➕ Criar Lembrete</button>
								</div>
							))}
						</div>
						<div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #ddd" }}>
							<button onClick={() => navigate("/events")} style={{ width: "100%", padding: "8px", background: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>→ Meus Eventos</button>
						</div>
					</div>
				)}
			</div>
			{showModal && modalEvent && (
				<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
					<div style={{ background: "white", borderRadius: "8px", padding: "24px", maxWidth: "500px", width: "90%", maxHeight: "90vh", overflow: "auto" }}>
						<h2 style={{ margin: "0 0 16px 0" }}>📍 Criar Lembrete</h2>
						<p style={{ color: "#666", fontSize: "14px", marginBottom: "16px" }}>Está a criar um lembrete baseado neste evento público</p>
						<div style={{ marginBottom: "16px" }}>
							<label style={{ display: "block", fontWeight: "bold", marginBottom: "8px" }}>Título</label>
							<input type="text" value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }} />
						</div>
						<div style={{ marginBottom: "16px" }}>
							<label style={{ display: "block", fontWeight: "bold", marginBottom: "8px" }}>Data</label>
							<input type="date" value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value })} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }} />
						</div>
						<div style={{ marginBottom: "16px" }}>
							<label style={{ display: "block", fontWeight: "bold", marginBottom: "8px" }}>Hora</label>
							<input type="time" value={formData.hora} onChange={(e) => setFormData({ ...formData, hora: e.target.value })} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }} />
						</div>
						<div style={{ marginBottom: "16px" }}>
							<label style={{ display: "block", fontWeight: "bold", marginBottom: "8px" }}>Local</label>
							<input type="text" value={formData.local} onChange={(e) => setFormData({ ...formData, local: e.target.value })} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }} />
						</div>
						<div style={{ marginBottom: "16px" }}>
							<label style={{ display: "block", fontWeight: "bold", marginBottom: "8px" }}>Descrição</label>
							<textarea value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box", minHeight: "80px" }} />
						</div>
						<div style={{ display: "flex", gap: "12px" }}>
							<button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "10px", background: "#ccc", color: "#333", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Cancelar</button>
							<button onClick={createReminder} style={{ flex: 1, padding: "10px", background: "#1976d2", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>✅ Criar Lembrete</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
