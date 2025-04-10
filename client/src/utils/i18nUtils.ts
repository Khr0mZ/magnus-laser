import { TFunction } from 'i18next'

/**
 * Translates a building type enum value
 * @param t Translation function
 * @param type The building type enum value
 * @returns Translated string
 */
export const translateBuildingType = (t: TFunction, type: string): string => {
    return t(`buildings.type.${type}`)
}

/**
 * Translates a building ownership enum value
 * @param t Translation function
 * @param ownership The ownership enum value
 * @returns Translated string
 */
export const translateBuildingOwnership = (t: TFunction, ownership: string): string => {
    return t(`buildings.ownership.${ownership}`)
}

/**
 * Translates a building security personnel enum value
 * @param t Translation function
 * @param security The security personnel enum value
 * @returns Translated string
 */
export const translateSecurity = (t: TFunction, security: string): string => {
    return t(`buildings.security.${security}`)
}

/**
 * Translates a building style enum value
 * @param t Translation function
 * @param style The style enum value
 * @returns Translated string
 */
export const translateStyle = (t: TFunction, style: string): string => {
    return t(`buildings.style.${style}`)
}

/**
 * Translates a building event enum value
 * @param t Translation function
 * @param event The event enum value
 * @returns Translated string
 */
export const translateEvent = (t: TFunction, event: string): string => {
    return t(`buildings.event.${event}`)
}

/**
 * Translates a building secret enum value
 * @param t Translation function
 * @param secret The secret enum value
 * @returns Translated string
 */
export const translateSecret = (t: TFunction, secret: string): string => {
    return t(`buildings.secret.${secret}`)
}

/**
 * Translates a gang type enum value
 * @param t Translation function
 * @param type The gang type enum value
 * @returns Translated string
 */
export const translateGangType = (t: TFunction, type: string): string => {
    return t(`gangs.type.${type}`)
}

/**
 * Translates a gang cyberwarequality enum value
 * @param t Translation function
 * @param cyberwareQuality The cyberware quality enum value
 * @returns Translated string
 */
export const translateGangCyberwareQuality = (t: TFunction, cyberwareQuality: string): string => {
    return t(`gangs.cyberwareQuality.${cyberwareQuality}`)
}

/**
 * Translates a gang status enum value
 * @param t Translation function
 * @param status The status enum value
 * @returns Translated string
 */
export const translateGangStatus = (t: TFunction, status: string): string => {
    return t(`gangs.status.${status}`)
}

/**
 * Translates a gang color enum value
 * @param t Translation function
 * @param color The color enum value
 * @returns Translated string
 */
export const translateGangColor = (t: TFunction, color: string): string => {
    return t(`gangs.color.${color}`)
}

/**
 * Translates a gang name type enum value
 * @param t Translation function
 * @param name The name type enum value
 * @returns Translated string
 */
export const translateGangName = (t: TFunction, name: string): string => {
    return t(`gangs.name.${name}`)
}

/**
 * Translates a gang sin enum value
 * @param t Translation function
 * @param sin The sin enum value
 * @returns Translated string
 */
export const translateGangSin = (t: TFunction, sin: string): string => {
    return t(`gangs.sin.${sin}`)
}

/**
 * Translates a gang known for part 1 enum value
 * @param t Translation function
 * @param part1 The known for part 1 enum value
 * @returns Translated string
 */
export const translateKnownForPart1 = (t: TFunction, part1: string): string => {
    return t(`gangs.knownForPart1.${part1}`)
}

/**
 * Translates a gang known for part 2 enum value
 * @param t Translation function
 * @param part2 The known for part 2 enum value
 * @returns Translated string
 */
export const translateKnownForPart2 = (t: TFunction, part2: string): string => {
    return t(`gangs.knownForPart2.${part2}`)
}

/**
 * Translates a gang flaw enum value
 * @param t Translation function
 * @param flaw The flaw enum value
 * @returns Translated string
 */
export const translateGangFlaw = (t: TFunction, flaw: string): string => {
    return t(`gangs.flaw.${flaw}`)
}

/**
 * Translates a gang attitude enum value
 * @param t Translation function
 * @param attitude The attitude enum value
 * @returns Translated string
 */
export const translateGangAttitude = (t: TFunction, attitude: string): string => {
    return t(`gangs.attitude.${attitude}`)
}

/**
 * Translates a gang news enum value
 * @param t Translation function
 * @param news The news enum value
 * @returns Translated string
 */
export const translateGangNews = (t: TFunction, news: string): string => {
    return t(`gangs.news.${news}`)
}

/**
 * Generic function to translate labels
 * @param t Translation function
 * @param key The label key
 * @param module The module (buildings or gangs)
 * @returns Translated string
 */
export const translateLabel = (t: TFunction, key: string, module: 'buildings' | 'gangs' | 'fixerJobs'): string => {
    return t(`${module}.labels.${key}`)
}

/**
 * Translate any enum value from a namespace
 * @param t Translation function
 * @param key The enum key
 * @param namespace The namespace (e.g., 'buildings.type', 'gangs.color')
 * @returns Translated string
 */
export const translateEnum = (t: TFunction, key: string, namespace: string): string => {
    return t(`${namespace}.${key}`)
}
