// Global JSX typing for the <model-viewer> web component
type ModelViewerJSXProps = import('react').DetailedHTMLProps<
    import('react').HTMLAttributes<HTMLElement>,
    HTMLElement
> & {
    src?: string
    'camera-controls'?: boolean | ''
    'disable-zoom'?: boolean | ''
    'interaction-prompt'?: string
    autoplay?: boolean | ''
    exposure?: string
    environmentImage?: string
    poster?: string
    'shadow-intensity'?: string
    'camera-orbit'?: string
    'auto-rotate'?: boolean | ''
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': ModelViewerJSXProps
        }
    }
}

declare namespace React {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': ModelViewerJSXProps
        }
    }
}
