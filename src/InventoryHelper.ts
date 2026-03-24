import {Inventory, KeyInfo} from '../types/Types'
import {InventoryFetcher} from './InventoryFetcher'
import KeyCapsule = Inventory.KeyCapsule;

export class InventoryHelper {
    private inventory: Inventory.Items
    private fetcher: InventoryFetcher

    constructor() {
        this.fetcher = new InventoryFetcher()
    }

    public async getInventory() {
        if (this.inventory) {
            return this.inventory
        }

        this.inventory = await this.fetcher.getInventory()

        return this.inventory
    }

    public async refresh() {
        this.inventory = await this.fetcher.refresh()

        return this.inventory
    }

    public async getKeysInfo(): Promise<Map<string, KeyInfo>> {
        const inventory = await this.getInventory()
        const keyInfos = new Map<string, KeyInfo>()
        let keyInfo: KeyInfo | undefined

        for (const key of inventory.keys) {

            keyInfo = keyInfos.get(key.guid)

            keyInfo ??= {
                total: 0,
                atHand: 0,
                portal: {
                    guid: key.guid,
                    title: key.title,
                    lat: key.lat,
                    lng: key.lng,
                },
                capsules: new Map<string, number>(),
            }

            keyInfo.atHand!++
            keyInfo.total++

            for (const capsule of [...inventory.keyCapsules, ...inventory.capsules]) {
                if (!(keyInfo.capsules?.has(capsule.differentiator))) {
                    for (const k of capsule.keys) {
                        if (k.key.guid === key.guid) {
                            keyInfo.capsules!.set(capsule.differentiator, k.count)
                            keyInfo.total += k.count
                        }
                    }
                }
            }

            keyInfos.set(key.guid, keyInfo)
        }

        // Search for keys only in capsules
        for (const capsule of [...inventory.keyCapsules, ...inventory.capsules]) {
            for (const k of capsule.keys) {
                if (keyInfos.has(k.key.guid)) {
                    keyInfo = keyInfos.get(k.key.guid)
                    if (false === keyInfo?.capsules?.has(capsule.differentiator)) {
                        keyInfo.capsules.set(capsule.differentiator, k.count)
                        keyInfo.total += k.count

                        keyInfos.set(k.key.guid, keyInfo)
                    }
                } else {
                    keyInfo = {
                        total: 0,
                        portal: {
                            guid: k.key.guid,
                            title: k.key.title,
                            lat: k.key.lat,
                            lng: k.key.lng,
                        },
                        capsules: new Map<string, number>(),
                    }

                    keyInfo.capsules?.set(capsule.differentiator, k.count)
                    keyInfo.total += k.count

                    keyInfos.set(k.key.guid, keyInfo)
                }
            }
        }

        return keyInfos
    }

    public async getCapsuleContents(): Promise<Inventory.CapsuleContents[]> {
        const inventory = await this.getInventory()
        return inventory.capsuleContents
    }

    public async getKeyCapsulesInfo(): Promise<KeyCapsule[]> {
        const inventory = await this.getInventory()

        return inventory.keyCapsules
    }

    /**
     * @return
     * [{WEAPON-TYPE}-{LEVEL}: {COUNT}]
     */
    public async getWeaponsInfo(): Promise<Map<string, number>> {
        const inventory = await this.getInventory()

        const weapons = new Map<string, number>()

        for (const type of ['EMP_BURSTER', 'ULTRA_STRIKE']) {
            for (let i = 1; i < 9; i++) {
                weapons.set(`${type}-${i}`, 0)
            }
        }

        weapons.set('ADA-0', 0)
        weapons.set('JARVIS-0', 0)

        for (const weapon of inventory.weapons) {
            const key = `${weapon.type}-${weapon.level}`
            if (weapons.has(key)) {
                weapons.set(key, weapons.get(key)! + 1)
            } else {
                // Key should have been set before
                console.warn('missing key', key)
                weapons.set(key, 1)
            }
        }

        return weapons
    }

    /**
     * @return
     * [{ RESONATOR-{LEVEL}: {COUNT} }]
     */
    public async getResonatorsInfo(): Promise<Map<string, number>> {
        const inventory = await this.getInventory()
        const resonatorsInfo = new Map<string, number>()

        for (const resonator of inventory.resonators) {
            const key = `RESONATOR-${resonator.level}`
            if (resonatorsInfo.has(key)) {
                resonatorsInfo.set(key, resonatorsInfo.get(key)! + 1)
            } else {
                resonatorsInfo.set(key, 1)
            }
        }

        for (const [k, v] of [...resonatorsInfo.entries()].toSorted(
            ([a], [b]) => {
                const numA = parseInt((/\d+$/.exec(a))?.[0] ?? '0', 10)
                const numB = parseInt((/\d+$/.exec(b))?.[0] ?? '0', 10)
                return numA - numB
            }
        )) {
            resonatorsInfo.delete(k)
            resonatorsInfo.set(k, v)
        }

        return resonatorsInfo
    }

    public async getModsInfo() {
        const inventory = await this.getInventory()
        const info = new Map<string, number>()

        for (const modulator of inventory.mods) {
            const key = `${modulator.type}-${modulator.rarity}`
            if (info.has(key)) {
                info.set(key, info.get(key)! + 1)
            } else {
                info.set(key, 1)
            }
        }

        return info
    }

    public async getBoostsInfo() {
        const inventory = await this.getInventory()
        const info = new Map<string, number>()
        for (const boost of inventory.boosts) {
            const key = boost.type
            if (info.has(key)) {
                info.set(key, info.get(key)! + 1)
            } else {
                info.set(key, 1)
            }
        }

        return info
    }

    public async getCubesInfo() {
        const inventory = await this.getInventory()
        const info = new Map<string, number>()

        for (const cube of inventory.cubes) {
            const key = `POWER_CUBE-${cube.level}`
            if (info.has(key)) {
                info.set(key, info.get(key)! + 1)
            } else {
                info.set(key, 1)
            }
        }

        for (const [k, v] of [...info.entries()].toSorted(
            ([a], [b]) => {
                const numA = parseInt(a.slice(-1))
                const numB = parseInt(b.slice(-1))
                return numA - numB
            }
        )) {
            info.delete(k)
            info.set(k, v)
        }

        return info
    }
}