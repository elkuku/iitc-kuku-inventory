// @ts-expect-error "Import attributes are only supported when the --module option is set to esnext, nodenext, or preserve"
import dialogTemplate from '../templates/dialog.hbs' with {type: 'text'}

// @ts-expect-error "Import attributes are only supported when the --module option is set to esnext, nodenext, or preserve"
import itemsImageTemplate from '../templates/_items-image-container.hbs' with {type: 'text'}
// @ts-expect-error "Import attributes are only supported when the --module option is set to esnext, nodenext, or preserve"
import itemsContainerTemplate from '../templates/_items-container.hbs' with {type: 'text'}
// @ts-expect-error "Import attributes are only supported when the --module option is set to esnext, nodenext, or preserve"
import itemsKeysTemplate from '../templates/_items-keys-container.hbs' with {type: 'text'}
// @ts-expect-error "Import attributes are only supported when the --module option is set to esnext, nodenext, or preserve"
import keyCapsulesTemplate from '../templates/_key-capsules.hbs' with {type: 'text'}

import {translateKey} from '../types/key-translations'
import {InventoryHelper} from './InventoryHelper'
import {HelperHandlebars, Inventory, KeyInfo} from '../types/Types'
import {Utility} from './Utility'
import {LocalStorageHelper} from './LocalStorageHelper'

export class DialogHelper {

    private localStorageHelper: LocalStorageHelper
    private readonly capsuleNames: Map<string, string>
    private handlebars: HelperHandlebars

    public constructor(
        private pluginName: string,
        private title: string,
        private inventoryHelper: InventoryHelper
    ) {
        this.inventoryHelper = inventoryHelper
        this.localStorageHelper = new LocalStorageHelper()

        this.capsuleNames = this.localStorageHelper.loadMap('capsuleNames') ?? new Map()
    }

    public getDialog(): JQuery {
        this.handlebars = window.plugin.HelperHandlebars

        if (!this.handlebars) {
            throw new Error('Handlebars helper not found')
        }

        // @ts-expect-error 'howtodeclaretypes?'
        this.handlebars.registerHelper({
            capsuleNames: (key: string): string => {
                return this.capsuleNames.get(key) ?? key
            },
            eachInMap: (map: Map<any, any>, block: Handlebars.HelperOptions) => {
                let out = ''
                if (map && map instanceof Map) {
                    for (const [key, value] of map) {
                        out += block.fn({key, value})
                    }
                }
                return out
            },
            translateKey: (key: string): string => {
                return translateKey(key)
            },
            distance: (lat: number, lng: number): string => {
                return Utility.distance(L.latLng(lat, lng))
            },
            dump: (context: any): void => {
                console.log(context)
                // return JSON.stringify(context, undefined, 2)
            }
        })

        const template: Handlebars.TemplateDelegate = this.handlebars.compile(dialogTemplate)

        const data = {
            plugin: 'window.plugin.' + this.pluginName,
            prefix: this.pluginName,
            product: {
                name: this.pluginName,
                version: VERSION,
            },
        }

        return window.dialog({
            id: this.pluginName,
            title: this.title,
            html: template(data),
            width: 800,
            height: 600,
            buttons: [],
        }).parent()
    }

    public showPanel(name: string) {
        for (const panel of ['Inventory', 'Keys', 'Other', 'Info', 'Capsules']) {
            const element = document.getElementById(`${this.pluginName}-${panel}-Panel`)
            if (element) element.style.display = 'none'
        }

        const element = document.getElementById(`${this.pluginName}-${name}-Panel`)
        if (element) element.style.display = 'block'
    }

    public async refresh() {
        try {
            await this.inventoryHelper.refresh()
            await this.updateDialog()
            alert('Inventory has been refreshed.')
        } catch (error) {
            // We probably hit the rate limit...
            console.error(error)
            alert(error.message)
        }
    }

    public async updateDialog() {
        const resonators = await this.inventoryHelper.getResonatorsInfo(),
            weapons = await this.inventoryHelper.getWeaponsInfo(),
            modulators = await this.inventoryHelper.getModsInfo(),
            keys = await this.inventoryHelper.getKeysInfo(),
            cubes = await this.inventoryHelper.getCubesInfo(),
            boosts = await this.inventoryHelper.getBoostsInfo(),
            keyCapsules = await this.inventoryHelper.getKeyCapsulesInfo()

        let cntEquipment = 0, cntKeys = 0, cntOther = 0

        cntEquipment += this.processResos(resonators)
        cntEquipment += this.processWeapons(weapons)
        cntEquipment += this.processModulators(modulators)

        cntKeys += this.processKeys(keys)

        cntOther += this.processCubes(cubes)
        cntOther += this.processBoosts(boosts)

        this.processKeyCapsules(keyCapsules)

        this.updateCountField('cntEquipment', cntEquipment)
        this.updateCountField('cntKeys', cntKeys)
        this.updateCountField('cntOther', cntOther)

        this.updateCountField('cntTotal', cntEquipment + cntKeys + cntOther)

        this.enableTableSorting('keysTable')
    }

