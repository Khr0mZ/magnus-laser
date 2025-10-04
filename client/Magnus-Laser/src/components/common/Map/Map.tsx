import { TFunction } from 'i18next'
import L from 'leaflet'
import 'leaflet-draw'
import 'leaflet-draw/dist/leaflet.draw.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import { memo, useCallback, useEffect, useState } from 'react'
import { GeoJSON, ImageOverlay, MapContainer } from 'react-leaflet'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import { Building, Character, Gang } from '../../../graphql/types'
import colors from '../../../utils/colors'
import {
    CustomMarker,
    loadBuildings,
    loadCharacters,
    loadGangs,
    loadMapMarkers,
    saveMapMarkers,
} from '../../../utils/storage'
import { glitch } from '../Animations'
import { WarningDialog } from '../WarningDialog'
import CustomMarkerComponent from './CustomMarker'
import MarkerSelectDialog from './MarkerSelectDialog'

// Fix for default marker icons in Leaflet with Webpack
delete (L.Icon.Default.prototype as { _getIconUrl?: string })._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
})

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

const MAP_MAX_BOUNDS: [[number, number], [number, number]] = [
    [-3000, -3000],
    [13200, 9600],
]

const MAP_BOUNDS: [[number, number], [number, number]] = [
    [0, 0],
    [10200, 6600],
]

