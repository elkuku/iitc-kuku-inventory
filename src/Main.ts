import * as Plugin from "iitcpluginkit"

import {DialogHelper} from './DialogHelper'
import {InventoryHelper} from './InventoryHelper'
import {LayerHelper} from './LayerHelper'
import {SidebarHelper} from './SidebarHelper'
import {CapsuleNamesMap, StorageHelper} from './StorageHelper'
import Portal = IITC.Portal;

const PLUGIN_NAME = 'KuKuInventory'

class KuKuInventory implements Plugin.Class {

    private dialogHelper: DialogHelper
    private dialog: JQuery | undefined
    private layerHelper: LayerHelper
    private sidebarHelper: SidebarHelper
    private storageHelper: StorageHelper

    // Synced with the sync plugin
    public capsuleNames: CapsuleNamesMap = {}

    init() {
        console.log(`${PLUGIN_NAME} ${VERSION}`)

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('./styles.css')

        const inventoryHelper = new InventoryHelper()

        this.dialogHelper = new DialogHelper(PLUGIN_NAME, 'Inventory', inventoryHelper)
        this.storageHelper = new StorageHelper(PLUGIN_NAME, this.updateCallback)
        this.layerHelper = new LayerHelper('Portal keys')
        this.sidebarHelper = new SidebarHelper()

        this.capsuleNames = this.storageHelper.capsuleNames
        this.setCapsuleNames()

        setTimeout( // delay setup and thus requesting data, or we might encounter a server error.
            async () => {
                const keys = await inventoryHelper.getKeysInfo()
                this.layerHelper.setKeys(keys)
                this.sidebarHelper.setKeys(keys)
            },
            1000
        )

        this.createButtons()
        this.addHooks()

        this.storageHelper.register()
    }

    public async refresh() {
        await this.dialogHelper.refresh()
    }

    public async storeCapsuleNames() {
        const capsuleNames = this.dialogHelper.getCapsuleNames()

        this.storageHelper.capsuleNames = capsuleNames
        this.capsuleNames = capsuleNames

        this.storageHelper.updateCapsuleNames(Object.keys(capsuleNames))
        this.storageHelper.persistField('capsuleNames')

        this.setCapsuleNames()

        await this.dialogHelper.updateDialog()

        alert('Capsule names have been saved. :)')
    }

    private updateCallback = async (fieldName: string): Promise<void> => {
        console.log(`[${PLUGIN_NAME}] - UPDATING: ${fieldName}`)

        switch (fieldName) {
            case 'settings':
                break
            case 'capsuleNames':
                this.setCapsuleNames()
                await this.dialogHelper.updateDialog()

                this.storageHelper.capsuleNames = this.capsuleNames
                this.storageHelper.persistField('capsuleNames')
                break
            default:
                console.error(`Unknown field ${fieldName}`)
        }
    }

    private setCapsuleNames() {
        this.layerHelper.setCapsuleNames(this.capsuleNames)
        this.sidebarHelper.setCapsuleNames(this.capsuleNames)
        this.dialogHelper.setCapsuleNames(this.capsuleNames)
    }

    private onPortalAdded = (data: any) => {
        this.layerHelper.onPortalAdded(data.portal as Portal)
    }

    private onPortalRemoved = (data: any) => {
        this.layerHelper.onPortalRemoved(data.portal as Portal)
    }

    private onPortalSelected = (data: any) => {
        this.layerHelper.onPortalSelected(data)
    }

    private onPortalDetailsUpdated = (data: any) => {
        this.sidebarHelper.onPortalDetailsUpdated(data)
    }

    private addHooks() {
        window.addHook('portalAdded', this.onPortalAdded)
        window.addHook('portalRemoved', this.onPortalRemoved)
        window.addHook('portalSelected', this.onPortalSelected)
        window.addHook('portalDetailsUpdated', this.onPortalDetailsUpdated)
    }

    private createButtons(): void {
        IITC.toolbox.addButton({
            label: 'KInventory',
            action: this.showDialog,
            title: 'Show the agents inventory',
        })
    }

    private showDialog = async (): Promise<void> => {
        if (!this.dialog) {
            this.dialog = this.dialogHelper.getDialog()
            this.dialog.on('dialogclose', () => {
                this.dialog = undefined
            })

            await this.dialogHelper.updateDialog()

            $(`#${PLUGIN_NAME}-Tabs`).tabs()
        }
    }
}

Plugin.Register(new KuKuInventory(), PLUGIN_NAME)