    public sortTable(tableId: string, columnIndex: number, type: 'string' | 'number' | 'distance', ascending: boolean): void {
        const table = document.getElementById(tableId) as HTMLTableElement
        const tbody = table.tBodies[0]
        const rows = [...tbody.rows]

        rows.sort((a, b) => {
            const aText = a.cells[columnIndex].textContent?.trim() || ''
            const bText = b.cells[columnIndex].textContent?.trim() || ''

            switch (type) {
                case 'string': {
                    return ascending
                        ? aText.localeCompare(bText)
                        : bText.localeCompare(aText)
                }
                case 'number': {
                    const aNum = parseFloat(aText)
                    const bNum = parseFloat(bText)
                    return ascending ? aNum - bNum : bNum - aNum
                }
                case 'distance': {
                    const aNum = Utility.parseDistance(aText)
                    const bNum = Utility.parseDistance(bText)
                    return ascending ? aNum - bNum : bNum - aNum
                }
            }
        })

        rows.forEach(row => tbody.appendChild(row))
    }

    public enableTableSorting(tableId: string): void {
        const table = document.getElementById(tableId) as HTMLTableElement
        const headers = table.querySelectorAll('th')

        headers.forEach((header, i) => {
            let ascending = true

            const indicator = document.createElement('span')
            indicator.style.marginLeft = '8px'
            header.appendChild(indicator)

            const type = header.dataset.type as 'string' | 'number' | 'distance'
            if (type) {
                header.addEventListener('click', () => {
                    this.sortTable(tableId, i, type, ascending)
                    ascending = !ascending

                    headers.forEach((hdr) => {
                        const span = hdr.querySelector('span:not(.cnt)')
                        if (span) span.textContent = ''
                    })

                    indicator.textContent = (ascending) ? '▲' : '▼'
                })
            }
        })
    }

    public storeCapsuleNames() {
        const capsuleNames = this.getCapsuleNames()

        for (const [key, value] of capsuleNames) {
            if (value) {
                this.capsuleNames.set(key, value)
            }
        }

        this.localStorageHelper.saveMap('capsuleNames', this.capsuleNames)

        alert('Capsule names have been saved - please refresh ;)')
    }

    private processResos(resonators: Map<string, number>) {
        this.getContainer('Resonators').innerHTML =
            this.handlebars.compile(itemsImageTemplate)({items: resonators})

        let cntResos = 0

        for (const count of resonators.values()) {
            cntResos += count
        }

        this.updateCountField('cntResonators', cntResos)

        return cntResos
    }

    private processWeapons(weapons: Map<string, number>) {
        const itemsTemplate: HandlebarsTemplateDelegate = this.handlebars.compile(itemsImageTemplate)

        const bursters = new Map<string, number>
        const strikes = new Map<string, number>

        let cntBursters = 0, cntStrikes = 0, cntFlips = 0

        for (const [key, value] of weapons) {
            if (key.startsWith('EMP_BURSTER')) {
                bursters.set(key, value)
                cntBursters += value
            } else if (key.startsWith('ULTRA_STRIKE')) {
                strikes.set(key, value)
                cntStrikes += value
            } else if (['ADA-0', 'JARVIS-0'].includes(key)) {
                // Viruses also go here
                strikes.set(key, value)
                cntFlips += value
            } else {
                console.warn('Unknown weapon', key)
            }
        }

        const total = cntBursters + cntStrikes + cntFlips

        this.getContainer('Bursters').innerHTML = itemsTemplate({items: bursters})
        this.getContainer('Strikes').innerHTML = itemsTemplate({items: strikes})

        this.updateCountField('cntBursters', cntBursters)
        this.updateCountField('cntStrikes', cntStrikes)
        this.updateCountField('cntFlips', cntFlips)

        this.updateCountField('cntWeapons', total)

        return total
    }

