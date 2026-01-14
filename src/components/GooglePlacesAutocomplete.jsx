import { useEffect, useRef, useState } from "react";

const GOOGLE_MAPS_API_KEY = "AIzaSyCAXUu_954tLnurNrz7P5JAh2l4dBkIbW8";

export function useGooglePlacesAutocomplete(inputValue, onSelectPlace) {
  const [suggestions, setSuggestions] = useState([]);
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);

  useEffect(() => {
    // Carregar script do Google Maps se ainda não estiver
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        placesServiceRef.current = new window.google.maps.places.PlacesService(
          document.createElement("div")
        );
      };
      document.head.appendChild(script);
    } else {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      placesServiceRef.current = new window.google.maps.places.PlacesService(
        document.createElement("div")
      );
    }
  }, []);

  useEffect(() => {
    if (!inputValue || inputValue.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    if (!autocompleteServiceRef.current) return;

    // Buscar sugestões com foco em Portugal
    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: inputValue,
        componentRestrictions: { country: "pt" }, // Restringir a Portugal
        types: ["establishment", "geocode"], // Locais e endereços
      },
      (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(
            predictions.slice(0, 5).map((p) => ({
              placeId: p.place_id,
              description: p.description,
              mainText: p.main_text,
              secondaryText: p.secondary_text,
            }))
          );
        } else {
          setSuggestions([]);
        }
      }
    );
  }, [inputValue]);

  const selectPlace = (placeId, description) => {
    setSuggestions([]);

    // Trazer detalhes para obter lat/lng
    if (placesServiceRef.current) {
      placesServiceRef.current.getDetails(
        { placeId, fields: ["geometry", "formatted_address", "name"] },
        (result, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && result?.geometry?.location) {
            const lat = result.geometry.location.lat();
            const lng = result.geometry.location.lng();
            onSelectPlace({
              placeId,
              description: result.formatted_address || description,
              name: result.name,
              lat,
              lng,
            });
          } else {
            onSelectPlace({ placeId, description, lat: null, lng: null });
          }
        }
      );
    } else {
      onSelectPlace({ placeId, description, lat: null, lng: null });
    }
  };

  return { suggestions, selectPlace };
}

export function GooglePlacesAutocomplete({ value, onChange, onSelect, placeholder }) {
  const { suggestions, selectPlace } = useGooglePlacesAutocomplete(value, onSelect);

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        className="input"
        value={value}
        onChange={(e) => {
          const text = e.target.value;
          onChange(text);
          // Se for texto livre (não do autocomplete), apenas atualizar o texto
        }}
        onBlur={() => setTimeout(() => {}, 200)}
        placeholder={placeholder || "Ex.: Lisboa, Escritório..."}
        autoComplete="off"
      />
      {suggestions.length > 0 && (
        <div className="autocomplete-dropdown">
          {suggestions.map((suggestion, idx) => (
            <div
              key={idx}
              className="autocomplete-item"
              onClick={() => selectPlace(suggestion.placeId, suggestion.description)}
            >
              <div style={{ fontWeight: 500 }}>{suggestion.mainText}</div>
              {suggestion.secondaryText && (
                <div style={{ fontSize: 12, opacity: 0.7 }}>{suggestion.secondaryText}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
