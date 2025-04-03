import { useTheme } from '@mui/material'
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Scrollbar from 'smooth-scrollbar'
import colors from '../utils/colors'

interface CustomScrollbarProps {
    children: React.ReactNode
    className?: string
}

// Track created instances for global refreshes
const scrollbarInstances: Set<Scrollbar> = new Set()

const CustomScrollbar: React.FC<CustomScrollbarProps> = ({ children, className }) => {
    const theme = useTheme()
    const isLight = theme.palette.mode === 'light'
    const scrollbarRef = useRef<HTMLDivElement>(null)
    const [scrollbarInstance, setScrollbarInstance] = useState<Scrollbar | null>(null)
    const [needsScrolling, setNeedsScrolling] = useState(false)
    // We need to force re-render when theme changes to update inline styles
    const [paddingRight, setPaddingRight] = useState(0)

    // Use refs to track state without causing re-renders
    const thumbSizeRef = useRef(isLight ? 16 : 8)
    const needsScrollingRef = useRef(false)

    // Update padding helper function
    const updateContainerPadding = useCallback(() => {
        if (!scrollbarRef.current) return

        const needsScrolling = needsScrollingRef.current
        const newPadding = needsScrolling ? thumbSizeRef.current : 0

        // Update state for re-render
        setPaddingRight(newPadding)

        // Also apply directly to DOM for immediate effect
        scrollbarRef.current.style.paddingRight = `${newPadding}px`
    }, [])

    // Function to apply all scrollbar styles globally (for both track and thumb)
    const applyScrollbarStyles = useCallback(() => {
        const currentThumbSize = thumbSizeRef.current
        const styleElement = document.getElementById('scrollbar-styles')

        if (!styleElement) {
            const style = document.createElement('style')
            style.id = 'scrollbar-styles'
            document.head.appendChild(style)

            style.textContent = `
                .scrollbar-track-y {
                    right: 0 ;
                    width: ${currentThumbSize}px ;
                    opacity: 1 ;
                    background: linear-gradient(to bottom, ${colors.neons.purple.default}, ${colors.neons.yellow.default}) ;
                }
                
                .scrollbar-thumb-y {
                    width: ${currentThumbSize}px ;
                    background: linear-gradient(to bottom, ${colors.neons.cyan.default}, ${colors.neons.pink.default}) ;
                    border-radius: 4px ;
                    box-shadow: 0 0 8px ${colors.neons.cyan.default}, 0 0 15px rgba(0, 255, 255, 0.4) ;
                    min-height: 100px ;
                }
                
                .scrollbar-track-x {
                    display: none ;
                }
            `
        } else {
            styleElement.textContent = `
                .scrollbar-track-y {
                    right: 0 ;
                    width: ${currentThumbSize}px ;
                    opacity: 1 ;
                    background: linear-gradient(to bottom, ${colors.neons.purple.default}, ${colors.neons.yellow.default}) ;
                }
                
                .scrollbar-thumb-y {
                    width: ${currentThumbSize}px ;
                    background: linear-gradient(to bottom, ${colors.neons.cyan.default}, ${colors.neons.pink.default}) ;
                    border-radius: 4px ;
                    box-shadow: 0 0 8px ${colors.neons.cyan.default}, 0 0 15px rgba(0, 255, 255, 0.4) ;
                    min-height: 100px ;
                }
                
                .scrollbar-track-x {
                    display: none ;
                }
            `
        }

        // Apply direct styles to all DOM elements
        document.querySelectorAll('.scrollbar-track-y').forEach((track) => {
            if (track instanceof HTMLElement) {
                track.style.width = `${currentThumbSize}px`
                track.style.right = '0'
                track.style.background = `linear-gradient(to bottom, ${colors.neons.purple.default}, ${colors.neons.yellow.default})`
                track.style.opacity = '1'
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

        // Hide horizontal scrollbar
        document.querySelectorAll('.scrollbar-track-x').forEach((track) => {
            if (track instanceof HTMLElement) {
                track.style.display = 'none'
            }
        })

        // Update all scrollbar instances
        scrollbarInstances.forEach((instance) => {
            if (instance && typeof instance.update === 'function') {
                instance.update()
            }
        })
    }, [])

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

            // Apply another update after a short delay to ensure changes take effect
            setTimeout(() => {
                updateContainerPadding()
                applyScrollbarStyles()
                scrollbarInstance.update()
            }, 50)

            // And another update after a longer delay
            setTimeout(() => {
                updateContainerPadding()
                applyScrollbarStyles()
                scrollbarInstance.update()
            }, 200)
        }
    }, [isLight, applyScrollbarStyles, scrollbarInstance, updateContainerPadding])

    // Check if content requires scrolling
    const checkIfScrollingNeeded = useCallback(() => {
        if (!scrollbarRef.current) return false

        const container = scrollbarRef.current
        const content = container.querySelector('.scroll-content') as HTMLElement

        if (!content) return false

        const contentHeight = content.scrollHeight
        const containerHeight = container.clientHeight
        const needsScroll = contentHeight > containerHeight

        // Update local refs and state
        needsScrollingRef.current = needsScroll
        if (needsScroll !== needsScrolling) {
            setNeedsScrolling(needsScroll)
        }

        // Update padding immediately
        updateContainerPadding()

        return needsScroll
    }, [needsScrolling, updateContainerPadding])

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

    // Update on route/page change
    useEffect(() => {
        if (!scrollbarInstance) return

        // When children change (page change), update everything
        const updateTimer = setTimeout(() => {
            checkIfScrollingNeeded()
            applyScrollbarStyles()
            scrollbarInstance.update()

            // Apply a second time after a longer delay to ensure everything is set
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

    // Set up MutationObserver to detect DOM changes that might affect scrolling
    useEffect(() => {
        if (!scrollbarRef.current || !scrollbarInstance) return

        const contentElement = scrollbarRef.current.querySelector('.scroll-content')
        if (!contentElement) return

        const observer = new MutationObserver(() => {
            // When DOM changes, update everything
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
                height: 'calc(100vh - 92px)',
                overflow: 'hidden',
                position: 'relative',
                paddingRight: paddingRight,
            }}
        >
            <div className="scroll-content">{children}</div>
        </div>
    )
}

export default CustomScrollbar
