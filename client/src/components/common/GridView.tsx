import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Typography,
} from '@mui/material'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { ReaderModeContext } from '../../contexts/ReaderModeContext'
import { Building, FixerJob, Gang } from '../../graphql/types'
import colors from '../../utils/colors'
import { ModuleTypes } from '../../utils/constants'
import {
    getBuildingColor,
    getComplementaryColor,
    getFixerJobDifficultyColor,
    getGangColorValue,
    getOrderedBuildingData,
    getOrderedFixerJobData,
    getOrderedGangData,
    processFixerJobValueForDisplay,
    processGangValueForDisplay,
} from '../../utils/functions'
import { processBuildingValueForDisplay } from '../../utils/functions.tsx'

import { Close } from '@mui/icons-material'
import { buttonGlitch } from './Animations'
import TiptapEditor from './TiptapEditor.tsx'

type GridViewProps = {
    item: Gang | Building | FixerJob
    index: number
    onDelete: (index: number) => void
    moduleType: ModuleTypes
    onEdit: (index: number) => void
}

const GridView = (props: GridViewProps) => {
    const { item, index, onDelete, moduleType, onEdit } = props
    const { t } = useTranslation()
    const { readerMode } = useContext(ReaderModeContext)

    // Get ordered gang data for display
    let itemData: { key: string; label: string; value: unknown }[] = []
    let color: string = ''
    switch (moduleType) {
        case ModuleTypes.GANG:
            itemData = getOrderedGangData(item as Gang, t)
            color = getGangColorValue((item as Gang).color)
            break
        case ModuleTypes.BUILDING:
            itemData = getOrderedBuildingData(item as Building, t)
            color = getBuildingColor((item as Building).type)
            break
        case ModuleTypes.FIXER_JOB:
            itemData = getOrderedFixerJobData(item as FixerJob, t)
            color = getFixerJobDifficultyColor((item as FixerJob).difficulty)
            break
    }

    return (
        <Grid item xs={12} md={6} xl={4}>
            <Card
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
                                data-text={item.name}
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
                                {item.name}
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
                                    processGangValueForDisplay('type', (item as Gang).type, t)}
                                {moduleType === ModuleTypes.BUILDING &&
                                    processBuildingValueForDisplay(
                                        'type',
                                        (item as Building).type,
                                        t,
                                        'isAbandoned' in item ? item.isAbandoned : false
                                    )}
                                {moduleType === ModuleTypes.FIXER_JOB &&
                                    processFixerJobValueForDisplay(
                                        'plot.verb.value',
                                        (item as FixerJob).plot.verb?.value,
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
                                border: readerMode ? '1px solid #d32f2f' : `1px solid ${colors.neons.red.default}60`,
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
                    {item.image && (
                        <Box
                            sx={{
                                position: 'relative',
                                width: readerMode ? 'calc(100% + 32px)' : '100%',
                                aspectRatio: '1 / 1',
                                display: 'flex',
                                alignItems: 'center',
                                maxHeight: '300px',
                                justifyContent: 'center',
                                bgcolor: `${getGangColorValue((item as Gang).color)}70`,
                                transition: 'all 0.3s ease',
                                p: 0.5,
                                borderBottom: `1px solid ${color}40`,
                                borderTop: `1px solid ${color}40`,
                                mx: readerMode ? -2 : 0,
                            }}
                        >
                            <Avatar
                                src={item.image}
                                alt={t('common.itemImageAlt', { name: item.name })}
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
                        </Box>
                    )}
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
                        <TiptapEditor value={item.description} />
                    </Box>

                    {/* Data Table */}
                    <TableContainer
                        sx={{
                            bgcolor: 'rgba(10, 15, 30, 0.8)',
                            backdropFilter: 'blur(3px)',
                            position: 'relative',
                            width: readerMode ? 'calc(100% + 32px)' : '100%',
                            mx: readerMode ? -2 : 0,
                            mb: readerMode ? -2 : -3,
                        }}
                    >
                        <Table size="small">
                            <TableBody>
                                {itemData.map((entry) => (
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
                                                      '&:nth-of-type(odd)': { bgcolor: 'rgba(0, 15, 30, 0.4)' },
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
                                                            : colors.neons.cyan.default) + ' !important',
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
                                                title={
                                                    moduleType === ModuleTypes.GANG
                                                        ? processGangValueForDisplay(entry.key, entry.value, t)
                                                        : moduleType === ModuleTypes.BUILDING
                                                        ? (processBuildingValueForDisplay(
                                                              entry.key,
                                                              entry.value,
                                                              t,
                                                              'isAbandoned' in item ? item.isAbandoned : false
                                                          ) as string)
                                                        : '—'
                                                }
                                                variant="body2"
                                                noWrap
                                                sx={{
                                                    color:
                                                        (readerMode ? colors.grays.gray000 : colors.grays.gray900) +
                                                        ' !important',
                                                }}
                                            >
                                                {moduleType === ModuleTypes.GANG &&
                                                    processGangValueForDisplay(entry.key, entry.value, t)}
                                                {moduleType === ModuleTypes.BUILDING &&
                                                    processBuildingValueForDisplay(
                                                        entry.key,
                                                        entry.value,
                                                        t,
                                                        'isAbandoned' in item ? item.isAbandoned : false
                                                    )}
                                                {moduleType === ModuleTypes.FIXER_JOB &&
                                                    (entry.value !== undefined
                                                        ? processFixerJobValueForDisplay(entry.key, entry.value, t)
                                                        : '—')}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Grid>
    )
}

export default GridView
