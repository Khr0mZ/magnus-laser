import AutoFixHigh from '@mui/icons-material/AutoFixHigh'
import Close from '@mui/icons-material/Close'
import { Fab, Zoom } from '@mui/material'
import { useUserPreferences } from '../../contexts/userPreferencesHooks'
import colors from '../../utils/colors'
import { useGMToolsStore } from './GMToolsStore'

const GMToolsFab = () => {
    const { readerMode } = useUserPreferences()
    const { isDrawerOpen, toggleDrawer } = useGMToolsStore()

    return (
        <Zoom in={true}>
            <Fab
                onClick={toggleDrawer}
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 1300,
                    background: isDrawerOpen
                        ? `linear-gradient(135deg, ${colors.neons.red.default} 0%, ${colors.neons.orange.default} 100%)`
                        : `linear-gradient(135deg, ${colors.neons.purple.default} 0%, ${colors.neons.cyan.default} 100%)`,
                    color: colors.grays.gray000,
                    boxShadow: isDrawerOpen
                        ? `0 0 20px ${colors.neons.red.default}80`
                        : `0 0 20px ${colors.neons.purple.default}80`,
                    '&:hover': {
                        background: isDrawerOpen
                            ? `linear-gradient(135deg, ${colors.neons.orange.default} 0%, ${colors.neons.red.default} 100%)`
                            : `linear-gradient(135deg, ${colors.neons.cyan.default} 0%, ${colors.neons.purple.default} 100%)`,
                        boxShadow: isDrawerOpen
                            ? `0 0 30px ${colors.neons.red.default}`
                            : `0 0 30px ${colors.neons.cyan.default}`,
                    },
                    transition: 'all 0.3s ease-in-out',
                    width: 64,
                    height: 64,
                    ...(readerMode && {
                        background: isDrawerOpen
                            ? colors.grays.gray400
                            : colors.grays.gray200,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        '&:hover': {
                            background: isDrawerOpen
                                ? colors.grays.gray500
                                : colors.grays.gray300,
                        },
                    }),
                }}
            >
                {isDrawerOpen ? (
                    <Close sx={{ fontSize: 28 }} />
                ) : (
                    <AutoFixHigh sx={{ fontSize: 28 }} />
                )}
            </Fab>
        </Zoom>
    )
}

export default GMToolsFab

