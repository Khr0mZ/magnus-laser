import { Avatar, Box, Chip, Stack, Typography } from '@mui/material'
import { TFunction } from 'i18next'
import L from 'leaflet'
import 'leaflet-draw'
import 'leaflet-draw/dist/leaflet.draw.css'
import 'leaflet/dist/leaflet.css'
import { throttle } from 'lodash'
import { memo, useCallback, useMemo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import { Building, Character, Gang } from '../../../graphql/types'
import colors from '../../../utils/colors'
import ClearAllButton from '../../ClearAllButton'

const buildingMarkerUrl = '/map/building-marker.svg'
const gangMarkerUrl = '/map/gang-marker.svg'
const contactMarkerUrl = '/map/contact-marker.svg'

const MAP_BOUNDS: [[number, number], [number, number]] = [
    [0, 0],
    [10200, 6600],
]

const createIcon = (url: string, type: 'building' | 'gang' | 'contact') => {
    const size: L.PointTuple = type === 'building' ? [45, 45] : [40, 40]
    const anchor: L.PointTuple = type === 'building' ? [22, 45] : [20, 40]
    return new L.Icon({
        iconUrl: url,
        iconRetinaUrl: url,
        iconSize: size,
        iconAnchor: anchor,
        popupAnchor: [0, -5],
        className: `cyberpunk-marker-icon ${type}-marker`,
    })
}

const buildingIcon = createIcon(buildingMarkerUrl, 'building')
const gangIcon = createIcon(gangMarkerUrl, 'gang')
const contactIcon = createIcon(contactMarkerUrl, 'contact')

// Add marker icon styles
const markerStyles = `
    .cyberpunk-marker-icon {
        filter: drop-shadow(0 0 2px rgba(0, 255, 255, 0.5));
        transition: all 0.3s ease;
    }
    
    .cyberpunk-marker-icon:hover {
        filter: drop-shadow(0 0 4px rgba(0, 255, 255, 0.8));
        transform: scale(1.1);
    }
    
    .building-marker {
        filter: drop-shadow(0 0 2px rgba(0, 255, 255, 0.5));
    }
    
    .gang-marker {
        filter: drop-shadow(0 0 2px rgba(255, 0, 128, 0.5));
    }
    
    .contact-marker {
        filter: drop-shadow(0 0 2px rgba(0, 255, 0, 0.5));
    }
`

// Add styles to document head
const style = document.createElement('style')
style.textContent = markerStyles
document.head.appendChild(style)

export type MapProps = {
    center: [number, number]
    zoom?: number
    markers?: Array<{
        position: [number, number]
        popup?: string
    }>
    style?: React.CSSProperties
    setIsSaving?: (saving: boolean) => void
    t: TFunction
}

type CustomMarker = {
    position: [number, number]
    buildingId: string
    id: string
    markerType: 'building' | 'gang' | 'contact'
}

// Memoized Marker component
const CustomMarker = memo(
    ({
        marker,
        onDelete,
        buildings,
        gangs,
        contacts,
        t,
        onDragEnd,
    }: {
        marker: CustomMarker
        onDelete: (id: string) => void
        buildings: Building[]
        gangs: Gang[]
        contacts: Character[]
        t: TFunction
        onDragEnd?: (id: string, position: [number, number]) => void
    }) => {
        const handleDrag = useCallback((e: L.LeafletEvent) => {
            const marker = e.target as L.Marker
            const newPos = marker.getLatLng()
            const [sw, ne] = MAP_BOUNDS

            // Constrain position to bounds
            const lat = Math.max(sw[0], Math.min(ne[0], newPos.lat))
            const lng = Math.max(sw[1], Math.min(ne[1], newPos.lng))

            // If position was constrained, update it
            if (lat !== newPos.lat || lng !== newPos.lng) {
                marker.setLatLng([lat, lng])
            }
        }, [])

        const throttledDragEnd = useCallback(
            (e: L.DragEndEvent) => {
                const newPosition: [number, number] = [e.target.getLatLng().lat, e.target.getLatLng().lng]
                onDragEnd?.(marker.id, newPosition)
            },
            [marker.id, onDragEnd]
        )

        const throttledHandler = useMemo(() => throttle(throttledDragEnd, 500), [throttledDragEnd])

        const getEntity = () => {
            switch (marker.markerType) {
                case 'building':
                    return buildings.find((b) => b.ID === marker.buildingId)
                case 'gang':
                    return gangs.find((g) => g.ID === marker.buildingId)
                case 'contact':
                    return contacts.find((c) => c.ID === marker.buildingId)
            }
        }

        const entity = getEntity()
        if (!entity) return null

        const getMarkerIcon = () => {
            switch (marker.markerType) {
                case 'building':
                    return buildingIcon
                case 'gang':
                    return gangIcon
                case 'contact':
                    return contactIcon
                default:
                    return buildingIcon
            }
        }

        const renderEntityDetails = () => {
            if (marker.markerType === 'building') {
                const building = entity as Building
                return (
                    <>
                        <Typography variant="h6">{building.name}</Typography>
                        <Stack direction="row" gap={1} alignItems="center" justifyContent="space-between">
                            <Box sx={{ width: 90, height: 90, position: 'relative' }}>
                                {building.image === '' && (
                                    <Typography
                                        sx={{
                                            fontWeight: 500,
                                            fontSize: '0.25rem',
                                            position: 'absolute',
                                            top: 'calc(50% - 0.4rem)',
                                            left: 'calc(50% + 0.1rem)',
                                            transform: 'translate(-50%, -50%)',
                                            textShadow: `0 0 5px ${colors.grays.gray000}`,
                                            color: colors.neons.yellow.default,
                                        }}
                                    >
                                        PLACEHOLDER
                                    </Typography>
                                )}
                                <Avatar
                                    src={building.image !== '' ? building.image : '/logoBlackTransparentEyes.png'}
                                    variant="rounded"
                                    slotProps={{
                                        img: {
                                            style: {
                                                objectFit: 'contain',
                                            },
                                        },
                                    }}
                                    sx={{
                                        bgcolor: 'transparent',
                                        color: 'transparent',
                                        width: '100%',
                                        height: '100%',
                                    }}
                                />
                            </Box>
                            <Stack gap={1}>
                                {building.type && (
                                    <Chip
                                        title={t(`buildings.type.${building.type}`)}
                                        label={t(`buildings.type.${building.type}`)}
                                        size="small"
                                        sx={{
                                            backgroundColor: colors.neons.cyan.default + '20',
                                            color: colors.neons.cyan.default,
                                            border: `1px solid ${colors.neons.cyan.default}`,
                                            maxWidth: 110,
                                        }}
                                    />
                                )}
                                {building.securityPersonnel && (
                                    <Chip
                                        title={t(`buildings.securityPersonnel.${building.securityPersonnel}`)}
                                        label={t(`buildings.securityPersonnel.${building.securityPersonnel}`)}
                                        size="small"
                                        sx={{
                                            backgroundColor: colors.neons.pink.default + '20',
                                            color: colors.neons.pink.default,
                                            border: `1px solid ${colors.neons.pink.default}`,
                                            maxWidth: 110,
                                        }}
                                    />
                                )}
                                {building.ownership && (
                                    <Chip
                                        title={t(`buildings.ownership.${building.ownership}`)}
                                        label={t(`buildings.ownership.${building.ownership}`)}
                                        size="small"
                                        sx={{
                                            backgroundColor: colors.neons.yellow.default + '20',
                                            color: colors.neons.yellow.default,
                                            border: `1px solid ${colors.neons.yellow.default}`,
                                            maxWidth: 110,
                                        }}
                                    />
                                )}
                            </Stack>
                        </Stack>
                    </>
                )
            } else if (marker.markerType === 'gang') {
                const gang = entity as Gang
                return (
                    <>
                        <Typography variant="h6">{gang.name}</Typography>
                        <Stack direction="row" gap={1} alignItems="center" justifyContent="space-between">
                            <Box sx={{ width: 90, height: 90, position: 'relative' }}>
                                <Avatar
                                    src={gang.image || '/logoBlackTransparentEyes.png'}
                                    variant="rounded"
                                    slotProps={{
                                        img: {
                                            style: {
                                                objectFit: 'contain',
                                            },
                                        },
                                    }}
                                    sx={{
                                        bgcolor: 'transparent',
                                        color: 'transparent',
                                        width: '100%',
                                        height: '100%',
                                    }}
                                />
                            </Box>
                            <Stack gap={1}>
                                {gang.type && (
                                    <Chip
                                        title={t(`gangs.type.${gang.type}`)}
                                        label={t(`gangs.type.${gang.type}`)}
                                        size="small"
                                        sx={{
                                            backgroundColor: colors.neons.pink.default + '20',
                                            color: colors.neons.pink.default,
                                            border: `1px solid ${colors.neons.pink.default}`,
                                            maxWidth: 110,
                                        }}
                                    />
                                )}
                            </Stack>
                        </Stack>
                    </>
                )
            } else {
                const contact = entity as Character
                return (
                    <>
                        <Typography variant="h6">{contact.name}</Typography>
                        <Stack direction="row" gap={1} alignItems="center" justifyContent="space-between">
                            <Box sx={{ width: 90, height: 90, position: 'relative' }}>
                                <Avatar
                                    src={contact.image || '/logoBlackTransparentEyes.png'}
                                    variant="rounded"
                                    slotProps={{
                                        img: {
                                            style: {
                                                objectFit: 'contain',
                                            },
                                        },
                                    }}
                                    sx={{
                                        bgcolor: 'transparent',
                                        color: 'transparent',
                                        width: '100%',
                                        height: '100%',
                                    }}
                                />
                            </Box>
                            <Stack gap={1}>
                                {contact.type && (
                                    <Chip
                                        title={t(`characters.type.${contact.type}`)}
                                        label={t(`characters.type.${contact.type}`)}
                                        size="small"
                                        sx={{
                                            backgroundColor: colors.neons.green.default + '20',
                                            color: colors.neons.green.default,
                                            border: `1px solid ${colors.neons.green.default}`,
                                            maxWidth: 110,
                                        }}
                                    />
                                )}
                                {contact.attitude && (
                                    <Chip
                                        title={t(`characters.attitude.${contact.attitude}`)}
                                        label={t(`characters.attitude.${contact.attitude}`)}
                                        size="small"
                                        sx={{
                                            backgroundColor: colors.neons.blue.default + '20',
                                            color: colors.neons.blue.default,
                                            border: `1px solid ${colors.neons.blue.default}`,
                                            maxWidth: 110,
                                        }}
                                    />
                                )}
                            </Stack>
                        </Stack>
                    </>
                )
            }
        }

        return (
            <Marker
                position={marker.position}
                icon={getMarkerIcon()}
                draggable={true}
                eventHandlers={{
                    drag: handleDrag,
                    dragend: throttledHandler,
                }}
            >
                <Popup>
                    <Stack gap={1} sx={{ maxWidth: 200 }}>
                        {renderEntityDetails()}
                        <ClearAllButton
                            handleClearAllClick={() => onDelete(marker.id)}
                            disabled={false}
                            label={t('common.delete')}
                        />
                    </Stack>
                </Popup>
            </Marker>
        )
    }
)

export default CustomMarker
