export async function getParticipants(eventId) {
  console.log(`[getParticipants] (API) Buscando participantes para evento ${eventId}`);
  
  try {
    const response = await fetch(
      `https://api-5yqejumh5a-uc.a.run.app/api/participants/${eventId}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[getParticipants] ✓ ${data.participants.length} participantes carregados`);
    
    return data.participants;
  } catch (err) {
    console.error(`[getParticipants] Erro:`, err.message);
    return [];
  }
}