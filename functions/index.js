const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const sgMail = require("@sendgrid/mail");

// --- Inicializar Admin SDK (Firestore) ---
admin.initializeApp();
const db = admin.firestore();

// =====================
// 1) SENDGRID (mantido)
// =====================
const SENDGRID_API_KEY = defineSecret("SENDGRID_API_KEY");

exports.testEmail = onRequest(
  { secrets: [SENDGRID_API_KEY] },
  async (req, res) => {
    try {
      sgMail.setApiKey(SENDGRID_API_KEY.value().trim());

      await sgMail.send({
        to: "memora.projeto@gmail.com",
        from: "memora.projeto@gmail.com",
        subject: "Teste SendGrid (Firebase Functions)",
        text: "Email enviado com sucesso.",
      });

      res.status(200).send("Email enviado com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      res.status(500).send("Erro ao enviar email.");
    }
  }
);

// ======================================
// 2) WEB SERVICES (API) - sem autenticação
// ======================================
const apiApp = express();
apiApp.use(cors({ origin: true }));

function normalizeEvent(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    data: data.data?.toDate ? data.data.toDate().toISOString() : null,
  };
}

// YYYY-MM-DD (UTC) a partir de ISO string
function isoToYMD(iso) {
  if (!iso) return null;
  return new Date(iso).toISOString().slice(0, 10);
}

// Parse "YYYY-MM" -> { start: Date, end: Date }
function monthRange(monthStr) {
  const [y, m] = monthStr.split("-").map((v) => Number(v));
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0)); // 1º dia do mês seguinte
  return { start, end };
}

apiApp.get("/", (req, res) => {
  res.json({
    service: "memora-api",
    note: "Web Services públicos (sem autenticação). Apenas eventos com visibilidade=true.",
    endpoints: [
      "/health",
      "/events/public?from=YYYY-MM-DD&to=YYYY-MM-DD&q=texto",
      "/events/public/:id",
      "/events/public/by-date/YYYY-MM-DD",
      "/calendar/public?month=YYYY-MM",
      "/stats/events",
    ],
  });
});

apiApp.get("/health", (req, res) => {
  res.json({ status: "ok", service: "memora-api" });
});

/**
 * GET /api/events/public
 * (sem índice composto) se usar datas: query por data e filtra visibilidade em memória.
 */
apiApp.get("/events/public", async (req, res) => {
  try {
    const { q, from, to } = req.query;

    let ref = db.collection("events");

    if (from) ref = ref.where("data", ">=", new Date(`${from}T00:00:00`));
    if (to) ref = ref.where("data", "<=", new Date(`${to}T23:59:59`));

    const snap = await ref.limit(200).get();

    let events = snap.docs.map(normalizeEvent);

    // só públicos
    events = events.filter((e) => e.visibilidade === true);

    // pesquisa em memória
    if (q) {
      const qq = String(q).toLowerCase();
      events = events.filter((e) => {
        const titulo = String(e.titulo || "").toLowerCase();
        const local = String(e.local || "").toLowerCase();
        return titulo.includes(qq) || local.includes(qq);
      });
    }

    res.json({ count: events.length, events });
  } catch (err) {
    res.status(500).json({
      error: "Erro ao listar eventos públicos",
      details: String(err),
    });
  }
});

apiApp.get("/events/public/:id", async (req, res) => {
  try {
    const doc = await db.collection("events").doc(req.params.id).get();

    if (!doc.exists) return res.status(404).json({ error: "Evento não encontrado" });

    const data = doc.data();
    if (!data.visibilidade) {
      return res.status(403).json({ error: "Evento privado (não exposto pela API)" });
    }

    res.json(normalizeEvent(doc));
  } catch (err) {
    res.status(500).json({
      error: "Erro ao obter evento",
      details: String(err),
    });
  }
});

/**
 * GET /api/events/public/by-date/:date
 * (sem índice composto) query só por data e filtra visibilidade em memória.
 */
apiApp.get("/events/public/by-date/:date", async (req, res) => {
  try {
    const dateStr = req.params.date; // YYYY-MM-DD
    const start = new Date(`${dateStr}T00:00:00`);
    const end = new Date(`${dateStr}T23:59:59`);

    const snap = await db
      .collection("events")
      .where("data", ">=", start)
      .where("data", "<=", end)
      .get();

    let events = snap.docs.map(normalizeEvent);
    events = events.filter((e) => e.visibilidade === true);

    res.json({ date: dateStr, count: events.length, events });
  } catch (err) {
    res.status(500).json({
      error: "Erro ao filtrar eventos por data",
      details: String(err),
    });
  }
});

/**
 * GET /api/calendar/public?month=YYYY-MM
 * Calendário público por mês (agrupado por dia).
 * Não depende do teu frontend. Só depende de "events.data" ser Timestamp.
 */
