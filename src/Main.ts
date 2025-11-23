import * as Plugin from "iitcpluginkit"

import {DialogHelper} from './DialogHelper'
import {LayerHelper} from './LayerHelper'
import {InventoryHelper} from './InventoryHelper'
import Portal = IITC.Portal;

const PLUGIN_NAME = 'KuKuInventory'

class KuKuInventory implements Plugin.Class {

    private dialogHelper: DialogHelper
    private dialog: JQuery | undefined
    private layerHelper: LayerHelper

    init() {
        console.log(`${PLUGIN_NAME} ${VERSION}`)

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('./styles.css')

        const inventoryHelper = new InventoryHelper()

        this.dialogHelper = new DialogHelper(PLUGIN_NAME, 'Inventory', inventoryHelper)
        this.layerHelper = new LayerHelper('Portal keys KUKU')

        setTimeout(async () => {
            const keys = await inventoryHelper.getKeysInfo()
            this.layerHelper.addKeys(keys)
        }, 1000) // delay setup and thus requesting data, or we might encounter a server error

        this.createButtons()

        window.addHook('portalAdded', this.onPortalAdded)
        window.addHook('portalSelected', this.onPortalSelected)
    }

    public showPanel(name: string) {
        this.dialogHelper.showPanel(name)
    }

    public async refresh() {
        await this.dialogHelper.refresh()
    }

    public storeCapsuleNames() {
        this.dialogHelper.storeCapsuleNames()

        // todo: reload
    }

    private onPortalAdded(data: any) {
        const portal: Portal = data.portal
        main.layerHelper.addPortal(portal)
    }

    private onPortalSelected(data: any) {
        main.layerHelper.onPortalSelected(data)
    }

    private createButtons(): void {
        $('#toolbox').append(
            $('<a>', {
                text: 'KInventory',
                click: () => this.showDialog()
            })
        )
    }

    private async showDialog(): Promise<void> {
        if (!this.dialog) {
            this.dialog = this.dialogHelper.getDialog()
            this.dialog.on('dialogclose', () => {
                this.dialog = undefined
            })

            await this.dialogHelper.updateDialog()
        }
    }
}

export const main = new KuKuInventory()

Plugin.Register(main, PLUGIN_NAME)
