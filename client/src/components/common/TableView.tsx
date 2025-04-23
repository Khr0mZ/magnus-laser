import { Close } from '@mui/icons-material'
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import CustomScrollbar from '../../components/CustomScrollbar'
import { useData } from '../../contexts/dataHooks'
import { useUserPreferences } from '../../contexts/userPreferencesHooks.ts'
import { Building, Character, FixerJob, Gang, Item } from '../../graphql/types'
import colors from '../../utils/colors'
import {
    buildingColumns,
    characterColumns,
    fixerJobColumns,
    gangColumns,
    itemColumns,
    ModuleTypes,
} from '../../utils/constants'
import {
    getBuildingColor,
    getComplementaryColor,
    getFixerJobDifficultyColor,
    getGangColorValue,
    processCharacterValueForDisplay,
    processFixerJobValueForDisplay,
    processGangValueForDisplay,
    processItemValueForDisplay,
} from '../../utils/functions'
import { processBuildingValueForDisplay } from '../../utils/functions.tsx'
import { buttonGlitch } from './Animations'

type TableColumn = {
    key: string
    label: string
}

type TableViewProps = {
    targetArray: (Gang | Building | FixerJob | Character | Item)[]
    onDelete: (index: number) => void
    moduleType: ModuleTypes
    onEdit: (index: number) => void
}

