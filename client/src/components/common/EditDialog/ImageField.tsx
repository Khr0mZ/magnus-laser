import { Close, Save } from '@mui/icons-material'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import { Avatar, Box, CircularProgress, IconButton, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks.ts'
import colors from '../../../utils/colors'
import { flicker, glitch } from '../Animations'

// Image field component for consistency
interface ImageFieldProps {
    image: string | undefined
    downloadName: string | undefined
    handleImageUploadClick: () => void
    handleImageRemove: () => void
    toggleFullscreenImage: () => void
    handleRegenerateClick?: () => void
    canRegenerate?: boolean
    isGeneratingImage?: boolean
    disabled?: boolean
}

const ImageField = (props: ImageFieldProps) => {
    const {
        image,
        downloadName,
        handleImageUploadClick,
        handleImageRemove,
        toggleFullscreenImage,
        handleRegenerateClick,
        canRegenerate,
        isGeneratingImage,
        disabled,
    } = props
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()

    // Ensure these event handlers stop propagation to prevent unwanted parent clicks
    const handleUploadClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        handleImageUploadClick()
    }

    const handleRemoveClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        handleImageRemove()
    }

    const handleRegenerateButtonClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (handleRegenerateClick) {
            handleRegenerateClick()
        }
    }

    const handleImageClick = () => {
        if (image) {
            toggleFullscreenImage()
        }
    }

    const handleDownloadClick = () => {
        if (image) {
            const link = document.createElement('a')
            link.href = image
            link.download = `${downloadName}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }

    return (
        <Box
            sx={{
                maxHeight: '40vh',
                position: 'relative',
                width: '100%',
                boxSizing: 'border-box',
                aspectRatio: '1 / 1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: readerMode ? colors.grays.gray900 : 'rgba(0, 0, 0, 0.5)',
                border: `2px solid ${readerMode ? colors.grays.gray800 : 'rgba(0, 255, 255, 0.65)'}`,
                cursor: image ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                '&:hover': {
                    boxShadow: readerMode
                        ? `0 0 15px ${colors.neons.blue.default}80`
                        : `0 0 15px ${colors.neons.cyan.default}80`,
                    border: readerMode
                        ? `2px solid ${colors.neons.blue.default}`
                        : `2px solid ${colors.neons.cyan.default}`,
                    '& .MuiBox-root': {
                        opacity: 1,
                    },
                },
                borderRadius: '4px',
            }}
            onClick={handleImageClick}
        >
            <Avatar
                src={image}
                alt={t('common.itemImageAlt', { name: downloadName })}
                variant="rounded"
                slotProps={{
                    img: {
                        style: {
                            objectFit: 'contain',
                            width: '100%',
                            height: '100%',
                        },
                    },
                }}
                sx={{
                    bgcolor: 'transparent',
                    color: 'transparent',
                    objectFit: 'contain',
                    width: '100%',
                    height: '100%',
                }}
            />
            {!image && (
                <Typography
                    variant={'caption'}
                    sx={{
                        fontSize: { xs: '64px', sm: '80px', md: '48px', lg: '64px' },
                        textAlign: 'center',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        transition: 'all 0.3s',
                        textTransform: 'uppercase',
                        ...(readerMode
                            ? {}
                            : {
                                  fontFamily: '"Courier New", monospace',
                                  letterSpacing: '1px',
                                  color: colors.neons.cyan.default,
                                  textShadow: `0 0 8px ${colors.neons.cyan.default}`,
                                  '&::before': {
                                      content: 'attr(data-text)',
                                      position: 'absolute',
                                      left: -2,
                                      top: 0,
                                      color: colors.neons.pink.default,
                                      opacity: 0.8,
                                      animation: `${glitch} 2s ease-out infinite alternate-reverse`,
                                  },
                                  '&::after': {
                                      content: 'attr(data-text)',
                                      position: 'absolute',
                                      left: 2,
                                      top: 0,
                                      color: colors.neons.green.default,
                                      opacity: 0.8,
                                      animation: `${glitch} 3s ease-in infinite alternate`,
                                  },
                              }),
                    }}
                    data-text={t('common.noImageFound')}
                >
                    {t('common.noImageFound')}
                </Typography>
            )}
            {isGeneratingImage && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                >
                    <CircularProgress
                        sx={{
                            color: readerMode ? '#0288d1' : colors.neons.cyan.default,
                        }}
                    />
                </Box>
            )}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                    p: 0.5,
                    backgroundColor: readerMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(3px)',
                    borderRadius: '0 0 0 8px',
                    border: readerMode ? '1px solid rgba(0, 0, 0, 0.1)' : `1px solid ${colors.neons.cyan.default}30`,
                    boxShadow: readerMode ? 'none' : `0 0 10px ${colors.neons.cyan.default}30`,
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                }}
                className="MuiBox-root"
                onClick={(e) => e.stopPropagation()} // Prevent clicks from propagating to parent
            >
                <IconButton
                    size="small"
                    onClick={handleUploadClick}
                    title={t('common.uploadImage')}
                    sx={{
                        minWidth: '30px',
                        width: '30px',
                        height: '30px',
                        borderRadius: '2px',
                        p: 0,
                        bgcolor: readerMode ? '#f5f5f5' : 'rgba(0, 0, 40, 0.4)',
                        color: readerMode ? '#1976d2' : colors.neons.blue.default,
                        border: readerMode ? '1px solid #1976d2' : `1px solid ${colors.neons.blue.default}60`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        position: 'relative',
                        '&::before': !readerMode
                            ? {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '1px',
                                  background: `linear-gradient(90deg, transparent, ${colors.neons.blue.default}, transparent)`,
                                  opacity: 0.7,
                              }
                            : {},
                        '&:hover': readerMode
                            ? {
                                  bgcolor: '#f0f0f0',
                                  color: '#0d47a1',
                              }
                            : {
                                  bgcolor: 'rgba(0, 0, 60, 0.6)',
                                  color: colors.neons.blue.light,
                                  boxShadow: `0 0 8px ${colors.neons.blue.default}80`,
                                  '&::after': {
                                      opacity: 0.8,
                                      height: '100%',
                                  },
                                  '& .icon-content': {
                                      animation: `${glitch} 2s infinite`,
                                      filter: `drop-shadow(0 0 3px ${colors.neons.blue.default})`,
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
                                  background: `linear-gradient(0deg, ${colors.neons.blue.default}30, transparent)`,
                                  transition: 'all 0.2s',
                              }
                            : {},
                        '&.Mui-disabled': {
                            color: 'grey',
                            bgcolor: readerMode ? '#f5f5f5' : 'rgba(40, 40, 40, 0.4)',
                            border: readerMode ? '1px solid #ccc' : '1px solid rgba(100, 100, 100, 0.2)',
                        },
                    }}
                    disabled={disabled}
                >
                    <FolderOpenIcon
                        className="icon-content"
                        sx={{
                            color: disabled ? 'grey' : readerMode ? '#1976d2' : colors.neons.blue.default,
                            textShadow: disabled || readerMode ? 'none' : `0 0 5px ${colors.neons.blue.default}`,
                            zIndex: 2,
                            fontSize: '16px',
                        }}
                        fontSize="small"
                    />
                </IconButton>
                <IconButton
                    size="small"
                    onClick={handleRemoveClick}
                    title={t('common.removeImage')}
                    disabled={!image || disabled}
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
                                  '& .icon-content': {
                                      animation: `${flicker} 2s infinite`,
                                      filter: `drop-shadow(0 0 3px ${colors.neons.red.default})`,
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
                        '&.Mui-disabled': {
                            color: 'grey',
                            bgcolor: readerMode ? '#f5f5f5' : 'rgba(40, 40, 40, 0.4)',
                            border: readerMode ? '1px solid #ccc' : '1px solid rgba(100, 100, 100, 0.2)',
                        },
                    }}
                >
                    <Close
                        className="icon-content"
                        sx={{
                            color: disabled || !image ? 'grey' : readerMode ? '#d32f2f' : colors.neons.red.default,
                            textShadow:
                                disabled || !image
                                    ? 'none'
                                    : readerMode
                                    ? 'none'
                                    : `0 0 5px ${colors.neons.red.default}`,
                            zIndex: 2,
                            fontSize: '16px',
                        }}
                        fontSize="small"
                    />
                </IconButton>
                {handleRegenerateClick && (
                    <IconButton
                        size="small"
                        onClick={handleRegenerateButtonClick}
                        title={t('common.regenerateImage')}
                        disabled={!canRegenerate || disabled}
                        sx={{
                            minWidth: '30px',
                            width: '30px',
                            height: '30px',
                            borderRadius: '2px',
                            p: 0,
                            bgcolor: readerMode ? '#f5f5f5' : 'rgba(0, 40, 0, 0.4)',
                            color: readerMode ? '#2e7d32' : colors.neons.green.default,
                            border: readerMode ? '1px solid #2e7d32' : `1px solid ${colors.neons.green.default}60`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            position: 'relative',
                            '&::before': !readerMode
                                ? {
                                      content: '""',
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '1px',
                                      background: `linear-gradient(90deg, transparent, ${colors.neons.green.default}, transparent)`,
                                      opacity: 0.7,
                                  }
                                : {},
                            '&:hover': readerMode
                                ? {
                                      bgcolor: '#f0f0f0',
                                      color: '#1b5e20',
                                  }
                                : {
                                      bgcolor: 'rgba(0, 60, 0, 0.6)',
                                      color: colors.neons.green.light,
                                      boxShadow: `0 0 8px ${colors.neons.green.default}80`,
                                      '&::after': {
                                          opacity: 0.8,
                                          height: '100%',
                                      },
                                      '& .icon-content': {
                                          animation: `${flicker} 2s infinite`,
                                          filter: `drop-shadow(0 0 3px ${colors.neons.green.default})`,
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
                                      background: `linear-gradient(0deg, ${colors.neons.green.default}30, transparent)`,
                                      transition: 'all 0.2s',
                                  }
                                : {},
                            '&.Mui-disabled': {
                                color: 'grey',
                                bgcolor: readerMode ? '#f5f5f5' : 'rgba(40, 40, 40, 0.4)',
                                border: readerMode ? '1px solid #ccc' : '1px solid rgba(100, 100, 100, 0.2)',
                            },
                        }}
                    >
                        <AutorenewIcon
                            className="icon-content"
                            sx={{
                                color:
                                    disabled || !canRegenerate
                                        ? 'grey'
                                        : readerMode
                                        ? '#2e7d32'
                                        : colors.neons.green.default,
                                textShadow:
                                    disabled || !canRegenerate
                                        ? 'none'
                                        : readerMode
                                        ? 'none'
                                        : `0 0 5px ${colors.neons.green.default}`,
                                zIndex: 2,
                                fontSize: '16px',
                            }}
                            fontSize="small"
                        />
                    </IconButton>
                )}
                <IconButton
                    size="small"
                    onClick={handleDownloadClick}
                    title={t('common.downloadImage')}
                    disabled={!image}
                    sx={{
                        minWidth: '30px',
                        width: '30px',
                        height: '30px',
                        borderRadius: '2px',
                        p: 0,
                        bgcolor: readerMode ? '#f5f5f5' : 'rgba(0, 0, 40, 0.4)',
                        color: readerMode ? '#1976d2' : colors.neons.blue.default,
                        border: readerMode ? '1px solid #1976d2' : `1px solid ${colors.neons.blue.default}60`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        position: 'relative',
                        '&::before': !readerMode
                            ? {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '1px',
                                  background: `linear-gradient(90deg, transparent, ${colors.neons.blue.default}, transparent)`,
                                  opacity: 0.7,
                              }
                            : {},
                        '&:hover': readerMode
                            ? {
                                  bgcolor: '#f0f0f0',
                                  color: '#0d47a1',
                              }
                            : {
                                  bgcolor: 'rgba(0, 0, 60, 0.6)',
                                  color: colors.neons.blue.light,
                                  boxShadow: `0 0 8px ${colors.neons.blue.default}80`,
                                  '&::after': {
                                      opacity: 0.8,
                                      height: '100%',
                                  },
                                  '& .icon-content': {
                                      animation: `${glitch} 2s infinite`,
                                      filter: `drop-shadow(0 0 3px ${colors.neons.blue.default})`,
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
                                  background: `linear-gradient(0deg, ${colors.neons.blue.default}30, transparent)`,
                                  transition: 'all 0.2s',
                              }
                            : {},
                        '&.Mui-disabled': {
                            color: 'grey',
                            bgcolor: readerMode ? '#f5f5f5' : 'rgba(40, 40, 40, 0.4)',
                            border: readerMode ? '1px solid #ccc' : '1px solid rgba(100, 100, 100, 0.2)',
                        },
                    }}
                >
                    <Save
                        className="icon-content"
                        sx={{
                            color: !image ? 'grey' : readerMode ? '#1976d2' : colors.neons.blue.default,
                            textShadow: !image ? 'none' : readerMode ? 'none' : `0 0 5px ${colors.neons.blue.default}`,
                            zIndex: 2,
                            fontSize: '16px',
                        }}
                        fontSize="small"
                    />
                </IconButton>
            </Box>
        </Box>
    )
}

export default ImageField
