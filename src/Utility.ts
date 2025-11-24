export const Utility = {
    /**
     * by EisFrei ?
     */
    formatTimeString: (milliseconds: number): string => {
        if (milliseconds < 0) {
            milliseconds = -milliseconds
        }
        let seconds = Math.floor(milliseconds / 1000)
        if (seconds < 60)
            return `${seconds} seconds`
        else {
            const minutes = Math.floor(seconds / 60)
            seconds = seconds % 60
            return minutes > 5 ? `${minutes} minutes` : `${minutes}:${seconds < 10 ? '0' : ''}${seconds} minutes`
        }
    },

    /**
     * by EisFrei ?
     */
    distanceToCenter: (latLng: L.LatLng) => {
        const center = window.map.getCenter()

        const distance = latLng.distanceTo(center)

        if (distance >= 10000) {
            return `${Math.round(distance / 1000)} km`
        } else if (distance >= 1000) {
            return `${Math.round(distance / 100) / 10} km`
        }

        return `${Math.round(distance)} m`
    },

    parseDistance: (distanceStr: string): number => {
        const match = /^([\d.]+)\s*(\w+)$/.exec(distanceStr.trim())

        if (!match) return 0

        const value = parseFloat(match[1])
        const unit = match[2].toLowerCase()

        switch (unit) {
            case 'm':
                return value
            case 'km':
                return value * 1000
            default:
                return value
        }
    },

    /**
     * by EisFrei ?
     */
    convertHexToSignedFloat: (num: string) => {
        let int = parseInt(num, 16)
        if ((int & 0x80000000) === -0x80000000) {
            int = -1 * (int ^ 0xFFFFFFFF) + 1
        }
        return int / 10e5
    },

    sortMapByKey: <T>(
        map: Map<string, T>, order: string[]
    ): Map<string, any> =>
        new Map(
            [...map.entries()].toSorted(
                ([a], [b]) => order.indexOf(a) - order.indexOf(b)
            )
        ),

    sortMapByCompoundKey: <T>(
        map: Map<string, T>, orderPart1: string[], orderPart2: string[]
    ): Map<string, any> =>
        new Map(
            [...map.entries()].toSorted(
                ([keyA], [keyB]) => {
                    const [partA1, partA2] = keyA.split('-')
                    const [partB1, partB2] = keyB.split('-')

                    const order1Diff = orderPart1.indexOf(partA1) - orderPart1.indexOf(partB1)
                    if (order1Diff !== 0) {

                        return order1Diff
                    }

                    return orderPart2.indexOf(partA2) - orderPart2.indexOf(partB2)
                }
            )
        ),

    fromE6: (value: number): number => value / 1_000_000
}