const TableView = (props: TableViewProps) => {
    const { targetArray, onDelete, moduleType, onEdit } = props
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    const { buildings, gangs, characters, items } = useData()

    // Helper functions to resolve references
    const resolveGangReference = (gangId: string) => {
        if (!gangId) return null
        return gangs.find((g) => g.ID === gangId)
    }

    const resolveBuildingReference = (buildingId: string) => {
        if (!buildingId) return null
        return buildings.find((b) => b.ID === buildingId)
    }

    const resolveCharacterReference = (characterId: string) => {
        if (!characterId) return null
        return characters.find((c) => c.ID === characterId)
    }

    const resolveItemReference = (itemId: string) => {
        if (!itemId) return null
        return items.find((i) => i.ID === itemId)
    }

    const getValueByPath = (item: Record<string, unknown>, path: string): unknown => {
        // Special case handlers for common problematic paths
        if (path === 'plot.plotSubject.gang.name') {
            const plot = (item.plot as Record<string, unknown>) || {}
            const plotSubject = (plot.plotSubject as Record<string, unknown>) || {}
            const gang = plotSubject.gang

            if (typeof gang === 'string') {
                const gangRef = resolveGangReference(gang)
                return gangRef?.name || gang
            } else if (gang && typeof gang === 'object' && 'name' in (gang as Record<string, unknown>)) {
                return (gang as Record<string, unknown>).name
            }
            return undefined
        }

        if (path === 'plot.plotBuilding.building.name') {
            const plot = (item.plot as Record<string, unknown>) || {}
            const plotBuilding = (plot.plotBuilding as Record<string, unknown>) || {}
            const building = plotBuilding.building

            if (typeof building === 'string') {
                const buildingRef = resolveBuildingReference(building)
                return buildingRef?.name || building
            } else if (building && typeof building === 'object' && 'name' in (building as Record<string, unknown>)) {
                return (building as Record<string, unknown>).name
            }
            return undefined
        }

        // Handle character or item names in complications
        if (path.endsWith('.character.name')) {
            const basePath = path.substring(0, path.length - 5)
            const baseValue = getValueByPath(item, basePath)

            if (typeof baseValue === 'string') {
                const charRef = resolveCharacterReference(baseValue)
                return charRef?.name || baseValue
            } else if (baseValue && typeof baseValue === 'object' && 'name' in (baseValue as Record<string, unknown>)) {
                return (baseValue as Record<string, unknown>).name
            }
            return undefined
        }

        if (path.endsWith('.item.name')) {
            const basePath = path.substring(0, path.length - 5)
            const baseValue = getValueByPath(item, basePath)

            if (typeof baseValue === 'string') {
                const itemRef = resolveItemReference(baseValue)
                return itemRef?.name || baseValue
            } else if (baseValue && typeof baseValue === 'object' && 'name' in (baseValue as Record<string, unknown>)) {
                return (baseValue as Record<string, unknown>).name
            }
            return undefined
        }

        // Standard path traversal for other paths
        const parts = path.split('.')
        let current = item as Record<string, unknown>

        for (const part of parts) {
            if (!current || typeof current !== 'object') return undefined

            if (part === 'verb' && current.verb && typeof current.verb === 'object') {
                current = current.verb as Record<string, unknown>
                continue
            }

            if (part === 'gang' && current[part]) {
                if (typeof current[part] === 'string') {
                    const gangRef = resolveGangReference(current[part] as string)
                    if (gangRef) {
                        current = gangRef as unknown as Record<string, unknown>
                        continue
                    }
                    return current[part]
                }
            }

            if (part === 'building' && current[part]) {
                if (typeof current[part] === 'string') {
                    const buildingRef = resolveBuildingReference(current[part] as string)
                    if (buildingRef) {
                        current = buildingRef as unknown as Record<string, unknown>
                        continue
                    }
                    return current[part]
                }
            }

            if (part === 'character' && current[part]) {
                if (typeof current[part] === 'string') {
                    const characterRef = resolveCharacterReference(current[part] as string)
                    if (characterRef) {
                        current = characterRef as unknown as Record<string, unknown>
                        continue
                    }
                    return current[part]
                }
            }

            if (part === 'item' && current[part]) {
                if (typeof current[part] === 'string') {
                    const itemRef = resolveItemReference(current[part] as string)
                    if (itemRef) {
                        current = itemRef as unknown as Record<string, unknown>
                        continue
                    }
                    return current[part]
                }
            }

            // Handle complication objects
            if (part === 'complication' && current[part]) {
                current = current[part] as Record<string, unknown>
                continue
            }

            current = current[part] as Record<string, unknown>
        }

        return current
    }

    // Return all columns without filtering for TableView
    const getFilteredColumns = (): TableColumn[] => {
        let baseColumns: TableColumn[] = []
        switch (moduleType) {
            case ModuleTypes.GANG:
                baseColumns = gangColumns
                break
            case ModuleTypes.BUILDING:
                baseColumns = buildingColumns
                break
            case ModuleTypes.FIXER_JOB:
                baseColumns = fixerJobColumns
                break
            case ModuleTypes.ITEM:
                baseColumns = itemColumns
                break
            case ModuleTypes.CHARACTER:
                baseColumns = characterColumns
                break
        }

        // For table view, show all columns without filtering
        return baseColumns
    }

    if (targetArray.length === 0) return null

    // Get the filtered columns for display
    const columns = getFilteredColumns()

    return (
        <TableContainer
            sx={{
                mb: 4,
                borderRadius: '4px',
                position: 'relative',
                bgcolor: readerMode ? colors.grays.gray900 : colors.cyberpunk.darkBg,
                border: `1px solid ${colors.neons.cyan.dark}`,
                boxShadow: `0 0 20px rgba(0, 255, 255, 0.15)`,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '2px',
                    background: `linear-gradient(to right, ${colors.neons.green.default}, ${colors.neons.cyan.default})`,
                },
            }}
        >
            <CustomScrollbar scrollDirection="horizontal">
                <Table size="small" sx={{ minWidth: 650 }}>
                    <TableHead>
                        <TableRow
                            sx={{
                                bgcolor: 'rgba(0, 255, 255, 0.25)',
                                position: 'relative',
                            }}
                        >
                            {columns.map((column) => (
                                <TableCell
                                    key={column.key}
                                    align={column.key === 'name' ? 'left' : 'center'}
                                    sx={{
                                        fontWeight: 'bold',
                                        color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                                        ...(column.key === 'name' && {
                                            position: 'sticky',
                                            left: 0,
                                            bgcolor: 'rgba(0, 255, 255, 0.25)',
                                            zIndex: 2,
                                        }),
                                        borderBottom: `1px solid ${colors.neons.cyan.dark}`,
                                        textShadow: `0 0 5px ${colors.neons.cyan.dark}`,
                                    }}
                                >
                                    {moduleType === ModuleTypes.GANG && t(`gangs.labels.${column.label}`)}
                                    {moduleType === ModuleTypes.BUILDING && t(`buildings.labels.${column.label}`)}
                                    {moduleType === ModuleTypes.FIXER_JOB && t(`fixerJobs.labels.${column.label}`)}
                                    {moduleType === ModuleTypes.ITEM && t(`items.labels.${column.label}`)}
                                    {moduleType === ModuleTypes.CHARACTER && t(`characters.labels.${column.label}`)}
                                </TableCell>
                            ))}

                            {/* Actions column */}
                            <TableCell
                                sx={{
                                    fontWeight: 'bold',
                                    color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                                    borderBottom: `1px solid ${colors.neons.cyan.dark}`,
                                    textShadow: `0 0 5px ${colors.neons.cyan.dark}`,
                                    width: '60px',
                                    textAlign: 'center',
                                }}
                            >
                                {t('common.actions')}
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {targetArray.map((target, index) => {
                            // Generate localized name and color based on module type
                            let name = ''
                            let color = ''
                            switch (moduleType) {
                                case ModuleTypes.GANG:
                                    name = target.name
                                    color = getGangColorValue((target as Gang).color)
                                    break
                                case ModuleTypes.BUILDING:
                                    name = target.name
                                    color = getBuildingColor((target as Building).type)
                                    break
                                case ModuleTypes.FIXER_JOB:
                                    name = target.name
                                    color = getFixerJobDifficultyColor((target as FixerJob).difficulty)
                                    break
                                case ModuleTypes.ITEM:
                                    name = target.name
                                    color = colors.neons.cyan.default
                                    break
                                case ModuleTypes.CHARACTER:
                                    name = target.name
                                    color = colors.neons.cyan.default
                                    break
                            }

                            return (
                                <TableRow
                                    key={index}
                                    onClick={() => onEdit(index)}
                                    sx={{
                                        '&:nth-of-type(odd)': {
                                            bgcolor: readerMode ? 'rgba(0, 255, 255, 0.1)' : 'rgba(0, 15, 30, 0.4)',
                                        },
                                        '&:nth-of-type(even)': {
                                            bgcolor: readerMode ? 'rgba(0, 255, 255, 0.2)' : 'rgba(0, 20, 40, 0.2)',
                                        },
                                        '&:hover': {
                                            bgcolor: 'rgba(0, 255, 255, 0.1)',
                                            cursor: 'pointer',
                                            '& .cell-content': {
                                                color: readerMode ? colors.neons.cyan.dark : colors.neons.cyan.default,
                                                textShadow: `0 0 5px ${colors.neons.cyan.default}`,
                                            },
                                        },
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {/* Name cell */}
                                    <TableCell
                                        className="cell-content"
                                        align="center"
                                        sx={{
                                            borderBottom: `1px solid ${colors.neons.cyan.dark}`,
                                            position: 'sticky',
                                            left: 0,
                                            bgcolor: readerMode
                                                ? index % 2 === 0
                                                    ? 'rgba(0, 255, 255, 0.2)'
                                                    : 'rgba(0, 255, 255, 0.1)'
                                                : index % 2 === 0
                                                ? 'rgba(0, 20, 40, 0.2)'
                                                : 'rgba(0, 15, 30, 0.4)',
                                            zIndex: 1,
                                        }}
                                    >
                                        <Typography
                                            className={readerMode ? 'gang-name-typography' : 'glitch-text'}
                                            data-text={name}
                                            sx={{
                                                fontWeight: 500,
                                                color: color,
                                                textShadow: readerMode
                                                    ? `0 0 5px ${getComplementaryColor(
                                                          color
                                                      )}40, -1px -1px 0 ${getComplementaryColor(
                                                          color
                                                      )}40, 1px -1px 0 ${getComplementaryColor(
                                                          color
                                                      )}40, -1px 1px 0 ${getComplementaryColor(
                                                          color
                                                      )}40, 1px 1px 0 ${getComplementaryColor(color)}40`
                                                    : `0 0 5px ${getComplementaryColor(
                                                          color
                                                      )}40, -1px -1px 0 ${getComplementaryColor(
                                                          color
                                                      )}40, 1px -1px 0 ${getComplementaryColor(
                                                          color
                                                      )}40, -1px 1px 0 ${getComplementaryColor(
                                                          color
                                                      )}40, 1px 1px 0 ${getComplementaryColor(color)}40`,
                                            }}
                                        >
                                            {name}
                                        </Typography>
                                    </TableCell>

                                    {/* Render data cells for each column (excluding name since it's already rendered) */}
                                    {columns.slice(1).map((column) => {
                                        // Get and process the value
                                        let displayValue: string = '—'

                                        if (moduleType === ModuleTypes.GANG) {
                                            displayValue = String(
                                                processGangValueForDisplay(
                                                    column.key,
                                                    (target as Gang)[column.key as keyof Gang],
                                                    t
                                                )
                                            )
                                        } else if (moduleType === ModuleTypes.BUILDING) {
                                            displayValue = String(
                                                processBuildingValueForDisplay(
                                                    column.key,
                                                    (target as Building)[column.key as keyof Building],
                                                    t,
                                                    (target as Building).isAbandoned
                                                )
                                            )
                                        } else if (moduleType === ModuleTypes.FIXER_JOB) {
                                            if (column.key === 'name') {
                                                displayValue = target.name
                                            } else if (
                                                column.key === 'plot.plotSubject' ||
                                                column.label === 'plotCategory.target'
                                            ) {
                                                // Special handling for the Target column
                                                const fixerJob = target as FixerJob
                                                const plotSubject = fixerJob.plot?.plotSubject

                                                // Handle direct character/item references
                                                if (
                                                    plotSubject &&
                                                    typeof plotSubject === 'object' &&
                                                    'name' in plotSubject
                                                ) {
                                                    displayValue = plotSubject.name
                                                }
                                                // Handle gang references
                                                else if (
                                                    plotSubject &&
                                                    typeof plotSubject === 'object' &&
                                                    'gang' in plotSubject
                                                ) {
                                                    const gang = plotSubject.gang
                                                    if (typeof gang === 'object' && gang !== null && 'name' in gang) {
                                                        displayValue = (gang as { name: string }).name
                                                    } else if (typeof gang === 'string') {
                                                        // Try to resolve the gang reference
                                                        const gangRef = resolveGangReference(gang)
                                                        displayValue = gangRef?.name || '—'
                                                    }
                                                } else if (typeof plotSubject === 'string') {
                                                    // Try to resolve the string ID
                                                    const charRef = resolveCharacterReference(plotSubject)
                                                    if (charRef) {
                                                        displayValue = charRef.name
                                                    } else {
                                                        const itemRef = resolveItemReference(plotSubject)
                                                        if (itemRef) {
                                                            displayValue = itemRef.name
                                                        } else {
                                                            displayValue = '—'
                                                        }
                                                    }
                                                } else {
                                                    displayValue = '—'
                                                }
                                            } else {
                                                const value = getValueByPath(
                                                    target as Record<string, unknown>,
                                                    column.key
                                                )

                                                // Handle undefined values explicitly
                                                if (value === undefined) {
                                                    displayValue = '—'
                                                } else {
                                                    const processed = processFixerJobValueForDisplay(
                                                        column.key,
                                                        value,
                                                        t
                                                    )
                                                    // Replace 'undefined' string with the dash character
                                                    displayValue = processed === 'undefined' ? '—' : processed
                                                }
                                            }
                                        } else if (moduleType === ModuleTypes.ITEM) {
                                            displayValue = String(
                                                processItemValueForDisplay(
                                                    column.key,
                                                    getValueByPath(target as Record<string, unknown>, column.key),
                                                    t
                                                )
                                            )
                                        } else if (moduleType === ModuleTypes.CHARACTER) {
                                            displayValue = String(
                                                processCharacterValueForDisplay(
                                                    column.key,
                                                    getValueByPath(target as Record<string, unknown>, column.key),
                                                    t
                                                )
                                            )
                                        }

                                        // Special handling for strings that contain 'undefined'
                                        if (displayValue === 'undefined') {
                                            displayValue = '—'
                                        }

                                        // Display all cells, even with "—" value
                                        return (
                                            <TableCell
                                                key={column.key}
                                                align="center"
                                                sx={{
                                                    color: readerMode
                                                        ? colors.grays.gray400
                                                        : colors.neons.cyan.default,
                                                    fontWeight: 500,
                                                    borderBottom: `1px solid ${colors.neons.cyan.dark}`,
                                                }}
                                                className="cell-content"
                                            >
                                                {displayValue}
                                            </TableCell>
                                        )
                                    })}

                                    {/* Actions cell */}
                                    <TableCell
                                        sx={{
                                            color: colors.neons.red.default,
                                            borderBottom: `1px solid ${colors.neons.cyan.dark}`,
                                            textAlign: 'center',
                                        }}
                                    >
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
                                                '&::before': {
                                                    content: '""',
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '1px',
                                                    background: `linear-gradient(90deg, transparent, ${colors.neons.red.default}, transparent)`,
                                                    opacity: 0.7,
                                                },
                                                '&:hover': {
                                                    bgcolor: readerMode
                                                        ? 'rgba(255, 0, 0, 0.4)'
                                                        : 'rgba(60, 0, 0, 0.6)',
                                                    color: readerMode ? colors.grays.gray900 : colors.neons.red.light,
                                                    boxShadow: `0 0 8px ${colors.neons.red.default}80`,
                                                    '&::after': {
                                                        opacity: 0.8,
                                                        height: '100%',
                                                    },
                                                },
                                                '&::after': {
                                                    content: '""',
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '0%',
                                                    opacity: 0,
                                                    background: `linear-gradient(0deg, ${colors.neons.red.default}30, transparent)`,
                                                    transition: 'all 0.2s',
                                                },
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
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CustomScrollbar>
        </TableContainer>
    )
}

export default TableView
