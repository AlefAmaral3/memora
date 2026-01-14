// Lista de locais comuns em Portugal para autocomplete
export const LOCAIS_COMUNS = [
  // Cidades principais
  "Lisboa",
  "Porto",
  "Coimbra",
  "Braga",
  "Faro",
  "Aveiro",
  "Évora",
  "Setúbal",
  "Guimarães",
  "Viseu",
  
  // Tipos de locais
  "Escritório Central",
  "Sala de Reuniões",
  "Auditório Principal",
  "Centro de Conferências",
  "Biblioteca",
  "Café Central",
  "Restaurante",
  "Parque",
  "Casa",
  "Online / Remoto",
  "Por definir",
];

export function filterLocations(query) {
  if (!query || query.trim().length < 2) return [];
  
  const q = query.toLowerCase().trim();
  return LOCAIS_COMUNS.filter((loc) => 
    loc.toLowerCase().includes(q)
  ).slice(0, 5);
}
