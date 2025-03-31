import {
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
import colors from '../../utils/colors'
import { translateLabel } from '../../utils/i18nUtils'
import { buttonGlitch } from './BuildingAnimations'
import { DisplayBuilding } from './BuildingTypes'
import {
    generateLocalizedBuildingDescription,
    generateLocalizedBuildingName,
    processValueForDisplay,
} from './BuildingUtils'

type DetailedBuildingViewProps = {
    building: DisplayBuilding
    index: number
    onDelete: (index: number) => void
}

const DetailedBuildingView = ({ building, index, onDelete }: DetailedBuildingViewProps) => {
    const { t } = useTranslation()
    const { readerMode } = useContext(ReaderModeContext)

    // Priority order for display in the table, matching the reference
    const getOrderedBuildingData = (building: DisplayBuilding) => {
        return [
            { key: 'type', label: translateLabel(t, 'type', 'buildings'), value: building.type },
            { key: 'elevators', label: translateLabel(t, 'elevators', 'buildings'), value: building.elevators },
            { key: 'parking', label: translateLabel(t, 'parking', 'buildings'), value: building.parking },
            {
                key: 'gatehouseFrontDesk',
                label: translateLabel(t, 'gatehouseFrontDesk', 'buildings'),
                value: building.gatehouseFrontDesk,
            },
            {
                key: 'emergencyExit',
                label: translateLabel(t, 'emergencyExit', 'buildings'),
                value: building.emergencyExit,
            },
            {
                key: 'backupLights',
                label: translateLabel(t, 'backupLights', 'buildings'),
                value: building.backupLights,
            },
            { key: 'landingPad', label: translateLabel(t, 'landingPad', 'buildings'), value: building.landingPad },
            {
                key: 'secretOrAltEntrance',
                label: translateLabel(t, 'secretOrAltEntrance', 'buildings'),
                value: building.secretOrAltEntrance,
            },
            { key: 'ownership', label: translateLabel(t, 'ownership', 'buildings'), value: building.ownership },
            {
                key: 'securityPersonnel',
                label: translateLabel(t, 'securityPersonnel', 'buildings'),
                value: building.securityPersonnel,
            },
            { key: 'style', label: translateLabel(t, 'style', 'buildings'), value: building.style },
            { key: 'event', label: translateLabel(t, 'event', 'buildings'), value: building.event },
            { key: 'secret', label: translateLabel(t, 'secret', 'buildings'), value: building.secret },
        ]
    }

    const buildingData = getOrderedBuildingData(building)

    // Generate localized name and description
    const localizedName = generateLocalizedBuildingName(building, t)
    const localizedDescription = generateLocalizedBuildingDescription(building, t)

    return (
        <Grid item xs={12} md={6} xl={4}>
            <Card
                sx={{
                    bgcolor: '#0e1630',
                    border: 'none',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
                    position: 'relative',
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
                        background: `linear-gradient(90deg, transparent, ${colors.neons.cyan.default}, transparent)`,
                        boxShadow: `0 0 15px ${colors.neons.cyan.default}`,
                        zIndex: 2,
                    },
                }}
            >
                <CardContent sx={{ p: 0, position: 'relative', zIndex: 3 }}>
                    {/* Index number and type indicator */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: readerMode ? 0 : -56,
                            left: 0,
                            bgcolor: 'rgba(25, 28, 58, 0.9)',
                            color: '#fff',
                            py: 0.8,
                            px: 1.5,
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            zIndex: 5,
                            backdropFilter: 'blur(2px)',
                        }}
                    >
                        <Box>
                            <Typography
                                className={readerMode ? '' : 'glitch-text'}
                                data-text={localizedName}
                                sx={{
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    color: readerMode
                                        ? '#333'
                                        : building.style === 'LUXURIOUS'
                                        ? colors.neons.yellow.default
                                        : colors.neons.cyan.default,
                                    fontFamily: 'Orbitron, sans-serif',
                                    ...(readerMode && {
                                        color: '#333 !important',
                                        textShadow: 'none !important',
                                    }),
                                }}
                            >
                                {localizedName}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontSize: '0.7rem',
                                    fontWeight: 'normal',
                                    color: readerMode ? '#555' : '#aaa',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    ...(readerMode && {
                                        color: '#555 !important',
                                    }),
                                }}
                            >
                                {processValueForDisplay('type', building.type, t)} -{' '}
                                {processValueForDisplay('style', building.style, t)}
                            </Typography>
                        </Box>

                        {/* Delete Button - Updated to use confirmation */}
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
                                          transform: 'scale(1.05)',
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
                    </Box>

                    {/* Header Section */}
                    <Box
                        sx={{
                            bgcolor: 'rgba(14, 22, 48, 0.9)',
                            p: 2,
                            mt: 8,
                            borderBottom: `1px solid rgba(${
                                building.style === 'LUXURIOUS'
                                    ? colors.neons.yellow.default
                                          .replace('#', '')
                                          .match(/.{2}/g)
                                          ?.map((hex) => parseInt(hex, 16))
                                          .join(',')
                                    : '0, 255, 255'
                            }, 0.3)`,
                            position: 'relative',
                            overflow: 'hidden',
                            '&::after': !readerMode
                                ? {
                                      content: '""',
                                      position: 'absolute',
                                      bottom: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '1px',
                                      background: `linear-gradient(90deg, transparent, ${
                                          building.style === 'LUXURIOUS'
                                              ? colors.neons.yellow.default
                                              : colors.neons.cyan.default
                                      }, transparent)`,
                                      opacity: 0.5,
                                  }
                                : {},
                        }}
                    >
                        <Typography
                            variant="body1"
                            sx={{
                                color: readerMode ? '#333' : '#fff',
                                fontStyle: readerMode ? 'normal' : 'italic',
                                textShadow: readerMode ? 'none' : '0 0 2px rgba(0,0,0,0.8)',
                                position: 'relative',
                                zIndex: 2,
                            }}
                        >
                            {localizedDescription}
                        </Typography>
                    </Box>

                    {/* Data Table */}
                    <TableContainer
                        sx={{
                            bgcolor: 'rgba(10, 15, 30, 0.8)',
                            backdropFilter: 'blur(3px)',
                            position: 'relative',
                        }}
                    >
                        <Table size="small">
                            <TableBody>
                                {buildingData.map((item) => {
                                    const displayValue = processValueForDisplay(item.key, item.value, t)

                                    return (
                                        <TableRow
                                            key={item.key}
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
                                                    borderBottom: 'none',
                                                    color: colors.neons.cyan.default,
                                                    fontWeight: 'bold',
                                                    width: '40%',
                                                    textShadow: `0 0 5px ${colors.neons.cyan.dark}`,
                                                    ...(readerMode && {
                                                        color: '#333 !important',
                                                        textShadow: 'none !important',
                                                    }),
                                                }}
                                                className="cell-content"
                                            >
                                                {item.label}
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
                                                    color: '#fff',
                                                    textShadow: `0 0 5px ${colors.neons.green.dark}`,
                                                    ...(readerMode
                                                        ? {
                                                              color: '#333 !important',
                                                              textShadow: 'none !important',
                                                              borderBottom: '1px solid #ddd !important',
                                                          }
                                                        : {}),
                                                }}
                                                className="cell-content"
                                            >
                                                {displayValue}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Grid>
    )
}

export default DetailedBuildingView
