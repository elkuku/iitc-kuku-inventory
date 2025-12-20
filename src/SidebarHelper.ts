import {KeyInfo} from '../types/Types'
import {CapsuleNamesMap} from './StorageHelper'

export class SidebarHelper {

    private keys: Map<string, KeyInfo>
    private capsuleNames: CapsuleNamesMap = {}

    public setKeys(keys: Map<string, KeyInfo>) {
        this.keys = keys
    }

    public setCapsuleNames(capsuleNames: CapsuleNamesMap) {
        this.capsuleNames = capsuleNames
    }

    public onPortalDetailsUpdated(data: any) {
        if (data.guid) this.updateKeyDetails(data.guid as string)
    }

    private updateKeyDetails(guid: string) {
        const keyInfo = this.keys.get(guid)
        if (!keyInfo) return

        const tbody = document.querySelector('#randdetails tbody')
        if (!tbody) return

        let html = '<tr>'
        html += `<td>Keys: ${keyInfo.total}</td>`
        html += keyInfo.atHand && keyInfo.atHand !== keyInfo.total
            ? `<td>Hand: ${keyInfo.atHand}</td>`
            : '<td></td>'
        html += '<td colspan="2">'

        if (keyInfo.capsules) {
            for (const [capsule, v] of keyInfo.capsules) {
                html += `${this.getCapsuleName(capsule)}: ${v}<br />`
            }
        }

        html += '</td>'
        html += '</tr>'

        tbody.insertAdjacentHTML('beforeend', html)
    }

    private getCapsuleName(key: string): string {
        return this.capsuleNames[key] ?? key
    }
}
