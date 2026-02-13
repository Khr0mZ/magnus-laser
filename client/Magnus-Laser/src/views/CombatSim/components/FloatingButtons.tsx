import { useUserPreferences } from '@/contexts/userPreferencesHooks'
import colors from '@/utils/colors'
import { toAlphaHex } from '@/views/CombatSim/utils/pixiUtils'
import { BlastType, WallShape } from '@/views/CombatSim/utils/types'
import { Close, Done } from '@mui/icons-material'
import { Box, Stack } from '@mui/material'
import { Dispatch, RefObject, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'

interface FloatingButtonsProps {
    fitRef: RefObject<(() => void) | null>
    isMeasuring: boolean
    setIsMeasuring: Dispatch<SetStateAction<boolean>>
    isWallMode: boolean
    setIsWallMode: Dispatch<SetStateAction<boolean>>
    isErasingWalls: boolean
    setIsErasingWalls: Dispatch<SetStateAction<boolean>>
    isTokenPanelOpen: boolean
    setIsTokenPanelOpen: Dispatch<SetStateAction<boolean>>
    isInitiativePanelOpen: boolean
    setIsInitiativePanelOpen: Dispatch<SetStateAction<boolean>>
    isRollHistoryOpen: boolean
    setIsRollHistoryOpen: Dispatch<SetStateAction<boolean>>
    isBlastPanelOpen: boolean
    setIsBlastPanelOpen: Dispatch<SetStateAction<boolean>>
    acceptAllRef: RefObject<(() => void) | null>
    cancelAllRef: RefObject<(() => void) | null>
    setWallColorAnchor: Dispatch<SetStateAction<HTMLElement | null>>
    setBlastDrawMode: Dispatch<SetStateAction<BlastType | null>>
    setWallDrawingShape: Dispatch<SetStateAction<WallShape | undefined>>
    wallDrawingShape: WallShape | undefined
    wallColorHex: string
    wallAlpha: number
    pendingCount: number
    isPlayerConnected: boolean
}

const FloatingButtons = (props: FloatingButtonsProps) => {
    const {
        fitRef,
        isMeasuring,
        setIsMeasuring,
        isWallMode,
        setIsWallMode,
        isErasingWalls,
        setIsErasingWalls,
        isTokenPanelOpen,
        setIsTokenPanelOpen,
        isInitiativePanelOpen,
        setIsInitiativePanelOpen,
        isRollHistoryOpen,
        setIsRollHistoryOpen,
        isBlastPanelOpen,
        setIsBlastPanelOpen,
        acceptAllRef,
        cancelAllRef,
        setWallColorAnchor,
        setBlastDrawMode,
        setWallDrawingShape,
        wallDrawingShape,
        wallColorHex,
        wallAlpha,
        pendingCount,
        isPlayerConnected,
    } = props
    const { readerMode } = useUserPreferences()
    const { t } = useTranslation()
    return (
        <>
            {/* Fit button */}
            <Box
                onClick={() => fitRef.current?.()}
                sx={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: readerMode ? 'rgba(0, 0, 40, 0.7)' : 'rgba(0, 0, 40, 0.6)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: `1px solid ${colors.neons.blue.default}60`,
                    transition: 'all 0.2s',
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 60, 0.8)',
                        border: `1px solid ${colors.neons.pink.default}60`,
                        boxShadow: `0 0 8px ${colors.neons.pink.default}80`,
                    },
                    '&:hover .fit-icon': {
                        color: colors.neons.pink.default,
                    },
                }}
                title={t('combatSim.fit')}
            >
                <Box
                    sx={{
                        fontSize: isMeasuring ? '30px' : '20px',
                        color: isMeasuring ? colors.neons.pink.default : colors.neons.blue.default,
                        transition: 'all 0.2s',
                        '&:hover': {
                            fontSize: '30px',
                        },
                    }}
                >
                    🗺️
                </Box>
            </Box>
            {/* Measure button */}
            <Box
                onClick={() =>
                    setIsMeasuring((v) => {
                        const nv = !v
                        if (nv) {
                            setIsWallMode(false)
                            setIsErasingWalls(false)
                            setWallColorAnchor(null)
                            setBlastDrawMode(null)
                        }
                        return nv
                    })
                }
                sx={{
                    position: 'absolute',
                    top: 52,
                    left: 10,
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isMeasuring
                        ? 'rgba(255, 0, 255, 0.3)'
                        : readerMode
                        ? 'rgba(0, 0, 40, 0.7)'
                        : 'rgba(0, 0, 40, 0.6)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: `1px solid ${isMeasuring ? colors.neons.pink.default : colors.neons.blue.default}60`,
                    transition: 'all 0.2s',
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 60, 0.8)',
                        border: `1px solid ${colors.neons.pink.default}60`,
                        boxShadow: `0 0 8px ${colors.neons.pink.default}80`,
                    },
                    '&:hover .measure-icon': {
                        color: colors.neons.pink.default,
                    },
                }}
                title={t('combatSim.measure')}
            >
                <Box
                    sx={{
                        fontSize: isMeasuring ? '30px' : '20px',
                        color: isMeasuring ? colors.neons.pink.default : colors.neons.blue.default,
                        transition: 'all 0.2s',
                        '&:hover': {
                            fontSize: '30px',
                        },
                    }}
                >
                    📏
                </Box>
            </Box>
            {/* Wall mode button */}
            {!isPlayerConnected && (
                <Box
                    onClick={() => {
                        setIsWallMode((v) => {
                            const nv = !v
                            if (nv) {
                                setIsMeasuring(false)
                                setBlastDrawMode(null)
                                setWallDrawingShape('line') // Reset to line mode when entering wall mode
                            }
                            if (!nv) {
                                setIsErasingWalls(false)
                                setWallColorAnchor(null)
                            }
                            return nv
                        })
                    }}
                    sx={{
                        position: 'absolute',
                        top: 94,
                        left: 10,
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isWallMode
                            ? 'rgba(255, 0, 255, 0.3)'
                            : readerMode
                            ? 'rgba(0, 0, 40, 0.7)'
                            : 'rgba(0, 0, 40, 0.6)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        border: `1px solid ${isWallMode ? colors.neons.green.default : colors.neons.blue.default}60`,
                        transition: 'all 0.2s',
                        '&:hover': {
                            backgroundColor: 'rgba(0, 0, 60, 0.8)',
                            border: `1px solid ${colors.neons.green.default}60`,
                            boxShadow: `0 0 8px ${colors.neons.green.default}80`,
                        },
                        '&:hover .wall-mode-icon': {
                            color: colors.neons.green.default,
                        },
                    }}
                    title={t('combatSim.wallMode')}
                >
                    <Box
                        sx={{
                            fontSize: isWallMode ? '30px' : '20px',
                            color: isTokenPanelOpen ? colors.neons.pink.default : colors.neons.blue.default,
                            transition: 'all 0.2s',
                            '&:hover': {
                                fontSize: '30px',
                            },
                        }}
                    >
                        🧱
                    </Box>
                </Box>
            )}
            {/* Blasts button */}
            {!isPlayerConnected && (
                <Box
                    onClick={() => {
                        setIsBlastPanelOpen((v) => !v)
                    }}
                    sx={{
                        position: 'absolute',
                        top: 136,
                        left: 10,
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isBlastPanelOpen
                            ? 'rgba(255, 0, 255, 0.3)'
                            : readerMode
                            ? 'rgba(0, 0, 40, 0.7)'
                            : 'rgba(0, 0, 40, 0.6)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        border: `1px solid ${
                            isBlastPanelOpen ? colors.neons.pink.default : colors.neons.blue.default
                        }60`,
                        transition: 'all 0.2s',
                        '&:hover': {
                            backgroundColor: 'rgba(0, 0, 60, 0.8)',
                            border: `1px solid ${colors.neons.pink.default}60`,
                            boxShadow: `0 0 8px ${colors.neons.pink.default}80`,
                        },
                    }}
                    title={t('combatSim.blastsPanelTitle')}
                >
                    <Box
                        sx={{
                            fontSize: isBlastPanelOpen ? '30px' : '20px',
                            color: isBlastPanelOpen ? colors.neons.pink.default : colors.neons.blue.default,
                            transition: 'all 0.2s',
                            '&:hover': {
                                fontSize: '30px',
                            },
                        }}
                    >
                        ✨
                    </Box>
                </Box>
            )}
            {/* Token Panel button */}
            <Box
                onClick={() => {
                    setIsTokenPanelOpen((v) => !v)
                }}
                sx={{
                    position: 'absolute',
                    top: isPlayerConnected ? 94 : 178,
                    left: 10,
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isTokenPanelOpen
                        ? 'rgba(255, 0, 255, 0.3)'
                        : readerMode
                        ? 'rgba(0, 0, 40, 0.7)'
                        : 'rgba(0, 0, 40, 0.6)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: `1px solid ${isTokenPanelOpen ? colors.neons.pink.default : colors.neons.blue.default}60`,
                    transition: 'all 0.2s',
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 60, 0.8)',
                        border: `1px solid ${colors.neons.pink.default}60`,
                        boxShadow: `0 0 8px ${colors.neons.pink.default}80`,
                    },
                }}
                title={t('combatSim.tokensPanel')}
            >
                <Box
                    sx={{
                        fontSize: isTokenPanelOpen ? '30px' : '20px',
                        color: isTokenPanelOpen ? colors.neons.pink.default : colors.neons.blue.default,
                        transition: 'all 0.2s',
                        '&:hover': {
                            fontSize: '30px',
                        },
                    }}
                >
                    👨‍🎤
                </Box>
            </Box>
            {/* Initiative Panel button */}
            <Box
                onClick={() => setIsInitiativePanelOpen((v) => !v)}
                sx={{
                    position: 'absolute',
                    top: isPlayerConnected ? 136 : 220,
                    left: 10,
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isInitiativePanelOpen
                        ? 'rgba(255, 0, 255, 0.3)'
                        : readerMode
                        ? 'rgba(0, 0, 40, 0.7)'
                        : 'rgba(0, 0, 40, 0.6)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: `1px solid ${
                        isInitiativePanelOpen ? colors.neons.pink.default : colors.neons.blue.default
                    }60`,
                    transition: 'all 0.2s',
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 60, 0.8)',
                        border: `1px solid ${colors.neons.pink.default}60`,
                        boxShadow: `0 0 8px ${colors.neons.pink.default}80`,
                    },
                }}
                title={t('combatSim.initiativePanel')}
            >
                <Box
                    sx={{
                        fontSize: isInitiativePanelOpen ? '30px' : '20px',
                        color: isInitiativePanelOpen ? colors.neons.pink.default : colors.neons.blue.default,
                        transition: 'all 0.2s',
                        '&:hover': {
                            fontSize: '30px',
                        },
                    }}
                >
                    ⚔️
                </Box>
            </Box>
            {/* Roll History button */}
            <Box
                onClick={() => setIsRollHistoryOpen((v) => !v)}
                sx={{
                    position: 'absolute',
                    top: isPlayerConnected ? 178 : 262,
                    left: 10,
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isRollHistoryOpen
                        ? 'rgba(255, 0, 255, 0.3)'
                        : readerMode
                        ? 'rgba(0, 0, 40, 0.7)'
                        : 'rgba(0, 0, 40, 0.6)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: `1px solid ${isRollHistoryOpen ? colors.neons.pink.default : colors.neons.blue.default}60`,
                    transition: 'all 0.2s',
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 60, 0.8)',
                        border: `1px solid ${colors.neons.pink.default}60`,
                        boxShadow: `0 0 8px ${colors.neons.pink.default}80`,
                    },
                }}
                title={t('combatSim.rollHistory')}
            >
                <Box
                    sx={{
                        fontSize: isRollHistoryOpen ? '30px' : '20px',
                        color: isRollHistoryOpen ? colors.neons.pink.default : colors.neons.blue.default,
                        transition: 'all 0.2s',
                        '&:hover': {
                            fontSize: '30px',
                        },
                    }}
                >
                    🎲
                </Box>
            </Box>
            {/* Eraser & Wall color (visible in wall mode) */}
            {isWallMode && (
                <>
                    {/* Line wall drawing mode */}
                    <Box
                        onClick={() => {
                            if (wallDrawingShape === 'line') {
                                setWallDrawingShape(undefined)
                                return
                            }
                            setWallDrawingShape('line')
                            setIsErasingWalls(false)
                        }}
                        sx={{
                            position: 'absolute',
                            top: 94,
                            left: 54,
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor:
                                wallDrawingShape === 'line'
                                    ? 'rgba(255, 0, 255, 0.3)'
                                    : readerMode
                                    ? 'rgba(0, 0, 40, 0.7)'
                                    : 'rgba(0, 0, 40, 0.6)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: `1px solid ${
                                wallDrawingShape === 'line' ? colors.neons.pink.default : colors.neons.blue.default
                            }60`,
                            transition: 'all 0.2s',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 60, 0.8)',
                                border: `1px solid ${colors.neons.blue.default}60`,
                                boxShadow: `0 0 8px ${colors.neons.blue.default}80`,
                            },
                        }}
                        title={t('combatSim.lineMode')}
                    >
                        <Box
                            sx={{
                                fontSize: wallDrawingShape === 'line' ? '30px' : '20px',
                                color:
                                    wallDrawingShape === 'line' ? colors.neons.pink.default : colors.neons.blue.default,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    fontSize: '30px',
                                },
                            }}
                        >
                            ➖
                        </Box>
                    </Box>
                    {/* Rectangle wall drawing mode */}
                    <Box
                        onClick={() => {
                            if (wallDrawingShape === 'rectangle') {
                                setWallDrawingShape(undefined)
                                return
                            }
                            setWallDrawingShape('rectangle')
                            setIsErasingWalls(false)
                        }}
                        sx={{
                            position: 'absolute',
                            top: 94,
                            left: 98,
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor:
                                wallDrawingShape === 'rectangle'
                                    ? 'rgba(255, 0, 255, 0.3)'
                                    : readerMode
                                    ? 'rgba(0, 0, 40, 0.7)'
                                    : 'rgba(0, 0, 40, 0.6)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: `1px solid ${
                                wallDrawingShape === 'rectangle'
                                    ? colors.neons.green.default
                                    : colors.neons.blue.default
                            }60`,
                            transition: 'all 0.2s',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 60, 0.8)',
                                border: `1px solid ${colors.neons.green.default}60`,
                                boxShadow: `0 0 8px ${colors.neons.green.default}80`,
                            },
                        }}
                        title={t('combatSim.rectangleMode')}
                    >
                        <Box
                            sx={{
                                fontSize: wallDrawingShape === 'rectangle' ? '24px' : '16px',
                                color:
                                    wallDrawingShape === 'rectangle'
                                        ? colors.neons.green.default
                                        : colors.neons.blue.default,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    fontSize: '24px',
                                },
                            }}
                        >
                            🔳
                        </Box>
                    </Box>
                    {/* Circle wall drawing mode */}
                    <Box
                        onClick={() => {
                            if (wallDrawingShape === 'circle') {
                                setWallDrawingShape(undefined)
                                return
                            }
                            setWallDrawingShape('circle')
                            setIsErasingWalls(false)
                        }}
                        sx={{
                            position: 'absolute',
                            top: 94,
                            left: 142,
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor:
                                wallDrawingShape === 'circle'
                                    ? 'rgba(255, 0, 255, 0.3)'
                                    : readerMode
                                    ? 'rgba(0, 0, 40, 0.7)'
                                    : 'rgba(0, 0, 40, 0.6)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: `1px solid ${
                                wallDrawingShape === 'circle' ? colors.neons.pink.default : colors.neons.blue.default
                            }60`,
                            transition: 'all 0.2s',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 60, 0.8)',
                                border: `1px solid ${colors.neons.pink.default}60`,
                                boxShadow: `0 0 8px ${colors.neons.pink.default}80`,
                            },
                        }}
                        title={t('combatSim.circleMode')}
                    >
                        <Box
                            sx={{
                                fontSize: wallDrawingShape === 'circle' ? '30px' : '20px',
                                color:
                                    wallDrawingShape === 'circle'
                                        ? colors.neons.pink.default
                                        : colors.neons.blue.default,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    fontSize: '30px',
                                },
                            }}
                        >
                            ⭕
                        </Box>
                    </Box>
                    {/* Eraser button */}
                    <Box
                        onClick={() =>
                            setIsErasingWalls((v) => {
                                const nv = !v
                                if (nv) {
                                    setIsWallMode(true)
                                    setIsMeasuring(false)
                                    setBlastDrawMode(null)
                                    setWallDrawingShape(undefined)
                                }
                                return nv
                            })
                        }
                        sx={{
                            position: 'absolute',
                            top: 94,
                            left: 186,
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isErasingWalls
                                ? 'rgba(255, 0, 0, 0.3)'
                                : readerMode
                                ? 'rgba(0, 0, 40, 0.7)'
                                : 'rgba(0, 0, 40, 0.6)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: `1px solid ${
                                isErasingWalls ? colors.neons.red.default : colors.neons.blue.default
                            }60`,
                            transition: 'all 0.2s',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 60, 0.8)',
                                border: `1px solid ${colors.neons.red.default}60`,
                                boxShadow: `0 0 8px ${colors.neons.red.default}80`,
                            },
                        }}
                        title={t('combatSim.eraser')}
                    >
                        <Box
                            className="wall-eraser-mode-icon"
                            sx={{
                                fontSize: isErasingWalls ? '30px' : '20px',
                                color: isErasingWalls ? colors.neons.red.default : colors.neons.blue.default,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    fontSize: '30px',
                                },
                            }}
                        >
                            ♻️
                        </Box>
                    </Box>
                    {/* Wall color picker */}
                    <Box
                        onClick={(e) => {
                            const anchor = e.currentTarget as HTMLElement
                            setWallColorAnchor((prev) => (prev ? null : anchor))
                        }}
                        sx={{
                            position: 'absolute',
                            top: 94,
                            left: 230,
                            width: '36px',
                            height: '36px',
                            display: 'block',
                            backgroundColor: readerMode ? 'rgba(0, 0, 40, 0.7)' : 'rgba(0, 0, 40, 0.6)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: `1px solid ${colors.neons.blue.default}60`,
                            transition: 'all 0.2s',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 60, 0.8)',
                                border: `1px solid ${colors.neons.pink.default}60`,
                                boxShadow: `0 0 8px ${colors.neons.pink.default}80`,
                            },
                        }}
                        title={t('combatSim.wallColor')}
                    >
                        <Box
                            sx={{
                                m: '8px',
                                width: '20px',
                                height: '20px',
                                bgcolor: `${wallColorHex}${toAlphaHex(wallAlpha)}`,
                                borderRadius: '3px',
                                border: '1px solid #0006',
                            }}
                        />
                    </Box>
                </>
            )}
            {/* Accept & Cancel All Pending */}
            {pendingCount > 0 && !isPlayerConnected && (
                <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                    }}
                >
                    <Box
                        onClick={(e) => {
                            e.stopPropagation()
                            cancelAllRef.current?.()
                        }}
                        sx={{
                            width: '36px',
                            height: '36px',
                            display: 'block',
                            backgroundColor: readerMode ? 'rgba(0, 0, 40, 0.9)' : 'rgba(0, 0, 40, 0.9)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: `1px solid ${colors.neons.blue.default}60`,
                            transition: 'all 0.2s',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 60, 0.8)',
                                border: `1px solid ${colors.neons.red.default}60`,
                                boxShadow: `0 0 8px ${colors.neons.red.default}80`,
                            },
                            '&:hover .pending-btn-icon-cancel': {
                                color: colors.neons.red.default,
                            },
                        }}
                        title={t('common.cancelAll')}
                    >
                        <Close
                            className="pending-btn-icon-cancel"
                            sx={{
                                m: '6px',
                                fontSize: '24px',
                                lineHeight: '24px',
                                color: colors.neons.red.default,
                            }}
                        />
                    </Box>
                    <Box
                        onClick={(e) => {
                            e.stopPropagation()
                            acceptAllRef.current?.()
                        }}
                        sx={{
                            width: '36px',
                            height: '36px',
                            display: 'block',
                            backgroundColor: readerMode ? 'rgba(0, 0, 40, 0.9)' : 'rgba(0, 0, 40, 0.9)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: `1px solid ${colors.neons.blue.default}60`,
                            transition: 'all 0.2s',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 60, 0.8)',
                                border: `1px solid ${colors.neons.green.default}60`,
                                boxShadow: `0 0 8px ${colors.neons.green.default}80`,
                            },
                            '&:hover .pending-btn-icon-accept': {
                                color: colors.neons.green.default,
                            },
                        }}
                        title={t('common.acceptAll')}
                    >
                        <Done
                            className="pending-btn-icon-accept"
                            sx={{
                                m: '6px',
                                fontSize: '24px',
                                lineHeight: '24px',
                                color: colors.neons.green.default,
                            }}
                        />
                    </Box>
                </Stack>
            )}
        </>
    )
}

export default FloatingButtons
