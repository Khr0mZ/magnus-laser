import { toAlphaHex } from '@/views/CombatSim/pixiUtils'
import { FindReplace, Upload } from '@mui/icons-material'
import Close from '@mui/icons-material/Close'
import { Box, Button, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import ClearAllButton from '../../components/ClearAllButton'
import CyberpunkCheckbox from '../../components/CyberpunkCheckbox'
import CyberpunkFormControlLabel from '../../components/CyberpunkFormControlLabel'
import GenerateButton from '../../components/GenerateButton'
import { useUserPreferences } from '../../contexts/userPreferencesHooks'
import colors from '../../utils/colors'
import { ModuleTypes } from '../../utils/constants'
import { BoardMap, Map as MapType } from './types'

interface CombatSimHeaderProps {
    maps: MapType[]
    currentMap: BoardMap | null
    sortedMaps: BoardMap[]
    onReplaceMap: (file: globalThis.File) => void
    onUploadMap: (file: globalThis.File) => void
    onSelectMap: (mapId: string) => void
    gridSize: number
    setGridSize: Dispatch<SetStateAction<number>>
    gridColorHex: string
    gridAlpha: number
    setGridColorAnchor: Dispatch<SetStateAction<HTMLElement | null>>
    snapToGrid: boolean
    setSnapToGrid: Dispatch<SetStateAction<boolean>>
    setDeleteMapDialogOpen: Dispatch<SetStateAction<boolean>>
}

const CombatSimHeader = (props: CombatSimHeaderProps) => {
    const {
        maps,
        currentMap,
        sortedMaps,
        onReplaceMap,
        onUploadMap,
        onSelectMap,
        gridSize,
        setGridSize,
        gridColorHex,
        gridAlpha,
        setGridColorAnchor,
        snapToGrid,
        setSnapToGrid,
        setDeleteMapDialogOpen,
    } = props
    const { t } = useTranslation()
    const { readerMode } = useUserPreferences()
    const fieldSx = readerMode
        ? {
              '& .MuiOutlinedInput-root': {
                  height: 36.5,
                  color: colors.neons.cyan.dark,
              },
          }
        : {
              '& .MuiOutlinedInput-root': {
                  height: 36.5,
                  color: colors.neons.cyan.default,
              },
          }
    return (
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
            <Typography
                variant="h3"
                className="glitch-text"
                data-text={t('combatSim.title')}
                sx={{
                    color: readerMode ? colors.grays.gray000 : colors.neons.cyan.default,
                    textShadow: `0 0 10px ${colors.neons.cyan.default}`,
                    flexGrow: { xs: 1, xxl: 0 },
                    display: { xs: 'none', xl: 'flex' },
                }}
            >
                {t('combatSim.title')}
            </Typography>
            <Typography
                variant="h4"
                sx={{
                    color: readerMode ? colors.grays.gray000 : colors.neons.green.default,
                    textShadow: `0 0 8px ${colors.neons.green.default}`,
                    flexGrow: 1,
                    display: { xs: 'none', xxl: 'flex' },
                }}
            >
                {t(`modules.${ModuleTypes.COMBAT_SIM}_DESCRIPTION`)}
            </Typography>
            <Stack
                direction="row"
                sx={{
                    mb: 1,
                    flexWrap: 'wrap-reverse',
                    gap: 1,
                    justifyContent: 'flex-end',
                }}
            >
                <ClearAllButton
                    disabled={maps.length === 0}
                    handleClearAllClick={() => document.getElementById('combatsim-replace-map')?.click()}
                    label={<FindReplace />}
                    title={t('combatSim.replaceMap')}
                />
                <GenerateButton
                    isGenerating={false}
                    handleGenerate={() => document.getElementById('combatsim-upload-map')?.click()}
                    label={<Upload />}
                    title={t('combatSim.addMap')}
                />
                <input
                    id="combatsim-replace-map"
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f)
                            onReplaceMap(f)
                            // reset value so selecting the same file again still fires change
                        ;(e.target as HTMLInputElement).value = ''
                    }}
                />
                <input
                    id="combatsim-upload-map"
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f)
                            onUploadMap(f)
                            // reset value so selecting the same file again still fires change
                        ;(e.target as HTMLInputElement).value = ''
                    }}
                />
                <Stack direction="row" spacing={1} alignItems="center">
                    <CyberpunkFormControlLabel
                        readerMode={readerMode}
                        disabled={maps.length === 0}
                        control={
                            <Select
                                displayEmpty
                                value={
                                    sortedMaps.find((m) => m.id === currentMap?.mapId)?.id ?? sortedMaps[0]?.id ?? ''
                                }
                                onChange={(e) => onSelectMap(String(e.target.value))}
                                sx={{ ml: 1, width: 150, height: 36.5, ...fieldSx }}
                                slotProps={{
                                    input: {
                                        sx: {
                                            color: readerMode ? colors.neons.cyan.dark : colors.neons.cyan.default,
                                        },
                                    },
                                }}
                            >
                                {sortedMaps
                                    .map((a) => ({ id: a.id, name: a.name }))
                                    .map((a) => (
                                        <MenuItem key={a.id} value={a.id}>
                                            {a.name}
                                        </MenuItem>
                                    ))}
                            </Select>
                        }
                        label={t('combatSim.map')}
                        labelPlacement="start"
                    />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: 'center' }}>
                        <CyberpunkFormControlLabel
                            readerMode={readerMode}
                            labelPlacement="start"
                            control={
                                <TextField
                                    type="number"
                                    slotProps={{
                                        input: {
                                            sx: {
                                                width: 70,
                                                '& input[type=number]': {
                                                    MozAppearance: 'textfield',
                                                },
                                                '& input[type=number]::-webkit-outer-spin-button': {
                                                    WebkitAppearance: 'none',
                                                    margin: 0,
                                                },
                                                '& input[type=number]::-webkit-inner-spin-button': {
                                                    WebkitAppearance: 'none',
                                                    margin: 0,
                                                },
                                            },
                                        },
                                    }}
                                    value={gridSize}
                                    onChange={(e) => {
                                        let val = parseFloat(e.target.value)
                                        if (e.target.value === '') {
                                            val = 100
                                        }
                                        if (!Number.isNaN(val) && val > 0) setGridSize(val)
                                    }}
                                    sx={{ width: '100%', ...fieldSx }}
                                />
                            }
                            label={t('combatSim.gridSize')}
                        />
                        <Box
                            onClick={(e) => {
                                setGridColorAnchor((prev) => (prev ? null : e.currentTarget))
                            }}
                            sx={{
                                cursor: 'pointer',
                                height: '24px',
                                width: '24px',
                                bgcolor: `${gridColorHex}${toAlphaHex(gridAlpha)}`,
                                borderRadius: '3px',
                                border: `1px solid ${readerMode ? colors.neons.cyan.dark : colors.neons.cyan.dark}`,
                            }}
                            title={t('combatSim.gridColor')}
                        />
                        <CyberpunkFormControlLabel
                            readerMode={readerMode}
                            control={
                                <CyberpunkCheckbox
                                    readerMode={readerMode}
                                    checked={snapToGrid}
                                    onChange={(e) => setSnapToGrid(e.target.checked)}
                                />
                            }
                            label={t('combatSim.snapToGrid')}
                        />
                    </Stack>
                    <Button
                        onClick={() => {
                            setDeleteMapDialogOpen(true)
                        }}
                        disabled={maps.find((m) => m.id === currentMap?.mapId)?.name === 'Empty Map'}
                        sx={{
                            minWidth: '30px',
                            width: '36px',
                            height: '36px',
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
                            fontFamily: readerMode ? 'inherit' : '"Orbitron", monospace',
                            fontWeight: 'bold',
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
                        }}
                    >
                        <Close sx={{ textShadow: `0 0 5px ${colors.neons.red.default}`, zIndex: 2 }} />
                    </Button>
                </Stack>
            </Stack>
        </Stack>
    )
}

export default CombatSimHeader