const Map = memo(({ center, zoom = 13, markers = [], style = {}, setIsSaving, t }: MapProps) => {
    const [externalGeoJSON, setExternalGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null)
    const [customMarkers, setCustomMarkers] = useState<CustomMarker[]>([])
    const [mapInstance, setMapInstance] = useState<L.Map | null>(null)
    const [buildings, setBuildings] = useState<Building[]>([])
    const [gangs, setGangs] = useState<Gang[]>([])
    const [contacts, setContacts] = useState<Character[]>([])
    const [showBuildingSelect, setShowBuildingSelect] = useState(false)
    const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<string>()
    const [currentZoom, setCurrentZoom] = useState(zoom)
    const { readerMode } = useUserPreferences()

    // Load buildings, gangs, and contacts on component mount
    useEffect(() => {
        // Load buildings
        loadBuildings().then((loadedBuildings) => {
            if (loadedBuildings) {
                setBuildings(loadedBuildings)
            }
        })

        // Load gangs
        loadGangs().then((loadedGangs) => {
            if (loadedGangs) {
                setGangs(loadedGangs)
            }
        })

        // Load contacts
        loadCharacters().then((loadedContacts) => {
            if (loadedContacts) {
                setContacts(loadedContacts)
            }
        })

        // Load markers
        loadMapMarkers().then((savedMarkers) => {
            if (savedMarkers && savedMarkers.length > 0) {
                setCustomMarkers(savedMarkers)
            }
        })
    }, [])

    // Update customMarkers when markers prop changes
    useEffect(() => {
        setCustomMarkers(markers as CustomMarker[])
    }, [markers])

    const handleMapRef = useCallback(
        (map: L.Map | null) => {
            setMapInstance(map)
            if (map) {
                // Remove attribution control
                map.attributionControl.remove()

                // Style the zoom control
                const zoomControl = map.zoomControl
                const container = zoomControl.getContainer()
                if (!container) return

                container.style.border = 'none'
                container.style.boxShadow = 'none'
                container.style.background = 'transparent'

                // Style all buttons
                const buttons = container.getElementsByTagName('a')
                Array.from(buttons).forEach((button) => {
                    button.style.fontSize = '24px'
                    button.style.lineHeight = '36px'
                    button.style.textAlign = 'center'
                    button.style.width = '36px'
                    button.style.height = '36px'
                    button.style.display = 'block'
                    button.style.backgroundColor = readerMode ? 'rgba(0, 0, 40, 0.7)' : 'rgba(0, 0, 40, 0.6)'
                    button.style.borderRadius = '6px'
                    button.style.cursor = 'pointer'
                    button.style.marginBottom = '8px'
                    button.style.color = colors.neons.blue.default
                    button.style.border = `1px solid ${colors.neons.blue.default}60`
                    button.style.transition = 'all 0.2s'
                    button.style.position = 'relative'

                    // Add hover effects
                    button.addEventListener('mouseover', () => {
                        button.style.backgroundColor = 'rgba(0, 0, 60, 0.8)'
                        button.style.color = colors.neons.pink.default
                        button.style.boxShadow = `0 0 8px ${colors.neons.pink.default}80`
                    })

                    button.addEventListener('mouseout', () => {
                        button.style.backgroundColor = readerMode ? 'rgba(0, 0, 40, 0.7)' : 'rgba(0, 0, 40, 0.6)'
                        button.style.color = colors.neons.blue.default
                        button.style.boxShadow = 'none'
                    })

                    // Add glitch effect
                    const glitchEffect = document.createElement('div')
                    glitchEffect.style.position = 'absolute'
                    glitchEffect.style.top = '0'
                    glitchEffect.style.left = '0'
                    glitchEffect.style.width = '100%'
                    glitchEffect.style.height = '100%'
                    glitchEffect.style.animation = `${glitch} 2s infinite`
                    glitchEffect.style.opacity = '0.7'
                    button.appendChild(glitchEffect)
                })

                // Add home button
                const homeButton = L.DomUtil.create('a', 'leaflet-control-zoom-in', container)
                homeButton.innerHTML = '⌂'
                homeButton.title = 'Fit View'
                homeButton.style.fontSize = '24px'
                homeButton.style.lineHeight = '36px'
                homeButton.style.textAlign = 'center'
                homeButton.style.width = '36px'
                homeButton.style.height = '36px'
                homeButton.style.display = 'block'
                homeButton.style.backgroundColor = readerMode ? 'rgba(0, 0, 40, 0.7)' : 'rgba(0, 0, 40, 0.6)'
                homeButton.style.borderRadius = '6px'
                homeButton.style.cursor = 'pointer'
                homeButton.style.marginTop = '8px'
                homeButton.style.color = colors.neons.blue.default
                homeButton.style.border = `1px solid ${colors.neons.blue.default}60`
                homeButton.style.transition = 'all 0.2s'
                homeButton.style.position = 'relative'

                // Add hover effects to home button
                homeButton.addEventListener('mouseover', () => {
                    homeButton.style.backgroundColor = 'rgba(0, 0, 60, 0.8)'
                    homeButton.style.color = colors.neons.pink.default
                    homeButton.style.border = `1px solid ${colors.neons.pink.default}60`
                    homeButton.style.boxShadow = `0 0 8px ${colors.neons.pink.default}80`
                })

                homeButton.addEventListener('mouseout', () => {
                    homeButton.style.backgroundColor = readerMode ? 'rgba(0, 0, 40, 0.7)' : 'rgba(0, 0, 40, 0.6)'
                    homeButton.style.color = colors.neons.blue.default
                    homeButton.style.border = `1px solid ${colors.neons.blue.default}60`
                    homeButton.style.boxShadow = 'none'
                })

                // Add glitch effect to home button
                const homeGlitchEffect = document.createElement('div')
                homeGlitchEffect.style.position = 'absolute'
                homeGlitchEffect.style.top = '0'
                homeGlitchEffect.style.left = '0'
                homeGlitchEffect.style.width = '100%'
                homeGlitchEffect.style.height = '100%'
                homeGlitchEffect.style.animation = `${glitch} 2s infinite`
                homeGlitchEffect.style.opacity = '0.7'
                homeButton.appendChild(homeGlitchEffect)

                L.DomEvent.on(homeButton, 'click', L.DomEvent.stop)
                    .on(homeButton, 'click', () => map.fitBounds(MAP_BOUNDS))
                    .on(homeButton, 'dblclick', L.DomEvent.stop)

                // Add mousemove handler for cursor
                map.on('mousemove', (e: L.LeafletMouseEvent) => {
                    const { lat, lng } = e.latlng
                    const [sw, ne] = MAP_BOUNDS
                    const isOutOfBounds = lat < sw[0] || lat > ne[0] || lng < sw[1] || lng > ne[1]
                    map.getContainer().style.cursor = isOutOfBounds ? 'not-allowed' : 'grab'
                })
            }
        },
        [readerMode]
    )

    const handleMarkerDelete = useCallback(
        (id: string) => {
            setCustomMarkers((prev) => {
                const newMarkers = prev.filter((marker) => marker.id !== id)
                setIsSaving?.(true)
                saveMapMarkers(newMarkers).finally(() => setIsSaving?.(false))
                return newMarkers
            })
            setDeleteDialogOpen(undefined)
        },
        [setIsSaving]
    )

    const handleMarkerDragEnd = useCallback(
        (id: string, newPosition: [number, number]) => {
            // Check if the new position is within bounds
            const [sw, ne] = MAP_BOUNDS
            if (newPosition[0] < sw[0] || newPosition[0] > ne[0] || newPosition[1] < sw[1] || newPosition[1] > ne[1]) {
                return
            }

            setCustomMarkers((prev) => {
                const newMarkers = prev.map((marker) =>
                    marker.id === id ? { ...marker, position: newPosition } : marker
                )
                setIsSaving?.(true)
                saveMapMarkers(newMarkers).finally(() => setIsSaving?.(false))
                return newMarkers
            })
        },
        [setIsSaving]
    )

    const handleContextMenu = useCallback((e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng

        // Check if the click is within MAP_BOUNDS
        const [sw, ne] = MAP_BOUNDS
        if (lat < sw[0] || lat > ne[0] || lng < sw[1] || lng > ne[1]) {
            return
        }

        setSelectedPosition([lat, lng])
        setShowBuildingSelect(true)
    }, [])

    const handleBuildingSelect = useCallback(
        (entity: Building | Gang | Character, markerType: 'building' | 'gang' | 'contact') => {
            if (!selectedPosition) return

            const newMarker: CustomMarker = {
                position: selectedPosition,
                buildingId: entity.ID,
                id: Date.now().toString(),
                markerType: markerType,
            }
            setCustomMarkers((prev) => {
                const newMarkers = [...prev, newMarker]
                setIsSaving?.(true)
                saveMapMarkers(newMarkers).finally(() => setIsSaving?.(false))
                return newMarkers
            })
            setSelectedPosition(null)
        },
        [selectedPosition, setIsSaving]
    )

    useEffect(() => {
        if (!mapInstance) return

        mapInstance.on('contextmenu', handleContextMenu)
        return () => {
            mapInstance.off('contextmenu', handleContextMenu)
        }
    }, [mapInstance, handleContextMenu])

    const highlightFeature = useCallback((e: L.LeafletEvent) => {
        const layer = e.target as L.Polygon
        layer.setStyle({
            weight: 5,
            color: colors.neons.pink.default,
            fillOpacity: 0.5,
            fillColor: 'transparent',
        })
        layer.bringToFront()
    }, [])

    const resetHighlight = useCallback((e: L.LeafletEvent) => {
        const layer = e.target as L.Polygon
        layer.setStyle({
            weight: 0,
            color: colors.neons.pink.default,
            fillColor: 'transparent',
            fillOpacity: 1,
        })
    }, [])

    const zoomToFeature = useCallback((e: L.LeafletMouseEvent) => {
        const layer = e.target as L.Polygon & { _map?: L.Map }
        const map = layer._map
        if (!map) return
        const bounds = layer.getBounds()

        // Add padding to make the animation more visible
        const padding = L.point(100, 100) // [top/bottom, left/right] padding in pixels

        // Get current zoom level
        const currentZoom = map.getZoom()

        // Calculate target zoom level that fits the bounds
        const targetZoom = map.getBoundsZoom(bounds, false, padding)

        // If we're already at the target zoom, force a small zoom change for animation
        const finalZoom = currentZoom === targetZoom ? targetZoom - 0.1 : targetZoom

        // Animate to the new view
        map.flyToBounds(bounds, {
            duration: 1, // Longer duration for smoother animation
            padding: padding,
            maxZoom: finalZoom,
            easeLinearity: 0.25, // Smoother easing
        })
    }, [])

    const onEachFeature = useCallback(
        (feature: GeoJSON.Feature, layer: L.Layer) => {
            const polygon = layer as L.Polygon
            polygon.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
                click: zoomToFeature,
            })

            if (feature.properties && feature.properties.name) {
                layer.bindTooltip(feature.properties.name, {
                    permanent: false,
                    direction: 'center',
                    className: 'district-tooltip',
                    opacity: 1,
                })
            }
        },
        [highlightFeature, resetHighlight, zoomToFeature]
    )

    // Add tooltip styling
    useEffect(() => {
        const style = document.createElement('style')
        style.textContent = `
            .district-tooltip {
                background: transparent;
                border: none;
                box-shadow: none;
                font-family: 'Orbitron', sans-serif;
                font-size: 24px;
                font-weight: bold;
                display: ${currentZoom >= -1 || currentZoom <= -3 ? 'block' : 'none'};
                color: ${readerMode ? colors.grays.gray000 : colors.neons.yellow.default};
                text-shadow:-1px -1px 0 ${colors.neons.pink.default}, 1px -1px 0 ${colors.neons.pink.default},
                            -1px 1px 0 ${colors.neons.pink.default}, 1px 1px 0 ${colors.neons.pink.default},
                            -2px -2px 0 ${
                                readerMode ? colors.neons.yellow.default : colors.grays.gray000
                            }, 2px -2px 0 ${readerMode ? colors.neons.yellow.default : colors.grays.gray000},
                            -2px 2px 0 ${readerMode ? colors.neons.yellow.default : colors.grays.gray000}, 2px 2px 0 ${
            readerMode ? colors.neons.yellow.default : colors.grays.gray000
        };
            }
            .district-tooltip:before {
                display: none;
            }
            .inverted-map {
                filter: invert(1) hue-rotate(180deg);
            }
            .leaflet-container .leaflet-interactive:focus {
                outline: none !important;
            }
            .leaflet-popup-content-wrapper {
                background: ${readerMode ? '#dfe0eb' : '#1e1e29'};
                color: ${readerMode ? '#000' : '#fff'};
                border: 1px solid ${readerMode ? colors.neons.cyan.dark : colors.neons.cyan.default};
                box-shadow: 0 0 10px ${readerMode ? colors.neons.cyan.dark : colors.neons.cyan.default}, 
                           inset 0 0 5px ${readerMode ? colors.neons.cyan.dark : colors.neons.cyan.default};
            }
        `
        document.head.appendChild(style)
        return () => {
            document.head.removeChild(style)
        }
    }, [currentZoom, readerMode])

    // Handle map size and bounds
    useEffect(() => {
        if (mapInstance) {
            // Force map to update its size
            mapInstance.invalidateSize()
            // Set max bounds to prevent panning outside the image
            mapInstance.setMaxBounds(MAP_MAX_BOUNDS)
        }
    }, [mapInstance])

    useEffect(() => {
        fetch('/map/districts.geojson')
            .then((res) => res.json())
            .then((data) => setExternalGeoJSON(data))
            .catch(() => {})
    }, [])

    // Add zoom change handler
    useEffect(() => {
        if (mapInstance) {
            const handleZoom = () => {
                setCurrentZoom(mapInstance.getZoom())
            }
            mapInstance.on('zoomend', handleZoom)
            return () => {
                mapInstance.off('zoomend', handleZoom)
            }
        }
    }, [mapInstance])

    return (
        <div style={{ height: '100%', width: '100%', position: 'relative' }}>
            <MapContainer
                ref={handleMapRef}
                center={center}
                zoom={zoom}
                style={{
                    height: '100%',
                    width: '100%',
                    position: 'absolute',
                    background: readerMode ? '#dfe0eb' : '#1e1e29',
                    ...style,
                }}
                scrollWheelZoom={true}
                maxBounds={MAP_MAX_BOUNDS}
                minZoom={-4}
                maxZoom={1}
                zoomSnap={0}
                zoomDelta={0.25}
                crs={L.CRS.Simple}
                doubleClickZoom={false}
                boxZoom={false}
            >
                <ImageOverlay
                    url={currentZoom >= -1 ? '/map/StreetNames.jpg' : '/map/DistrictNames.jpg'}
                    bounds={MAP_BOUNDS}
                    opacity={1}
                    className={readerMode ? 'inverted-map' : ''}
                />
                {externalGeoJSON && (
                    <GeoJSON
                        data={externalGeoJSON}
                        style={{
                            weight: 0,
                            color: readerMode ? colors.neons.cyan.dark : colors.neons.pink.default,
                            fillColor: 'transparent',
                            fillOpacity: 1,
                        }}
                        interactive={true}
                        onEachFeature={onEachFeature}
                        bubblingMouseEvents={true}
                    />
                )}
                {customMarkers.map((marker) => (
                    <CustomMarkerComponent
                        key={marker.id}
                        marker={marker}
                        onDelete={(markerId) => setDeleteDialogOpen(markerId)}
                        onDragEnd={handleMarkerDragEnd}
                        buildings={buildings}
                        gangs={gangs}
                        contacts={contacts}
                        t={t}
                    />
                ))}
                {showBuildingSelect && selectedPosition && (
                    <MarkerSelectDialog
                        open={showBuildingSelect}
                        onClose={() => {
                            setShowBuildingSelect(false)
                            setSelectedPosition(null)
                        }}
                        onSelect={handleBuildingSelect}
                        buildings={buildings}
                        gangs={gangs}
                        contacts={contacts}
                        existingMarkers={customMarkers}
                    />
                )}
                {deleteDialogOpen && (
                    <WarningDialog
                        open
                        onClose={() => setDeleteDialogOpen(undefined)}
                        onConfirm={() => handleMarkerDelete(deleteDialogOpen)}
                        title={t('common.deleteConfirmTitle')}
                        message={t('common.deleteConfirmMessage')}
                        moduleType={'MARKER'}
                        isDelete={true}
                        isClearAll={false}
                    />
                )}
            </MapContainer>
        </div>
    )
})

export default Map
