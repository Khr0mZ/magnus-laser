import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { ReaderModeContext } from '../../contexts/ReaderModeContext'
import colors from '../../utils/colors'
import { translateLabel } from '../../utils/i18nUtils'
import { buildingColumns, gangColumns, ModuleTypes } from '../../utils/types'
import { DisplayBuilding } from '../buildings/BuildingTypes'
import { generateLocalizedBuildingName, processBuildingValueForDisplay } from '../buildings/BuildingUtils'
import { DisplayGang } from '../gangs/GangTypes'
import { generateLocalizedGangName, getGangColorValue, processGangValueForDisplay } from '../gangs/GangUtils'
import { buttonGlitch } from './Animations'

type CompactViewProps = {
    items: DisplayGang[] | DisplayBuilding[]
    onDelete: (index: number) => void
    moduleType: ModuleTypes
}

const CompactView = (props: CompactViewProps) => {
    const { items, onDelete, moduleType } = props
    const { t } = useTranslation()
    const { readerMode } = useContext(ReaderModeContext)

    if (items.length === 0) return null

    let columns: {
        key: string
        label: string
    }[] = []
    switch (moduleType) {
        case ModuleTypes.GANG:
            columns = gangColumns
            break
        case ModuleTypes.BUILDING:
            columns = buildingColumns
    }

    return (
        <TableContainer
            sx={{
                mb: 4,
                borderRadius: '4px',
                overflowX: 'auto',
                position: 'relative',
                bgcolor: readerMode ? colors.grays.gray900 : colors.cyberpunk.darkBg,
                border: `1px solid ${colors.neons.cyan.dark}`,
                boxShadow: `0 0 20px rgba(0, 255, 255, 0.15)`,
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
                                {moduleType === ModuleTypes.BUILDING && translateLabel(t, column.label, 'buildings')}
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
                            {t('common.actions', 'Actions')}
                        </TableCell>
                    </TableRow>
                </TableHead>

                <TableBody>
                    {items.map((item, index) => {
                        // Generate localized name
                        let displayName = ''
                        let color = ''
                        switch (moduleType) {
                            case ModuleTypes.GANG:
                                displayName = generateLocalizedGangName(item as DisplayGang, t)
                                color = getGangColorValue((item as DisplayGang).color)
                                break
                            case ModuleTypes.BUILDING:
                                displayName = generateLocalizedBuildingName(item as DisplayBuilding, t)
                                color = colors.neons.cyan.default
                                break
                        }

                        return (
                            <TableRow
                                key={index}
                                sx={{
                                    '&:nth-of-type(odd)': {
                                        bgcolor: readerMode ? 'rgba(0, 255, 255, 0.1)' : 'rgba(0, 15, 30, 0.4)',
                                    },
                                    '&:nth-of-type(even)': {
                                        bgcolor: readerMode ? 'rgba(0, 255, 255, 0.2)' : 'rgba(0, 20, 40, 0.2)',
                                    },
                                    '&:hover': {
                                        bgcolor: 'rgba(0, 255, 255, 0.1)',
                                        '& .cell-content': {
                                            color: readerMode ? colors.neons.cyan.dark : colors.neons.cyan.default,
                                            textShadow: `0 0 5px ${colors.neons.cyan.default}`,
                                        },
                                    },
                                    transition: 'all 0.2s',
                                }}
                            >
                                {/* Name Cell */}
                                <TableCell
                                    className="cell-content"
                                    sx={{
                                        color: readerMode ? colors.grays.gray000 : color,
                                        fontWeight: 'bold',
                                        letterSpacing: '0.5px',
                                        textShadow: readerMode ? 'none' : `0 0 5px ${color}50`,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: { xs: '100px', sm: '150px', md: '200px' },
                                        position: 'sticky',
                                        left: 0,
                                        zIndex: 1,
                                        borderBottom: `1px solid ${colors.neons.cyan.dark}`,
                                    }}
                                >
                                    {displayName}
                                </TableCell>

                                {/* All other data cells */}
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
                                            // @ts-expect-error - Gang object has dynamic properties based on column.key
                                            processGangValueForDisplay(column.key, item[column.key], t)}
                                        {moduleType === ModuleTypes.BUILDING &&
                                            // @ts-expect-error - Building object has dynamic properties based on column.key
                                            processBuildingValueForDisplay(column.key, item[column.key], t)}
                                    </TableCell>
                                ))}

                                {/* Actions */}
                                <TableCell
                                    sx={{
                                        color: colors.neons.red.default,
                                        borderBottom: `1px solid ${colors.neons.cyan.dark}`,
                                        textAlign: 'center',
                                    }}
                                >
                                    <Button
                                        onClick={() => onDelete(index)}
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
                                                bgcolor: readerMode ? 'rgba(255, 0, 0, 0.4)' : 'rgba(60, 0, 0, 0.6)',
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
                                        <span
                                            style={{
                                                textShadow: `0 0 5px ${colors.neons.red.default}`,
                                                zIndex: 2,
                                                animation: `${buttonGlitch} 5s infinite`,
                                            }}
                                        >
                                            ✕
                                        </span>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default CompactView