apiApp.get("/calendar/public", async (req, res) => {
  try {
    const month = String(req.query.month || "").trim();

    // valida "YYYY-MM"
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        error: "Parâmetro inválido. Use ?month=YYYY-MM (ex.: 2026-01)",
      });
    }

    const { start, end } = monthRange(month);

    // Query só por data (evita índice composto). Depois filtra visibilidade em memória.
    const snap = await db
      .collection("events")
      .where("data", ">=", start)
      .where("data", "<", end)
      .get();

    let events = snap.docs.map(normalizeEvent);
    events = events.filter((e) => e.visibilidade === true);

    // Agrupar por dia (YYYY-MM-DD)
    const daysMap = new Map();

    for (const e of events) {
      const ymd = isoToYMD(e.data);
      if (!ymd) continue;

      if (!daysMap.has(ymd)) daysMap.set(ymd, []);

      daysMap.get(ymd).push({
        id: e.id,
        titulo: e.titulo || "(Sem título)",
        hora: e.hora || null,
        local: e.local || null,
        categoria: e.categoria || null,
      });
    }

    const days = Array.from(daysMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, list]) => ({
        date,
        count: list.length,
        events: list,
      }));

    res.json({
      month,
      totalPublicosNoMes: events.length,
      days,
    });
  } catch (err) {
    res.status(500).json({
      error: "Erro ao gerar calendário público",
      details: String(err),
    });
  }
});

/**
 * GET /api/stats/events
 * Estatísticas com totalEventos/totalPublicos/totalPrivados
 */
apiApp.get("/stats/events", async (req, res) => {
  try {
    const snap = await db.collection("events").limit(500).get();

    const now = new Date();
    const in7 = new Date(now);
    in7.setDate(in7.getDate() + 7);

    let totalEventos = 0;
    let totalPublicos = 0;
    let totalPrivados = 0;

    let proximos7diasPublicos = 0;
    const porCategoriaPublicos = {};

    snap.forEach((doc) => {
      totalEventos++;

      const e = doc.data();
      const isPublico = e.visibilidade === true;

      if (isPublico) totalPublicos++;
      else totalPrivados++;

      if (isPublico) {
        const dt = e.data?.toDate ? e.data.toDate() : null;
        if (dt && dt >= now && dt <= in7) proximos7diasPublicos++;

        const cat = e.categoria || "Sem categoria";
        porCategoriaPublicos[cat] = (porCategoriaPublicos[cat] || 0) + 1;
      }
    });

    res.json({
      totalEventos,
      totalPublicos,
      totalPrivados,
      proximos7diasPublicos,
      porCategoriaPublicos,
    });
  } catch (err) {
    res.status(500).json({
      error: "Erro ao calcular estatísticas",
      details: String(err),
    });
  }
});

/**
 * GET /api/debug/users
 * Endpoint de debug para listar todos os utilizadores
 */
apiApp.get("/debug/users", async (req, res) => {
  try {
    const snap = await db.collection("users").limit(100).get();
    const users = snap.docs.map((doc) => ({
      uid: doc.id,
      email: doc.data().email,
      displayName: doc.data().displayName,
    }));
    res.json({ total: users.length, users });
  } catch (err) {
    res.status(500).json({
      error: "Erro ao listar utilizadores",
      details: String(err),
    });
  }
});

/**
 * GET /api/trigger-reminders
 * Endpoint para triggar lembretes manualmente (para teste ou catch-up)
 * NOTA: Isto apenas lista quais lembretes seriam enviados - o envio real usa sendReminders scheduler
 */
apiApp.get("/trigger-reminders", async (req, res) => {
  try {
    console.log("🔔 Endpoint /trigger-reminders chamado manualmente");

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    console.log(`🕐 Agora: ${now.toISOString()}`);
    console.log(`📅 Procurando eventos entre ${now.toISOString()} e ${in24h.toISOString()}`);

    // Buscar eventos nas próximas 24 horas
    const eventsSnap = await db
      .collection("events")
      .where("startAt", ">=", now)
      .where("startAt", "<=", in24h)
      .get();

    console.log(`📅 Encontrados ${eventsSnap.size} eventos nas próximas 24h`);

    let remindersToSend = [];

    for (const eventDoc of eventsSnap.docs) {
      const eventData = eventDoc.data();
      const eventId = eventDoc.id;
      const startAt = eventData.startAt?.toDate ? eventData.startAt.toDate() : null;
      
      if (!startAt) {
        console.log(`⚠️ Evento ${eventId} sem startAt válido`);
        continue;
      }

      // Verificar se tem lembretes configurados
      const reminders = eventData.reminders || [];
      if (reminders.length === 0) continue;

      // Calcular quando enviar lembretes
      for (const reminder of reminders) {
        let minutesBefore = 0;
        
        if (reminder === "10 min") minutesBefore = 10;
        else if (reminder === "1 hora") minutesBefore = 60;
        else if (reminder === "1 dia") minutesBefore = 24 * 60;
        
        const reminderTime = new Date(startAt.getTime() - minutesBefore * 60 * 1000);
        const diff = Math.abs(now.getTime() - reminderTime.getTime());
        
        console.log(`⏰ Evento: "${eventData.titulo}", Lembrete: ${reminder}, Próximo lembrete em: ${Math.round(diff / 60000)} min`);
        
        // Se estiver dentro da janela de 1h (tolerância para execução)
        if (diff < 60 * 60 * 1000) {
          remindersToSend.push({
            eventId,
            titulo: eventData.titulo,
            hora: eventData.hora,
            local: eventData.local,
            reminder,
            startAt: startAt.toISOString(),
          });
        }
      }
    }

    res.json({
      success: true,
      message: `${remindersToSend.length} lembretes encontrados para enviar`,
      reminders: remindersToSend,
      nextExecution: "Vê Cloud Functions logs para emails que foram enviados",
    });
  } catch (error) {
    console.error("❌ Erro ao verificar lembretes:", error);
    res.status(500).json({ error: "Erro ao verificar lembretes", details: error.message });
  }
});

/**
 * GET /api/debug/event/:eventId
 * Endpoint de debug para inspecionar um evento e seus participantes
 */
