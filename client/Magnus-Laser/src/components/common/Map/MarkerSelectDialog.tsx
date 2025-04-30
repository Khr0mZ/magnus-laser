import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Typography,
} from '@mui/material'
import 'leaflet-draw'
import 'leaflet-draw/dist/leaflet.draw.css'
import 'leaflet/dist/leaflet.css'
import { useState } from 'react'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import { Building, Character, Gang } from '../../../graphql/types'
import colors from '../../../utils/colors'
import CustomMarker from './CustomMarker'

type MaerkerSelectDialogProps = {
    open: boolean
    onClose: () => void
    onSelect: (entity: Building | Gang | Character, markerType: 'building' | 'gang' | 'contact') => void
    buildings: Building[]
    gangs: Gang[]
    contacts: Character[]
    existingMarkers: CustomMarker[]
}

const MarkerSelectDialog = (props: MaerkerSelectDialogProps) => {
    const { open, onClose, onSelect, buildings, gangs, contacts, existingMarkers } = props
    const [selectedMarkerType, setSelectedMarkerType] = useState<'building' | 'gang' | 'contact'>('building')
    const [selectedEntity, setSelectedEntity] = useState<Building | Gang | Character | null>(null)
    const { readerMode } = useUserPreferences()

    // Filter out entities that are already marked
    const getAvailableEntities = () => {
        switch (selectedMarkerType) {
            case 'building':
                return buildings.filter(
                    (building) => !existingMarkers.some((marker) => marker.buildingId === building.ID)
                )
            case 'gang':
                return gangs.filter((gang) => !existingMarkers.some((marker) => marker.buildingId === gang.ID))
            case 'contact':
                return contacts.filter((contact) => !existingMarkers.some((marker) => marker.buildingId === contact.ID))
        }
    }

    const handleSelect = () => {
        if (selectedEntity) {
            onSelect(selectedEntity, selectedMarkerType)
            setSelectedEntity(null)
            setSelectedMarkerType('building')
        }
        onClose()
    }

    const handleMarkerTypeChange = (type: 'building' | 'gang' | 'contact') => {
        setSelectedMarkerType(type)
        setSelectedEntity(null)
    }

    const getEntityLabel = () => {
        switch (selectedMarkerType) {
            case 'building':
                return 'Building'
            case 'gang':
                return 'Gang'
            case 'contact':
                return 'Contact'
        }
    }

    const color = colors.neons.green

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: readerMode
                    ? {
                          bgcolor: '#ffffff',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                          color: '#333',
                      }
                    : {
                          bgcolor: 'rgba(10, 15, 30, 0.95)',
                          backdropFilter: 'blur(4px)',
                          border: `1px solid ${colors.neons.green.default}40`,
                          boxShadow: `0 0 20px ${colors.neons.green.default}40`,
                          color: '#fff',
                          position: 'relative',
                          '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              backgroundImage: `linear-gradient(to right, rgba(0, 255, 0, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 255, 0, 0.03) 1px, transparent 1px)`,
                              backgroundSize: '20px 20px',
                              pointerEvents: 'none',
                              opacity: 0.5,
                          },
                      },
            }}
        >
            <DialogTitle
                sx={
                    readerMode
                        ? {
                              color: '#2e7d32',
                              borderBottom: '1px solid #eee',
                          }
                        : {
                              color: color.default,
                              textShadow: `0 0 5px ${color.default}`,
                              fontFamily: '"Orbitron", monospace',
                              borderBottom: `1px solid ${color.default}40`,
                              position: 'relative',
                              '&::after': {
                                  content: '""',
                                  position: 'absolute',
                                  bottom: 0,
                                  left: '10%',
                                  width: '80%',
                                  height: '1px',
                                  background: `linear-gradient(90deg, transparent, ${color.default}, transparent)`,
                              },
                          }
                }
            >
                <Typography
                    variant="h3"
                    component="div"
                    className="glitch-text"
                    data-text={'Select Marker'}
                    sx={{
                        color: readerMode ? '#2e7d32' : '#0097a7',
                        textShadow: `0 0 10px ${'#2e7d32'}`,
                    }}
                >
                    Select Marker
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    <FormControl fullWidth>
                        <InputLabel
                            sx={{
                                color: readerMode ? '#666' : 'rgba(255, 255, 255, 0.7)',
                                borderRadius: '4px',
                                bgcolor: readerMode ? '#fff' : 'rgba(10, 15, 30, 0.95)',
                                p: 0.5,
                                py: 0.25,
                                border: readerMode
                                    ? '1px solid rgba(0, 0, 0, 0.23)'
                                    : `1px solid ${colors.neons.cyan.default}`,
                            }}
                        >
                            Marker Type
                        </InputLabel>
                        <Select
                            value={selectedMarkerType}
                            onChange={(e) => handleMarkerTypeChange(e.target.value as 'building' | 'gang' | 'contact')}
                            label="Marker Type"
                        >
                            <MenuItem value="building">Building</MenuItem>
                            <MenuItem value="gang">Gang</MenuItem>
                            <MenuItem value="contact">Contact</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel
                            sx={{
                                color: readerMode ? '#666' : 'rgba(255, 255, 255, 0.7)',
                                borderRadius: '4px',
                                bgcolor: readerMode ? '#fff' : 'rgba(10, 15, 30, 0.95)',
                                p: 0.5,
                                py: 0.25,
                                border: readerMode
                                    ? '1px solid rgba(0, 0, 0, 0.23)'
                                    : `1px solid ${colors.neons.cyan.default}`,
                            }}
                        >
                            {getEntityLabel()}
                        </InputLabel>
                        <Select
                            value={selectedEntity?.ID || ''}
                            onChange={(e) => {
                                const entities = getAvailableEntities()
                                const entity = entities.find((ent) => ent.ID === e.target.value)
                                setSelectedEntity(entity || null)
                            }}
                            label={getEntityLabel()}
                        >
                            {getAvailableEntities().map((entity) => (
                                <MenuItem key={entity.ID} value={entity.ID}>
                                    {entity.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onClose}
                    sx={
                        readerMode
                            ? {
                                  color: '#0288d1',
                              }
                            : {
                                  bgcolor: 'rgba(10, 20, 30, 0.6)',
                                  color: colors.neons.cyan.default,
                                  border: `1px solid ${colors.neons.cyan.default}40`,
                                  '&:hover': {
                                      bgcolor: 'rgba(0, 30, 60, 0.8)',
                                      boxShadow: `0 0 10px ${colors.neons.cyan.default}40`,
                                  },
                              }
                    }
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSelect}
                    autoFocus
                    sx={
                        readerMode
                            ? {
                                  color: '#2e7d32',
                              }
                            : {
                                  bgcolor: 'rgba(0, 40, 0, 0.6)',
                                  color: color.default,
                                  border: `1px solid ${color.default}40`,
                                  '&:hover': {
                                      bgcolor: 'rgba(0, 60, 0, 0.8)',
                                      color: color.light,
                                      boxShadow: `0 0 10px ${color.default}60`,
                                      textShadow: `0 0 5px ${color.default}`,
                                      border: `1px solid ${color.default}70`,
                                  },
                              }
                    }
                    disabled={!selectedEntity}
                >
                    Add Marker
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default MarkerSelectDialog
