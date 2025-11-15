import Divider from '@mui/material/Divider'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import React from 'react'
import { useTranslation } from 'react-i18next'

interface TokenContextMenuProps {
    anchorEl: HTMLElement | null
    tokenId: string | null
    onDelete: (id: string) => void
    onDuplicate: (id: string) => void
    onCopy: (id: string) => void
    onCut: (id: string) => void
    onClose: () => void
}

export const TokenContextMenu: React.FC<TokenContextMenuProps> = ({
    anchorEl,
    tokenId,
    onDelete,
    onDuplicate,
    onCopy,
    onCut,
    onClose,
}) => {
    const { t } = useTranslation()

    const handleDelete = () => {
        if (tokenId) {
            onDelete(tokenId)
            onClose()
        }
    }

    const handleDuplicate = () => {
        if (tokenId) {
            onDuplicate(tokenId)
            onClose()
        }
    }

    const handleCopy = () => {
        if (tokenId) {
            onCopy(tokenId)
            onClose()
        }
    }

    const handleCut = () => {
        if (tokenId) {
            onCut(tokenId)
            onClose()
        }
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
            <MenuItem onClick={handleDuplicate}>
                <ListItemIcon sx={{ color: '#fff' }}>📋</ListItemIcon>
                <ListItemText>{t('combatSim.tokenContextMenu.duplicate')}</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleCopy}>
                <ListItemIcon sx={{ color: '#fff' }}>📄</ListItemIcon>
                <ListItemText>{t('combatSim.tokenContextMenu.copy')}</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleCut}>
                <ListItemIcon sx={{ color: '#fff' }}>✂️</ListItemIcon>
                <ListItemText>{t('combatSim.tokenContextMenu.cut')}</ListItemText>
            </MenuItem>
            <Divider sx={{ bgcolor: '#333' }} />
            <MenuItem onClick={handleDelete}>
                <ListItemIcon sx={{ color: '#ff6b6b' }}>🗑️</ListItemIcon>
                <ListItemText sx={{ color: '#ff6b6b' }}>{t('combatSim.tokenContextMenu.delete')}</ListItemText>
            </MenuItem>
        </Menu>
    )
}
