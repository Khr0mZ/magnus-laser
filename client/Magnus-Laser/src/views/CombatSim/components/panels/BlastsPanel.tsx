import { ExpandMore, Lock } from '@mui/icons-material'
import { Accordion, AccordionDetails, AccordionSummary, Box, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CustomScrollbar from '../../../../components/CustomScrollbar'
import { useUserPreferences } from '../../../../contexts/userPreferencesHooks'
import colors from '../../../../utils/colors'
import { Blast, BlastType } from '../../types'
import { BlastContextMenu } from '../contextMenus/BlastContextMenu'

interface BlastsPanelProps {
    isSidePanelOpen: boolean
    gridSize: number
    blasts: Blast[]
    blastsNotInMap: Blast[]
    blastDrawMode: BlastType | null
    onActivateBlastDrawMode: (type: BlastType) => void
    onBlastDelete: (id: string) => void
    onBlastCopy: (id: string) => void
    onBlastCut: (id: string) => void
    onBlastLock: (id: string, locked: boolean) => void
    mapKey: string
}

const BlastsPanel = ({
    isSidePanelOpen,
    blasts,
    blastsNotInMap,
    blastDrawMode,
    onActivateBlastDrawMode,
    onBlastDelete,
    onBlastCopy,
    onBlastCut,
    onBlastLock,
}: BlastsPanelProps) => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    const [blastContextMenuAnchor, setBlastContextMenuAnchor] = useState<HTMLElement | null>(null)
    const [selectedBlastId, setSelectedBlastId] = useState<string | null>(null)

    const selectedBlast =
        blasts.find((b) => b.id === selectedBlastId) || blastsNotInMap.find((b) => b.id === selectedBlastId)

    const closeContextMenu = () => {
        if (blastContextMenuAnchor) {
            document.body.removeChild(blastContextMenuAnchor)
        }
        setBlastContextMenuAnchor(null)
        setSelectedBlastId(null)
    }

    const getBlastTypeLabel = (type: BlastType): string => {
        switch (type) {
            case 'grenade':
                return '💣 Grenade (5x5)'
            case 'circle':
                return '🟠 Adaptable Circle'
            case 'square':
                return '🟧 Adaptable Rectangle'
            case 'cone':
                return '🔥 Flamer (6x3)'
        }
    }

    const getBlastDisplayName = (blast: Blast): string => {
        switch (blast.type) {
            case 'grenade':
                return `💣 ${blast.name}`
            case 'circle':
                return `🟠 Circle (r=${blast.size?.toFixed(1) || '?'})`
            case 'square': {
                const w = blast.size?.toFixed(1) || '?'
                const h = blast.sizeY?.toFixed(1) || blast.size?.toFixed(1) || '?'
                return `🟧 Rectangle (${w}x${h})`
            }
            case 'cone':
                return `🔥 ${blast.name}`
        }
    }

    const renderBlastTemplate = (type: BlastType) => {
        const isGrenade = type === 'grenade'
        const isCone = type === 'cone'
        const isDraggable = isGrenade || isCone
        const isActive = !isGrenade && !isCone && blastDrawMode === type

        return (
            <Stack
                key={type}
                direction="row"
                spacing={1}
                alignItems="center"
                draggable={isDraggable}
                onDragStart={(e) => {
                    if (isGrenade) {
                        e.dataTransfer.effectAllowed = 'copyMove'
                        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'grenade' }))

                        // Use circle_blast image (no emoji), same as adaptable circle style
                        const dragPreview = document.createElement('div')
                        dragPreview.style.position = 'absolute'
                        dragPreview.style.top = '-1000px'
                        dragPreview.style.left = '-1000px'
                        dragPreview.style.width = '50px'
                        dragPreview.style.height = '50px'
                        dragPreview.style.borderRadius = '50%'
                        dragPreview.style.overflow = 'hidden'
                        const img = document.createElement('img')
                        img.src = '/blasts/circle_blast.webp'
                        img.style.width = '100%'
                        img.style.height = '100%'
                        img.style.objectFit = 'cover'
                        dragPreview.appendChild(img)
                        document.body.appendChild(dragPreview)
                        e.dataTransfer.setDragImage(dragPreview, 25, 25)
                        setTimeout(() => {
                            document.body.removeChild(dragPreview)
                        }, 0)
                    } else if (isCone) {
                        e.dataTransfer.effectAllowed = 'copyMove'
                        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'cone' }))

                        // Use flame_blast image for cone drag preview
                        const dragPreview = document.createElement('div')
                        dragPreview.style.position = 'absolute'
                        dragPreview.style.top = '-1000px'
                        dragPreview.style.left = '-1000px'
                        dragPreview.style.width = '50px'
                        dragPreview.style.height = '50px'
                        dragPreview.style.overflow = 'hidden'
                        const img = document.createElement('img')
                        img.src = '/blasts/flame_blast.webp'
                        img.style.width = '100%'
                        img.style.height = '100%'
                        img.style.objectFit = 'cover'
                        dragPreview.appendChild(img)
                        document.body.appendChild(dragPreview)
                        e.dataTransfer.setDragImage(dragPreview, 25, 25)
                        setTimeout(() => {
                            document.body.removeChild(dragPreview)
                        }, 0)
                    }
                }}
                onClick={() => {
                    if (!isDraggable) {
                        onActivateBlastDrawMode(type)
                    }
                }}
                sx={{
                    width: '100%',
                    height: '40px',
                    background: isActive
                        ? readerMode
                            ? `linear-gradient(0deg, ${colors.neons.pink.dark}, ${colors.neons.pink.default}90)`
                            : `linear-gradient(0deg, ${colors.neons.pink.default}30, ${colors.neons.pink.light}20)`
                        : readerMode
                        ? `linear-gradient(0deg, ${colors.blues.dark}, ${colors.blues.default}90)`
                        : `linear-gradient(0deg, ${colors.neons.cyan.default}30, transparent)`,
                    borderRadius: '6px',
                    p: 1,
                    cursor: isGrenade ? 'grab' : 'pointer',
                    justifyContent: 'space-between',
                    border: isActive ? `1px solid ${colors.neons.pink.default}` : 'none',
                    '&:hover': {
                        backgroundColor: readerMode
                            ? colors.blues.default
                            : isActive
                            ? 'rgba(40, 0, 20, 0.6)'
                            : 'rgba(0, 0, 40, 0.6)',
                        boxShadow: isActive
                            ? `0 0 8px ${colors.neons.pink.default}80`
                            : `0 0 8px ${colors.neons.cyan.default}80`,
                    },
                    '&[draggable="true"]': {
                        cursor: 'grab',
                    },
                    '&:active[draggable="true"]': {
                        cursor: 'grabbing',
                        opacity: 0.5,
                    },
                }}
            >
                <Typography
                    variant="body1"
                    sx={{
                        color: readerMode ? colors.grays.gray900 : colors.neons.cyan.light,
                    }}
                >
                    {getBlastTypeLabel(type)}
                </Typography>
            </Stack>
        )
    }

    const renderBlast = (blast: Blast) => {
        const blastElement = (
            <Stack
                key={blast.id}
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
                draggable={!blast.locked}
                onDragStart={(e) => {
                    if (!blast.locked) {
                        e.dataTransfer.effectAllowed = 'move'
                        e.dataTransfer.setData('application/json', JSON.stringify(blast))

                        // Drag preview: grenades use circle_blast image; others use image box
                        if (blast.type === 'grenade') {
                            const dragPreview = document.createElement('div')
                            dragPreview.style.position = 'absolute'
                            dragPreview.style.top = '-1000px'
                            dragPreview.style.left = '-1000px'
                            dragPreview.style.width = '50px'
                            dragPreview.style.height = '50px'
                            dragPreview.style.borderRadius = '50%'
                            dragPreview.style.overflow = 'hidden'
                            const img = document.createElement('img')
                            img.src = '/blasts/circle_blast.webp'
                            img.style.width = '100%'
                            img.style.height = '100%'
                            img.style.objectFit = 'cover'
                            dragPreview.appendChild(img)
                            document.body.appendChild(dragPreview)
                            e.dataTransfer.setDragImage(dragPreview, 25, 25)
                            setTimeout(() => {
                                document.body.removeChild(dragPreview)
                            }, 0)
                        } else {
                            const dragPreview = document.createElement('div')
                            dragPreview.style.position = 'absolute'
                            dragPreview.style.top = '-1000px'
                            dragPreview.style.left = '-1000px'
                            dragPreview.style.width = '50px'
                            dragPreview.style.height = '50px'
                            dragPreview.style.overflow = 'hidden'
                            dragPreview.style.borderRadius = blast.type === 'square' ? '0%' : '50%'
                            dragPreview.style.boxShadow = '0 0 15px rgba(0, 0, 0, 0.4)'

                            const img = document.createElement('img')
                            img.src =
                                blast.type === 'square'
                                    ? '/blasts/square_blast.webp'
                                    : blast.type === 'cone'
                                    ? '/blasts/flame_blast.webp'
                                    : '/blasts/circle_blast.webp'
                            img.style.width = '100%'
                            img.style.height = '100%'
                            img.style.objectFit = 'cover'
                            dragPreview.appendChild(img)

                            document.body.appendChild(dragPreview)
                            e.dataTransfer.setDragImage(dragPreview, 25, 25)

                            setTimeout(() => {
                                document.body.removeChild(dragPreview)
                            }, 0)
                        }
                    }
                }}
                onContextMenu={(e) => {
                    e.preventDefault()
                    const anchorEl = document.createElement('div')
                    anchorEl.style.position = 'fixed'
                    anchorEl.style.left = `${e.clientX}px`
                    anchorEl.style.top = `${e.clientY}px`
                    anchorEl.style.width = '1px'
                    anchorEl.style.height = '1px'
                    anchorEl.style.pointerEvents = 'none'
                    document.body.appendChild(anchorEl)

                    setBlastContextMenuAnchor(anchorEl)
                    setSelectedBlastId(blast.id)
                }}
                sx={{
                    width: '100%',
                    height: '40px',
                    background: readerMode
                        ? `linear-gradient(0deg, ${colors.blues.dark}, ${colors.blues.default}90)`
                        : `linear-gradient(0deg, ${colors.neons.cyan.default}30, transparent)`,
                    borderRadius: '6px',
                    p: 1,
                    cursor: blast.locked ? 'default' : 'grab',
                    justifyContent: 'space-between',
                    border: blast.locked ? `1px solid ${colors.neons.yellow.default}40` : 'none',
                    '&:hover': {
                        backgroundColor: readerMode ? colors.blues.default : 'rgba(0, 0, 40, 0.6)',
                        boxShadow: `0 0 8px ${colors.neons.cyan.default}80`,
                    },
                    '&[draggable="true"]': {
                        cursor: 'grab',
                    },
                    '&:active[draggable="true"]': {
                        cursor: 'grabbing',
                        opacity: 0.5,
                    },
                }}
            >
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography
                        variant="body1"
                        sx={{
                            color: readerMode ? colors.grays.gray900 : colors.neons.cyan.light,
                        }}
                    >
                        {getBlastDisplayName(blast)}
                    </Typography>
                </Stack>
                {blast.locked && (
                    <Lock
                        sx={{
                            fontSize: 16,
                            color: readerMode ? colors.grays.gray600 : colors.neons.yellow.default,
                        }}
                    />
                )}
            </Stack>
        )

        return blastElement
    }

    const renderAccordion = (blasts: Blast[], title: string, _isInMap: boolean, isTemplate: boolean = false) => {
        const sortedBlasts = [...blasts].sort((a, b) => {
            // Sort by type first, then by size/position
            if (a.type !== b.type) return a.type.localeCompare(b.type)
            return 0
        })

        return (
            <Accordion
                sx={{
                    border: `1px solid ${colors.neons.cyan.dark}`,
                    borderRadius: 0.5,
                    width: '100%',
                }}
                disableGutters
                defaultExpanded
            >
                <AccordionSummary
                    sx={{
                        backgroundColor: readerMode ? 'transparent' : 'transparent',
                        mr: -3,
                        borderBottom: `1px solid ${colors.neons.pink.dark}90`,
                        bgcolor: readerMode ? colors.blues.default : 'transparent',
                    }}
                    expandIcon={
                        <ExpandMore
                            className="glitch-text"
                            data-text={'V'}
                            sx={{
                                color: readerMode ? colors.grays.gray900 : colors.yellows.default + '99',
                                textShadow: `0 0 8px ${colors.grays.gray000}`,
                            }}
                            fontSize="large"
                        />
                    }
                >
                    <Typography
                        sx={{
                            color: readerMode ? colors.grays.gray900 : colors.neons.yellow.default + '99',
                            fontWeight: 700,
                            textShadow: `0 0 8px ${colors.grays.gray000}`,
                        }}
                        className="glitch-text"
                        data-text={title}
                    >
                        {title}
                    </Typography>
                </AccordionSummary>
                <AccordionDetails
                    sx={{
                        px: 0,
                        pb: 0,
                        bgcolor: readerMode ? colors.grays.gray400 : 'transparent',
                    }}
                >
                    {isTemplate ? (
                        <>
                            {renderBlastTemplate('grenade')}
                            {renderBlastTemplate('cone')}
                            {renderBlastTemplate('circle')}
                            {renderBlastTemplate('square')}
                        </>
                    ) : sortedBlasts.length === 0 ? (
                        <Typography
                            variant="body2"
                            sx={{
                                color: readerMode ? colors.grays.gray600 : colors.neons.cyan.dark,
                                textAlign: 'center',
                                p: 2,
                            }}
                        >
                            {t('combatSim.blastsPanel.noBlasts')}
                        </Typography>
                    ) : (
                        sortedBlasts.map((blast) => renderBlast(blast))
                    )}
                </AccordionDetails>
            </Accordion>
        )
    }

    return (
        <>
            <Box
                sx={{
                    width: isSidePanelOpen ? 260 : 0,
                    flex: '0 0 auto',
                    height: '100%',
                    overflow: 'hidden',
                    transition: 'width 220ms ease',
                    willChange: 'width',
                    borderRight: isSidePanelOpen ? `1px solid ${colors.neons.cyan.dark}` : 'none',
                    bgcolor: readerMode ? colors.grays.gray000 : 'rgba(0, 0, 40, 0.6)',
                }}
            >
                <Box
                    sx={{
                        width: 260,
                        height: '100%',
                        background: `linear-gradient(0deg, ${colors.neons.cyan.default}30, transparent)`,
                        zIndex: 10,
                        p: 1,
                        opacity: isSidePanelOpen ? 1 : 0,
                        transition: 'opacity 220ms ease',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Typography
                        variant="h4"
                        className="glitch-text"
                        data-text={t('combatSim.blastsPanel.title')}
                        sx={{
                            color: readerMode ? colors.grays.gray900 : colors.neons.pink.default,
                            fontWeight: 700,
                            mb: 1,
                            textShadow: `0 0 8px ${colors.grays.gray000}`,
                        }}
                    >
                        {t('combatSim.blastsPanel.title')}
                    </Typography>
                    <CustomScrollbar scrollDirection="vertical" height="100%">
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                            }}
                        >
                            {renderAccordion([], t('combatSim.blastsPanel.templates'), false, true)}
                            {blasts.length > 0 && renderAccordion(blasts, t('combatSim.blastsPanel.mapBlasts'), true)}
                            {blastsNotInMap.length > 0 &&
                                renderAccordion(blastsNotInMap, t('combatSim.blastsPanel.otherBlasts'), false)}
                        </Box>
                    </CustomScrollbar>
                </Box>
            </Box>
            <BlastContextMenu
                anchorEl={blastContextMenuAnchor}
                blastId={selectedBlastId}
                isLocked={selectedBlast?.locked ?? false}
                onDelete={onBlastDelete}
                onCopy={onBlastCopy}
                onCut={onBlastCut}
                onLock={onBlastLock}
                onClose={closeContextMenu}
            />
        </>
    )
}

export default BlastsPanel
