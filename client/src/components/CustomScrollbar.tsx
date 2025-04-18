import { useTheme } from '@mui/material'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import Scrollbar from 'smooth-scrollbar'
import colors from '../utils/colors'

interface CustomScrollbarProps {
    children: React.ReactNode
    className?: string
    scrollDirection?: 'vertical' | 'horizontal'
    height?: string | number
}

// Track created instances for global refreshes - make this a weak set to allow garbage collection
const scrollbarInstances = new WeakSet<Scrollbar>()

const CustomScrollbar: React.FC<CustomScrollbarProps> = ({
    children,
    className,
    scrollDirection = 'vertical',
    height,
}) => {
    const theme = useTheme()
    const isLight = theme.palette.mode === 'light'
    const scrollbarRef = useRef<HTMLDivElement>(null)
    const [scrollbarInstance, setScrollbarInstance] = useState<Scrollbar | null>(null)

    // Use refs instead of state for values that shouldn't trigger re-renders
    const needsScrollingRef = useRef(false)
    const paddingRightRef = useRef(0)
    const paddingBottomRef = useRef(0)
    const thumbSizeRef = useRef(isLight ? 16 : 8)

    // Store references to observers and timers for cleanup
    const resizeObserverRef = useRef<ResizeObserver | null>(null)
    const mutationObserverRef = useRef<MutationObserver | null>(null)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const updatePendingRef = useRef(false)

    const isHorizontal = scrollDirection === 'horizontal'

    // Check if content requires scrolling
    const checkIfScrollingNeeded = useCallback(() => {
        if (!scrollbarRef.current) return false

        const container = scrollbarRef.current
        const content = container.querySelector('.scroll-content') as HTMLElement

        if (!content) return false

        const contentHeight = content.scrollHeight
        const contentWidth = content.scrollWidth
        const containerHeight = container.clientHeight
        const containerWidth = container.clientWidth

        const needsScroll = isHorizontal ? contentWidth > containerWidth : contentHeight > containerHeight

        // Update ref only
        needsScrollingRef.current = needsScroll

        return needsScroll
    }, [isHorizontal])

    // Update padding helper function - now only updates DOM directly without state
    const updateContainerPadding = useCallback(() => {
        if (!scrollbarRef.current) return

        const needsScrolling = needsScrollingRef.current
        const newPadding = needsScrolling ? thumbSizeRef.current : 0

        if (isHorizontal) {
            paddingBottomRef.current = newPadding
            scrollbarRef.current.style.paddingBottom = `${newPadding}px`
        } else {
            paddingRightRef.current = newPadding
            scrollbarRef.current.style.paddingRight = `${newPadding}px`
        }
    }, [isHorizontal])

    // Function to apply scrollbar styles
    const applyScrollbarStyles = useCallback(() => {
        const currentThumbSize = thumbSizeRef.current

        // Get or create style element
        let styleElement = document.getElementById('scrollbar-styles')
        if (!styleElement) {
            styleElement = document.createElement('style')
            styleElement.id = 'scrollbar-styles'
            document.head.appendChild(styleElement)
        }

        // Set CSS styles with template literals
        styleElement.textContent = `
            .scrollbar-track-y {
                right: 0;
                width: ${currentThumbSize}px;
                opacity: 1;
                background: linear-gradient(to bottom, ${colors.neons.purple.default}, ${colors.neons.yellow.default});
                display: ${isHorizontal ? 'none' : 'block'};
            }
            
            .scrollbar-thumb-y {
                width: ${currentThumbSize}px;
                background: linear-gradient(to bottom, ${colors.neons.cyan.default}, ${colors.neons.pink.default});
                border-radius: 4px;
                box-shadow: 0 0 8px ${colors.neons.cyan.default}, 0 0 15px rgba(0, 255, 255, 0.4);
                min-height: 100px;
            }
            
            .scrollbar-track-x {
                bottom: 0;
                height: ${currentThumbSize}px;
                opacity: 1;
                background: linear-gradient(to right, ${colors.neons.purple.default}, ${colors.neons.yellow.default});
                display: ${isHorizontal ? 'block' : 'none'};
            }
            
            .scrollbar-thumb-x {
                height: ${currentThumbSize}px;
                background: linear-gradient(to right, ${colors.neons.cyan.default}, ${colors.neons.pink.default});
                border-radius: 4px;
                box-shadow: 0 0 8px ${colors.neons.cyan.default}, 0 0 15px rgba(0, 255, 255, 0.4);
                min-width: 100px;
            }
        `
    }, [isHorizontal])

    // Unified update function to prevent multiple overlapping updates
    const updateScrollbar = useCallback(() => {
        // Don't schedule another update if one is already pending
        if (updatePendingRef.current) return

        updatePendingRef.current = true

        // Use requestAnimationFrame instead of setTimeout for smoother updates
        requestAnimationFrame(() => {
            if (!scrollbarInstance) {
                updatePendingRef.current = false
                return
            }

            checkIfScrollingNeeded()
            updateContainerPadding()
            applyScrollbarStyles()

            try {
                scrollbarInstance.update()
            } catch (error) {
                console.error('Error updating scrollbar:', error)
            }

            updatePendingRef.current = false
        })
    }, [scrollbarInstance, checkIfScrollingNeeded, updateContainerPadding, applyScrollbarStyles])

    // Cleanup function to ensure all resources are released
    const cleanupResources = useCallback(() => {
        // Clear any pending timers
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }

        // Disconnect observers
        if (resizeObserverRef.current) {
            resizeObserverRef.current.disconnect()
            resizeObserverRef.current = null
        }

        if (mutationObserverRef.current) {
            mutationObserverRef.current.disconnect()
            mutationObserverRef.current = null
        }
    }, [])

    // Update theme-dependent values
    useEffect(() => {
        // Update thumb size based on theme
        thumbSizeRef.current = isLight ? 16 : 8

        // Only update if scrollbar is already initialized
        if (scrollbarInstance) {
            updateScrollbar()
        }
    }, [isLight, scrollbarInstance, updateScrollbar])

    // Initialize scrollbar - only runs once when component mounts and when required refs are available
    useEffect(() => {
        if (typeof window === 'undefined' || !scrollbarRef.current || scrollbarInstance) return

        try {
            const options = {
                damping: 0.1,
                thumbMinSize: 100,
                renderByPixels: true,
                alwaysShowTracks: true,
                continuousScrolling: true,
            }

            // Create scrollbar instance
            const scrollbar = Scrollbar.init(scrollbarRef.current, options)
            setScrollbarInstance(scrollbar)
            scrollbarInstances.add(scrollbar)

            // Apply initial styles and update
            applyScrollbarStyles()
            checkIfScrollingNeeded()
            updateContainerPadding()
        } catch (error) {
            console.error('Error initializing smooth-scrollbar:', error)
        }
    }, [applyScrollbarStyles, checkIfScrollingNeeded, updateContainerPadding, scrollbarInstance])

    // Set up observers after scrollbar is initialized
    useEffect(() => {
        if (!scrollbarRef.current || !scrollbarInstance) return

        // Clean up previous observers
        cleanupResources()

        // Setup resize observer
        const resizeObserver = new ResizeObserver(() => {
            updateScrollbar()
        })
        resizeObserverRef.current = resizeObserver

        // Observe container and content
        resizeObserver.observe(scrollbarRef.current)
        const content = scrollbarRef.current.querySelector('.scroll-content')
        if (content) {
            resizeObserver.observe(content)
        }

        // Setup mutation observer for content changes
        const contentElement = scrollbarRef.current.querySelector('.scroll-content')
        if (contentElement) {
            const observer = new MutationObserver(() => {
                updateScrollbar()
            })

            mutationObserverRef.current = observer

            observer.observe(contentElement, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true,
            })
        }

        // Initial update
        updateScrollbar()

        return cleanupResources
    }, [scrollbarInstance, updateScrollbar, cleanupResources])

    // Update when children change
    useEffect(() => {
        if (!scrollbarInstance) return

        // Use RAF to batch updates and avoid calling too frequently
        if (!updatePendingRef.current) {
            updateScrollbar()
        }
    }, [children, scrollbarInstance, updateScrollbar])

    // Final cleanup when component unmounts
    useEffect(() => {
        return () => {
            cleanupResources()
            if (scrollbarInstance) {
                scrollbarInstance.destroy()
            }
        }
    }, [cleanupResources, scrollbarInstance])

    return (
        <div
            ref={scrollbarRef}
            className={`smooth-scrollbar-container ${className || ''}`}
            style={{
                width: '100%',
                height: height || (isHorizontal ? 'auto' : 'calc(100vh - 92px)'),
                overflow: 'hidden',
                position: 'relative',
                paddingRight: isHorizontal ? 0 : paddingRightRef.current,
                paddingBottom: isHorizontal ? paddingBottomRef.current : 0,
            }}
        >
            <div className="scroll-content">{children}</div>
        </div>
    )
}

export default CustomScrollbar
