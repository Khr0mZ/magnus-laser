import { Box, Divider, List, ListItem, ListItemText, Paper, Typography } from '@mui/material'
import colors from '../utils/colors'
import { getCategoryName } from '../utils/functions'

// Helper function to format enum values
const formatEnumValue = (value: string): string => {
    if (!value) return 'N/A'
    return value.toLowerCase().replace(/_/g, ' ')
}

// Function to process complex nested objects for display
const processValueForDisplay = (key: string, value: unknown): string => {
    if (value === null || value === undefined) {
        return 'N/A'
    }

    if (typeof value === 'object') {
        // Handle specific nested objects
        const valueObj = value as Record<string, unknown>

        if (key === 'armor' && 'h' in valueObj && 'spb' in valueObj) {
            return `H${valueObj.h} / SPB${valueObj.spb}`
        }

        if (key === 'knownFor' && 'knownForPart1' in valueObj && 'knownForPart2' in valueObj) {
            return `${formatEnumValue(valueObj.knownForPart1 as string)} ${formatEnumValue(
                valueObj.knownForPart2 as string
            )}`
        }

        if ('value' in valueObj && valueObj.value !== undefined) {
            return `${valueObj.value}/10`
        }

        // For weapons or other complex objects
        if (key === 'weapons') {
            return Object.entries(valueObj)
                .filter(([weaponKey]) => weaponKey !== '__typename')
                .map(([weaponKey, weaponValue]) => `${weaponKey}: ${weaponValue}`)
                .join(', ')
        }

        // Return a placeholder for other complex objects
        return '[Complex Object]'
    }

    // Handle basic value types
    if (typeof value === 'string' && value.includes('_')) {
        return formatEnumValue(value)
    }

    return String(value)
}

// Function to filter out internal properties and sort them in a meaningful order
const filterAndSortProperties = (data: Record<string, unknown>): [string, unknown][] => {
    const priorityKeys = [
        'type',
        'name',
        'color',
        'quality',
        'status',
        'style',
        'ownership',
        'securityPersonnel',
        'event',
        'secret',
    ]

    const entries = Object.entries(data).filter(
        ([key]) => !key.startsWith('__') && key !== 'displayName' && key !== 'description'
    )

    // Sort entries: first put priority keys in their defined order, then alphabetical
    return entries.sort(([keyA], [keyB]) => {
        const indexA = priorityKeys.indexOf(keyA)
        const indexB = priorityKeys.indexOf(keyB)

        if (indexA >= 0 && indexB >= 0) return indexA - indexB
        if (indexA >= 0) return -1
        if (indexB >= 0) return 1
        return keyA.localeCompare(keyB)
    })
}

interface GeneratedDataListProps {
    data: Record<string, unknown>
    title: string
}

const GeneratedDataList: React.FC<GeneratedDataListProps> = ({ data, title }) => {
    const filteredProperties = filterAndSortProperties(data)

    return (
        <Paper
            elevation={2}
            sx={{
                bgcolor: colors.grays.gray700,
                p: 2,
                border: `1px solid ${colors.grays.gray500}`,
                height: '100%',
            }}
        >
            <Typography variant="h5" sx={{ color: colors.blues.light, mb: 2 }}>
                {title}
            </Typography>

            <Divider sx={{ mb: 2, bgcolor: colors.grays.gray500 }} />

            <List dense sx={{ maxHeight: '600px', overflow: 'auto' }}>
                {filteredProperties.map(([key, value]) => {
                    const displayValue = processValueForDisplay(key, value)

                    // Skip null/undefined values or empty strings
                    if (displayValue === 'N/A' || displayValue === '') return null

                    return (
                        <ListItem key={key} sx={{ py: 0.5 }}>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography
                                            variant="body2"
                                            component="span"
                                            sx={{
                                                fontWeight: 'bold',
                                                color: colors.yellows.light,
                                                minWidth: '140px',
                                                mr: 2,
                                            }}
                                        >
                                            {getCategoryName(key)}:
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            component="span"
                                            sx={{
                                                color: colors.grays.gray100,
                                                flexGrow: 1,
                                            }}
                                        >
                                            {displayValue}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </ListItem>
                    )
                })}
            </List>
        </Paper>
    )
}

export default GeneratedDataList
