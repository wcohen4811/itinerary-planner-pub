export class InMemoryDayStore {
    idCounter = 0;
    idPrefix;
    idPad;
    daysById = new Map();
    constructor(options) {
        this.idPrefix = options?.idPrefix ?? 'day_';
        this.idPad = options?.idPad ?? 4;
    }
    nextId() {
        this.idCounter += 1;
        const padded = String(this.idCounter).padStart(this.idPad, '0');
        return `${this.idPrefix}${padded}`;
    }
    list() {
        return [...this.daysById.values()].sort((a, b) => a.dayNumber - b.dayNumber);
    }
    get(id) {
        return this.daysById.get(id);
    }
    create(input) {
        const day = { id: this.nextId(), ...input };
        this.daysById.set(day.id, day);
        return day;
    }
    createMany(inputs) {
        return inputs.map((i) => this.create(i));
    }
    update(id, partial) {
        const existing = this.daysById.get(id);
        if (!existing)
            return undefined;
        const updated = { ...existing, ...partial, id: existing.id };
        this.daysById.set(id, updated);
        return updated;
    }
    delete(id) {
        return this.daysById.delete(id);
    }
    clear() {
        this.daysById.clear();
        this.idCounter = 0;
    }
}
export const dayStore = new InMemoryDayStore();
