import { Day, DayCreate } from '../types/day.js';

export class InMemoryDayStore {
  private idCounter = 0;
  private readonly idPrefix: string;
  private readonly idPad: number;
  private daysById = new Map<string, Day>();

  constructor(options?: { idPrefix?: string; idPad?: number }) {
    this.idPrefix = options?.idPrefix ?? 'day_';
    this.idPad = options?.idPad ?? 4;
  }

  private nextId(): string {
    this.idCounter += 1;
    const padded = String(this.idCounter).padStart(this.idPad, '0');
    return `${this.idPrefix}${padded}`;
  }

  list(): Day[] {
    return [...this.daysById.values()].sort((a, b) => a.dayNumber - b.dayNumber);
  }

  get(id: string): Day | undefined {
    return this.daysById.get(id);
  }

  create(input: DayCreate): Day {
    const day: Day = { id: this.nextId(), ...input };
    this.daysById.set(day.id, day);
    return day;
  }

  createMany(inputs: DayCreate[]): Day[] {
    return inputs.map((i) => this.create(i));
  }

  update(id: string, partial: Partial<Day>): Day | undefined {
    const existing = this.daysById.get(id);
    if (!existing) return undefined;
    const updated: Day = { ...existing, ...partial, id: existing.id };
    this.daysById.set(id, updated);
    return updated;
    }

  delete(id: string): boolean {
    return this.daysById.delete(id);
  }

  clear(): void {
    this.daysById.clear();
    this.idCounter = 0;
  }
}

export const dayStore = new InMemoryDayStore();


