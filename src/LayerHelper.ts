import {KeyInfo} from '../types/Types'
import {LocalStorageHelper} from './LocalStorageHelper'
import Portal = IITC.Portal;

export class LayerHelper {
    private readonly layerGroup: L.LayerGroup<any>
    private keys: Map<string, KeyInfo>
    private markers: Map<string, L.Marker>

    private localStorageHelper: LocalStorageHelper
    private readonly capsuleNames: Map<string, string>

    constructor(name: string) {
        this.layerGroup = new L.LayerGroup()
        this.markers = new Map<string, L.Marker>()

        window.addLayerGroup(name, this.layerGroup, true)

        this.localStorageHelper = new LocalStorageHelper()

        this.capsuleNames = this.localStorageHelper.loadMap('capsuleNames') ?? new Map()
    }

    public addKeys(keys: Map<string, KeyInfo>) {
        this.keys = keys
    }

    public addPortal(portal: Portal) {
        if (!this.keys.has(portal.options.guid)) return
        if (this.markers.has(portal.options.guid)) return

        const marker = this.createMarker(portal.options.guid)

        this.layerGroup.addLayer(marker)
        this.markers.set(portal.options.guid, marker)
    }

    public toggleDetails(guid: string, showDetails: boolean) {
        if (!this.markers.has(guid)) return

        this.layerGroup.removeLayer(this.markers.get(guid))
        this.markers.delete(guid)

        const newMarker = this.createMarker(guid, showDetails)

        this.layerGroup.addLayer(newMarker)
        this.markers.set(guid, newMarker)
    }

    public onPortalSelected(data: any) {
        if (data.unselectedPortalGuid) {
            this.toggleDetails(data.unselectedPortalGuid as string, false)
        }

        if (data.selectedPortalGuid) {
            this.toggleDetails(data.selectedPortalGuid as string, true)
        }
    }

    private createMarker(guid: string, withDetails: boolean = false): L.Marker {
        const keyInfo = this.keys.get(guid)

        if (!keyInfo) {
            throw new Error('keyInfo not found')
        }

        let html = `${keyInfo.total}`

        if (withDetails) {
            if (keyInfo.atHand) html += `<br><strong>Hand: ${keyInfo.atHand}</strong>`

            if (keyInfo.capsules) {
                for (const [capsule, v] of keyInfo.capsules) {
                    html += `<br>${this.getCapsuleName(capsule)}: ${v}`
                }
            }
        }

        return L.marker(
            new L.LatLng(keyInfo.portal.lat, keyInfo.portal.lng),
            {
                icon: new L.DivIcon({
                    html: html,
                    className: 'layer-key-info'
                }),
                interactive: false,
            }
        )
    }

    private getCapsuleName(key: string): string {
        return this.capsuleNames.get(key) ?? key
    }
}