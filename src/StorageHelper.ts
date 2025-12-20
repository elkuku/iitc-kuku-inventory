import {LocalStorageHelper} from './LocalStorageHelper'

export type CapsuleNamesMap = Record<string, string>

export interface Settings {
    autoSync: boolean
    version: number
}

export class StorageHelper {
    private capsuleNamesStore = new LocalStorageHelper<CapsuleNamesMap>(
        'capsuleNames',
        {}
    )

    private settingsStore = new LocalStorageHelper<Settings>(
        'settings',
        {autoSync: true, version: 1}
    )

    public capsuleNames: CapsuleNamesMap = this.capsuleNamesStore.load()
    public settings: Settings = this.settingsStore.load()

    constructor(
        private readonly pluginName: string,
        private readonly updateCallback: (fieldName: string) => void,
    ) {}

    register(): void {
        const sync = window.plugin.sync
        if (!sync) {
            console.warn(this.pluginName + ' - Sync plugin not available; local-only mode')
            return
        }

        sync.registerMapForSync(this.pluginName, 'capsuleNames', this.onUpdate, this.onInitialized)
        sync.registerMapForSync(this.pluginName, 'settings', this.onUpdate, this.onInitialized)
    }

    // ------------------------------------------------------------------
    // Callbacks from Sync plugin
    // ------------------------------------------------------------------

    private onInitialized = (pluginName?: string, fieldName?: string) => {
        console.log(`[${pluginName}] ${fieldName} initialized`)
    }

    private onUpdate = (
        pluginName?: string,
        fieldName?: string,
        _unused?: null,
        fullUpdated?: boolean
    ): void => {
        if (fullUpdated) {
            console.log(`[${this.pluginName}] ${fieldName} replaced from Drive`)
        } else {
            console.log(`[${this.pluginName}] - ${fieldName} updated --- ${pluginName} / ${_unused}`)
        }

        if (fieldName !== undefined) {
            this.updateCallback(fieldName)
        }
    }

    // ------------------------------------------------------------------
    // Update helpers
    // ------------------------------------------------------------------

    public persistField(field: string): void {
        switch (field) {
            case 'capsuleNames':
                this.capsuleNamesStore.save(this.capsuleNames)
                break
            case 'settings':
                this.settingsStore.save(this.settings)
                break
            default:
                alert('Unknown field in persist: ' + field)
        }
    }

    public updateCapsuleNames(keys: string[]): void {
        if (window.plugin.sync) {
            window.plugin.sync.updateMap(this.pluginName, 'capsuleNames', keys)
        }
    }

    public updateSettings(): void {
        if (window.plugin.sync) {
            window.plugin.sync.updateMap(this.pluginName, 'settings', ['settings'])
        }
    }
}
