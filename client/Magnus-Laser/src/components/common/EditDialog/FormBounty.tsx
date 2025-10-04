import { Add } from '@mui/icons-material'
import {
    FormControl,
    GridLegacy as Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    SxProps,
    TextField,
    Typography,
} from '@mui/material'
import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useData } from '../../../contexts/dataHooks.ts'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks.ts'
import { Bounty, BountyRep, BountyStatus, Character, Crime, CrimeType } from '../../../graphql/types.ts'
import colors from '../../../utils/colors.ts'
import { getCrimeTargetType, getRandomElement } from '../../../utils/functions.ts'
import { baseBountyRewardPerSpeciality, getTarget } from '../../../utils/generators/generatorBounty.ts'
import {
    BribeTargetRank,
    ContrabandTargetRank,
    DrugTargetRank,
    MurderTargetRank,
    TheftTargetRank,
} from '../../../utils/types.ts'
import { flicker } from '../Animations.tsx'
import VirtualizedList from '../VirtualizedList.tsx'
import ImageField from './ImageField.tsx'

export type FormBountyProps = {
    editedTarget: Bounty
    textFieldOutlinedStyle: SxProps
    handleChange: (field: string, value: unknown) => void
    toggleFullscreenImage: (image: string) => void
    formControlStyle: SxProps
    inputLabelStyle: SxProps
    selectStyle: SxProps
}

