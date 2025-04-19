import { Close } from '@mui/icons-material'
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import CustomScrollbar from '../../components/CustomScrollbar'
import { useData } from '../../contexts/dataHooks'
import { ReaderModeContext } from '../../contexts/ReaderModeContext'
import { Building, FixerJob, Gang } from '../../graphql/types'
import colors from '../../utils/colors'
import { buildingColumns, fixerJobColumns, gangColumns, ModuleTypes } from '../../utils/constants'
import {
    getBuildingColor,
    getComplementaryColor,
    getFixerJobDifficultyColor,
    getGangColorValue,
    processFixerJobValueForDisplay,
    processGangValueForDisplay,
} from '../../utils/functions'
import { processBuildingValueForDisplay } from '../../utils/functions.tsx'
import { translateLabel } from '../../utils/i18nUtils'
import { buttonGlitch } from './Animations'

type TableColumn = {
    key: string
    label: string
}

type TableViewProps = {
    items: Gang[] | Building[] | FixerJob[]
    onDelete: (index: number) => void
    moduleType: ModuleTypes
    onEdit: (index: number) => void
}

const TableView = (props: TableViewProps) => {
    const { items, onDelete, moduleType, onEdit } = props
    const { t } = useTranslation()
    const { readerMode } = useContext(ReaderModeContext)
    const { buildings, gangs } = useData()

    const resolveGangReference = (gangId: string) => {
        if (!gangId) return null
        return gangs.find((g) => g.ID === gangId)
    }

    const resolveBuildingReference = (buildingId: string) => {
        if (!buildingId) return null
        return buildings.find((b) => b.ID === buildingId)
    }

    const getValueByPath = (item: Record<string, unknown>, path: string): unknown => {
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

            current = current[part] as Record<string, unknown>
        }

        return current
    }

    if (items.length === 0) return null

    let columns: TableColumn[] = []
    switch (moduleType) {
        case ModuleTypes.GANG:
            columns = gangColumns
            break
        case ModuleTypes.BUILDING:
            columns = buildingColumns
            break
        case ModuleTypes.FIXER_JOB:
            columns = fixerJobColumns
            break
    }

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
                                    {moduleType === ModuleTypes.GANG && translateLabel(t, column.label, 'gangs')}
                                    {moduleType === ModuleTypes.BUILDING &&
                                        translateLabel(t, column.label, 'buildings')}
                                    {moduleType === ModuleTypes.FIXER_JOB &&
                                        translateLabel(t, column.label, 'fixerJobs')}
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
                        {items.map((item, index) => {
                            // Generate localized name and color based on module type
                            let name = ''
                            let color = ''
                            switch (moduleType) {
                                case ModuleTypes.GANG:
                                    name = item.name
                                    color = getGangColorValue((item as Gang).color)
                                    break
                                case ModuleTypes.BUILDING:
                                    name = item.name
                                    color = getBuildingColor((item as Building).type)
                                    break
                                case ModuleTypes.FIXER_JOB:
                                    name = item.name
                                    color = getFixerJobDifficultyColor((item as FixerJob).difficulty)
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
                                        sx={{ borderBottom: `1px solid ${colors.neons.cyan.dark}` }}
                                    >
                                        <Typography
                                            className={readerMode ? 'gang-name-typography' : 'glitch-text'}
                                            data-text={name}
                                            sx={{
                                                fontWeight: 500,
                                                color: name,
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
                                    {columns.slice(1).map((column) => (
                                        <TableCell
                                            key={column.key}
                                            align="center"
                                            sx={{
                                                color: readerMode ? colors.grays.gray400 : colors.neons.cyan.default,
                                                fontWeight: 500,
                                                borderBottom: `1px solid ${colors.neons.cyan.dark}`,
                                            }}
                                            className="cell-content"
                                        >
                                            {moduleType === ModuleTypes.GANG &&
                                                processGangValueForDisplay(
                                                    column.key,
                                                    (item as Gang)[column.key as keyof Gang],
                                                    t
                                                )}
                                            {moduleType === ModuleTypes.BUILDING &&
                                                processBuildingValueForDisplay(
                                                    column.key,
                                                    (item as Building)[column.key as keyof Building],
                                                    t,
                                                    (item as Building).isAbandoned
                                                )}
                                            {moduleType === ModuleTypes.FIXER_JOB && (
                                                <>
                                                    {column.key === 'name' && item.name}
                                                    {column.key !== 'name' &&
                                                        processFixerJobValueForDisplay(
                                                            column.key,
                                                            getValueByPath(item as Record<string, unknown>, column.key),
                                                            t
                                                        )}
                                                </>
                                            )}
                                        </TableCell>
                                    ))}

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