apiApp.get("/debug/event/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const eventDoc = await db.collection("events").doc(eventId).get();
    
    if (!eventDoc.exists()) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    const eventData = eventDoc.data();
    
    // Buscar participantes
    const participantsSnap = await db
      .collection("events")
      .doc(eventId)
      .collection("participants")
      .get();

    const participants = participantsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        role: data.role,
        status: data.status,
        invitedAt: data.invitedAt,
      };
    });

    // Buscar dados dos participantes (nome, email)
    const participantsWithData = await Promise.all(
      participants.map(async (p) => {
        const userDoc = await db.collection("users").doc(p.uid).get();
        const userData = userDoc.data();
        return {
          ...p,
          displayName: userData?.displayName,
          email: userData?.email,
        };
      })
    );

    res.json({
      eventId,
      titulo: eventData.titulo,
      hora: eventData.hora,
      reminders: eventData.reminders || [],
      ownerId: eventData.ownerId,
      participantes: participantsWithData,
    });
  } catch (err) {
    res.status(500).json({
      error: "Erro ao obter evento",
      details: String(err),
    });
  }
});

/**
 * GET /api/invites/my
 * Lista convites pendentes (status="pending") para um utilizador
 * Usa Admin SDK (não depende das regras do Firestore no cliente).
 * Parâmetros:
 *   - query.uid ou header "x-user-id" com o UID do utilizador
 */
apiApp.get("/invites/my", async (req, res) => {
  try {
    const uid = req.query.uid || req.headers["x-user-id"];

    if (!uid) {
      return res.status(400).json({ error: "Parâmetro uid em falta" });
    }

    console.log(`🔍 [/api/invites/my] A procurar convites para uid=${uid}`);

    const eventsSnap = await db.collection("events").get();
    console.log(`🔍 [/api/invites/my] ${eventsSnap.size} eventos encontrados`);

    const invites = [];
    let checked = 0;
    let found = 0;

    for (const eventDoc of eventsSnap.docs) {
      const eventId = eventDoc.id;
      const eventData = eventDoc.data();

      try {
        const participantDoc = await db
          .collection("events")
          .doc(eventId)
          .collection("participants")
          .doc(uid)
          .get();

        checked++;

        if (participantDoc.exists) {
          const participantData = participantDoc.data();
          const status = participantData.status || "";

          console.log(
            `  ✓ [/api/invites/my] Participante no evento ${eventId} (${eventData.titulo || "(sem título)"}), status=${status}`
          );

          if (status === "pending") {
            found++;
            invites.push({
              eventId,
              eventTitle: eventData.titulo || "Evento sem título",
              eventDate: eventData.hora || "",
              eventDesc: eventData.descricao || "",
              organizerName: eventData.nomeProprietario || "Organizador desconhecido",
              ...participantData,
            });
          }
        }
      } catch (err) {
        console.warn(
          `  ⚠️ [/api/invites/my] Erro ao verificar participante no evento ${eventId}:`,
          err.message
        );
      }
    }

    console.log(
      `✓ [/api/invites/my] ${checked} eventos verificados, ${found} convites pendentes encontrados`
    );

    res.json({
      uid,
      totalEventsChecked: checked,
      invitesFound: found,
      invites,
    });
  } catch (err) {
    console.error("❌ [/api/invites/my] Erro:", err);
    res.status(500).json({
      error: "Erro ao obter convites",
      details: String(err),
    });
  }
});

/**
 * POST /api/invites/respond
 * Responde a um convite (aceitar ou rejeitar)
 * Body: { uid, eventId, status: "accepted" | "rejected" }
 */
