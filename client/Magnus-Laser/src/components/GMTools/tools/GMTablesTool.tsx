import ExpandMore from '@mui/icons-material/ExpandMore'
import SearchIcon from '@mui/icons-material/Search'
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUserPreferences } from '../../../contexts/userPreferencesHooks'
import colors from '../../../utils/colors'
import { getCyberpunkTextFieldStyle, getSectionTitleStyle } from '../GMToolsStyles'
import { type GMTableDef, gmTableCategories } from './gmTablesData'

const GMTablesTool = () => {
    const { t } = useTranslation('gmtables')
    const { t: tMain } = useTranslation()
    const { readerMode } = useUserPreferences()
    const [searchQuery, setSearchQuery] = useState('')

    const accentColor = colors.neons.orange.default

    const resolveCell = (value: string | number): string => {
        if (typeof value === 'number') return String(value)
        if (value.startsWith('t:')) return t(value.slice(2))
        return value
    }

    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return gmTableCategories
        const query = searchQuery.toLowerCase()
        return gmTableCategories
            .map((category) => ({
                ...category,
                tables: category.tables.filter(
                    (table) =>
                        t(table.titleKey).toLowerCase().includes(query) ||
                        t(category.titleKey).toLowerCase().includes(query)
                ),
            }))
            .filter((category) => category.tables.length > 0)
    }, [searchQuery, t])

    const baseAccordionSx = {
        backgroundColor: 'transparent',
        boxShadow: 'none',
        '&::before': { display: 'none' },
    }

    // Category accordion — prominent, with colored left border
    const categoryAccordionSx = (color: string) => ({
        ...baseAccordionSx,
        borderLeft: readerMode ? '3px solid rgba(0,0,0,0.15)' : `3px solid ${color}`,
        borderRadius: '2px',
        mb: 0.5,
    })

    const categorySummarySx = (color: string) => ({
        minHeight: 40,
        '&.Mui-expanded': { minHeight: 40 },
        '& .MuiAccordionSummary-content': { margin: '8px 0' },
        backgroundColor: readerMode ? 'rgba(0,0,0,0.04)' : `${color}0A`,
        borderBottom: readerMode ? '1px solid rgba(0,0,0,0.1)' : `1px solid ${color}25`,
        pl: 1.5,
    })

    const categoryLabelSx = (color: string) => ({
        color: readerMode ? colors.grays.gray000 : color,
        fontFamily: '"Orbitron", sans-serif',
        fontWeight: 'bold',
        fontSize: '0.75rem',
        letterSpacing: '2px',
        textTransform: 'uppercase' as const,
        textShadow: readerMode ? 'none' : `0 0 5px ${color}60`,
    })

    // Table accordion — subtle, indented, smaller
    const tableSummarySx = (color: string) => ({
        minHeight: 30,
        '&.Mui-expanded': { minHeight: 30 },
        '& .MuiAccordionSummary-content': { margin: '4px 0' },
        borderBottom: readerMode ? '1px solid rgba(0,0,0,0.06)' : `1px solid ${color}15`,
    })

    const tableLabelSx = {
        color: readerMode ? colors.grays.gray200 : colors.grays.gray700,
        fontFamily: '"Lexend", sans-serif',
        fontWeight: 600,
        fontSize: '0.7rem',
    }

    const tableHeaderCellSx = (color: string) => ({
        color: readerMode ? colors.grays.gray000 : color,
        fontSize: '0.6rem',
        fontFamily: '"Orbitron", sans-serif',
        fontWeight: 'bold',
        letterSpacing: '0.5px',
        textTransform: 'uppercase' as const,
        borderBottom: readerMode ? '2px solid rgba(0,0,0,0.15)' : `2px solid ${color}40`,
        py: 0.5,
        px: 0.75,
        whiteSpace: 'nowrap',
    })

    const tableCellSx = (color: string) => ({
        color: readerMode ? colors.grays.gray200 : colors.grays.gray800,
        fontSize: '0.72rem',
        fontFamily: '"Lexend", sans-serif',
        borderBottom: readerMode ? '1px solid rgba(0,0,0,0.08)' : `1px solid ${color}15`,
        py: 0.5,
        px: 0.75,
    })

    const renderTable = (table: GMTableDef) => (
        <Box key={table.key} sx={{ mb: 0.25 }}>
            <Accordion sx={baseAccordionSx} disableGutters>
                <AccordionSummary
                    expandIcon={
                        <ExpandMore
                            sx={{ color: readerMode ? colors.grays.gray500 : `${table.color}90`, fontSize: 16 }}
                        />
                    }
                    sx={tableSummarySx(table.color)}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box
                            sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: readerMode ? colors.grays.gray500 : `${table.color}80`,
                                flexShrink: 0,
                            }}
                        />
                        <Typography variant="caption" sx={tableLabelSx}>
                            {t(table.titleKey)}
                        </Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0, pt: 0.5 }}>
                    {table.descriptionKey && (
                        <Typography
                            variant="caption"
                            sx={{
                                color: readerMode ? colors.grays.gray400 : colors.grays.gray600,
                                fontFamily: '"Lexend", sans-serif',
                                fontSize: '0.68rem',
                                mb: 1,
                                display: 'block',
                                fontStyle: 'italic',
                                px: 0.5,
                            }}
                        >
                            {t(table.descriptionKey)}
                        </Typography>
                    )}
                    <Box sx={{ overflowX: 'auto' }}>
                        <Table size="small" sx={{ minWidth: table.columns.length > 5 ? 600 : 'auto' }}>
                            <TableHead>
                                <TableRow>
                                    {table.columns.map((col, i) => (
                                        <TableCell
                                            key={i}
                                            align={col.align || 'left'}
                                            sx={{
                                                ...tableHeaderCellSx(table.color),
                                                ...(col.width ? { width: col.width } : {}),
                                            }}
                                        >
                                            {t(col.headerKey)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {table.rows.map((row, ri) => (
                                    <TableRow
                                        key={ri}
                                        sx={{
                                            backgroundColor: row.highlight
                                                ? `${table.color}10`
                                                : ri % 2 === 0
                                                  ? 'transparent'
                                                  : readerMode
                                                    ? 'rgba(0,0,0,0.02)'
                                                    : 'rgba(255,255,255,0.02)',
                                        }}
                                    >
                                        {row.cells.map((cell, ci) => (
                                            <TableCell
                                                key={ci}
                                                align={table.columns[ci]?.align || 'left'}
                                                sx={tableCellSx(table.color)}
                                            >
                                                {resolveCell(cell)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                </AccordionDetails>
            </Accordion>
        </Box>
    )

    return (
        <Box>
            <Typography variant="h6" sx={getSectionTitleStyle(readerMode, accentColor)}>
                {tMain('gmTools.gmTables')}
            </Typography>

            <TextField
                fullWidth
                size="small"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: accentColor, fontSize: 18 }} />
                            </InputAdornment>
                        ),
                    },
                }}
                sx={{
                    ...getCyberpunkTextFieldStyle(readerMode, accentColor),
                    mb: 2,
                }}
            />

            {filteredCategories.map((category) => (
                <Box key={category.key} sx={{ mb: 1.5 }}>
                    <Accordion
                        defaultExpanded={false}
                        sx={categoryAccordionSx(category.color)}
                        disableGutters
                    >
                        <AccordionSummary
                            expandIcon={
                                <ExpandMore
                                    sx={{
                                        color: readerMode ? colors.grays.gray300 : category.color,
                                        fontSize: 20,
                                    }}
                                />
                            }
                            sx={categorySummarySx(category.color)}
                        >
                            <Typography variant="subtitle2" sx={categoryLabelSx(category.color)}>
                                {t(category.titleKey)}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pl: 1.5, pr: 0, pt: 0.5, pb: 0.5 }}>
                            {category.tables.map(renderTable)}
                        </AccordionDetails>
                    </Accordion>
                </Box>
            ))}

            {filteredCategories.length === 0 && searchQuery && (
                <Typography
                    variant="body2"
                    sx={{
                        color: colors.grays.gray600,
                        fontStyle: 'italic',
                        textAlign: 'center',
                        py: 4,
                    }}
                >
                    {t('noResults')}
                </Typography>
            )}
        </Box>
    )
}

export default GMTablesTool
