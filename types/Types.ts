// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Inventory {
    export interface Items {
        resonators: Resonator[]
        weapons: Weapon[]
        mods: Modulator[]
        keys: Key[]
        cubes: Cube[]
        boosts: Boost[]
        keyCapsules: KeyCapsule[]
        capsules: KeyCapsule[]
        capsuleContents: CapsuleContents[]
    }

    export interface CapsuleContents {
        differentiator: string
        items: Record<string, number>
    }

    export interface Resonator {
        level: number
    }

    export interface Boost {
        type: string
    }

    export interface Weapon {
        type: string
        level: number
    }

    export interface Modulator {
        type: string
        rarity: IITC.ModRarity
    }

    export interface Key {
        guid: string
        title: string
        lat: number
        lng: number
    }

    export interface Cube {
        level: number
    }

    export interface KeyCapsule {
        differentiator: string
        count: number
        keys: KeyCapsuleItem[]
    }

    export interface KeyCapsuleItem {
        key: Key
        count: number
    }
}

export interface KeyInfo {
    portal: Portal
    total: number
    atHand?: number
    capsules?: Map<string, number>
}

interface Portal {
    guid: string
    title: string
    lat: number
    lng: number
}

interface PluginSync {
    // Other plugin call this to register a field as CollaborativeMap to sync with Google Drive API
    // example: plugin.sync.registerMapForSync('keys', 'keysdata', plugin.keys.updateCallback, plugin.keys.initializedCallback)
    // which register plugin.keys.keysdata
    //
    // updateCallback function format: function(pluginName, fieldName, null, fullUpdated)
    // updateCallback will be fired when local or remote pushed update to Google Drive API
    // fullUpdated is true when remote update occur during local client offline, all data is replaced by remote data
    // the third parameter is always null for compatibility
    //
    // initializedCallback function format: function(pluginName, fieldName)
    // initializedCallback will be fired when the storage finished initialize and good to use
    registerMapForSync: (pluginName: string, fieldName: string, callback: CallableFunction, initializedCallback: CallableFunction) => void

    // Other plugin call this function to push update to Google Drive API
    // example:
    // plugin.sync.updateMap('keys', 'keysdata', ['guid1', 'guid2', 'guid3'])
    // Which will push plugin.keys.keysdata['guid1'] etc. to Google Drive API
    updateMap: (pluginName: string, fieldName: string, keyArray: unknown) => void
}

export interface HelperHandlebars {
    compile: (templateString: any) => Handlebars.TemplateDelegate
    registerHelper: (name: string, function_: Handlebars.HelperDelegate) => void
}

declare global {
    namespace IITC {
        namespace utils {
            /**
             * Point-in-polygon test (PNPOLY ray-casting algorithm).
             * Source: core/code/utils.js in IITC-CE.
             * NOTE: despite the JSDoc saying L.LatLng, the implementation uses .x/.y
             * (L.Point properties). Convert with map.latLngToLayerPoint() before calling.
             */
            function isPointInPolygon(polygon: L.Point[], point: L.Point): boolean
        }
    }
    interface Window {
        plugin: {
            KuKuInventory: any
            sync?: PluginSync
            HelperHandlebars: HelperHandlebars
            drawTools?: {
                drawnItems: L.FeatureGroup<L.ILayer>
            }
        }
    }
}