apiApp.post("/invites/respond", async (req, res) => {
  try {
    const { uid, eventId, status } = req.body;

    if (!uid || !eventId || !status) {
      return res.status(400).json({ error: "Parâmetros em falta (uid, eventId, status)" });
    }

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Status inválido" });
    }

    console.log(`📝 [/api/invites/respond] uid=${uid}, eventId=${eventId}, status=${status}`);

    const participantRef = db
      .collection("events")
      .doc(eventId)
      .collection("participants")
      .doc(uid);

    await participantRef.update({
      status,
      respondedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✓ [/api/invites/respond] Convite respondido com sucesso`);

    res.json({
      success: true,
      message: `Convite ${status === "accepted" ? "aceito" : "rejeitado"} com sucesso!`,
    });
  } catch (err) {
    console.error("❌ [/api/invites/respond] Erro:", err);
    res.status(500).json({
      error: "Erro ao responder convite",
      details: String(err),
    });
  }
});

/**
 * GET /api/events/my
 * Lista eventos do utilizador: próprios (ownerId) + aceitos como participante
 * Query param: uid
 */
apiApp.get("/events/my", async (req, res) => {
  try {
    const uid = req.query.uid || req.headers["x-user-id"];

    if (!uid) {
      return res.status(400).json({ error: "Parâmetro uid em falta" });
    }

    console.log(`📋 [/api/events/my] A procurar eventos para uid=${uid}`);

    // 1. Eventos onde é proprietário
    const ownEventsSnap = await db.collection("events").where("ownerId", "==", uid).get();
    const ownEvents = ownEventsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      isOwner: true,
    }));

    console.log(`  ✓ ${ownEvents.length} eventos como proprietário`);

    // 2. Eventos onde é participante aceito
    const allEventsSnap = await db.collection("events").get();
    const participantEvents = [];

    for (const eventDoc of allEventsSnap.docs) {
      const eventId = eventDoc.id;
      
      // Não incluir eventos onde já é proprietário
      if (ownEvents.some((e) => e.id === eventId)) continue;

      const participantDoc = await db
        .collection("events")
        .doc(eventId)
        .collection("participants")
        .doc(uid)
        .get();

      if (participantDoc.exists) {
        const participantData = participantDoc.data();
        if (participantData.status === "accepted") {
          participantEvents.push({
            id: eventDoc.id,
            ...eventDoc.data(),
            isOwner: false,
            participantRole: participantData.role,
          });
        }
      }
    }

    console.log(`  ✓ ${participantEvents.length} eventos como participante aceito`);

    const allEvents = [...ownEvents, ...participantEvents];

    res.json({
      uid,
      totalEvents: allEvents.length,
      ownEvents: ownEvents.length,
      participantEvents: participantEvents.length,
      events: allEvents,
    });
  } catch (err) {
    console.error("[/api/events/my] Erro:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/participants/:eventId
apiApp.get("/api/participants/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log(`[/api/participants/${eventId}] Buscando participantes...`);

    const snap = await db
      .collection("events")
      .doc(eventId)
      .collection("participants")
      .get();

    const participants = await Promise.all(
      snap.docs.map(async (doc) => {
        const uid = doc.id;
        const participantData = doc.data();

        // Tentar usar displayName salvo no participant, se não existir buscar do user
        let displayName = participantData.displayName || "Guest";
        
        if (displayName === "Guest") {
          try {
            const userSnap = await db.collection("users").doc(uid).get();
            if (userSnap.exists()) {
              displayName = userSnap.data().displayName || "Guest";
            }
          } catch (e) {
            console.log(`[/api/participants] Sem usuário para ${uid}`);
          }
        }

        return {
          uid,
          displayName,
          ...participantData,
        };
      })
    );

    console.log(`[/api/participants/${eventId}] ✓ ${participants.length} participantes encontrados`);
    res.json({ eventId, participants });
  } catch (err) {
    console.error("[/api/participants] Erro:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/debug/events-with-participants
 * Listar todos os eventos com seus participantes (para debug)
 */
apiApp.get("/debug/events-with-participants", async (req, res) => {
  try {
    const eventsSnap = await db.collection("events").limit(10).get();
    
    const eventsData = [];
    for (const eventDoc of eventsSnap.docs) {
      const eventData = eventDoc.data();
      
      const participantsSnap = await db
        .collection("events")
        .doc(eventDoc.id)
        .collection("participants")
        .get();

      const participants = [];
      for (const pDoc of participantsSnap.docs) {
        const pData = pDoc.data();
        const userDoc = await db.collection("users").doc(pDoc.id).get();
        const userData = userDoc.data();
        
        participants.push({
          uid: pDoc.id,
          displayName: userData?.displayName,
          email: userData?.email,
          role: pData.role,
          status: pData.status,
        });
      }

      eventsData.push({
        eventId: eventDoc.id,
        titulo: eventData.titulo,
        hora: eventData.hora,
        reminders: eventData.reminders || [],
        participantes: participants,
      });
    }

    res.json({ total: eventsData.length, events: eventsData });
  } catch (err) {
    res.status(500).json({
      error: "Erro ao listar eventos",
      details: String(err),
    });
  }
});

// Export v2: /api/*
exports.api = onRequest(apiApp);

// ======================================
// 3) LEMBRETES AUTOMÁTICOS (Scheduler)
// ======================================

/**
 * Executado de hora em hora para enviar lembretes
 * Procura eventos nas próximas 24h e envia emails/push
 */
exports.sendReminders = onSchedule(
  {
    schedule: "every 5 minutes",
    secrets: [SENDGRID_API_KEY],
    timeZone: "Europe/Lisbon",
  },
  async (event) => {
    try {
      sgMail.setApiKey(SENDGRID_API_KEY.value().trim());

      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      console.log(`🕐 Agora: ${now.toISOString()}`);
      console.log(`📅 Procurando eventos entre ${now.toISOString()} e ${in24h.toISOString()}`);

      // Buscar eventos nas próximas 24 horas
      const eventsSnap = await db
        .collection("events")
        .where("startAt", ">=", now)
        .where("startAt", "<=", in24h)
        .get();

      console.log(`📅 Encontrados ${eventsSnap.size} eventos nas próximas 24h`);

      for (const eventDoc of eventsSnap.docs) {
        const eventData = eventDoc.data();
        const eventId = eventDoc.id;
        const startAt = eventData.startAt?.toDate ? eventData.startAt.toDate() : null;
        
        if (!startAt) {
          console.log(`⚠️ Evento ${eventId} sem startAt válido`);
          continue;
        }

        // Verificar se tem lembretes configurados
        const reminders = eventData.reminders || [];
        if (reminders.length === 0) continue;

        // Calcular quando enviar lembretes
        for (const reminder of reminders) {
          let minutesBefore = 0;
          
          if (reminder === "10 min") minutesBefore = 10;
          else if (reminder === "1 hora") minutesBefore = 60;
          else if (reminder === "1 dia") minutesBefore = 24 * 60;
          
          const reminderTime = new Date(startAt.getTime() - minutesBefore * 60 * 1000);
          const diff = Math.abs(now.getTime() - reminderTime.getTime());
          
          console.log(`⏰ Evento: "${eventData.titulo}", Lembrete: ${reminder}, Próximo lembrete em: ${Math.round(diff / 60000)} min`);
          
          // Se estiver dentro da janela de 1h (tolerância para execução)
          if (diff < 60 * 60 * 1000) {
            console.log(`✓ ENVIANDO lembrete para "${eventData.titulo}" (${reminder})...`);
            
            // Buscar TODOS os participantes e filtrar por status
            const participantsSnap = await db
              .collection("events")
              .doc(eventId)
              .collection("participants")
              .get();

            // Filtrar por status accepted ou pending
            const filteredParticipants = participantsSnap.docs.filter(
              doc => doc.data().status === "accepted" || doc.data().status === "pending"
            );

            console.log(`📋 Total participantes: ${participantsSnap.size}, Com lembrete: ${filteredParticipants.length}`);

            // Enviar para proprietário E TODOS participantes
            const recipients = new Set([eventData.ownerId]);
            filteredParticipants.forEach((p) => {
              console.log(`  → Adicionando participante: ${p.id} (status: ${p.data().status})`);
              recipients.add(p.id);
            });

            console.log(`📬 Total destinatários: ${recipients.size} (${Array.from(recipients).join(", ")})`);

            for (const userId of recipients) {
              // Buscar dados do usuário
              const userDoc = await db.collection("users").doc(userId).get();
              const userData = userDoc.data();
              
              if (!userData?.email) {
                console.warn(`⚠️ Utilizador ${userId} (${userData?.displayName || "unknown"}) sem email`);
                continue;
              }

              console.log(`📧 Enviando lembrete para ${userData.displayName} <${userData.email}>`);

              // Enviar email
              try {
                await sgMail.send({
                  to: userData.email,
                  from: "memora.projeto@gmail.com",
                  subject: `Lembrete: ${eventData.titulo}`,
                  html: `
                    <h2>Lembrete de Evento</h2>
                    <p><strong>${eventData.titulo}</strong></p>
                    <p>📅 ${startAt.toLocaleDateString("pt-PT")} às ${eventData.hora}</p>
                    <p>📍 ${eventData.local || "Sem local definido"}</p>
                    <p>O evento começa em ${reminder}.</p>
                    <br>
                    <p><em>Enviado por Memora</em></p>
                  `,
                });
                console.log(`✓ Email enviado com sucesso para ${userData.email}`);
              } catch (emailError) {
                console.error(`❌ Erro ao enviar email para ${userData.email}:`, emailError.message);
              }

              // Enviar push notification se tiver token FCM
              if (userData.fcmToken) {
                try {
                  await admin.messaging().send({
                    token: userData.fcmToken,
                    notification: {
                      title: `Lembrete: ${eventData.titulo}`,
                      body: `${startAt.toLocaleDateString("pt-PT")} às ${eventData.hora} - ${eventData.local || ""}`,
                    },
                    data: {
                      eventId: eventId,
                      type: "reminder",
                    },
                  });
                  console.log(`Push enviado para ${userId}`);
                } catch (pushError) {
                  console.error(`Erro ao enviar push para ${userId}:`, pushError);
                }
              }
            }
          }
        }
      }

      console.log("Processamento de lembretes concluído");
    } catch (error) {
      console.error("Erro ao processar lembretes:", error);
    }
  }
);

// ======================================
// 4) SAVE FCM TOKEN (endpoint)
// ======================================

/**
 * POST /saveFcmToken
 * Body: { userId, token }
 */
exports.saveFcmToken = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Método não permitido");
  }

  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ error: "userId e token são obrigatórios" });
    }

    await db.collection("users").doc(userId).set(
      {
        fcmToken: token,
        fcmTokenUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.json({ success: true, message: "Token FCM salvo com sucesso" });
  } catch (error) {
    console.error("Erro ao salvar FCM token:", error);
    res.status(500).json({ error: "Erro ao salvar token" });
  }
});

// ======================================
// ======================================
// 5) ENVIAR EMAIL DE CONVITE (para utilizadores não registados)
// ======================================

/**
 * POST /sendInviteEmail
 * Envia email de convite para um utilizador (mesmo que não esteja registado)
 */
exports.sendInviteEmail = onRequest(
  { secrets: [SENDGRID_API_KEY], cors: true },
  async (req, res) => {
    try {
      console.log("✓ sendInviteEmail chamada");
      
      const { email, eventId, eventTitle, eventDate, inviteToken, organizerName } = req.body;

      console.log(`📧 Email: ${email}`);
      console.log(`🎯 Evento: ${eventTitle}`);
      console.log(`⏰ Data: ${eventDate}`);
      console.log(`🎭 Organizador: ${organizerName}`);
      console.log(`🔑 Token: ${inviteToken}`);

      if (!email || !eventId || !inviteToken) {
        console.error("❌ Dados incompletos:", { email, eventId, inviteToken });
        return res.status(400).json({ error: "Dados incompletos", received: req.body });
      }

      sgMail.setApiKey(SENDGRID_API_KEY.value().trim());

      const acceptLink = `https://memora-dbba3.web.app/accept-invite?token=${inviteToken}&email=${encodeURIComponent(email)}&eventId=${eventId}`;

      console.log(`🔗 Link de aceitação: ${acceptLink}`);

      const emailPayload = {
        to: email,
        from: "memora.projeto@gmail.com",
        subject: `${organizerName} convidou-o para o evento "${eventTitle}"`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Convite de Evento</h2>
            <p><strong>${organizerName}</strong> convidou-o para participar no evento:</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">${eventTitle}</h3>
              <p>📅 <strong>${eventDate}</strong></p>
            </div>

            <p>Para aceitar ou rejeitar este convite, clique no botão abaixo:</p>
            
            <a href="${acceptLink}" style="display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0;">
              Ver Convite
            </a>

            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Este link expira em 30 dias.<br>
              Se não solicitou este convite, pode ignorar este email.
            </p>
          </div>
        `,
      };

      console.log(`📬 Enviando email para ${email}...`);
      await sgMail.send(emailPayload);

      console.log(`✓ Email de convite enviado com sucesso para ${email}`);
      res.json({ 
        success: true, 
        message: "Email de convite enviado",
        sentTo: email,
      });
    } catch (error) {
      console.error("❌ Erro ao enviar email de convite:", error.message);
      console.error("Stack:", error.stack);
      res.status(500).json({ 
        error: "Erro ao enviar email", 
        details: error.message,
        errorCode: error.code
      });
    }
  }
);

// ======================================
// 5B) ENVIAR NOTIFICAÇÃO A PARTICIPANTE (para utilizadores registados)
// ======================================

/**
 * POST /sendParticipantNotification
 * Envia email de notificação quando um utilizador registado é convidado
 */
exports.sendParticipantNotification = onRequest(
  { secrets: [SENDGRID_API_KEY], cors: true },
  async (req, res) => {
    try {
      console.log("✓ sendParticipantNotification chamada");
      
      const { email, eventId, eventTitle, eventDate, organizerName } = req.body;

      console.log(`📧 Email: ${email}`);
      console.log(`🎯 Evento: ${eventTitle}`);
      console.log(`⏰ Data: ${eventDate}`);
      console.log(`🎭 Organizador: ${organizerName}`);

      if (!email || !eventId || !eventTitle) {
        console.error("❌ Dados incompletos:", { email, eventId, eventTitle });
        return res.status(400).json({ error: "Dados incompletos" });
      }

      sgMail.setApiKey(SENDGRID_API_KEY.value().trim());

      const viewLink = `https://memora-dbba3.web.app/events/${eventId}`;

      const emailPayload = {
        to: email,
        from: "memora.projeto@gmail.com",
        subject: `${organizerName} adicionou-o ao evento "${eventTitle}"`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Convite de Evento</h2>
            <p><strong>${organizerName}</strong> adicionou-o para participar no evento:</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">${eventTitle}</h3>
              <p>📅 <strong>${eventDate || "Data a confirmar"}</strong></p>
            </div>

            <p>Pode aceitar ou rejeitar este convite ao entrar na sua conta:</p>
            
            <a href="${viewLink}" style="display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0;">
              Ver Evento
            </a>

            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Se não solicitou este convite, pode ignorar este email.
            </p>
          </div>
        `,
      };

      console.log(`📬 Enviando notificação para ${email}...`);
      await sgMail.send(emailPayload);

      console.log(`✓ Notificação enviada com sucesso para ${email}`);
      res.json({ 
        success: true, 
        message: "Notificação enviada",
        sentTo: email,
      });
    } catch (error) {
      console.error("❌ Erro ao enviar notificação:", error.message);
      res.status(500).json({ 
        error: "Erro ao enviar notificação", 
        details: error.message
      });
    }
  }
);

// ======================================
// 6) LEMBRETES DE CONVITE (Scheduler)
// ======================================

/**
 * Executado a cada 5 minutos para enviar lembretes de convite
 * Envia lembrete 1H e 10MIN antes do evento para convidados
 * VERSÃO: 3 (com links corrigidos para respond-invite-quick page)
 */
exports.sendInviteReminders = onSchedule(
  {
    schedule: "every 5 minutes",
    secrets: [SENDGRID_API_KEY],
    timeZone: "Europe/Lisbon",
  },
  async (event) => {
    try {
      sgMail.setApiKey(SENDGRID_API_KEY.value().trim());

      const now = new Date();
      console.log(`🕐 Verificando lembretes de convites às ${now.toISOString()}`);

      // Buscar todos os eventos
      const eventsSnap = await db.collection("events").get();
      let remindersTotal = 0;

      for (const eventDoc of eventsSnap.docs) {
        const eventData = eventDoc.data();
        const eventId = eventDoc.id;
        const startAt = eventData.startAt?.toDate ? eventData.startAt.toDate() : null;
        
        if (!startAt) continue;

        const timeUntilEvent = startAt.getTime() - now.getTime();
        const minutesUntil = Math.round(timeUntilEvent / 60000);

        // Verificar se deve enviar lembrete (1H = 60min, 10min)
        const shouldSendReminder1h = minutesUntil > 55 && minutesUntil <= 65;
        const shouldSendReminder10m = minutesUntil > 5 && minutesUntil <= 15;

        if (!shouldSendReminder1h && !shouldSendReminder10m) {
          continue;
        }

        console.log(`📅 Evento: ${eventData.titulo} (${minutesUntil} min até começar)`);

        // Buscar participantes com status "pending"
        const participantsSnap = await db
          .collection("events")
          .doc(eventId)
          .collection("participants")
          .get();

        const filteredParticipants = participantsSnap.docs.filter(
          doc => doc.data().status === "pending"
        );

        console.log(`👥 ${filteredParticipants.length} participantes pendentes`);

        for (const participantDoc of filteredParticipants.docs) {
          const participantData = participantDoc.data();
          const userId = participantDoc.id;

          try {
            // Buscar email do participante
            const userDoc = await db.collection("users").doc(userId).get();
            const userData = userDoc.data();

            if (!userData?.email) {
              console.log(`  ⚠️ Participante ${userId} sem email`);
              continue;
            }

            const reminderText = shouldSendReminder1h 
              ? "em 1 hora" 
              : "em 10 minutos";

            console.log(`  📧 Enviando lembrete de convite para ${userData.email} (${reminderText})`);

            await sgMail.send({
              to: userData.email,
              from: "memora.projeto@gmail.com",
              subject: `Lembrete: ${eventData.titulo} começa ${reminderText}!`,
              html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9;">
                  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center;">
                      <h2 style="margin: 0; font-size: 24px;">Lembrete de Evento</h2>
                    </div>

                    <!-- Content -->
                    <div style="padding: 30px 20px;">
                      <p style="margin-top: 0; font-size: 16px; color: #333;">
                        O evento <strong>${eventData.titulo}</strong> começa em <strong>${reminderText}</strong>!
                      </p>
                      
                      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                        <h3 style="margin: 0 0 10px 0; color: #333;">${eventData.titulo}</h3>
                        <p style="margin: 5px 0; color: #666;"><strong>🕐 Hora:</strong> ${eventData.hora}</p>
                        <p style="margin: 5px 0; color: #666;"><strong>📍 Local:</strong> ${eventData.local || "Local não especificado"}</p>
                        ${eventData.descricao ? `<p style="margin: 5px 0; color: #666;"><strong>📝 Descrição:</strong> ${eventData.descricao}</p>` : ""}
                      </div>

                      <p style="margin: 20px 0 15px 0; color: #666; font-size: 15px;">Ainda não respondeu ao convite?</p>
                      
                      <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                        <a href="https://memora-dbba3.web.app/respond-invite-quick?email=${encodeURIComponent(userData.email)}&eventId=${eventId}&status=accepted" 
                           style="flex: 1; display: inline-block; background: #4CAF50; color: white; padding: 12px; text-decoration: none; border-radius: 5px; text-align: center; font-weight: bold; font-size: 14px;">
                          ✓ Aceitar
                        </a>
                        <a href="https://memora-dbba3.web.app/respond-invite-quick?email=${encodeURIComponent(userData.email)}&eventId=${eventId}&status=rejected" 
                           style="flex: 1; display: inline-block; background: #ff4444; color: white; padding: 12px; text-decoration: none; border-radius: 5px; text-align: center; font-weight: bold; font-size: 14px;">
                          ✕ Rejeitar
                        </a>
                      </div>

                      <p style="margin-bottom: 0; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 15px;">
                        Isto é um lembrete automático. Clique nos botões acima para responder ao convite.
                      </p>
                    </div>
                  </div>
                </div>
              `,
            });

            remindersTotal++;
            console.log(`  ✓ Lembrete enviado com sucesso`);
          } catch (err) {
            console.error(`  ❌ Erro ao enviar lembrete para ${userData?.email}:`, err.message);
          }
        }
      }

      console.log(`✓ Lembretes de convite: ${remindersTotal} enviados`);
    } catch (error) {
      console.error("❌ Erro ao enviar lembretes de convite:", error.message);
    }
  }
);

