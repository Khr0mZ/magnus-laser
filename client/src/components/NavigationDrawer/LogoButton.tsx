import { Avatar, Box, Button } from '@mui/material'
import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ReaderModeContext } from '../../contexts/ReaderModeContext'
import NavigationPaths from '../../navigation'
import colors from '../../utils/colors'
import { severeGlitch } from '../common/Animations.tsx'

const LogoButton = (): JSX.Element => {
    const navigate = useNavigate()
    const { readerMode } = useContext(ReaderModeContext)

    return (
        <Button
            size={'large'}
            disableRipple
            disableFocusRipple
            onClick={() => navigate(NavigationPaths.DASHBOARD)}
            sx={{
                padding: '12px 16px',
                minWidth: '70px',
                borderRadius: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1,
                ...(readerMode
                    ? {
                          // Reader mode button style
                          '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          },
                      }
                    : {
                          // Cyberpunk button style
                          '&:hover': {
                              backgroundColor: 'rgba(0, 255, 255, 0.1)',
                              '& .logo-glow': {
                                  opacity: 1,
                                  transform: 'scale(1.5)',
                                  filter: `drop-shadow(0 0 15px ${colors.neons.blue.default})`,
                                  animation: `${severeGlitch} 0.5s ease infinite`,
                              },
                              '&::after': {
                                  opacity: 1,
                                  width: '100%',
                              },
                          },
                          transition: 'all 0.3s',
                          position: 'relative',
                          '&::after': {
                              content: '""',
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              width: '0%',
                              height: '2px',
                              backgroundColor: colors.neons.pink.default,
                              boxShadow: `0 0 10px ${colors.neons.pink.default}`,
                              opacity: 0,
                              transition: 'all 0.3s ease-out',
                          },
                      }),
            }}
        >
            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Avatar
                    variant={'square'}
                    src={'/magnusLaserLogo.png'}
                    alt="Logo"
                    className="logo-glow"
                    sx={{
                        width: '40px',
                        height: '40px',
                        filter: `drop-shadow(0 0 0.5px ${colors.neons.cyan.default})`,
                        transition: 'all 0.3s',
                        transform: 'scale(1.5)',
                    }}
                />
            </Box>
        </Button>
    )
}

export default LogoButton
