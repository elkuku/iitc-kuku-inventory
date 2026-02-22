import {InventoryHelper} from './InventoryHelper'
import {CapsuleNamesMap} from './StorageHelper'

export interface ExportOptions {
    includeKeys: boolean
    polygonOnly: boolean
    detailed: boolean
    resonators: boolean
    weapons: boolean
    mods: boolean
    cubes: boolean
    boosts: boolean
    includeAgent: boolean
}

export class ExportHelper {
    private capsuleNames: CapsuleNamesMap = {}

    public constructor(private inventoryHelper: InventoryHelper) {}

    public setCapsuleNames(capsuleNames: CapsuleNamesMap) {
        this.capsuleNames = capsuleNames
    }

    public async exportAll(options: ExportOptions): Promise<void> {
        const exportData: Record<string, unknown> = {}

        if (options.includeAgent) {
            const agentName = (window as any).PLAYER?.nickname as string | undefined
            if (agentName) exportData.agent = agentName
        }

        if (options.includeKeys) {
            if (options.polygonOnly && !this.hasDrawnPolygons()) {
                alert('No drawn polygons found. Use the Draw Tools plugin to draw a polygon on the map first.')
                return
            }

            const keys = await this.inventoryHelper.getKeysInfo()
            const keysData: Record<string, unknown>[] = []

            for (const info of keys.values()) {
                if (options.polygonOnly && !this.isInsideDrawnPolygon(info.portal.lat, info.portal.lng)) {
                    continue
                }

                const entry: Record<string, unknown> = {
                    guid: info.portal.guid,
                    title: info.portal.title,
                    lat: info.portal.lat,
                    lng: info.portal.lng,
                    total: info.total,
                }

                if (options.detailed) {
                    entry.atHand = info.atHand ?? 0
                    const capsules: Record<string, number> = {}
                    if (info.capsules) {
                        for (const [id, count] of info.capsules) {
                            capsules[this.capsuleNames[id] ?? id] = count
                        }
                    }
                    entry.capsules = capsules
                }

                keysData.push(entry)
            }

            if (options.polygonOnly && keysData.length === 0) {
                alert('No keys found inside the drawn polygon(s).')
                return
            }

            exportData.keys = keysData
        }

        if (options.resonators) {
            exportData.resonators = Object.fromEntries(await this.inventoryHelper.getResonatorsInfo())
        }
        if (options.weapons) {
            exportData.weapons = Object.fromEntries(await this.inventoryHelper.getWeaponsInfo())
        }
        if (options.mods) {
            exportData.mods = Object.fromEntries(await this.inventoryHelper.getModsInfo())
        }
        if (options.cubes) {
            exportData.cubes = Object.fromEntries(await this.inventoryHelper.getCubesInfo())
        }
        if (options.boosts) {
            exportData.boosts = Object.fromEntries(await this.inventoryHelper.getBoostsInfo())
        }

        const timestamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '')
        const json = JSON.stringify(exportData, undefined, 2)
        const blob = new Blob([json], {type: 'application/json'})
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `kinventory-export-${timestamp}.json`
        anchor.click()
        URL.revokeObjectURL(url)
    }

    private hasDrawnPolygons(): boolean {
        if (!window.plugin.drawTools?.drawnItems) {
            return false
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call
        return window.plugin.drawTools.drawnItems
            .getLayers()
            .some((layer: L.ILayer) => layer instanceof L.Polygon)
    }

    private isInsideDrawnPolygon(lat: number, lng: number): boolean {
        if (!window.plugin.drawTools?.drawnItems) {
            return false
        }
        const testPoint = window.map.latLngToLayerPoint(L.latLng(lat, lng))
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call
        return window.plugin.drawTools.drawnItems
            .getLayers()
            .filter((layer: L.ILayer): layer is L.Polygon => layer instanceof L.Polygon)
            .some((polygon: L.Polygon) => {
                const ring = this.getOuterRing(polygon)
                    .map(ll => window.map.latLngToLayerPoint(ll))
                return IITC.utils.isPointInPolygon(ring, testPoint)
            })
    }

    private getOuterRing(polygon: L.Polygon): L.LatLng[] {
        const latlngs = polygon.getLatLngs() as any[]
        if (latlngs.length === 0) return []
        // Leaflet 0.x returns a flat LatLng[]; Leaflet 1.x returns LatLng[][] (array of rings)
        if (latlngs[0] instanceof L.LatLng) {
            return latlngs as L.LatLng[]
        }
        // rings[0] is the outer ring
        const outerRing = latlngs[0] as any[]
        if (outerRing.length > 0 && outerRing[0] instanceof L.LatLng) {
            return outerRing as L.LatLng[]
        }
        // Deeper nesting (multipolygon — shouldn't occur with draw tools)
        return (outerRing[0] as L.LatLng[]) ?? []
    }
}