const CrimeRow = memo(
    ({
        crime,
        index,
        handleChange,
        formControlStyle,
        inputLabelStyle,
        selectStyle,
        textFieldOutlinedStyle,
        getTargetRank,
    }: {
        crime: Crime
        index: number
        handleChange: (field: string, value: unknown) => void
        formControlStyle: SxProps
        inputLabelStyle: SxProps
        selectStyle: SxProps
        textFieldOutlinedStyle: SxProps
        getTargetRank: (target: string, crimeType: CrimeType) => number
    }) => {
        const { t } = useTranslation()

        return (
            <Stack
                direction="row"
                spacing={2}
                sx={{
                    width: '100%',
                    alignItems: 'center',
                    py: 1,
                }}
            >
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel sx={inputLabelStyle}>{t('bounties.labels.crime')}</InputLabel>
                    <Select
                        value={crime.crimeType}
                        onChange={(e) => {
                            handleChange(`crimes.${index}.crimeType`, e.target.value)
                            const targetType = getCrimeTargetType(e.target.value as CrimeType)
                            handleChange(`crimes.${index}.target`, getRandomElement(Object.values(targetType)))
                        }}
                        label={t('bounties.labels.crime')}
                        sx={selectStyle}
                    >
                        {Object.values(CrimeType).map((value) => (
                            <MenuItem key={value} value={value}>
                                {t(`bounties.speciality.${value}`)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel sx={inputLabelStyle}>{t('bounties.labels.target')}</InputLabel>
                    <Select
                        value={'target' in crime ? crime.target : ''}
                        onChange={(e) => {
                            handleChange(`crimes.${index}.target`, e.target.value)
                        }}
                        label={t('bounties.labels.target')}
                        sx={selectStyle}
                    >
                        {(() => {
                            const targets = Object.values(getCrimeTargetType(crime.crimeType))
                            return targets
                                .sort((a, b) => {
                                    const rankA = getTargetRank(a, crime.crimeType)
                                    const rankB = getTargetRank(b, crime.crimeType)
                                    return rankA - rankB
                                })
                                .map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {t(`bounties.target.${value}`)}
                                    </MenuItem>
                                ))
                        })()}
                    </Select>
                </FormControl>
                <TextField
                    fullWidth
                    label={t('bounties.labels.multiplier')}
                    value={crime.multiplier}
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                    onChange={(e) => handleChange(`crimes.${index}.multiplier`, e.target.value)}
                />
                <Typography variant="h4">X</Typography>
                <TextField
                    fullWidth
                    label={t('bounties.labels.reward')}
                    value={crime.reward}
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                    onChange={(e) => handleChange(`crimes.${index}.reward`, e.target.value)}
                />
                <Typography variant="h4">=</Typography>
                <TextField
                    fullWidth
                    label={t('bounties.labels.total')}
                    value={crime.reward * crime.multiplier}
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                    disabled
                    InputProps={{
                        endAdornment: <InputAdornment position="end">{'€$'}</InputAdornment>,
                    }}
                />
            </Stack>
        )
    }
)

const FormBounty = (props: FormBountyProps) => {
    const {
        editedTarget,
        textFieldOutlinedStyle,
        handleChange,
        toggleFullscreenImage,
        formControlStyle,
        inputLabelStyle,
        selectStyle,
    } = props
    const { t } = useTranslation()
    const { characters } = useData()
    const { readerMode } = useUserPreferences()

    const updatedTarget = useMemo(() => {
        return {
            ...editedTarget,
            character: characters.find(
                (c) =>
                    c.ID ===
                    (typeof editedTarget.character === 'string' ? editedTarget.character : editedTarget.character.ID)
            ) as Character,
        }
    }, [editedTarget, characters])

    const getTargetRank = useCallback((target: string, crimeType: CrimeType) => {
        let rank = 0
        switch (crimeType) {
            case CrimeType.THEFT:
                rank = TheftTargetRank[target as keyof typeof TheftTargetRank] || 0
                return rank
            case CrimeType.MURDER:
                rank = MurderTargetRank[target as keyof typeof MurderTargetRank] || 0
                return rank
            case CrimeType.CONTRABAND:
                rank = ContrabandTargetRank[target as keyof typeof ContrabandTargetRank] || 0
                return rank
            case CrimeType.DRUG:
                rank = DrugTargetRank[target as keyof typeof DrugTargetRank] || 0
                return rank
            case CrimeType.BRIBE:
                rank = BribeTargetRank[target as keyof typeof BribeTargetRank] || 0
                return rank
            default:
                return 0
        }
    }, [])

    const Row = useCallback(
        ({ index, style }: { index: number; style: React.CSSProperties }) => {
            const crime = updatedTarget.crimes[index]
            return (
                <div style={style}>
                    <CrimeRow
                        crime={crime}
                        index={index}
                        handleChange={handleChange}
                        formControlStyle={formControlStyle}
                        inputLabelStyle={inputLabelStyle}
                        selectStyle={selectStyle}
                        textFieldOutlinedStyle={textFieldOutlinedStyle}
                        getTargetRank={getTargetRank}
                    />
                </div>
            )
        },
        [
            updatedTarget.crimes,
            handleChange,
            formControlStyle,
            inputLabelStyle,
            selectStyle,
            textFieldOutlinedStyle,
            getTargetRank,
        ]
    )

    return (
        <>
            {/* Character */}
            <Grid item xs={12}>
                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                    <InputLabel sx={inputLabelStyle}>{t('characters.labels.name')}</InputLabel>
                    <Select
                        value={updatedTarget.character.ID}
                        onChange={(e) =>
                            handleChange('character', characters.find((c) => c.ID === e.target.value) as Character)
                        }
                        label={t('characters.labels.name')}
                        sx={selectStyle}
                    >
                        {characters.map((character) => (
                            <MenuItem key={character.ID} value={character.ID}>
                                {character.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>
            {/* Name */}
            <Grid item xs={12}>
                <TextField
                    fullWidth
                    label={t('characters.labels.name')}
                    value={updatedTarget.character.name}
                    variant="outlined"
                    sx={textFieldOutlinedStyle}
                    disabled
                />
            </Grid>

            <Grid item container xs={12} md={8}>
                <Stack spacing={2} sx={{ width: '100%' }}>
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                        {/* Type */}
                        <TextField
                            fullWidth
                            label={t('characters.labels.type')}
                            value={t(`characters.type.${updatedTarget.character.type}`)}
                            variant="outlined"
                            sx={textFieldOutlinedStyle}
                            disabled
                        />
                        {/* Attitude */}
                        <TextField
                            fullWidth
                            label={t('characters.labels.attitude')}
                            value={t(`characters.attitude.${updatedTarget.character.attitude}`)}
                            variant="outlined"
                            sx={textFieldOutlinedStyle}
                            disabled
                        />
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                        {/* Speciality */}
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel sx={inputLabelStyle}>{t('bounties.labels.speciality')}</InputLabel>
                            <Select
                                value={updatedTarget.speciality || ''}
                                onChange={(e) => handleChange('speciality', e.target.value)}
                                label={t('bounties.labels.speciality')}
                                sx={selectStyle}
                            >
                                {Object.values(CrimeType).map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {t(`bounties.speciality.${value}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {/* Base Bounty */}
                        <TextField
                            fullWidth
                            label={t('bounties.labels.baseBounty')}
                            value={baseBountyRewardPerSpeciality[updatedTarget.speciality]}
                            variant="outlined"
                            sx={textFieldOutlinedStyle}
                            disabled
                            InputProps={{
                                endAdornment: <InputAdornment position="end">{'€$'}</InputAdornment>,
                            }}
                        />
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                        {/* Rep */}
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel sx={inputLabelStyle}>{t('bounties.labels.rep')}</InputLabel>
                            <Select
                                value={updatedTarget.rep || ''}
                                onChange={(e) => handleChange('rep', e.target.value)}
                                label={t('bounties.labels.rep')}
                                sx={selectStyle}
                            >
                                {Object.values(BountyRep).map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {t(`bounties.rep.${value}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {/* Status */}
                        <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                            <InputLabel sx={inputLabelStyle}>{t('bounties.labels.status.title')}</InputLabel>
                            <Select
                                value={updatedTarget.status || ''}
                                onChange={(e) => handleChange('status', e.target.value)}
                                label={t('bounties.labels.status.title')}
                                sx={selectStyle}
                            >
                                {Object.values(BountyStatus).map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {t(`bounties.labels.status.${value}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </Stack>
            </Grid>
            {/* Image */}
            <Grid item xs={12} md={4}>
                <ImageField
                    image={updatedTarget.character.image}
                    downloadName={updatedTarget.character.name}
                    toggleFullscreenImage={toggleFullscreenImage}
                    disabled
                />
            </Grid>
            <Grid item xs={12}>
                <Stack
                    spacing={2}
                    sx={{
                        width: '100%',
                        bgcolor: colors.neons.cyan.default + '10',
                        border: `1px solid ${colors.neons.cyan.dark}`,
                        borderRadius: 0.5,
                        p: 2,
                        pt: 1.5,
                    }}
                >
                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                        <Typography variant="h4">{t('bounties.labels.crimes')}</Typography>
                        <IconButton
                            size="small"
                            onClick={() => {
                                const crimeType = getRandomElement(Object.values(CrimeType))
                                const multiplier =
                                    crimeType === updatedTarget.speciality
                                        ? updatedTarget.rep === BountyRep.BRAGGER
                                            ? 2
                                            : 0.5
                                        : 1
                                const target = getTarget(crimeType, multiplier)
                                const crime = {
                                    crimeType,
                                    target: target.target,
                                    multiplier,
                                    reward: target.reward * multiplier,
                                }
                                handleChange('crimes', [...updatedTarget.crimes, crime])
                            }}
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
                            <Add
                                className="icon-content"
                                sx={{
                                    color: readerMode ? '#2e7d32' : colors.neons.green.default,
                                    textShadow: readerMode ? 'none' : `0 0 5px ${colors.neons.green.default}`,
                                    zIndex: 2,
                                    fontSize: '16px',
                                }}
                                fontSize="small"
                            />
                        </IconButton>
                    </Stack>
                    <VirtualizedList
                        height={Math.min(updatedTarget.crimes.length * 74, 400)}
                        itemCount={updatedTarget.crimes.length}
                        itemSize={74}
                        width="100%"
                        renderItem={Row}
                    />
                </Stack>
            </Grid>
        </>
    )
}

export default FormBounty
