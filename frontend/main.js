const API_BASE = 'http://localhost:3001';

function set(el, text) {
  el.textContent = typeof text === 'string' ? text : JSON.stringify(text, null, 2);
}

async function health() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

async function ping() {
  const res = await fetch(`${API_BASE}/ping`);
  return res.json();
}

async function listDays() {
  const res = await fetch(`${API_BASE}/days`);
  return res.json();
}

async function listItins() {
  const res = await fetch(`${API_BASE}/itineraries`);
  return res.json();
}

async function getItin(id) {
  const res = await fetch(`${API_BASE}/itineraries/${encodeURIComponent(id)}`);
  return res.json();
}

async function updateItin(id, payload) {
  const res = await fetch(`${API_BASE}/itineraries/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

async function listItinDays(id) {
  const res = await fetch(`${API_BASE}/itineraries/${encodeURIComponent(id)}/days`);
  return res.json();
}

async function addItinDay(itineraryId, payload) {
  const res = await fetch(`${API_BASE}/itineraries/${encodeURIComponent(itineraryId)}/days`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

async function updateItinDay(itineraryId, dayId, payload) {
  const res = await fetch(
    `${API_BASE}/itineraries/${encodeURIComponent(itineraryId)}/days/${encodeURIComponent(dayId)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
  return res.json();
}

async function deleteItinDay(itineraryId, dayId) {
  const res = await fetch(
    `${API_BASE}/itineraries/${encodeURIComponent(itineraryId)}/days/${encodeURIComponent(dayId)}`,
    { method: 'DELETE' },
  );
  return res.text();
}

async function createDay(payload) {
  const res = await fetch(`${API_BASE}/days`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

async function generateItinerary(payload) {
  const res = await fetch(`${API_BASE}/ai/itinerary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

async function init() {
  const status = document.getElementById('status');
  const hpOut = document.getElementById('hpOut');
  const createOut = document.getElementById('createOut');
  const daysOut = document.getElementById('daysOut');
  const itinsOut = document.getElementById('itinsOut');
  const itinOut = document.getElementById('itinOut');
  const itinDaysOut = document.getElementById('itinDaysOut');
  const aiOut = document.getElementById('aiOut');

  try {
    const h = await health();
    set(status, `Backend: ${h.status} (AI ready: ${h.aiReady})`);
  } catch {
    set(status, 'Backend: unreachable');
  }

  document.getElementById('checkHealth').onclick = async () => {
    const data = await health();
    set(hpOut, data);
  };
  document.getElementById('doPing').onclick = async () => {
    const data = await ping();
    set(hpOut, data);
  };
  document.getElementById('loadDays').onclick = async () => {
    const data = await listDays();
    set(daysOut, data);
  };
  document.getElementById('loadItins').onclick = async () => {
    const data = await listItins();
    set(itinsOut, data);
  };
  document.getElementById('loadItin').onclick = async () => {
    const id = document.getElementById('itinId').value.trim();
    if (!id) {
      set(itinOut, { error: 'Enter itinerary ID' });
      return;
    }
    const data = await getItin(id);
    set(itinOut, data);
  };
  document.getElementById('updateItin').onclick = async () => {
    const id = document.getElementById('itinId').value.trim();
    if (!id) return set(itinOut, { error: 'Enter itinerary ID' });
    const payload = {
      title: document.getElementById('itinTitle').value || undefined,
      startDate: document.getElementById('itinStartDate').value || undefined,
      accommodationLevel: document.getElementById('itinLevel').value || undefined,
      updatedByName: document.getElementById('itinUpdatedBy').value || undefined,
    };
    const data = await updateItin(id, payload);
    set(itinOut, data);
  };
  document.getElementById('loadItinDays').onclick = async () => {
    const id = document.getElementById('itinId').value.trim();
    if (!id) return set(itinDaysOut, { error: 'Enter itinerary ID' });
    const data = await listItinDays(id);
    set(itinDaysOut, data);
  };
  document.getElementById('addDay').onclick = async () => {
    const id = document.getElementById('itinId').value.trim();
    if (!id) return set(itinDaysOut, { error: 'Enter itinerary ID' });
    const payload = {
      dayNumber: Number(document.getElementById('dayNumber').value),
      title: document.getElementById('dayTitle').value,
      description: document.getElementById('dayDescription').value,
      destination: document.getElementById('dayDestination').value,
      transferStatus: document.getElementById('dayTransfer').value,
      accommodationLevel: document.getElementById('dayLevel').value,
      activity: (() => {
        const name = document.getElementById('actName').value;
        const price = document.getElementById('actPrice').value;
        if (!name && !price) return undefined;
        return { name, priceCents: Number(price || 0) };
      })(),
    };
    const data = await addItinDay(id, payload);
    set(itinDaysOut, data);
  };
  document.getElementById('updateDay').onclick = async () => {
    const itinId = document.getElementById('itinId').value.trim();
    const dayId = document.getElementById('dayId').value.trim();
    if (!itinId || !dayId) return set(itinDaysOut, { error: 'Enter itinerary and day IDs' });
    const payload = {
      dayNumber: document.getElementById('dayNumber').value ? Number(document.getElementById('dayNumber').value) : undefined,
      title: document.getElementById('dayTitle').value || undefined,
      description: document.getElementById('dayDescription').value || undefined,
      destination: document.getElementById('dayDestination').value || undefined,
      transferStatus: document.getElementById('dayTransfer').value || undefined,
      accommodationLevel: document.getElementById('dayLevel').value || undefined,
      activity: (() => {
        const name = document.getElementById('actName').value;
        const price = document.getElementById('actPrice').value;
        if (!name && !price) return undefined;
        return { name, priceCents: Number(price || 0) };
      })(),
    };
    const data = await updateItinDay(itinId, dayId, payload);
    set(itinDaysOut, data);
  };
  document.getElementById('deleteDay').onclick = async () => {
    const itinId = document.getElementById('itinId').value.trim();
    const dayId = document.getElementById('dayId').value.trim();
    if (!itinId || !dayId) return set(itinDaysOut, { error: 'Enter itinerary and day IDs' });
    await deleteItinDay(itinId, dayId);
    const data = await listItinDays(itinId);
    set(itinDaysOut, data);
  };
  document.getElementById('createDay').onclick = async () => {
    const payload = {
      dayNumber: Number(document.getElementById('dayNumber').value),
      title: document.getElementById('title').value,
      description: document.getElementById('description').value,
      accommodationLevel: document.getElementById('acc').value,
      provider: document.getElementById('provider').value,
      transferStatus: document.getElementById('transfer').value,
    };
    const data = await createDay(payload);
    set(createOut, data);
  };
  document.getElementById('genAi').onclick = async () => {
    const prefsRaw = document.getElementById('aiPrefs').value.trim();
    const acc = document.getElementById('aiAcc').value;
    const payload = {
      numDays: Number(document.getElementById('aiNumDays').value),
      destination: document.getElementById('aiProvider').value,
      title: document.getElementById('aiTitle').value || undefined,
      style: document.getElementById('aiStyle').value,
      preferences: prefsRaw ? prefsRaw.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      accommodationLevel: acc || undefined,
    };
    const data = await generateItinerary(payload);
    set(aiOut, data);
  };
}

init();