// ======================================
// 7) TESTE MANUAL DE LEMBRETES
// ======================================

/**
 * GET /testReminders
 * Testa envio de lembretes manualmente (para debugging)
 */
exports.testReminders = onRequest({ secrets: [SENDGRID_API_KEY] }, async (req, res) => {
  try {
    console.log("✓ testReminders iniciada");
    
    const apiKey = SENDGRID_API_KEY.value().trim();
    console.log(`✓ API Key recebida (primeiros 10 chars): ${apiKey.substring(0, 10)}...`);
    sgMail.setApiKey(apiKey);

    // Buscar todos os eventos
    const eventsSnap = await db.collection("events").limit(50).get();
    console.log(`✓ ${eventsSnap.size} eventos encontrados`);
    let remindersSent = 0;

    for (const eventDoc of eventsSnap.docs) {
      const eventData = eventDoc.data();
      const reminders = eventData.reminders || [];
      
      console.log(`  - Evento: ${eventData.titulo} (reminders: ${reminders.length})`);
      if (reminders.length === 0) {
        console.log(`    → Sem reminders, pulando...`);
        continue;
      }

      // Buscar proprietário
      const userDoc = await db.collection("users").doc(eventData.ownerId).get();
      const userData = userDoc.data();
      
      if (!userData?.email) {
        console.log(`    → Usuário sem email, pulando...`);
        continue;
      }

      // Enviar email de teste
      try {
        console.log(`    → Enviando email para ${userData.email}...`);
        await sgMail.send({
          to: userData.email,
          from: "memora.projeto@gmail.com",
          subject: `[TESTE] Lembrete: ${eventData.titulo}`,
          html: `
            <h2>TESTE - Lembrete de Evento</h2>
            <p><strong>${eventData.titulo}</strong></p>
            <p>Proprietário: ${userData.displayName}</p>
            <p>Email: ${userData.email}</p>
            <p>Lembretes configurados: ${reminders.join(", ")}</p>
            <br>
            <p><em>Este é um email de teste do sistema Memora</em></p>
          `,
        });
        remindersSent++;
        console.log(`    ✓ Email enviado com sucesso para ${userData.email}`);
      } catch (error) {
        console.error(`    ✗ Erro ao enviar email para ${userData.email}:`, error.message);
      }
    }

    console.log(`✓ Teste concluído. ${remindersSent} emails enviados.`);
    res.json({
      success: true,
      message: `Teste concluído. ${remindersSent} emails enviados.`,
      eventosTestados: eventsSnap.size,
      emailsEnviados: remindersSent,
    });
  } catch (error) {
    console.error("✗ Erro no teste de lembretes:", error);
    res.status(500).json({ error: "Erro ao testar lembretes", details: String(error) });
  }
});

