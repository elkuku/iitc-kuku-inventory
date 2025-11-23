const KEY_STORAGE = 'plugin-kuku-inventory'

export class LocalStorageHelper {

    public saveMap<T, U>(key: string, map: Map<T, U>): void {
        const object = Object.fromEntries(map)
        localStorage.setItem(KEY_STORAGE + '-' + key, JSON.stringify(object))
    }

    public loadMap<T extends string, U>(key: string): Map<T, U> | undefined {
        const json = localStorage.getItem(KEY_STORAGE + '-' + key)
        if (!json) return undefined

        const object = JSON.parse(json) as Record<T, U>
        const entries = Object.entries(object) as [T, U][]

        return new Map<T, U>(entries)
    }
}