    private processModulators(modulators: Map<string, number>) {
        const itemsTemplate: HandlebarsTemplateDelegate = this.handlebars.compile(itemsImageTemplate)

        const shields = new Map<string, number>,
            hackMods = new Map<string, number>,
            otherMods = new Map<string, number>,
            otherModsTypes = [
                'FORCE_AMP-RARE', 'TURRET-RARE',
                'LINK_AMPLIFIER-RARE', 'ULTRA_LINK_AMP-VERY_RARE',
                'TRANSMUTER_ATTACK-VERY_RARE', 'TRANSMUTER_DEFENSE-VERY_RARE' // ITOs
            ],
            rarities = ['COMMON', 'RARE', 'VERY_RARE']

        let cntShields = 0, cntHack = 0, cntOther = 0

        for (const [key, value] of modulators) {
            if (key.startsWith('RES_SHIELD')
                || key.startsWith('EXTRA_SHIELD')
            ) {
                shields.set(key, value)
                cntShields += value
            } else if (key.startsWith('HEATSINK')
                || key.startsWith('MULTIHACK')
            ) {
                hackMods.set(key, value)
                cntHack += value
            } else if (otherModsTypes.includes(key)) {
                otherMods.set(key, value)
                cntOther += value
            } else {
                console.warn(`Unknown modulator: ${key}`)
                otherMods.set(key, value)
                cntOther += value
            }
        }

        this.getContainer('Shields').innerHTML = itemsTemplate({
            items: Utility.sortMapByCompoundKey(shields, ['RES_SHIELD', 'EXTRA_SHIELD'], rarities)
        })
        this.getContainer('HackMods').innerHTML = itemsTemplate({
            items: Utility.sortMapByCompoundKey(hackMods, ['HEATSINK', 'MULTIHACK'], rarities)
        })
        this.getContainer('OtherMods').innerHTML = itemsTemplate({
            items: Utility.sortMapByKey(otherMods, otherModsTypes)
        })

        const total = cntShields + cntHack + cntOther

        this.updateCountField('cntModShields', cntShields)
        this.updateCountField('cntModHack', cntHack)
        this.updateCountField('cntModOther', cntOther)

        this.updateCountField('cntMods', total)

        return total
    }

    private processBoosts(boosts: Map<string, number>) {
        const itemsTemplate: HandlebarsTemplateDelegate = this.handlebars.compile(itemsContainerTemplate)

        const play = new Map<string, number>,
            beacons = new Map<string, number>,
            playTypes = ['FRACK', 'APEX', 'BB_BATTLE', 'FW_ENL', 'FW_RES'],
            beaconsTypes = new Set(['MEET', 'TOASTY', 'NIA', 'BN_PEACE', 'BN_BLM', 'RES', 'ENL'])

        let total = 0, cntPlay = 0, cntBeacons = 0

        for (const [key, value] of boosts) {
            if (playTypes.includes(key)) {
                play.set(key, value)
                cntPlay += value
            } else if (beaconsTypes.has(key)) {
                beacons.set(key, value)
                cntBeacons += value
            } else {
                console.warn(`Unknown boost: ${key}`)
            }
        }

        total += cntPlay + cntBeacons
        this.getContainer('Boosts-Play').innerHTML = itemsTemplate({items: Utility.sortMapByKey(play, playTypes)})
        this.getContainer('Boosts-Beacons').innerHTML = itemsTemplate({items: beacons})

        this.updateCountField('cntBoostsPlay', cntPlay)
        this.updateCountField('cntBoostsBeacons', cntBeacons)

        this.updateCountField('cntBoosts', total)

        return total
    }

    private processCubes(cubes: Map<string, number>) {
        this.getContainer('Cubes').innerHTML =
            this.handlebars.compile(itemsContainerTemplate)({items: cubes})

        let count = 0

        for (const cnt of cubes.values()) {
            count += cnt
        }

        this.updateCountField('cntCubes', count)

        return count
    }

    private processKeys(keys: Map<string, KeyInfo>) {
        this.getContainer('Keys').innerHTML =
            this.handlebars.compile(itemsKeysTemplate)({items: keys})

        let total = 0, atHand = 0

        for (const info of keys.values()) {
            total += info.total
            atHand += info.atHand ?? 0
        }

        this.updateCountField('cntKeys', total)

        this.updateCountField('cntKeysTotal', total)
        this.updateCountField('cntKeysAtHand', atHand)
        this.updateCountField('cntKeysCapsules', total - atHand)

        return total
    }

    private processKeyCapsules(keyCapsules: Inventory.KeyCapsule[]) {
        this.getContainer('KeyCapsules').innerHTML =
            this.handlebars.compile(keyCapsulesTemplate)({
                keyCapsules: keyCapsules,
                names: Object.fromEntries(this.capsuleNames)
            })
    }

    private getCapsuleNames(): Map<string, string> {
        const names = new Map<string, string>()
        const inputElements = this.getContainer('KeyCapsules').querySelectorAll('input')

        inputElements.forEach(input => {
            names.set(input.name, input.value)
        })

        return names
    }

    private getContainer(name: string): Element {
        const container = document.getElementById(`${this.pluginName}-${name}-Container`) as Element

        if (!container) {
            console.warn(`Unknown Container: ${name}`)
        }

        return container
    }

    private updateCountField(name: string, count: number): void {
        const element = document.getElementById(this.pluginName + '-' + name) as Element

        if (element) {
            element.innerHTML = count.toString()
        } else {
            console.warn(`Unknown countField: ${name}`)
        }
    }
}
