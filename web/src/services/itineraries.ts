import { useMemo, useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { ItineraryWithDays } from '../api/client';

export type UiAccommodation = '3' | '4' | '5' | 'deluxe';
export type UiTransfer = 'in' | 'out' | 'none';

export type UiDay = {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  destination: string;
  transferStatus: UiTransfer;
  accommodationLevel: UiAccommodation;
  hotelName?: string;
};

export type UiItinerary = {
  id: string;
  title: string;
  startDate: string; // ISO
  accommodationLevel: UiAccommodation;
  description?: string; // aligns with backend Itinerary.description
  days: UiDay[];
};

const seedItineraries: UiItinerary[] = [
  {
    id: 'it-1',
    title: 'Classic Machu Picchu',
    startDate: new Date().toISOString().slice(0, 10),
    accommodationLevel: '4',
    description:
      'Experience Peru’s iconic highlights with thoughtful acclimatization. Explore Lima’s culinary scene, Cusco’s history, the Sacred Valley’s living culture, and the citadel of Machu Picchu.',
    days: [
      { id: 'd-1-1', dayNumber: 1, title: 'Arrive Lima', description: 'Arrival and settle in.', destination: 'Lima', transferStatus: 'in', accommodationLevel: '4', hotelName: 'Casa Andina Classic Miraflores Centro' },
      { id: 'd-1-2', dayNumber: 2, title: 'Lima City', description: 'Explore historic center & cuisine.', destination: 'Lima', transferStatus: 'none', accommodationLevel: '4' },
      { id: 'd-1-3', dayNumber: 3, title: 'Fly to Cusco', description: 'Travel to Cusco and acclimatize.', destination: 'Cusco', transferStatus: 'in', accommodationLevel: '4' },
      { id: 'd-1-4', dayNumber: 4, title: 'Cusco Ruins', description: 'Visit Sacsayhuamán & nearby.', destination: 'Cusco', transferStatus: 'none', accommodationLevel: '4' },
      { id: 'd-1-5', dayNumber: 5, title: 'Sacred Valley', description: 'Pisac and Ollantaytambo.', destination: 'Sacred Valley', transferStatus: 'none', accommodationLevel: '4' },
      { id: 'd-1-6', dayNumber: 6, title: 'Machu Picchu', description: 'Train to Aguas Calientes & MP.', destination: 'Machu Picchu', transferStatus: 'in', accommodationLevel: '4' },
      { id: 'd-1-7', dayNumber: 7, title: 'Return Cusco', description: 'Second entry optional.', destination: 'Cusco', transferStatus: 'out', accommodationLevel: '4' },
      { id: 'd-1-8', dayNumber: 8, title: 'Depart', description: 'Fly home.', destination: 'Lima', transferStatus: 'out', accommodationLevel: '4' },
    ],
  },
  {
    id: 'it-2',
    title: 'GPS, MP, & IPC',
    startDate: new Date().toISOString().slice(0, 10),
    accommodationLevel: '5',
    description:
      'An adventurous blend of Galápagos (GPS), Machu Picchu (MP), and Isabela (IPC) with curated logistics and premium stays.',
    days: [
      { id: 'd-2-1', dayNumber: 1, title: 'Arrive Lima', description: 'Arrival and settle in.', destination: 'Lima', transferStatus: 'in', accommodationLevel: '5' },
      { id: 'd-2-2', dayNumber: 2, title: 'Fly to Galápagos', description: 'Flight and embark.', destination: 'Galápagos', transferStatus: 'in', accommodationLevel: '5' },
      { id: 'd-2-3', dayNumber: 3, title: 'Galápagos Cruise', description: 'Explorations.', destination: 'Galápagos', transferStatus: 'none', accommodationLevel: '5' },
      { id: 'd-2-4', dayNumber: 4, title: 'Return Quito', description: 'Disembark and return.', destination: 'Quito', transferStatus: 'out', accommodationLevel: '5' },
      { id: 'd-2-5', dayNumber: 5, title: 'Cusco', description: 'Arrive and acclimatize.', destination: 'Cusco', transferStatus: 'in', accommodationLevel: '5' },
      { id: 'd-2-6', dayNumber: 6, title: 'Machu Picchu', description: 'Guided visit.', destination: 'Machu Picchu', transferStatus: 'none', accommodationLevel: '5' },
      { id: 'd-2-7', dayNumber: 7, title: 'Lima', description: 'Final day.', destination: 'Lima', transferStatus: 'out', accommodationLevel: '5' },
    ],
  },
  {
    id: 'it-3',
    title: 'GP & MP',
    startDate: new Date().toISOString().slice(0, 10),
    accommodationLevel: '3',
    description:
      'A streamlined exploration of Galápagos and Machu Picchu with efficient transfers.',
    days: [
      { id: 'd-3-1', dayNumber: 1, title: 'Arrive Lima', description: 'Arrival and settle in.', destination: 'Lima', transferStatus: 'in', accommodationLevel: '3' },
      { id: 'd-3-2', dayNumber: 2, title: 'Cusco', description: 'Historic center.', destination: 'Cusco', transferStatus: 'in', accommodationLevel: '3' },
      { id: 'd-3-3', dayNumber: 3, title: 'Sacred Valley', description: 'Valley highlights.', destination: 'Sacred Valley', transferStatus: 'none', accommodationLevel: '3' },
      { id: 'd-3-4', dayNumber: 4, title: 'Machu Picchu', description: 'Guided visit.', destination: 'Machu Picchu', transferStatus: 'none', accommodationLevel: '3' },
      { id: 'd-3-5', dayNumber: 5, title: 'Depart', description: 'Return flights.', destination: 'Lima', transferStatus: 'out', accommodationLevel: '3' },
    ],
  },
];

const PERSIST_KEY = 'itineraryplanner.published';
// We persist only data, not selection; selection should reset on reload

export function useMockItineraries() {
  const [items, setItems] = useState<UiItinerary[]>(() => {
    try {
      const raw = localStorage.getItem(PERSIST_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as UiItinerary[];
        return parsed;
      }
    } catch {}
    return seedItineraries;
  });
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((it) => it.title.toLowerCase().includes(q));
  }, [items, query]);

  function selectItinerary(id: string) {
    setSelectedId(id);
  }

  function getSelected(): UiItinerary | null {
    return items.find((it) => it.id === selectedId) || null;
  }

  function duplicateFrom(id: string | null): UiItinerary | null {
    if (!id) return null;
    const current = items.find((it) => it.id === id);
    if (!current) return null;
    const copy: UiItinerary = {
      ...current,
      id: `it-copy-${Math.random().toString(36).slice(2, 8)}`,
      title: `${current.title} (Copy)`,
      days: current.days.map((d) => ({ ...d, id: `d-copy-${Math.random().toString(36).slice(2, 8)}` })),
    };
    setItems((prev) => [copy, ...prev]);
    setSelectedId(copy.id);
    return copy;
  }

  function duplicateSelected(): UiItinerary | null {
    const current = getSelected();
    if (!current) return null;
    const copy: UiItinerary = {
      ...current,
      id: `it-copy-${Math.random().toString(36).slice(2, 8)}`,
      title: `${current.title} (Copy)`,
      days: current.days.map((d) => ({ ...d, id: `d-copy-${Math.random().toString(36).slice(2, 8)}` })),
    };
    setItems((prev) => [copy, ...prev]);
    setSelectedId(copy.id);
    return copy;
  }

  function updateItineraryTitle(id: string, title: string) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, title } : it)));
  }

  function updateItineraryDescription(id: string, description: string) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, description } : it)));
  }

  function deleteDay(itineraryId: string, dayId: string) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === itineraryId ? { ...it, days: it.days.filter((d) => d.id !== dayId) } : it,
      ),
    );
  }

  function updateDay(itineraryId: string, dayId: string, patch: Partial<UiDay>) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === itineraryId
          ? {
              ...it,
              days: it.days.map((d) => (d.id === dayId ? { ...d, ...patch } : d)),
            }
          : it,
      ),
    );
  }

  function publish() {
    try {
      localStorage.setItem(PERSIST_KEY, JSON.stringify(itemsRef.current));
    } catch {}
  }

  function publishWithOverrideDescription(id: string, description: string) {
    setItems((prev) => {
      const next = prev.map((it) => (it.id === id ? { ...it, description } : it));
      try {
        localStorage.setItem(PERSIST_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    // keep current in-session selection; do not persist selection
  }

  function clearPublished() {
    try {
      localStorage.removeItem(PERSIST_KEY);
    } catch {}
    setItems(seedItineraries);
    setSelectedId(null);
  }

  return {
    query,
    setQuery,
    items: filtered,
    allItems: items,
    selectedId,
    selectItinerary,
    getSelected,
    duplicateSelected,
    duplicateFrom,
    updateItineraryTitle,
    updateItineraryDescription,
    deleteDay,
    updateDay,
    publish,
    publishWithOverrideDescription,
    clearPublished,
  };
}

export function useItineraries() {
  return useQuery<{ itineraries: ItineraryWithDays[] }>({
    queryKey: ['itineraries'],
    queryFn: () => api.listItineraries(),
  });
}


