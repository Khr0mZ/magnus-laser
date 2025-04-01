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
import { buttonGlitch } from './GangAnimations'
import { DisplayGang } from './GangTypes'
import {
    generateLocalizedGangDescription,
    generateLocalizedGangName,
    getGangColorValue,
    getOrderedGangData,
    processValueForDisplay,
} from './GangUtils'

type DetailedGangViewProps = {
    gang: DisplayGang
    index: number
    onDelete: (index: number) => void
}

const DetailedGangView = ({ gang, index, onDelete }: DetailedGangViewProps) => {
    const { t } = useTranslation()
    const { readerMode } = useContext(ReaderModeContext)

    // Generate localized content
    const localizedName = generateLocalizedGangName(gang, t)
    const localizedDescription = generateLocalizedGangDescription(gang, t)
    const gangColor = getGangColorValue(gang.color as string)

    // Get ordered gang data for display
    const gangData = getOrderedGangData(gang, t)

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
                    transition: 'all 0.2s ease',
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
                        background: `linear-gradient(90deg, transparent, ${gangColor}, transparent)`,
                        boxShadow: `0 0 15px ${gangColor}`,
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
                            bgcolor: readerMode ? colors.blues.default : 'rgba(14, 22, 48, 0.9)',
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
                                className={readerMode ? 'gang-name-typography' : 'glitch-text'}
                                data-text={localizedName}
                                sx={{
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    fontFamily: 'Orbitron, sans-serif',
                                }}
                            >
                                {readerMode ? (
                                    <span style={{ color: gangColor, fontWeight: 'bold' }}>{localizedName}</span>
                                ) : (
                                    localizedName
                                )}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontSize: '0.7rem',
                                    fontWeight: 'normal',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                }}
                            >
                                {readerMode ? (
                                    <span style={{ color: colors.grays.gray000, fontWeight: 'bold' }}>
                                        {processValueForDisplay('type', gang.type, t)} -{' '}
                                        {processValueForDisplay('quality', gang.quality, t)}
                                    </span>
                                ) : (
                                    <>
                                        {processValueForDisplay('type', gang.type, t)} -{' '}
                                        {processValueForDisplay('quality', gang.quality, t)}
                                    </>
                                )}
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
                            bgcolor: readerMode ? colors.blues.light : 'rgba(14, 22, 48, 0.9)',
                            mx: readerMode ? -2 : 0,
                            p: 2,
                            mt: readerMode ? 4 : 8,
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        <Typography
                            variant="body1"
                            sx={{
                                fontStyle: readerMode ? 'normal' : 'italic',
                                textShadow: readerMode ? 'none' : '0 0 2px rgba(0,0,0,0.8)',
                                position: 'relative',
                                zIndex: 2,
                            }}
                        >
                            {readerMode ? (
                                <span style={{ color: colors.grays.gray000 }}>{localizedDescription}</span>
                            ) : (
                                localizedDescription
                            )}
                        </Typography>
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
                                {gangData.map((item) => {
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

export default DetailedGangView
