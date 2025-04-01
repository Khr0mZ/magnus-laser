import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { ReaderModeContext } from '../../contexts/ReaderModeContext'
import colors from '../../utils/colors'
import { translateLabel } from '../../utils/i18nUtils'
import { buttonGlitch } from './BuildingAnimations'
import { DisplayBuilding } from './BuildingTypes'
import { generateLocalizedBuildingName, processValueForDisplay } from './BuildingUtils'

type CompactBuildingViewProps = {
    buildings: DisplayBuilding[]
    onDelete: (index: number) => void
}

const CompactBuildingView = ({ buildings, onDelete }: CompactBuildingViewProps) => {
    const { t } = useTranslation()
    const { readerMode } = useContext(ReaderModeContext)

    if (buildings.length === 0) return null

    return (
        <TableContainer
            sx={{
                mb: 4,
                borderRadius: '4px',
                overflowX: 'auto',
                position: 'relative',
                ...(readerMode
                    ? {
                          backgroundColor: '#fff !important',
                          border: '1px solid #ddd !important',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1) !important',
                      }
                    : {
                          bgcolor: colors.cyberpunk.darkBg,
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
                      }),
            }}
        >
            <Table size="small" sx={{ minWidth: 650 }}>
                <TableHead>
                    <TableRow
                        sx={{
                            bgcolor: 'rgba(0, 255, 255, 0.05)',
                            position: 'relative',
                        }}
                    >
                        <TableCell
                            sx={{
                                fontWeight: 'bold',
                                color: readerMode ? '#333' : colors.neons.cyan.default,
                                position: 'sticky',
                                left: 0,
                                bgcolor: readerMode ? '#f5f5f5' : 'rgba(0, 255, 255, 0.05)',
                                zIndex: 2,
                                borderBottom: readerMode ? '1px solid #ddd' : `1px solid ${colors.neons.cyan.dark}`,
                                textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.cyan.dark}`,
                                ...(readerMode
                                    ? {
                                          color: '#333 !important',
                                          textShadow: 'none !important',
                                          backgroundColor: '#f5f5f5 !important',
                                          borderBottom: '1px solid #ddd !important',
                                      }
                                    : {}),
                            }}
                        >
                            {t('buildings.labels.name', 'Name')}
                        </TableCell>
                        {/* Other header cells with updated styling */}
                        {[
                            'type',
                            'elevators',
                            'parking',
                            'gatehouseFrontDesk',
                            'emergencyExit',
                            'backupLights',
                            'landingPad',
                            'secretOrAltEntrance',
                            'ownership',
                            'securityPersonnel',
                            'style',
                            'event',
                            'secret',
                        ].map((key) => (
                            <TableCell
                                key={key}
                                sx={{
                                    fontWeight: 'bold',
                                    color: readerMode ? '#333' : colors.neons.cyan.default,
                                    borderBottom: readerMode ? '1px solid #ddd' : `1px solid ${colors.neons.cyan.dark}`,
                                    textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.cyan.dark}`,
                                    ...(readerMode
                                        ? {
                                              color: '#333 !important',
                                              textShadow: 'none !important',
                                              backgroundColor: '#f5f5f5 !important',
                                              borderBottom: '1px solid #ddd !important',
                                          }
                                        : {}),
                                }}
                            >
                                {translateLabel(t, key, 'buildings')}
                            </TableCell>
                        ))}
                        {/* Add header cell for actions */}
                        <TableCell
                            sx={{
                                fontWeight: 'bold',
                                color: readerMode ? '#333' : colors.neons.cyan.default,
                                borderBottom: readerMode ? '1px solid #ddd' : `1px solid ${colors.neons.cyan.dark}`,
                                textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.cyan.dark}`,
                                width: '60px',
                                textAlign: 'center',
                                ...(readerMode
                                    ? {
                                          color: '#333 !important',
                                          textShadow: 'none !important',
                                          backgroundColor: '#f5f5f5 !important',
                                          borderBottom: '1px solid #ddd !important',
                                      }
                                    : {}),
                            }}
                        >
                            {t('common.actions', 'Actions')}
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {buildings.map((building, index) => {
                        // Generate localized name for the table row
                        const localizedName = generateLocalizedBuildingName(building, t)

                        return (
                            <TableRow
                                key={index}
                                sx={{
                                    ...(readerMode
                                        ? {
                                              '&:nth-of-type(odd)': { bgcolor: '#f9f9f9' },
                                              '&:nth-of-type(even)': { bgcolor: '#fff' },
                                              '&:hover': {
                                                  bgcolor: '#f0f0f0',
                                                  transform: 'none !important',
                                              },
                                          }
                                        : {
                                              '&:nth-of-type(odd)': { bgcolor: 'rgba(0, 15, 30, 0.4)' },
                                              '&:nth-of-type(even)': { bgcolor: 'rgba(0, 20, 40, 0.2)' },
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
                                        color: readerMode ? '#1a237e' : colors.neons.green.default,
                                        fontWeight: 'bold',
                                        fontSize: { xs: '0.75rem', sm: '0.85rem' },
                                        fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                                        letterSpacing: '0.5px',
                                        textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.green.default}50`,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: { xs: '100px', sm: '150px', md: '200px' },
                                        position: 'sticky',
                                        left: 0,
                                        bgcolor:
                                            index % 2 === 0
                                                ? readerMode
                                                    ? '#f9f9f9'
                                                    : 'rgba(0, 15, 30, 0.4)'
                                                : readerMode
                                                ? '#fff'
                                                : 'rgba(0, 20, 40, 0.2)',
                                        zIndex: 1,
                                        borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
                                        '&::after': !readerMode
                                            ? {
                                                  content: '""',
                                                  position: 'absolute',
                                                  bottom: 0,
                                                  left: 0,
                                                  width: '100%',
                                                  height: '1px',
                                                  background: `linear-gradient(90deg, ${colors.neons.green.default}40, transparent 80%)`,
                                              }
                                            : {},
                                        ...(readerMode
                                            ? {
                                                  color: colors.blues.dark,
                                                  textShadow: 'none !important',
                                                  backgroundColor:
                                                      index % 2 === 0 ? '#f9f9f9 !important' : '#fff !important',
                                                  borderBottom: '1px solid #ddd !important',
                                              }
                                            : {}),
                                    }}
                                    className="cell-content"
                                >
                                    {localizedName}
                                </TableCell>
                                <TableCell
                                    sx={{
                                        color: colors.neons.green.default,
                                        borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
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
                                    {processValueForDisplay('type', building.type, t)}
                                </TableCell>
                                <TableCell
                                    sx={{
                                        color: colors.neons.green.default,
                                        borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
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
                                    {processValueForDisplay('elevators', building.elevators, t)}
                                </TableCell>
                                <TableCell
                                    sx={{
                                        color: colors.neons.green.default,
                                        borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
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
                                    {processValueForDisplay('parking', building.parking, t)}
                                </TableCell>
                                <TableCell
                                    sx={{
                                        color: colors.neons.green.default,
                                        borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
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
                                    {processValueForDisplay('gatehouseFrontDesk', building.gatehouseFrontDesk, t)}
                                </TableCell>
                                <TableCell
                                    sx={{
                                        color: colors.neons.green.default,
                                        borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
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
                                    {processValueForDisplay('emergencyExit', building.emergencyExit, t)}
                                </TableCell>
                                <TableCell
                                    sx={{
                                        color: colors.neons.green.default,
                                        borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
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
                                    {processValueForDisplay('backupLights', building.backupLights, t)}
                                </TableCell>
                                <TableCell
                                    sx={{
                                        color: colors.neons.green.default,
                                        borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
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
                                    {processValueForDisplay('landingPad', building.landingPad, t)}
                                </TableCell>
                                <TableCell
                                    sx={{
                                        color: colors.neons.green.default,
                                        borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
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
                                    {processValueForDisplay('secretOrAltEntrance', building.secretOrAltEntrance, t)}
                                </TableCell>
                                <TableCell
                                    sx={{
                                        color: colors.neons.green.default,
                                        borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
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
                                    {processValueForDisplay('ownership', building.ownership, t)}
                                </TableCell>
                                <TableCell
                                    sx={{
                                        color: colors.neons.green.default,
                                        borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
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
                                    {processValueForDisplay('securityPersonnel', building.securityPersonnel, t)}
                                </TableCell>
                                <TableCell
                                    sx={{
                                        color: colors.neons.green.default,
                                        borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
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
                                    {processValueForDisplay('style', building.style, t)}
                                </TableCell>
                                <TableCell
                                    sx={{
                                        color: colors.neons.green.default,
                                        borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
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
                                    {processValueForDisplay('event', building.event, t)}
                                </TableCell>
                                <TableCell
                                    sx={{
                                        color: colors.neons.green.default,
                                        borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
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
                                    {processValueForDisplay('secret', building.secret, t)}
                                </TableCell>
                                {/* Add delete button */}
                                <TableCell
                                    sx={{
                                        color: colors.neons.red.default,
                                        borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
                                        textAlign: 'center',
                                        ...(readerMode
                                            ? {
                                                  color: '#d32f2f !important',
                                                  textShadow: 'none !important',
                                                  borderBottom: '1px solid #ddd !important',
                                              }
                                            : {}),
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

export default CompactBuildingView