// ======================================
// 7) DELETAR EVENTO COM SUBCOLEÇÕES
// ======================================

/**
 * POST /deleteEvent
 * Deleta um evento e todas as suas subcoleções (participants, reminders, etc)
 */
exports.deleteEvent = onRequest(
  { cors: true },
  async (req, res) => {
    try {
      const { eventId } = req.body;
      const uid = req.headers["x-user-id"];

      if (!eventId || !uid) {
        return res.status(400).json({ error: "Dados incompletos" });
      }

      // Verificar se o utilizador é o proprietário
      const eventDoc = await db.collection("events").doc(eventId).get();
      if (!eventDoc.exists) {
        return res.status(404).json({ error: "Evento não encontrado" });
      }

      if (eventDoc.data().ownerId !== uid) {
        return res.status(403).json({ error: "Sem permissão para deletar" });
      }

      // Deletar todos os documentos na subcoleção participants
      const participantsSnap = await db.collection("events").doc(eventId).collection("participants").get();
      const batch = db.batch();
      
      for (const doc of participantsSnap.docs) {
        batch.delete(doc.ref);
      }
      
      // Deletar o evento
      batch.delete(eventDoc.ref);
      
      await batch.commit();

      console.log(`✓ Evento ${eventId} deletado com sucesso`);
      res.json({ success: true, message: "Evento deletado" });
    } catch (error) {
      console.error("❌ Erro ao deletar evento:", error.message);
      res.status(500).json({ error: "Erro ao deletar evento", details: error.message });
    }
  }
);

