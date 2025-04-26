import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useData } from '../../contexts/dataHooks'
import { useUserPreferences } from '../../contexts/userPreferencesHooks.ts'
import { Bounty, Building, Character, FixerJob, Gang, Item } from '../../graphql/types'
import colors from '../../utils/colors'
import { ModuleTypes } from '../../utils/constants'
import {
    getBuildingColor,
    getComplementaryColor,
    getFixerJobDifficultyColor,
    getGangColorValue,
    getOrderedBountyData,
    getOrderedBuildingData,
    getOrderedCharacterData,
    getOrderedFixerJobData,
    getOrderedGangData,
    getOrderedItemData,
    processBountyValueForDisplay,
    processCharacterValueForDisplay,
    processFixerJobValueForDisplay,
    processGangValueForDisplay,
    processItemValueForDisplay,
} from '../../utils/functions'
import { processBuildingValueForDisplay } from '../../utils/functions.tsx'

import { Close } from '@mui/icons-material'
import { Masonry } from '@mui/lab'
import { baseBountyRewardPerSpeciality } from '../../utils/generators/generatorBounty.ts'
import { buttonGlitch } from './Animations'
import TiptapEditor from './TiptapEditor.tsx'

type GridViewProps = {
    targetArray: (Gang | Building | FixerJob | Character | Item | Bounty)[]
    onDelete: (index: number) => void
    moduleType: ModuleTypes
    onEdit: (index: number) => void
}

