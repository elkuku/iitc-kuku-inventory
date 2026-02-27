import {KeyInfo} from '../types/Types'
import Portal = IITC.Portal;
import {CapsuleNamesMap} from './StorageHelper'

export class LayerHelper {
    private readonly layerGroup: L.LayerGroup<any>
    private keys: Map<string, KeyInfo> = new Map()
    private markers: Map<string, L.Marker>
    private capsuleNames: CapsuleNamesMap = {}
    private displayMode: 'count' | 'icon' = 'count'

    constructor(name: string) {
        this.layerGroup = new L.LayerGroup()
        this.markers = new Map<string, L.Marker>()

        window.addLayerGroup(name, this.layerGroup, true)
    }

    public setDisplayMode(mode: 'count' | 'icon'): void {
        this.displayMode = mode
        this.refreshMarkers()
    }

    private refreshMarkers(): void {
        for (const marker of this.markers.values()) {
            this.layerGroup.removeLayer(marker)
        }
        this.markers.clear()

        for (const guid of Object.keys(window.portals)) {
            if (!this.keys.has(guid)) continue
            const marker = this.createMarker(guid)
            this.layerGroup.addLayer(marker)
            this.markers.set(guid, marker)
        }
    }

    public setKeys(keys: Map<string, KeyInfo>) {
        this.keys = keys
    }

    public setCapsuleNames(capsuleNames: CapsuleNamesMap) {
        this.capsuleNames = capsuleNames
    }

    public onPortalAdded(portal: Portal) {
        const guid = portal.options.guid
        if (!this.keys.has(guid)) return
        if (this.markers.has(guid)) return

        const marker = this.createMarker(guid)

        this.layerGroup.addLayer(marker)
        this.markers.set(guid, marker)
    }

    public onPortalRemoved(portal: Portal) {
        const guid = portal.options.guid
        if (!this.markers.has(guid)) return

        this.layerGroup.removeLayer(this.markers.get(guid))
        this.markers.delete(guid)
    }

    public onPortalSelected(data: any) {
        if (data.unselectedPortalGuid) this.toggleDetails(data.unselectedPortalGuid as string, false)
        if (data.selectedPortalGuid) this.toggleDetails(data.selectedPortalGuid as string, true)
    }

    private toggleDetails(guid: string, showDetails: boolean) {
        if (!this.markers.has(guid)) return

        this.layerGroup.removeLayer(this.markers.get(guid))
        this.markers.delete(guid)

        const newMarker = this.createMarker(guid, showDetails && !this.teamInventoryHandles(guid))

        this.layerGroup.addLayer(newMarker)
        this.markers.set(guid, newMarker)
    }

    /**
     * Returns true when the team inventory layer is active and has data for
     * this portal, meaning it will show its own details popup and the
     * inventory plugin should not show a competing one.
     */
    private teamInventoryHandles(guid: string): boolean {
        const teamLayer = (window.plugin as any).KuKuTeamInventory?.layerHelper
        if (!teamLayer) return false
        return (window.map?.hasLayer(teamLayer.layerGroup) ?? false)
            && (teamLayer.keys?.has(guid) ?? false)
    }

    private createMarker(guid: string, withDetails: boolean = false): L.Marker {
        const keyInfo = this.keys.get(guid)
        if (!keyInfo) throw new Error('keyInfo not found')

        const isIconMode = this.displayMode === 'icon' && !withDetails

        let innerHtml: string
        if (isIconMode) {
            innerHtml = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14">'
                + '<path fill="currentColor" d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6'
                + 'c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>'
                + '</svg>'
        } else {
            innerHtml = `<strong>${keyInfo.total}</strong>`
        }

        if (withDetails) {
            if (keyInfo.atHand) innerHtml += `<br /><em>Hand: ${keyInfo.atHand}</em>`

            if (keyInfo.capsules) {
                for (const [key, count] of keyInfo.capsules) {
                    const capsuleName = this.capsuleNames[key] ?? key
                    innerHtml += `<br />${capsuleName}: ${count}`
                }
            }
        }

        let bubbleClass = 'key-bubble'
        if (isIconMode) bubbleClass += ' key-bubble--icon'
        else if (withDetails) bubbleClass += ' key-bubble--details'

        return L.marker(
            new L.LatLng(keyInfo.portal.lat, keyInfo.portal.lng),
            {
                icon: new L.DivIcon({
                    html: `<div class="${bubbleClass}">${innerHtml}</div>`,
                    className: 'layer-key-info',
                    iconSize: [0, 0],
                    iconAnchor: [0, 0],
                }),
                interactive: false,
                zIndexOffset: withDetails ? 10000 : 0,
            }
        )
    }
}