// ======================================
// 8) ATUALIZAR EVENTO COM VALIDAÇÃO
// ======================================

/**
 * POST /updateEvent
 * Atualiza um evento com validações
 */
exports.updateEvent = onRequest(
  { cors: true },
  async (req, res) => {
    try {
      const { eventId, updates } = req.body;
      const uid = req.headers["x-user-id"];

      if (!eventId || !uid || !updates) {
        return res.status(400).json({ error: "Dados incompletos" });
      }

      // Verificar se o utilizador é o proprietário
      const eventDoc = await db.collection("events").doc(eventId).get();
      if (!eventDoc.exists) {
        return res.status(404).json({ error: "Evento não encontrado" });
      }

      if (eventDoc.data().ownerId !== uid) {
        return res.status(403).json({ error: "Sem permissão para atualizar" });
      }

      // Atualizar o documento
      await db.collection("events").doc(eventId).update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✓ Evento ${eventId} atualizado com sucesso`);
      res.json({ success: true, message: "Evento atualizado" });
    } catch (error) {
      console.error("❌ Erro ao atualizar evento:", error.message);
      res.status(500).json({ error: "Erro ao atualizar evento", details: error.message });
    }
  }
);

// ======================================
// 9) RESPONDER CONVITE POR EMAIL (sem login)
// ======================================

/**
 * POST /respondInviteByEmail
 * Responde a um convite usando email + eventId (sem autenticação Firebase)
 * Body: { email, eventId, status: "accepted" | "rejected" }
 */
exports.respondInviteByEmail = onRequest(
  { cors: true },
  async (req, res) => {
    try {
      const { email, eventId, status } = req.body;

      // Validações
      if (!email || !eventId || !status) {
        return res.status(400).json({ error: "Dados incompletos (email, eventId, status)" });
      }

      if (!["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Status deve ser 'accepted' ou 'rejected'" });
      }

      console.log(`📧 Respondendo convite: email=${email}, eventId=${eventId}, status=${status}`);

      // 1. Buscar o utilizador pelo email
      const usersSnap = await db
        .collection("users")
        .where("email", "==", email)
        .limit(1)
        .get();

      if (usersSnap.empty) {
        console.log(`❌ Utilizador não encontrado com email: ${email}`);
        return res.status(404).json({ error: "Utilizador não encontrado" });
      }

      const userId = usersSnap.docs[0].id;
      const userDoc = usersSnap.docs[0];
      const displayName = userDoc.data().displayName || "Guest";
      console.log(`✓ Utilizador encontrado: ${userId} - ${displayName}`);

      // 2. Buscar o evento
      const eventDoc = await db.collection("events").doc(eventId).get();
      if (!eventDoc.exists()) {
        console.log(`❌ Evento não encontrado: ${eventId}`);
        return res.status(404).json({ error: "Evento não encontrado" });
      }

      console.log(`✓ Evento encontrado: ${eventDoc.data().titulo}`);

      // 3. Atualizar o participant document
      const participantRef = db
        .collection("events")
        .doc(eventId)
        .collection("participants")
        .doc(userId);

      await participantRef.update({
        status,
        displayName,
        respondedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✓ Convite respondido com sucesso: ${status}`);

      res.json({
        success: true,
        message: `Convite ${status === "accepted" ? "aceito" : "rejeitado"} com sucesso!`,
        eventTitle: eventDoc.data().titulo,
      });
    } catch (error) {
      console.error("❌ Erro ao responder convite:", error.message);
      res.status(500).json({ error: "Erro ao responder convite", details: error.message });
    }
  }
);
