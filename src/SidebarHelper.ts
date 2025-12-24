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
        if (!data.guid) return

        const keyInfo = this.keys.get(data.guid as string)
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
            for (const [key, count] of keyInfo.capsules) {
                const capsuleName = this.capsuleNames[key] ?? key
                html += `${capsuleName}: ${count}<br />`
            }
        }

        html += '</td>'
        html += '</tr>'

        tbody.insertAdjacentHTML('beforeend', html)
    }
}
