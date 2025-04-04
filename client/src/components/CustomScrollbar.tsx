import { useTheme } from '@mui/material'
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Scrollbar from 'smooth-scrollbar'
import colors from '../utils/colors'

interface CustomScrollbarProps {
    children: React.ReactNode
    className?: string
    scrollDirection?: 'vertical' | 'horizontal'
    height?: string | number
}

// Track created instances for global refreshes
const scrollbarInstances: Set<Scrollbar> = new Set()

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
    const [needsScrolling, setNeedsScrolling] = useState(false)
    const [paddingRight, setPaddingRight] = useState(0)
    const [paddingBottom, setPaddingBottom] = useState(0)

    // Use refs to track state without causing re-renders
    const thumbSizeRef = useRef(isLight ? 16 : 8)
    const needsScrollingRef = useRef(false)
    const isHorizontal = scrollDirection === 'horizontal'

    // Update padding helper function
    const updateContainerPadding = useCallback(() => {
        if (!scrollbarRef.current) return

        const needsScrolling = needsScrollingRef.current
        const newPadding = needsScrolling ? thumbSizeRef.current : 0

        if (isHorizontal) {
            setPaddingBottom(newPadding)
            scrollbarRef.current.style.paddingBottom = `${newPadding}px`
        } else {
            setPaddingRight(newPadding)
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
            }
            
            .scrollbar-thumb-x {
                height: ${currentThumbSize}px;
                background: linear-gradient(to right, ${colors.neons.cyan.default}, ${colors.neons.pink.default});
                border-radius: 4px;
                box-shadow: 0 0 8px ${colors.neons.cyan.default}, 0 0 15px rgba(0, 255, 255, 0.4);
                min-width: 100px;
            }
        `

        // Apply styles directly to DOM elements for immediate effect
        document.querySelectorAll('.scrollbar-track-y').forEach((track) => {
            if (track instanceof HTMLElement) {
                track.style.width = `${currentThumbSize}px`
                track.style.right = '0'
                track.style.background = `linear-gradient(to bottom, ${colors.neons.purple.default}, ${colors.neons.yellow.default})`
                track.style.opacity = '1'
                track.style.display = isHorizontal ? 'none' : 'block'
            }
        })

        document.querySelectorAll('.scrollbar-thumb-y').forEach((thumb) => {
            if (thumb instanceof HTMLElement) {
                thumb.style.width = `${currentThumbSize}px`
                thumb.style.background = `linear-gradient(to bottom, ${colors.neons.cyan.default}, ${colors.neons.pink.default})`
                thumb.style.borderRadius = '4px'
                thumb.style.boxShadow = `0 0 8px ${colors.neons.cyan.default}, 0 0 15px rgba(0, 255, 255, 0.4)`
                thumb.style.minHeight = '100px'
            }
        })

        document.querySelectorAll('.scrollbar-track-x').forEach((track) => {
            if (track instanceof HTMLElement) {
                track.style.height = `${currentThumbSize}px`
                track.style.bottom = '0'
                track.style.background = `linear-gradient(to right, ${colors.neons.purple.default}, ${colors.neons.yellow.default})`
                track.style.opacity = '1'
                track.style.display = isHorizontal ? 'block' : 'none'
            }
        })

        document.querySelectorAll('.scrollbar-thumb-x').forEach((thumb) => {
            if (thumb instanceof HTMLElement) {
                thumb.style.height = `${currentThumbSize}px`
                thumb.style.background = `linear-gradient(to right, ${colors.neons.cyan.default}, ${colors.neons.pink.default})`
                thumb.style.borderRadius = '4px'
                thumb.style.boxShadow = `0 0 8px ${colors.neons.cyan.default}, 0 0 15px rgba(0, 255, 255, 0.4)`
                thumb.style.minWidth = '100px'
            }
        })

        // Update all scrollbar instances
        scrollbarInstances.forEach((instance) => {
            if (instance && typeof instance.update === 'function') {
                instance.update()
            }
        })
    }, [isHorizontal])

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

        // Update local refs and state
        needsScrollingRef.current = needsScroll
        if (needsScroll !== needsScrolling) {
            setNeedsScrolling(needsScroll)
        }

        // Update padding immediately
        updateContainerPadding()

        return needsScroll
    }, [needsScrolling, updateContainerPadding, isHorizontal])

    // Update theme-dependent values and styles
    useEffect(() => {
        // Update thumb size based on theme
        thumbSizeRef.current = isLight ? 16 : 8

        // Force immediate container padding update since theme changed
        updateContainerPadding()

        // Apply all styles
        applyScrollbarStyles()

        if (scrollbarInstance) {
            scrollbarInstance.update()

            // Apply updates after delays to ensure everything takes effect
            setTimeout(() => {
                updateContainerPadding()
                applyScrollbarStyles()
                scrollbarInstance.update()
            }, 50)

            setTimeout(() => {
                updateContainerPadding()
                applyScrollbarStyles()
                scrollbarInstance.update()
            }, 200)
        }
    }, [isLight, applyScrollbarStyles, scrollbarInstance, updateContainerPadding])

    // Initialize scrollbar
    useEffect(() => {
        if (typeof window === 'undefined' || !scrollbarRef.current) return

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

            // Setup resize observer
            const resizeObserver = new ResizeObserver(() => {
                checkIfScrollingNeeded()
                applyScrollbarStyles()
                scrollbar.update()
            })

            // Apply initial styles after short delay
            setTimeout(() => {
                checkIfScrollingNeeded()
                applyScrollbarStyles()
                scrollbar.update()
            }, 50)

            // Observe container and content
            if (scrollbarRef.current) {
                resizeObserver.observe(scrollbarRef.current)
                const content = scrollbarRef.current.querySelector('.scroll-content')
                if (content) {
                    resizeObserver.observe(content)
                }
            }

            // Cleanup
            return () => {
                scrollbarInstances.delete(scrollbar)
                resizeObserver.disconnect()
                scrollbar.destroy()
            }
        } catch (error) {
            console.error('Error initializing smooth-scrollbar:', error)
        }
    }, [applyScrollbarStyles, checkIfScrollingNeeded])

    // Update on children/route/page change
    useEffect(() => {
        if (!scrollbarInstance) return

        const updateTimer = setTimeout(() => {
            checkIfScrollingNeeded()
            applyScrollbarStyles()
            scrollbarInstance.update()

            setTimeout(() => {
                checkIfScrollingNeeded()
                applyScrollbarStyles()
                scrollbarInstance.update()
            }, 300)
        }, 100)

        return () => clearTimeout(updateTimer)
    }, [children, scrollbarInstance, applyScrollbarStyles, checkIfScrollingNeeded])

    // Force update on mount and whenever component updates
    useLayoutEffect(() => {
        if (scrollbarInstance) {
            updateContainerPadding()
            applyScrollbarStyles()
            scrollbarInstance.update()
        }
    }, [scrollbarInstance, applyScrollbarStyles, updateContainerPadding])

    // Monitor DOM changes
    useEffect(() => {
        if (!scrollbarRef.current || !scrollbarInstance) return

        const contentElement = scrollbarRef.current.querySelector('.scroll-content')
        if (!contentElement) return

        const observer = new MutationObserver(() => {
            setTimeout(() => {
                checkIfScrollingNeeded()
                updateContainerPadding()
                applyScrollbarStyles()
                scrollbarInstance.update()
            }, 50)
        })

        observer.observe(contentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true,
        })

        return () => observer.disconnect()
    }, [scrollbarInstance, applyScrollbarStyles, checkIfScrollingNeeded, updateContainerPadding])

    return (
        <div
            ref={scrollbarRef}
            className={`smooth-scrollbar-container ${className || ''}`}
            style={{
                width: '100%',
                height: height || (isHorizontal ? 'auto' : 'calc(100vh - 92px)'),
                overflow: 'hidden',
                position: 'relative',
                paddingRight: isHorizontal ? 0 : paddingRight,
                paddingBottom: isHorizontal ? paddingBottom : 0,
            }}
        >
            <div className="scroll-content">{children}</div>
        </div>
    )
}

export default CustomScrollbar