const GridView = (props: GridViewProps) => {
    const { targetArray, onDelete, moduleType, onEdit } = props
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    const { buildings, gangs, characters, items } = useData()

    // Helper function to resolve gang references
    const resolveGangReference = (gangId: string): Gang | null => {
        if (!gangId) return null
        return gangs.find((g) => g.ID === gangId) || null
    }

    // Helper function to resolve building references
    const resolveBuildingReference = (buildingId: string): Building | null => {
        if (!buildingId) return null
        return buildings.find((b) => b.ID === buildingId) || null
    }

    // Helper function to resolve character references
    const resolveCharacterReference = (characterId: string): Character | null => {
        if (!characterId) return null
        return characters.find((c) => c.ID === characterId) || null
    }

    // Helper function to resolve item references
    const resolveItemReference = (itemId: string): Item | null => {
        if (!itemId) return null
        return items.find((i) => i.ID === itemId) || null
    }

    // Helper function to process ordered data with reference resolution
    const getOrderedData = (target: Gang | Building | FixerJob | Character | Item | Bounty) => {
        let targetData: { key: string; label: string; value: unknown }[] = []
        let color: string = ''
        switch (moduleType) {
            case ModuleTypes.GANG: {
                targetData = getOrderedGangData(target as Gang, t)
                color = getGangColorValue((target as Gang).color)
                break
            }
            case ModuleTypes.BUILDING: {
                targetData = getOrderedBuildingData(target as Building, t)
                color = getBuildingColor((target as Building).type)
                break
            }
            case ModuleTypes.CHARACTER: {
                targetData = getOrderedCharacterData(target as Character, t)
                color = colors.neons.cyan.default
                break
            }
            case ModuleTypes.ITEM: {
                targetData = getOrderedItemData(target as Item, t)
                color = colors.neons.cyan.default
                break
            }
            case ModuleTypes.BOUNTY: {
                const bounty = target as Bounty

                // Create a processed version for the resolver
                const processedBounty: Bounty = structuredClone(bounty)
                let needsProcessing = false

                // Pre-process specific references to help with character display
                if (bounty.character && typeof bounty.character === 'string') {
                    const characterID = bounty.character
                    const characterRef = resolveCharacterReference(characterID)
                    // If we found a resolved character, use it
                    if (characterRef) {
                        processedBounty.character = characterRef
                        needsProcessing = true
                    }
                }

                // Use the processed version if needed, otherwise use original
                targetData = getOrderedBountyData(needsProcessing ? processedBounty : bounty, t, {
                    resolveCharacter: resolveCharacterReference,
                })
                color = colors.neons.cyan.default
                break
            }
            case ModuleTypes.FIXER_JOB: {
                const fixerJob = target as FixerJob

                // Create a processed version for the resolver
                const processedFixerJob = { ...fixerJob }
                let needsProcessing = false

                // Pre-process specific references to help with character/item display
                if (fixerJob.plot && typeof fixerJob.plot.plotSubject === 'string') {
                    // Try to resolve the plotSubject if it's a character or item ID
                    const characterRef = resolveCharacterReference(fixerJob.plot.plotSubject)
                    const itemRef = resolveItemReference(fixerJob.plot.plotSubject)

                    // If we found a resolved character or item, use it
                    if (characterRef) {
                        processedFixerJob.plot = {
                            ...fixerJob.plot,
                            plotSubject: characterRef,
                        }
                        needsProcessing = true
                    } else if (itemRef) {
                        processedFixerJob.plot = {
                            ...fixerJob.plot,
                            plotSubject: itemRef,
                        }
                        needsProcessing = true
                    }
                }

                // Handle gang references
                if (
                    fixerJob.plot?.plotSubject &&
                    typeof fixerJob.plot.plotSubject === 'object' &&
                    'gang' in fixerJob.plot.plotSubject &&
                    typeof fixerJob.plot.plotSubject.gang === 'string'
                ) {
                    const gangId = fixerJob.plot.plotSubject.gang
                    const gangRef = resolveGangReference(gangId)

                    if (gangRef) {
                        // Create a deep copy of plotSubject if needed
                        const plotSubject =
                            processedFixerJob.plot.plotSubject === fixerJob.plot.plotSubject
                                ? { ...fixerJob.plot.plotSubject }
                                : processedFixerJob.plot.plotSubject

                        // Update the gang reference
                        if (typeof plotSubject === 'object' && plotSubject !== null && 'gang' in plotSubject) {
                            plotSubject.gang = gangRef

                            // Also handle character in gang complication if it exists
                            if (
                                'complication' in plotSubject &&
                                plotSubject.complication &&
                                typeof plotSubject.complication === 'object' &&
                                'character' in plotSubject.complication &&
                                typeof plotSubject.complication.character === 'string'
                            ) {
                                const characterId = plotSubject.complication.character
                                const characterRef = resolveCharacterReference(characterId)

                                if (characterRef) {
                                    plotSubject.complication = {
                                        ...plotSubject.complication,
                                        character: characterRef,
                                    }
                                }
                            }

                            // Also handle item in gang complication if it exists
                            if (
                                'complication' in plotSubject &&
                                plotSubject.complication &&
                                typeof plotSubject.complication === 'object' &&
                                'item' in plotSubject.complication &&
                                typeof plotSubject.complication.item === 'string'
                            ) {
                                const itemId = plotSubject.complication.item
                                const itemRef = resolveItemReference(itemId)

                                if (itemRef) {
                                    plotSubject.complication = {
                                        ...plotSubject.complication,
                                        item: itemRef,
                                    }
                                }
                            }

                            // Update the processed job
                            processedFixerJob.plot = {
                                ...processedFixerJob.plot,
                                plotSubject: plotSubject,
                            }
                            needsProcessing = true
                        }
                    }
                }

                // Handle building references
                if (fixerJob.plot?.plotBuilding && typeof fixerJob.plot.plotBuilding.building === 'string') {
                    const buildingId = fixerJob.plot.plotBuilding.building
                    const buildingRef = resolveBuildingReference(buildingId)

                    if (buildingRef) {
                        processedFixerJob.plot = {
                            ...processedFixerJob.plot,
                            plotBuilding: {
                                ...processedFixerJob.plot.plotBuilding,
                                building: buildingRef,
                            },
                        }
                        needsProcessing = true
                    }
                }

                // Use the processed version if needed, otherwise use original
                targetData = getOrderedFixerJobData(needsProcessing ? processedFixerJob : fixerJob, t, {
                    resolveCharacter: resolveCharacterReference,
                    resolveItem: resolveItemReference,
                    resolveBuilding: resolveBuildingReference,
                    resolveGang: resolveGangReference,
                })

                color = getFixerJobDifficultyColor(fixerJob.difficulty)
                break
            }
        }
        return {
            targetData,
            color,
        }
    }

    return (
        <Masonry columns={{ xs: 1, md: 2, xl: 3 }} spacing={3} sx={{ flex: 1, width: 'calc(100vw - 32px)' }}>
            {targetArray
                .sort((a, b) => {
                    if (moduleType === ModuleTypes.BOUNTY) {
                        const totalBountyA = (a as Bounty).crimes.reduce(
                            (acc, crime) =>
                                acc +
                                crime.reward * crime.multiplier +
                                baseBountyRewardPerSpeciality[(a as Bounty).speciality],
                            0
                        )
                        const totalBountyB = (b as Bounty).crimes.reduce(
                            (acc, crime) =>
                                acc +
                                crime.reward * crime.multiplier +
                                baseBountyRewardPerSpeciality[(b as Bounty).speciality],
                            0
                        )
                        return totalBountyB - totalBountyA
                    }
                    return 0
                })
                .map((target, index) => {
                    const { targetData: itemData, color } = getOrderedData(target)
                    return (
                        <Card
                            key={index}
                            onClick={() => onEdit(index)}
                            sx={{
                                bgcolor: '#0e1630',
                                border: 'none',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
                                position: 'relative',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    backgroundImage:
                                        'linear-gradient(to right, rgba(0, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 255, 255, 0.05) 1px, transparent 1px)',
                                    backgroundSize: '20px 20px',
                                    pointerEvents: 'none',
                                    zIndex: 1,
                                },
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '2px',
                                    background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                                    boxShadow: `0 0 15px ${color}`,
                                    zIndex: 2,
                                },
                            }}
                        >
                            <CardContent sx={{ p: 0, position: 'relative', zIndex: 3 }}>
                                {/* Index number and type indicator */}
                                <Box
                                    sx={{
                                        bgcolor: readerMode ? color : 'rgba(14, 22, 48, 0.9)',
                                        py: 0.8,
                                        px: 1.5,
                                        width: readerMode ? 'calc(100% + 32px)' : '100%',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                                        zIndex: 5,
                                        backdropFilter: 'blur(2px)',
                                        mt: readerMode ? -2 : 0.5,
                                        mx: readerMode ? -2 : 0,
                                    }}
                                >
                                    <Box>
                                        <Typography
                                            className={readerMode ? 'gang-name-typography' : 'glitch-text'}
                                            data-text={
                                                moduleType === ModuleTypes.BOUNTY
                                                    ? resolveCharacterReference(
                                                          (target as Bounty).character as unknown as string
                                                      )?.name
                                                    : 'name' in target && target.name
                                            }
                                            sx={{
                                                fontSize: '1rem',
                                                fontWeight: 'bold',
                                                fontFamily: 'Orbitron, sans-serif',
                                                color: readerMode ? colors.grays.gray000 + ' !important' : color,
                                                textShadow: readerMode
                                                    ? `0 0 5px ${colors.grays.gray900}` + ' !important'
                                                    : `0 0 5px ${getComplementaryColor(color)}`,
                                            }}
                                        >
                                            {moduleType === ModuleTypes.BOUNTY
                                                ? resolveCharacterReference(
                                                      (target as Bounty).character as unknown as string
                                                  )?.name
                                                : 'name' in target && target.name}
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontSize: '0.7rem',
                                                fontWeight: 'normal',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px',
                                                color: readerMode ? colors.grays.gray000 + '!important' : undefined,
                                                textShadow: readerMode ? `0 0 5px ${colors.grays.gray900}` : 'none',
                                            }}
                                        >
                                            {moduleType === ModuleTypes.GANG &&
                                                processGangValueForDisplay('type', (target as Gang).type, t)}
                                            {moduleType === ModuleTypes.BUILDING &&
                                                processBuildingValueForDisplay(
                                                    'type',
                                                    (target as Building).type,
                                                    t,
                                                    'isAbandoned' in target ? target.isAbandoned : false
                                                )}
                                            {moduleType === ModuleTypes.FIXER_JOB &&
                                                processFixerJobValueForDisplay(
                                                    'plot.verb.value',
                                                    (target as FixerJob).plot.verb?.value,
                                                    t
                                                )}
                                        </Typography>
                                    </Box>

                                    {/* Delete Button - Updated to use confirmation */}
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onDelete(index)
                                        }}
                                        sx={{
                                            minWidth: '30px',
                                            width: '30px',
                                            height: '30px',
                                            borderRadius: '2px',
                                            p: 0,
                                            bgcolor: readerMode ? '#f5f5f5' : 'rgba(40, 0, 0, 0.4)',
                                            color: readerMode ? '#d32f2f' : colors.neons.red.default,
                                            border: readerMode
                                                ? '1px solid #d32f2f'
                                                : `1px solid ${colors.neons.red.default}60`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s',
                                            position: 'relative',
                                            fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                                            fontWeight: 'bold',
                                            '&::before': !readerMode
                                                ? {
                                                      content: '""',
                                                      position: 'absolute',
                                                      top: 0,
                                                      left: 0,
                                                      width: '100%',
                                                      height: '1px',
                                                      background: `linear-gradient(90deg, transparent, ${colors.neons.red.default}, transparent)`,
                                                      opacity: 0.7,
                                                  }
                                                : {},
                                            '&:hover': readerMode
                                                ? {
                                                      bgcolor: '#f0f0f0',
                                                      color: '#b71c1c',
                                                  }
                                                : {
                                                      bgcolor: 'rgba(60, 0, 0, 0.6)',
                                                      color: colors.neons.red.light,
                                                      boxShadow: `0 0 8px ${colors.neons.red.default}80`,
                                                      '&::after': {
                                                          opacity: 0.8,
                                                          height: '100%',
                                                      },
                                                  },
                                            '&::after': !readerMode
                                                ? {
                                                      content: '""',
                                                      position: 'absolute',
                                                      bottom: 0,
                                                      left: 0,
                                                      width: '100%',
                                                      height: '0%',
                                                      opacity: 0,
                                                      background: `linear-gradient(0deg, ${colors.neons.red.default}30, transparent)`,
                                                      transition: 'all 0.2s',
                                                  }
                                                : {},
                                        }}
                                    >
                                        <Close
                                            sx={{
                                                textShadow: `0 0 5px ${colors.neons.red.default}`,
                                                zIndex: 2,
                                                animation: `${buttonGlitch} 5s infinite`,
                                            }}
                                        />
                                    </Button>
                                </Box>

                                {/* Image Display */}
                                <Box
                                    sx={{
                                        position: 'relative',
                                        width: readerMode ? 'calc(100% + 32px)' : '100%',
                                        aspectRatio: '1 / 1',
                                        display: 'flex',
                                        alignItems: 'center',
                                        maxHeight: '300px',
                                        justifyContent: 'center',
                                        bgcolor: `${
                                            'color' in target
                                                ? getGangColorValue((target as Gang).color)
                                                : 'difficulty' in target
                                                ? getFixerJobDifficultyColor((target as FixerJob).difficulty)
                                                : getBuildingColor((target as Building).type)
                                        }70`,
                                        transition: 'all 0.3s ease',
                                        p: 0.5,
                                        borderBottom: `1px solid ${color}40`,
                                        borderTop: `1px solid ${color}40`,
                                        mx: readerMode ? -2 : 0,
                                    }}
                                >
                                    {(('image' in target && target.image === '') ||
                                        (typeof (target as Bounty).character === 'object' &&
                                            ((target as Bounty).character.image as string) === '') ||
                                        resolveCharacterReference((target as Bounty).character as unknown as string)
                                            ?.image === '') && (
                                        <Typography
                                            //variant="h1"
                                            sx={{
                                                fontWeight: 900,
                                                fontSize: '1rem',
                                                position: 'absolute',
                                                top: 'calc(50% - 0.5rem)',
                                                left: 'calc(50% + 0.5rem)',
                                                transform: 'translate(-50%, -50%)',
                                                textShadow: `0 0 5px ${colors.grays.gray000}`,
                                                color: colors.neons.yellow.default,
                                            }}
                                        >
                                            PLACEHOLDER
                                        </Typography>
                                    )}

                                    <Avatar
                                        src={
                                            'image' in target
                                                ? target.image === ''
                                                    ? '/logoBlackTransparentEyes.png'
                                                    : target.image
                                                : typeof target.character === 'object' && 'image' in target.character
                                                ? (target.character.image as string) === ''
                                                    ? '/logoBlackTransparentEyes.png'
                                                    : (target.character.image as string)
                                                : resolveCharacterReference(
                                                      (target as Bounty).character as unknown as string
                                                  )?.image === ''
                                                ? '/logoBlackTransparentEyes.png'
                                                : resolveCharacterReference(
                                                      (target as Bounty).character as unknown as string
                                                  )?.image
                                        }
                                        alt={
                                            'image' in target
                                                ? t('common.itemImageAlt', {
                                                      name: target.name,
                                                  })
                                                : t('common.itemImageAlt', {
                                                      name: resolveCharacterReference(
                                                          (target as Bounty).character as unknown as string
                                                      )?.name,
                                                  })
                                        }
                                        variant="rounded"
                                        slotProps={{
                                            img: {
                                                style: {
                                                    objectFit: 'contain',
                                                },
                                            },
                                        }}
                                        sx={{
                                            bgcolor: 'transparent',
                                            color: 'transparent',
                                            width: '100%',
                                            height: '100%',
                                        }}
                                    />
                                    {moduleType === ModuleTypes.BOUNTY && (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: '50%',
                                                transform: 'translate(-50%)',
                                                textAlign: 'center',
                                                bgcolor: 'rgba(0, 0, 0, 0.8)',
                                                px: 1,
                                                pb: 1,
                                            }}
                                        >
                                            <Typography
                                                variant="h2"
                                                className="glitch-text"
                                                data-text={t('bounties.labels.wanted')}
                                                sx={{
                                                    fontWeight: 900,
                                                    color: colors.neons.red.default,
                                                    lineHeight: 1,
                                                    letterSpacing: '0.1em',
                                                }}
                                            >
                                                {t('bounties.labels.wanted')}
                                            </Typography>
                                            <Typography
                                                variant="h4"
                                                className="glitch-text"
                                                data-text={`${Intl.NumberFormat('de-DE').format(
                                                    (target as Bounty).crimes.reduce(
                                                        (acc, crime) => acc + crime.reward * crime.multiplier,
                                                        0
                                                    ) + baseBountyRewardPerSpeciality[(target as Bounty).speciality]
                                                )} €$`}
                                                sx={{
                                                    fontWeight: 900,
                                                    color: colors.neons.yellow.default,
                                                    lineHeight: 1,
                                                }}
                                            >
                                                {Intl.NumberFormat('de-DE').format(
                                                    (target as Bounty).crimes.reduce(
                                                        (acc, crime) => acc + crime.reward * crime.multiplier,
                                                        0
                                                    ) + baseBountyRewardPerSpeciality[(target as Bounty).speciality]
                                                )}{' '}
                                                €$
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>

                                {/* Header Section - Use TiptapDisplay for description */}
                                <Box
                                    sx={{
                                        bgcolor: readerMode ? colors.grays.gray900 : 'rgba(14, 22, 48, 0.9)',
                                        mx: readerMode ? -2 : 0,
                                        px: 2,
                                        mt: 0,
                                        position: 'relative',
                                        overflow: 'hidden',
                                        color: readerMode ? colors.grays.gray000 : '#fff',
                                        fontSize: '0.9rem',
                                        fontWeight: 500,
                                    }}
                                >
                                    {'description' in target && <TiptapEditor value={target.description} />}
                                </Box>

                                {/* Data Table */}
                                <TableContainer
                                    sx={{
                                        bgcolor: readerMode ? colors.grays.gray900 : 'rgba(14, 22, 48, 0.9)',
                                        backdropFilter: 'blur(3px)',
                                        position: 'relative',
                                        width: readerMode ? 'calc(100% + 32px)' : '100%',
                                        mx: readerMode ? -2 : 0,
                                        mb: readerMode ? -1.5 : -2.5,
                                    }}
                                >
                                    <Table size="small">
                                        <TableBody>
                                            {itemData
                                                // Filter out items with empty labels or "—" values
                                                .filter((entry) => {
                                                    // Check for valid label
                                                    if (!entry.label || entry.label.trim() === '') {
                                                        return false
                                                    }

                                                    // Check for empty values
                                                    let displayValue = ''

                                                    // Get the right processor function for this module type
                                                    if (moduleType === ModuleTypes.GANG) {
                                                        displayValue = String(
                                                            processGangValueForDisplay(entry.key, entry.value, t)
                                                        )
                                                    } else if (moduleType === ModuleTypes.BUILDING) {
                                                        displayValue = String(
                                                            processBuildingValueForDisplay(
                                                                entry.key,
                                                                entry.value,
                                                                t,
                                                                'isAbandoned' in target ? target.isAbandoned : false
                                                            )
                                                        )
                                                    } else if (moduleType === ModuleTypes.FIXER_JOB) {
                                                        displayValue =
                                                            entry.value !== undefined
                                                                ? processFixerJobValueForDisplay(
                                                                      entry.key,
                                                                      entry.value,
                                                                      t
                                                                  )
                                                                : '—'
                                                    } else if (moduleType === ModuleTypes.CHARACTER) {
                                                        displayValue = String(
                                                            processCharacterValueForDisplay(entry.key, entry.value, t)
                                                        )
                                                    } else if (moduleType === ModuleTypes.ITEM) {
                                                        displayValue = String(
                                                            processItemValueForDisplay(entry.key, entry.value, t)
                                                        )
                                                    } else if (moduleType === ModuleTypes.BOUNTY) {
                                                        displayValue = String(
                                                            processBountyValueForDisplay(entry.key, entry.value, t)
                                                        )
                                                    }

                                                    // If the display value is "—", filter it out
                                                    return displayValue !== '—'
                                                })
                                                .map((entry) => (
                                                    <TableRow
                                                        key={entry.key}
                                                        sx={{
                                                            position: 'relative',
                                                            ...(readerMode
                                                                ? {
                                                                      '&:nth-of-type(odd)': { bgcolor: '#f9f9f9' },
                                                                      '&:nth-of-type(even)': { bgcolor: '#fff' },
                                                                      '&:hover': {
                                                                          bgcolor: '#f0f0f0',
                                                                      },
                                                                  }
                                                                : {
                                                                      '&:nth-of-type(odd)': {
                                                                          bgcolor: 'rgba(0, 15, 30, 0.4)',
                                                                      },
                                                                      '&:nth-of-type(even)': {
                                                                          bgcolor: 'rgba(0, 20, 40, 0.2)',
                                                                      },
                                                                      '&:hover': {
                                                                          bgcolor: 'rgba(0, 255, 255, 0.1)',
                                                                          '& .cell-content': {
                                                                              color: colors.neons.cyan.default,
                                                                              textShadow: `0 0 5px ${colors.neons.cyan.default}`,
                                                                          },
                                                                      },
                                                                  }),
                                                            transition: 'all 0.3s ease',
                                                        }}
                                                    >
                                                        <TableCell
                                                            sx={{
                                                                borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
                                                                fontWeight: 'bold',
                                                                maxWidth: '15vw',
                                                                textShadow: `0 0 5px ${colors.neons.cyan.dark}`,
                                                                ...(readerMode && {
                                                                    color: '#333',
                                                                    textShadow: 'none',
                                                                    borderBottom: '1px solid #ddd ',
                                                                }),
                                                            }}
                                                            className="cell-content"
                                                        >
                                                            <Typography
                                                                title={entry.label}
                                                                variant="body2"
                                                                noWrap
                                                                sx={{
                                                                    color:
                                                                        (readerMode
                                                                            ? colors.grays.gray000
                                                                            : colors.neons.cyan.default) +
                                                                        ' !important',
                                                                }}
                                                            >
                                                                {entry.label}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell
                                                            sx={{
                                                                maxWidth: '15vw',
                                                                borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
                                                                textShadow: `0 0 5px ${colors.neons.green.dark}`,
                                                                ...(readerMode
                                                                    ? {
                                                                          color: '#333 ',
                                                                          textShadow: 'none ',
                                                                          borderBottom: '1px solid #ddd ',
                                                                          fontWeight: 500,
                                                                      }
                                                                    : {}),
                                                            }}
                                                            className="cell-content"
                                                        >
                                                            <Typography
                                                                title={`${
                                                                    moduleType === ModuleTypes.GANG
                                                                        ? processGangValueForDisplay(
                                                                              entry.key,
                                                                              entry.value,
                                                                              t
                                                                          )
                                                                        : ''
                                                                }${
                                                                    moduleType === ModuleTypes.BUILDING
                                                                        ? processBuildingValueForDisplay(
                                                                              entry.key,
                                                                              entry.value,
                                                                              t,
                                                                              'isAbandoned' in target
                                                                                  ? target.isAbandoned
                                                                                  : false
                                                                          )
                                                                        : ''
                                                                }${
                                                                    moduleType === ModuleTypes.FIXER_JOB
                                                                        ? entry.value !== undefined
                                                                            ? processFixerJobValueForDisplay(
                                                                                  entry.key,
                                                                                  entry.value,
                                                                                  t
                                                                              )
                                                                            : '—'
                                                                        : ''
                                                                }${
                                                                    moduleType === ModuleTypes.CHARACTER
                                                                        ? processCharacterValueForDisplay(
                                                                              entry.key,
                                                                              entry.value,
                                                                              t
                                                                          )
                                                                        : ''
                                                                }${
                                                                    moduleType === ModuleTypes.ITEM
                                                                        ? processItemValueForDisplay(
                                                                              entry.key,
                                                                              entry.value,
                                                                              t
                                                                          )
                                                                        : ''
                                                                }${
                                                                    moduleType === ModuleTypes.BOUNTY
                                                                        ? processBountyValueForDisplay(
                                                                              entry.key,
                                                                              entry.value,
                                                                              t
                                                                          )
                                                                        : ''
                                                                }`}
                                                                variant="body2"
                                                                noWrap
                                                                sx={{
                                                                    color:
                                                                        (readerMode
                                                                            ? colors.grays.gray000
                                                                            : colors.grays.gray900) + ' !important',
                                                                }}
                                                            >
                                                                {moduleType === ModuleTypes.GANG &&
                                                                    processGangValueForDisplay(
                                                                        entry.key,
                                                                        entry.value,
                                                                        t
                                                                    )}
                                                                {moduleType === ModuleTypes.BUILDING &&
                                                                    processBuildingValueForDisplay(
                                                                        entry.key,
                                                                        entry.value,
                                                                        t,
                                                                        'isAbandoned' in target
                                                                            ? target.isAbandoned
                                                                            : false
                                                                    )}
                                                                {moduleType === ModuleTypes.FIXER_JOB &&
                                                                    (entry.value !== undefined
                                                                        ? processFixerJobValueForDisplay(
                                                                              entry.key,
                                                                              entry.value,
                                                                              t
                                                                          )
                                                                        : '—')}
                                                                {moduleType === ModuleTypes.CHARACTER &&
                                                                    processCharacterValueForDisplay(
                                                                        entry.key,
                                                                        entry.value,
                                                                        t
                                                                    )}
                                                                {moduleType === ModuleTypes.ITEM &&
                                                                    processItemValueForDisplay(
                                                                        entry.key,
                                                                        entry.value,
                                                                        t
                                                                    )}
                                                                {moduleType === ModuleTypes.BOUNTY &&
                                                                    processBountyValueForDisplay(
                                                                        entry.key,
                                                                        entry.value,
                                                                        t
                                                                    )}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <Box
                                    sx={{
                                        '&::after': {
                                            content: '""',
                                            position: 'absolute',
                                            bottom: 2,
                                            left: 0,
                                            right: 0,
                                            height: '2px',
                                            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                                            boxShadow: `0 0 15px ${color}`,
                                            zIndex: 2,
                                        },
                                    }}
                                ></Box>
                            </CardContent>
                        </Card>
                    )
                })}
        </Masonry>
    )
}

export default GridView
