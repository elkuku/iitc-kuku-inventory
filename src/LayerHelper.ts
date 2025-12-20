import {KeyInfo} from '../types/Types'
import Portal = IITC.Portal;
import {CapsuleNamesMap} from './StorageHelper'

export class LayerHelper {
    private readonly layerGroup: L.LayerGroup<any>
    private keys: Map<string, KeyInfo>
    private markers: Map<string, L.Marker>
    private capsuleNames: CapsuleNamesMap = {}

    constructor(name: string) {
        this.layerGroup = new L.LayerGroup()
        this.markers = new Map<string, L.Marker>()

        window.addLayerGroup(name, this.layerGroup, true)
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

        const newMarker = this.createMarker(guid, showDetails)

        this.layerGroup.addLayer(newMarker)
        this.markers.set(guid, newMarker)
    }

    private createMarker(guid: string, withDetails: boolean = false): L.Marker {
        const keyInfo = this.keys.get(guid)
        if (!keyInfo) throw new Error('keyInfo not found')

        let html = `${keyInfo.total}`

        if (withDetails) {
            if (keyInfo.atHand) html += `<br /><strong>Hand: ${keyInfo.atHand}</strong>`

            if (keyInfo.capsules) {
                for (const [key, count] of keyInfo.capsules) {
                    const capsuleName = this.capsuleNames[key] ?? key
                    html += `<br />${capsuleName}: ${count}`
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
}