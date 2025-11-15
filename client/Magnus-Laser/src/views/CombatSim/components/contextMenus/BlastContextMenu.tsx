import Divider from '@mui/material/Divider'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import React from 'react'
import { useTranslation } from 'react-i18next'

interface BlastContextMenuProps {
    anchorEl: HTMLElement | null
    blastId: string | null
    isLocked: boolean
    onDelete: (id: string) => void
    onCopy: (id: string) => void
    onCut: (id: string) => void
    onLock: (id: string, locked: boolean) => void
    onClose: () => void
}

export const BlastContextMenu: React.FC<BlastContextMenuProps> = ({
    anchorEl,
    blastId,
    isLocked,
    onDelete,
    onCopy,
    onCut,
    onLock,
    onClose,
}) => {
    const { t } = useTranslation()

    const handleDelete = () => {
        if (blastId) {
            onDelete(blastId)
            onClose()
        }
    }

    const handleCopy = () => {
        if (blastId) {
            onCopy(blastId)
            onClose()
        }
    }

    const handleCut = () => {
        if (blastId) {
            onCut(blastId)
            onClose()
        }
    }

    const handleLock = () => {
        if (blastId) {
            onLock(blastId, !isLocked)
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
            <MenuItem onClick={handleLock}>
                <ListItemIcon sx={{ color: '#fff' }}>{isLocked ? '🔓' : '🔒'}</ListItemIcon>
                <ListItemText>
                    {isLocked ? t('combatSim.blastContextMenu.unlock') : t('combatSim.blastContextMenu.lock')}
                </ListItemText>
            </MenuItem>
            <Divider sx={{ bgcolor: '#333' }} />
            <MenuItem onClick={handleCopy}>
                <ListItemIcon sx={{ color: '#fff' }}>📄</ListItemIcon>
                <ListItemText>{t('combatSim.blastContextMenu.copy')}</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleCut}>
                <ListItemIcon sx={{ color: '#fff' }}>✂️</ListItemIcon>
                <ListItemText>{t('combatSim.blastContextMenu.cut')}</ListItemText>
            </MenuItem>
            <Divider sx={{ bgcolor: '#333' }} />
            <MenuItem onClick={handleDelete} sx={{ color: '#ff4444 !important' }}>
                <ListItemIcon sx={{ color: '#ff4444' }}>🗑️</ListItemIcon>
                <ListItemText>{t('combatSim.blastContextMenu.delete')}</ListItemText>
            </MenuItem>
        </Menu>
    )
}
