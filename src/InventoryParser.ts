import {IngressInventory} from '../types/IngressInventory'
import {Inventory} from '../types/Types'
import {Utility} from './Utility'

export class InventoryParser {
    public parse(items: IngressInventory.Items): Inventory.Items {
        const inventory: Inventory.Items = {
            resonators: [],
            weapons: [],
            mods: [],
            keys: [],
            cubes: [],
            boosts: [],
            keyCapsules: [],
        }

        for (const whyIsThisAnArray of items) {
            // This is a #/&§$%%$ array...
            const object = whyIsThisAnArray[2]

            let type = '', designation = '', level = 0

            if (Object.prototype.hasOwnProperty.call(object, 'resource')) {
                type = object.resource.resourceType
            } else if (Object.prototype.hasOwnProperty.call(object, 'resourceWithLevels')) {
                type = object.resourceWithLevels.resourceType
                level = object.resourceWithLevels.level
            } else if (Object.prototype.hasOwnProperty.call(object, 'modResource')) {
                type = 'modResource'
            } else {
                console.warn('Unknown resource type in object', object)
            }

            if (Object.prototype.hasOwnProperty.call(object, 'timedPowerupResource')) {
                designation = object.timedPowerupResource.designation
            }

            switch (type) {
                case 'EMITTER_A': // This is a so-called "resonator"
                    inventory.resonators.push({level: level})
                    break
                case 'ULTRA_STRIKE':
                case 'EMP_BURSTER':
                    inventory.weapons.push({
                        type: type,
                        level: level
                    })
                    break
                case 'FLIP_CARD':
                    inventory.weapons.push({
                        type: object.flipCard.flipCardType,
                        level: 0
                    })
                    break
                case 'PORTAL_LINK_KEY': {
                    const location: string = object.portalCoupler.portalLocation
                    const parts: string[] = location.split(',')
                    inventory.keys.push({
                        guid: object.portalCoupler.portalGuid,
                        title: object.portalCoupler.portalTitle,
                        lat: Utility.convertHexToSignedFloat(parts[0]),
                        lng: Utility.convertHexToSignedFloat(parts[1]),
                    })
                    break
                }
                case 'KEY_CAPSULE': {
                    const items: IngressInventory.ContainerItem[] = object.container.stackableItems
                    inventory.keyCapsules.push({
                        differentiator: object.moniker.differentiator,
                        count: object.container.currentCount,
                        keys: this.listKeysInCapsule(items),
                    })
                    break
                }
                case 'PLAYER_POWERUP': // apex
                    if ('APEX' === object.playerPowerupResource.playerPowerupEnum) {
                        inventory.boosts.push({type: 'APEX'})
                    } else {
                        console.warn('Unknown PLAYER_POWERUP', object)
                    }
                    break
                case 'PORTAL_POWERUP':
                    inventory.boosts.push({type: designation})
                    break
                case 'modResource':
                    inventory.mods.push({
                        type: object.modResource.resourceType,
                        rarity: object.modResource.rarity,
                    })
                    break
                case 'POWER_CUBE':
                    inventory.cubes.push({level: level})
                    break
                case 'BOOSTED_POWER_CUBE': // hyper cube
                    inventory.cubes.push({level: 9})
                    break
                case 'CAPSULE': // TODO process capsules
                case 'KINETIC_CAPSULE':
                case 'ENTITLEMENT': // ???
                case 'DRONE':
                    // todo process those items (?)
                    // console.log(`todo type: ${type}`, object)
                    break
                default:
                    console.warn(`Unknown type: ${type}`, object)
                    break
            }
        }

        return inventory
    }

    private listKeysInCapsule(items: IngressInventory.ContainerItem[]): Inventory.KeyCapsuleItem[] {
        const keys = []
        for (const capsuleItem of items) {
            const coupler = capsuleItem.exampleGameEntity[2].portalCoupler
            const parts = coupler.portalLocation.split(',')

            const key: Inventory.Key = {
                guid: coupler.portalGuid,
                title: coupler.portalTitle,
                lat: Utility.convertHexToSignedFloat(parts[0]),
                lng: Utility.convertHexToSignedFloat(parts[1]),
            }
            const item: Inventory.KeyCapsuleItem = {
                key: key,
                count: capsuleItem.itemGuids.length,
            }

            keys.push(item)
        }

        return keys
    }
}
