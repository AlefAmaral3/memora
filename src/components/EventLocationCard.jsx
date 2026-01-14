import { useEffect, useMemo, useRef, useState } from "react";

function hasCoords(loc) {
  return !!loc && typeof loc.lat === "number" && typeof loc.lng === "number";
}

function openGoogleMaps(lat, lng, placeId) {
  const url = placeId
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(placeId)}`
    : `https://www.google.com/maps?q=${lat},${lng}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function EventLocationCard({
  mode = "edit", // "edit" | "view"
  location,
  onChange,
  defaultCenter = { lat: 38.736946, lng: -9.142685 }, // Lisboa
}) {
  const canEdit = mode === "edit";

  const [ready, setReady] = useState(false);
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);
  const autocompleteRef = useRef(null);

  const searchRef = useRef(null);

  const center = useMemo(() => {
    if (hasCoords(location)) return { lat: location.lat, lng: location.lng };
    return defaultCenter;
  }, [location, defaultCenter]);

  // Inicializa o mapa 1x quando Google estiver disponível
  useEffect(() => {
    const t = setInterval(() => {
      if (window.google?.maps && window.google?.maps?.places) {
        clearInterval(t);
        setReady(true);
      }
    }, 120);

    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!mapElRef.current) return;

    // Mapa (criar apenas 1 vez)
    if (!mapRef.current) {
      const map = new window.google.maps.Map(mapElRef.current, {
        center,
        zoom: hasCoords(location) ? 15 : 13,
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
      });

      const marker = new window.google.maps.Marker({
        map,
      });

      mapRef.current = map;
      markerRef.current = marker;
      geocoderRef.current = new window.google.maps.Geocoder();

      // Clique no mapa -> define coords
      map.addListener("click", (e) => {
        if (!canEdit) return;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        marker.setPosition({ lat, lng });
        map.panTo({ lat, lng });
        map.setZoom(15);

        // reverse geocode (opcional) para sugerir address
        geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
          const address =
            status === "OK" && results?.[0]?.formatted_address ? results[0].formatted_address : "";

          onChange?.({
            name: location?.name || "", // nome fica como o utilizador quiser
            address,
            lat,
            lng,
            placeId: location?.placeId || "",
          });
        });
      });

      // Autocomplete (Places) no input de pesquisa
      if (searchRef.current) {
        const ac = new window.google.maps.places.Autocomplete(searchRef.current, {
          fields: ["place_id", "formatted_address", "geometry", "name"],
        });
        autocompleteRef.current = ac;

        ac.addListener("place_changed", () => {
          if (!canEdit) return;
          const place = ac.getPlace();
          if (!place?.geometry?.location) return;

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address || "";
          const placeId = place.place_id || "";

          marker.setPosition({ lat, lng });
          map.panTo({ lat, lng });
          map.setZoom(15);

          onChange?.({
            name: location?.name || place.name || "",
            address,
            lat,
            lng,
            placeId,
          });
        });
      }
    }

    // Atualiza marker/centro quando o location muda
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    if (hasCoords(location)) {
      marker.setPosition({ lat: location.lat, lng: location.lng });
      map.panTo({ lat: location.lat, lng: location.lng });
      map.setZoom(15);
    } else {
      marker.setPosition(null);
      map.panTo(center);
      map.setZoom(13);
    }
  }, [ready, canEdit, location, center, onChange]);

  const coordsText = hasCoords(location)
    ? `Lat ${location.lat.toFixed(6)} · Lng ${location.lng.toFixed(6)}`
    : "Sem localização no mapa.";

  return (
    <div className="card card-pad">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h3 className="card-title">Local do evento (Mapa)</h3>

        {hasCoords(location) && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => openGoogleMaps(location.lat, location.lng, location.placeId)}
          >
            Abrir no Google Maps
          </button>
        )}
      </div>

      <div className="hr" />

      {!ready ? (
        <p className="sub" style={{ margin: 0 }}>
          A carregar Google Maps…
        </p>
      ) : (
        <>
          {canEdit && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field" style={{ margin: 0 }}>
                <label className="label">Nome do local</label>
                <input
                  className="input"
                  value={location?.name || ""}
                  onChange={(e) => onChange?.({ ...(location || {}), name: e.target.value })}
                  placeholder="Ex.: Auditório Central"
                />
                <span className="help">Este nome será mostrado aos participantes.</span>
              </div>

              <div className="field" style={{ margin: 0 }}>
                <label className="label">Pesquisar no Google</label>
                <input
                  ref={searchRef}
                  className="input"
                  placeholder="Pesquisar endereço / local…"
                  defaultValue={location?.address || ""}
                />
                <span className="help">Seleciona um resultado para posicionar o marcador.</span>
              </div>
            </div>
          )}

          {!canEdit && (
            <div className="kv" style={{ marginBottom: 12 }}>
              <div className="kv-row">
                <span>Nome</span>
                <b>{location?.name || "—"}</b>
              </div>
              <div className="kv-row">
                <span>Endereço</span>
                <b style={{ textAlign: "right", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {location?.address || "—"}
                </b>
              </div>
            </div>
          )}

          <div
            ref={mapElRef}
            style={{
              height: 260,
              borderRadius: 16,
              border: "1px solid rgba(17,24,39,.10)",
              background: "rgba(17,24,39,.03)",
              overflow: "hidden",
            }}
            aria-label="Mapa do local do evento"
          />

          <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span className="help" style={{ margin: 0 }}>
              {canEdit ? "Dica: clica no mapa para posicionar o marcador." : ""}
            </span>
            <span className="help" style={{ margin: 0 }}>
              {coordsText}
            </span>
          </div>

          {canEdit && hasCoords(location) && (
            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => onChange?.(null)}
                title="Remove a localização do mapa"
              >
                Remover localização
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
