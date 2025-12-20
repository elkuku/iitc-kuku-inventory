const PREFIX = 'plugin-kuku-inventory'

export class LocalStorageHelper<T> {

    constructor(
        private readonly key: string,
        private readonly defaultValue: T
    ) {}

    load(): T {
        const raw = localStorage.getItem(`${PREFIX}-${this.key}`)
        if (!raw) return structuredClone(this.defaultValue)

        try {
            return JSON.parse(raw) as T
        } catch {
            console.warn(`[LocalStore] Failed to parse ${this.key}, resetting`)
            return structuredClone(this.defaultValue)
        }
    }

    save(value: T): void {
        localStorage.setItem(`${PREFIX}-${this.key}`, JSON.stringify(value))
    }

    clear(): void {
        localStorage.removeItem(this.key)
    }

    public saveMap<T, U>(map: Map<T, U>): void {
        const object = Object.fromEntries(map)
        localStorage.setItem(PREFIX + '-' + this.key, JSON.stringify(object))
    }

    public loadMap<T extends string, U>(): Map<T, U> | undefined {
        const json = localStorage.getItem(PREFIX + '-' + this.key)
        if (!json) return undefined

        const object = JSON.parse(json) as Record<T, U>
        const entries = Object.entries(object) as [T, U][]

        return new Map<T, U>(entries)
    }
}