import { Add, ExpandMore } from '@mui/icons-material'
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Avatar,
    Box,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'
import CustomScrollbar from '../../components/CustomScrollbar'
import { useUserPreferences } from '../../contexts/userPreferencesHooks'
import colors from '../../utils/colors'
import { db } from '../../utils/db'
import { TokenContextMenu } from './TokenContextMenu'
import { TokenTooltip } from './TokenTooltip'
import { Token } from './types'

interface TokenPanelProps {
    isSidePanelOpen: boolean
    setTokenDialogOpen: (tokenId: string | undefined) => void
    getActiveMapKey: () => string
    setTokens: React.Dispatch<React.SetStateAction<Token[]>>
    setIsSaving: React.Dispatch<React.SetStateAction<boolean>>
    pixiToCss: (color: number) => string
    resolveImageUrl: (imageId: string | undefined) => string | undefined
    gridSize: number
    tokens: Token[]
    tokensNotInMap: Token[]
    defaultTokens: Token[]
    onTokenDelete: (id: string) => void
    onTokenDuplicate: (id: string) => void
    onTokenCopy: (id: string) => void
    onTokenCut: (id: string) => void
}

const TokenPanel = ({
    isSidePanelOpen,
    setTokenDialogOpen,
    getActiveMapKey,
    setTokens,
    setIsSaving,
    pixiToCss,
    resolveImageUrl,
    gridSize,
    tokens,
    tokensNotInMap,
    defaultTokens,
    onTokenDelete,
    onTokenDuplicate,
    onTokenCut,
    onTokenCopy,
}: TokenPanelProps) => {
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    const [tokenContextMenuAnchor, setTokenContextMenuAnchor] = useState<HTMLElement | null>(null)
    const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null)

    const renderToken = (token: Token, isDefault?: boolean) => {
        const tokenElement = (
            <Stack
                key={token.id}
                direction="row"
                spacing={1}
                alignItems="center"
                draggable={!isDefault}
                onDragStart={(e) => {
                    if (!isDefault) {
                        e.dataTransfer.effectAllowed = 'move'
                        e.dataTransfer.setData('application/json', JSON.stringify(token))

                        // Use the existing avatar as drag image if available
                        const avatarElement = e.currentTarget.querySelector('img')
                        if (avatarElement) {
                            // Clone and style the avatar for drag preview
                            const dragPreview = document.createElement('div')
                            dragPreview.style.position = 'absolute'
                            dragPreview.style.top = '-1000px'
                            dragPreview.style.left = '-1000px'
                            dragPreview.style.width = '50px'
                            dragPreview.style.height = '50px'
                            dragPreview.style.borderRadius = '50%'
                            dragPreview.style.overflow = 'hidden'
                            dragPreview.style.backgroundColor = pixiToCss(token.color)

                            const imgClone = avatarElement.cloneNode(true) as HTMLElement
                            imgClone.style.width = '100%'
                            imgClone.style.height = '100%'
                            // Set objectFit if it exists (will be on img elements)
                            if ('objectFit' in imgClone.style) {
                                ;(imgClone.style as { objectFit: string }).objectFit = 'cover'
                            }
                            dragPreview.appendChild(imgClone)

                            document.body.appendChild(dragPreview)
                            e.dataTransfer.setDragImage(dragPreview, 25, 25)

                            setTimeout(() => {
                                document.body.removeChild(dragPreview)
                            }, 0)
                        } else {
                            // Fallback: Use simple colored circle with name
                            const dragPreview = document.createElement('div')
                            dragPreview.style.position = 'absolute'
                            dragPreview.style.top = '-1000px'
                            dragPreview.style.left = '-1000px'
                            dragPreview.style.width = '50px'
                            dragPreview.style.height = '50px'
                            dragPreview.style.borderRadius = '50%'
                            dragPreview.style.backgroundColor = pixiToCss(token.color)
                            dragPreview.style.display = 'flex'
                            dragPreview.style.alignItems = 'center'
                            dragPreview.style.justifyContent = 'center'
                            dragPreview.style.fontSize = '9px'
                            dragPreview.style.fontWeight = 'bold'
                            dragPreview.style.color = '#fff'
                            dragPreview.style.textShadow = '0 0 4px rgba(0,0,0,0.8)'
                            dragPreview.style.textAlign = 'center'
                            dragPreview.style.padding = '2px'
                            dragPreview.style.wordBreak = 'break-word'
                            dragPreview.textContent = token.name

                            document.body.appendChild(dragPreview)
                            e.dataTransfer.setDragImage(dragPreview, 25, 25)

                            setTimeout(() => {
                                document.body.removeChild(dragPreview)
                            }, 0)
                        }
                    }
                }}
                sx={{
                    width: '100%',
                    height: '40px',
                    background: readerMode
                        ? `linear-gradient(0deg, ${colors.blues.dark}, ${colors.blues.default}90)`
                        : `linear-gradient(0deg, ${colors.neons.cyan.default}30, transparent)`,
                    borderRadius: '6px',
                    p: 1,
                    cursor: 'pointer',
                    justifyContent: 'space-between',
                    '&:hover': {
                        backgroundColor: readerMode ? colors.blues.default : 'rgba(0, 0, 40, 0.6)',
                        boxShadow: `0 0 8px ${colors.neons.cyan.default}80`,
                        '&::after': {
                            opacity: 0.8,
                            height: '100%',
                        },
                    },
                    '&[draggable="true"]': {
                        cursor: 'grab',
                    },
                    '&:active[draggable="true"]': {
                        cursor: 'grabbing',
                        opacity: 0.5,
                    },
                }}
                onClick={() => setTokenDialogOpen(token.id)}
                onContextMenu={(e) => {
                    e.preventDefault()
                    if (!isDefault) {
                        // Create a temporary anchor element at the click position
                        const anchorEl = document.createElement('div')
                        anchorEl.style.position = 'fixed'
                        anchorEl.style.left = `${e.clientX}px`
                        anchorEl.style.top = `${e.clientY}px`
                        anchorEl.style.width = '1px'
                        anchorEl.style.height = '1px'
                        anchorEl.style.pointerEvents = 'none'
                        document.body.appendChild(anchorEl)

                        setTokenContextMenuAnchor(anchorEl)
                        setSelectedTokenId(token.id)
                    }
                }}
            >
                <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar
                        key={token.id}
                        sx={{ width: 28, height: 28, color: pixiToCss(token.color) }}
                        src={resolveImageUrl(token.imageId)}
                    />
                    <Typography
                        variant="body1"
                        sx={{
                            color: readerMode ? colors.grays.gray900 : colors.neons.cyan.light,
                        }}
                    >
                        {token.name}
                    </Typography>
                </Stack>
                {isDefault && (
                    <IconButton
                        onClick={async (e) => {
                            e.stopPropagation()
                            // Count existing copies with the same base name
                            const baseName = token.name
                            const existingCopies = tokens.filter((t) => {
                                // Match tokens like "Easy 1", "Easy 2", etc.
                                return t.name.startsWith(baseName + ' ') || t.name === baseName
                            })
                            const copyNumber = existingCopies.length + 1

                            const newToken: Token = {
                                ...token,
                                radius: Math.max(1, Math.floor(gridSize / 2)),
                                name: `${baseName} ${copyNumber}`,
                                mapId: getActiveMapKey(),
                                stats: {
                                    ...token.stats,
                                    combat: token.stats?.combat ?? 0,
                                    skills: token.stats?.skills ?? 0,
                                    initiative: token.stats?.initiative ?? 0,
                                    health: token.stats?.health ?? 0,
                                    movement: token.stats?.movement ?? 0,
                                    currentMovement: token.stats?.movement ?? 0,
                                    weapons: {
                                        melee: { d6: token.stats?.weapons?.melee?.d6 ?? 0 },
                                        ranged: { d6: token.stats?.weapons?.ranged?.d6 ?? 0 },
                                        grenadesOrSpecialAmmo: token.stats?.weapons?.grenadesOrSpecialAmmo,
                                    },
                                    currentHealth: token.stats?.health ?? 0,
                                    armor: {
                                        ...token.stats?.armor,
                                        currentSph: token.stats?.armor?.sph ?? 0,
                                        currentSpb: token.stats?.armor?.spb ?? 0,
                                        sph: token.stats?.armor?.sph ?? 0,
                                        spb: token.stats?.armor?.spb ?? 0,
                                    },
                                },
                                id: uuidv4(),
                            }
                            await db.tokens.add(newToken)
                            setTokens((prev) => [...prev, newToken])
                            setIsSaving(true)
                        }}
                        sx={{
                            width: 32,
                            height: 32,
                            color: colors.neons.cyan.default,
                        }}
                    >
                        <Add />
                    </IconButton>
                )}
            </Stack>
        )

        // Only show tooltip for non-default tokens
        if (!isDefault && token.stats) {
            return (
                <Tooltip
                    key={token.id}
                    title={<TokenTooltip token={token} />}
                    placement="right"
                    enterDelay={500}
                    arrow
                    slotProps={{
                        tooltip: {
                            sx: {
                                p: 0,
                                bgcolor: 'transparent',
                            },
                        },
                        popper: {
                            sx: {
                                bgcolor: 'transparent',
                            },
                        },
                    }}
                >
                    {tokenElement}
                </Tooltip>
            )
        }

        return tokenElement
    }

    const renderAccordion = (tokens: Token[], title: string, isDefault?: boolean) => {
        // Sort tokens alphabetically by name for non-default tokens
        const sortedTokens = isDefault ? tokens : [...tokens].sort((a, b) => a.name.localeCompare(b.name))

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
                    {sortedTokens.map((token) => {
                        return renderToken(token, isDefault)
                    })}
                </AccordionDetails>
            </Accordion>
        )
    }

    const closeContextMenus = () => {
        // Clean up anchor elements
        if (tokenContextMenuAnchor && tokenContextMenuAnchor.parentNode) {
            tokenContextMenuAnchor.parentNode.removeChild(tokenContextMenuAnchor)
        }

        setTokenContextMenuAnchor(null)
        setSelectedTokenId(null)
    }

    const handleTokenDelete = (tokenId: string) => {
        onTokenDelete(tokenId)
    }

    const handleTokenDuplicate = (tokenId: string) => {
        onTokenDuplicate(tokenId)
    }

    const handleTokenCopy = (tokenId: string) => {
        onTokenCopy(tokenId)
    }

    const handleTokenCut = (tokenId: string) => {
        onTokenCut(tokenId)
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
                        data-text={t('combatSim.tokensPanel')}
                        sx={{
                            color: readerMode ? colors.grays.gray900 : colors.neons.pink.default,
                            fontWeight: 700,
                            mb: 1,
                            textShadow: `0 0 8px ${colors.grays.gray000}`,
                        }}
                    >
                        {t('combatSim.tokensPanel')}
                    </Typography>
                    <CustomScrollbar scrollDirection="vertical" height="100%">
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                            }}
                        >
                            {/* Default tokens */}
                            {defaultTokens.length > 0 &&
                                renderAccordion(defaultTokens, t('combatSim.defaultTokens'), true)}
                            {/* Map tokens */}
                            {tokens.length > 0 && renderAccordion(tokens, t('combatSim.mapTokens'))}
                            {/* Tokens not in map */}
                            {tokensNotInMap.length > 0 &&
                                renderAccordion(tokensNotInMap, t('combatSim.tokensNotInMap'))}
                        </Box>
                    </CustomScrollbar>
                </Box>
            </Box>
            <TokenContextMenu
                anchorEl={tokenContextMenuAnchor}
                tokenId={selectedTokenId}
                onDelete={handleTokenDelete}
                onDuplicate={handleTokenDuplicate}
                onCopy={handleTokenCopy}
                onCut={handleTokenCut}
                onClose={closeContextMenus}
            />
        </>
    )
}

export default TokenPanel
