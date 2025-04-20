import { Box, FormControl, InputLabel, SxProps, Theme, useTheme } from '@mui/material'
import { EditorContent, useEditor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { marked } from 'marked'
import { useEffect, useId } from 'react'
import { useUserPreferences } from '../../contexts/userPreferencesHooks.ts'
import colors from '../../utils/colors'
import { pulseGlowBlue, pulseGlowCyan } from './Animations'

type TiptapEditorProps = {
    label?: string
    value: string // Expect initial value as Markdown
    onChange?: (htmlContent: string) => void // Output HTML
    sx?: SxProps<Theme>
}

const TiptapEditor = ({ label, value, onChange, sx }: TiptapEditorProps) => {
    const { readerMode } = useUserPreferences()
    const theme = useTheme() // Use theme for consistency if needed
    const editorId = useId() // Generate unique ID for accessibility
    const labelId = `tiptap-label-${editorId}`
    const inputId = `tiptap-input-${editorId}`
    const disabled = !onChange

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // Configure extensions as needed, e.g., disable some
                // codeBlock: false, // Example
            }),
        ],
        content: '', // Start empty, set content via useEffect
        editorProps: {
            attributes: {
                id: inputId, // Add id to editor
                class: 'prosemirror-editor',
                role: 'textbox', // Accessibility role
                'aria-labelledby': labelId, // Link label
            },
            editable: () => !disabled,
        },
        onUpdate: ({ editor }) => {
            if (onChange) {
                onChange(editor.getHTML())
            }
        },
    })

    // Set initial content or update when the value prop changes
    useEffect(() => {
        if (!editor) {
            return
        }

        // Only update if the external value is different from current editor content
        // Note: This comparison is basic. Comparing parsed HTML might be more robust
        // if frequent external updates are expected that might match internal state.
        const currentHtml = editor.getHTML()
        let newHtml = ''
        try {
            // Assume 'value' is Markdown and parse it
            newHtml = marked.parse(value || '') as string
        } catch (error) {
            console.error('Error parsing initial Markdown:', error)
            newHtml = '<p>Error loading content</p>'
        }

        // Avoid unnecessary updates and potential cursor jumps
        if (newHtml !== currentHtml) {
            // Use promises to ensure content is set before potentially triggering other effects
            editor.commands.setContent(newHtml, false) // false prevents triggering onUpdate
        }
    }, [editor, value]) // Rerun when editor is ready or external value changes

    // Mimic MUI TextField Label styles (from EditDialog's textFieldOutlinedStyle)
    const muiInputLabelStyle: SxProps<Theme> = {
        color: readerMode ? '#666' : 'rgba(255, 255, 255, 0.7)',
        borderRadius: '4px',
        bgcolor: readerMode ? theme.palette.background.paper : 'rgba(10, 15, 30, 0.95)',
        p: 0.5,
        py: 0.25,
        fontSize: '16px',
        border: readerMode ? '1px solid rgba(0, 0, 0, 0.23)' : `1px solid ${colors.neons.cyan.default}`,
        '&.MuiInputLabel-shrink': {
            transform: 'translate(14px, -9px) scale(0.75)',
            bgcolor: readerMode ? theme.palette.background.paper : 'rgba(10, 15, 30, 0.95)',
            border: readerMode ? '1px solid rgba(0, 0, 0, 0.23)' : `1px solid ${colors.neons.cyan.default}`,
            padding: '1px 4px',
        },
    }

    // Styles for the Box acting as the input slot (mimicking OutlinedInput root/fieldset)
    const inputSlotStyle: SxProps<Theme> = {
        ...theme.typography.body1, // Apply base typography
        borderRadius: disabled ? undefined : theme.shape.borderRadius + 'px',
        border: disabled ? 'none' : '2px solid', // Thicker border
        // Base border colors from theme override
        borderColor: readerMode ? 'rgba(0, 0, 0, 0.23)' : colors.neons.cyan.dark,
        padding: '0px 14px', // Reduced top/bottom padding again
        marginTop: 0, // Ensure no extra margin
        color: readerMode ? '#333' : '#fff',
        bgcolor: disabled ? 'transparent' : readerMode ? 'rgb(248, 249, 250)' : 'rgba(10, 12, 20, 0.8)',
        minHeight: '40px',
        cursor: 'text',
        mx: disabled ? -2 : 0,
        transition: theme.transitions.create(['border-color', 'box-shadow'], {
            // Use theme transition
            duration: theme.transitions.duration.short,
        }),
        '&:hover': {
            // Hover border/shadow from theme override
            borderColor: readerMode ? colors.grays.gray700 : colors.neons.cyan.default,
            boxShadow: readerMode ? 'none' : `0 0 10px ${colors.neons.cyan.default}`,
        },
        // Use :focus-within to apply styles when the inner editor receives focus
        '&:focus-within': {
            // Focused border/shadow from theme override
            borderColor: readerMode ? theme.palette.primary.main : colors.neons.cyan.default,
            boxShadow: readerMode ? `0 0 0 1px ${theme.palette.primary.main}` : `0 0 15px ${colors.neons.cyan.default}`, // MUI uses 1px inner shadow for light focus
        },
    }

    // Styles specifically for TipTap content elements (markdown, etc.)
    const editorContentStyle: SxProps<Theme> = {
        outline: 'none',
        width: '100%',
        display: 'block',
        cursor: disabled ? 'pointer' : 'text',
        '.prosemirror-editor': {
            caretColor: readerMode ? '#333' : '#fff',
            fontWeight: 500,
            p: { lineHeight: '1.6m' },
            ol: { lineHeight: '1em' },
            li: { lineHeight: '1em' },
            h1: { lineHeight: '1em' },
            h2: { lineHeight: '1em' },
            h3: { lineHeight: '1em' },
            h4: { lineHeight: '1em' },
            h5: { lineHeight: '1em' },
            h6: { lineHeight: '1em' },
        },
    }

    // Simplified FormControl styles - only width and user overrides
    const formControlStyles: SxProps<Theme> = {
        width: '100%',
        // Re-add label animation on hover (matching EditDialog)
        '&:hover .MuiInputLabel-root': {
            animation: `${!readerMode ? pulseGlowCyan : pulseGlowBlue} 2s infinite`,
        },
        // Re-add label animation on focus (matching EditDialog)
        '&.Mui-focused .MuiInputLabel-root': {
            animation: `${!readerMode ? pulseGlowCyan : pulseGlowBlue} 2s infinite`,
        },
        ...sx, // Allow overriding form control styles
    }

    return (
        <FormControl fullWidth variant="outlined" sx={disabled ? {} : formControlStyles}>
            {label && (
                <InputLabel
                    id={labelId}
                    htmlFor={inputId}
                    sx={muiInputLabelStyle}
                    shrink={!!value || editor?.isFocused}
                >
                    {label}
                </InputLabel>
            )}
            <Box
                className="tiptap-input-slot"
                id={inputId}
                aria-labelledby={labelId}
                sx={inputSlotStyle}
                onClick={() => editor?.chain().focus().run()}
            >
                <Box className="prosemirror-editor-content-wrapper" sx={editorContentStyle}>
                    <EditorContent editor={editor} />
                </Box>
            </Box>
        </FormControl>
    )
}

export default TiptapEditor
