import { Elderly } from '@mui/icons-material'
import { Avatar, Button, Typography } from '@mui/material'
import { useContext, useState } from 'react'
import { ReaderModeContext } from '../../contexts/ReaderModeContext'
import colors from '../../utils/colors'
import { glitch } from '../common/Animations.tsx'

const ReaderModeButton = (): JSX.Element => {
    const { readerMode, toggleReaderMode } = useContext(ReaderModeContext)
    const [isHovered, setIsHovered] = useState(false)

    return (
        <Button
            size={'large'}
            disableRipple
            disableFocusRipple
            onClick={toggleReaderMode}
            sx={{
                padding: '12px 16px',
                minWidth: '70px',
                borderRadius: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1,
                ...(readerMode
                    ? {
                          // Reader mode button style
                          color: '#555',
                          '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.04)',
                              '& svg': {
                                  transform: 'scale(1.1)',
                              },
                          },
                          '& svg': {
                              transition: 'transform 0.2s',
                              width: 36,
                              height: 36,
                          },
                      }
                    : {
                          // Cyberpunk button style
                          color: colors.neons.yellow.default,
                          '&:hover': {
                              backgroundColor: 'rgba(255, 255, 0, 0.1)',
                              '& svg': {
                                  filter: `drop-shadow(0 0 5px ${colors.neons.yellow.default})`,
                                  animation: `${glitch} 1s ease infinite alternate`,
                              },
                              '&::after': {
                                  opacity: 1,
                                  width: '100%',
                              },
                          },
                          '& svg': {
                              filter: `drop-shadow(0 0 2px ${colors.neons.yellow.dark})`,
                              width: 36,
                              height: 36,
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
                              backgroundColor: colors.neons.yellow.default,
                              boxShadow: `0 0 10px ${colors.neons.yellow.default}`,
                              opacity: 0,
                              transition: 'all 0.3s ease-out',
                          },
                      }),
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {!readerMode ? (
                <Elderly fontSize={'large'} />
            ) : (
                <Avatar
                    variant={'square'}
                    src={isHovered ? '/logoBlackTransparentEyes.png' : '/logoBlackTransparent.png'}
                    sx={{ width: 36, height: 36, opacity: isHovered ? 1 : 0.5, transition: 'all 0.3s' }}
                />
            )}
            <Typography
                variant="caption"
                sx={{
                    mt: 0.5,
                    ...(readerMode
                        ? {
                              fontFamily: '"Orbitron", "Rajdhani", "Lexend", sans-serif',
                              textTransform: 'uppercase',
                          }
                        : {}),
                }}
            >
                {readerMode ? 'Chrome' : 'Flesh'}
            </Typography>
        </Button>
    )
}

export default ReaderModeButton
