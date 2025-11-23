import {KeyInfo} from '../types/Types'
import {LocalStorageHelper} from './LocalStorageHelper'

export class SidebarHelper {

    private keys: Map<string, KeyInfo>
    private readonly capsuleNames: Map<string, string>

    constructor() {
        this.capsuleNames = new LocalStorageHelper().loadMap('capsuleNames') ?? new Map()
    }

    public addKeys(keys: Map<string, KeyInfo>) {
        this.keys = keys
    }

    public onPortalDetailsUpdated(data: any) {
        console.log('onPortalDetailsUpdated', data)
        if (data.guid) this.updateKeyDetails(data.guid as string)
    }

    public updateKeyDetails(guid: string) {
        if (!this.keys.has(guid)) return

        const keyInfo = this.keys.get(guid)
        if (!keyInfo) throw new Error('keyInfo not found')

        const tbody = document.querySelector('#randdetails tbody')
        if (!tbody) return

        let html = '<tr>'
        html += `<td>Keys: ${keyInfo.total}</td>`
        html += keyInfo.atHand && keyInfo.atHand !== keyInfo.total
            ? `<td>Hand: ${keyInfo.atHand}</td>`
            : '<td></td>'

        if (keyInfo.capsules) {
            html += '<td colspan="2">'
            for (const [capsule, v] of keyInfo.capsules) {
                html += `${this.getCapsuleName(capsule)}: ${v}<br />`
            }
            html += '</td>'
        } else {
            html += '<td colspan="2"></td>'
        }
        html += '</tr>'

        tbody.insertAdjacentHTML('beforeend', html)
    }

    private getCapsuleName(key: string): string {
        return this.capsuleNames.get(key) ?? key
    }
}
