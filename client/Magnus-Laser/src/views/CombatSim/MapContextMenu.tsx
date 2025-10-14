import Clear from '@mui/icons-material/Clear'
import ContentCut from '@mui/icons-material/ContentCut'
import ContentPaste from '@mui/icons-material/ContentPaste'
import DeleteSweep from '@mui/icons-material/DeleteSweep'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import React from 'react'
import { useTranslation } from 'react-i18next'

interface MapContextMenuProps {
    anchorEl: HTMLElement | null
    onDeleteAllTokens: () => void
    onDeleteAllWalls: () => void
    onDeleteAllBlasts: () => void
    onCutAllTokens: () => void
    onPasteToken: () => void
    onPasteBlast: () => void
    canPasteToken: boolean
    canPasteBlast: boolean
    onClose: () => void
}

export const MapContextMenu: React.FC<MapContextMenuProps> = ({
    anchorEl,
    onDeleteAllTokens,
    onDeleteAllWalls,
    onDeleteAllBlasts,
    onCutAllTokens,
    onPasteToken,
    onPasteBlast,
    canPasteToken,
    canPasteBlast,
    onClose,
}) => {
    const { t } = useTranslation()
    const handleDeleteAllTokens = () => {
        onDeleteAllTokens()
        onClose()
    }

    const handleDeleteAllWalls = () => {
        onDeleteAllWalls()
        onClose()
    }

    const handleCutAllTokens = () => {
        onCutAllTokens()
        onClose()
    }

    const handlePasteToken = () => {
        onPasteToken()
        onClose()
    }

    const handlePasteBlast = () => {
        onPasteBlast()
        onClose()
    }

    const handleDeleteAllBlasts = () => {
        onDeleteAllBlasts()
        onClose()
    }

    return (
        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={onClose}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
            slotProps={{
                paper: {
                    sx: {
                        bgcolor: '#1a1a1a',
                        border: '1px solid #333',
                        '& .MuiMenuItem-root': {
                            color: '#fff',
                            '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.1)',
                            },
                        },
                    },
                },
            }}
        >
            <MenuItem onClick={handlePasteToken} disabled={!canPasteToken}>
                <ListItemIcon sx={{ color: canPasteToken ? '#fff' : '#666' }}>
                    <ContentPaste fontSize="small" />
                </ListItemIcon>
                <ListItemText sx={{ color: canPasteToken ? '#fff' : '#666' }}>
                    {t('combatSim.mapContextMenu.pasteToken')}
                </ListItemText>
            </MenuItem>
            <MenuItem onClick={handlePasteBlast} disabled={!canPasteBlast}>
                <ListItemIcon sx={{ color: canPasteBlast ? '#fff' : '#666' }}>
                    <ContentPaste fontSize="small" />
                </ListItemIcon>
                <ListItemText sx={{ color: canPasteBlast ? '#fff' : '#666' }}>
                    {t('combatSim.mapContextMenu.pasteBlast')}
                </ListItemText>
            </MenuItem>
            <MenuItem onClick={handleCutAllTokens}>
                <ListItemIcon sx={{ color: '#ffa500' }}>
                    <ContentCut fontSize="small" />
                </ListItemIcon>
                <ListItemText sx={{ color: '#ffa500' }}>{t('combatSim.mapContextMenu.cutAllTokens')}</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleDeleteAllTokens}>
                <ListItemIcon sx={{ color: '#ff6b6b' }}>
                    <DeleteSweep fontSize="small" />
                </ListItemIcon>
                <ListItemText sx={{ color: '#ff6b6b' }}>{t('combatSim.mapContextMenu.deleteAllTokens')}</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleDeleteAllWalls}>
                <ListItemIcon sx={{ color: '#ff6b6b' }}>
                    <Clear fontSize="small" />
                </ListItemIcon>
                <ListItemText sx={{ color: '#ff6b6b' }}>{t('combatSim.mapContextMenu.deleteAllWalls')}</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleDeleteAllBlasts}>
                <ListItemIcon sx={{ color: '#ff6b6b' }}>
                    <DeleteSweep fontSize="small" />
                </ListItemIcon>
                <ListItemText sx={{ color: '#ff6b6b' }}>{t('combatSim.mapContextMenu.deleteAllBlasts')}</ListItemText>
            </MenuItem>
        </Menu>
    )
}
