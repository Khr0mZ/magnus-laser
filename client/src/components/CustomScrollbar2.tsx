// CustomScrollbar.tsx
import { useTheme } from '@mui/material'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import Scrollbar from 'smooth-scrollbar'
import colors from '../utils/colors'

interface CustomScrollbarProps {
    children: React.ReactNode
    className?: string
    scrollDirection?: 'vertical' | 'horizontal'
    height?: string | number
    onScroll?: (scrollTop: number) => void
}

const CustomScrollbar: React.FC<CustomScrollbarProps> = ({
    children,
    className,
    scrollDirection = 'vertical',
    height,
    onScroll,
}) => {
    const theme = useTheme()
    const isLight = theme.palette.mode === 'light'
    const scrollbarRef = useRef<HTMLDivElement>(null)
    const [scrollbarInstance, setScrollbarInstance] = useState<Scrollbar | null>(null)

    const needsScrollingRef = useRef(false)
    const paddingRightRef = useRef(0)
    const paddingBottomRef = useRef(0)
    const thumbSizeRef = useRef(isLight ? 16 : 8)
    const updatePendingRef = useRef(false)

    const isHorizontal = scrollDirection === 'horizontal'

    const checkIfScrollingNeeded = useCallback(() => {
        if (!scrollbarRef.current) return false
        const container = scrollbarRef.current
        const content = container.querySelector('.scroll-content') as HTMLElement
        if (!content) return false
        const needsScroll = isHorizontal
            ? content.scrollWidth > container.clientWidth
            : content.scrollHeight > container.clientHeight
        needsScrollingRef.current = needsScroll
        return needsScroll
    }, [isHorizontal])

    const updateContainerPadding = useCallback(() => {
        if (!scrollbarRef.current) return
        const newPadding = needsScrollingRef.current ? thumbSizeRef.current : 0
        if (isHorizontal) {
            paddingBottomRef.current = newPadding
            scrollbarRef.current.style.paddingBottom = `${newPadding}px`
        } else {
            paddingRightRef.current = newPadding
            scrollbarRef.current.style.paddingRight = `${newPadding}px`
        }
    }, [isHorizontal])

    const applyScrollbarStyles = useCallback(() => {
        const size = thumbSizeRef.current
        let styleEl = document.getElementById('scrollbar-styles')
        if (!styleEl) {
            styleEl = document.createElement('style')
            styleEl.id = 'scrollbar-styles'
            document.head.appendChild(styleEl)
        }
        styleEl.textContent = `
      .scrollbar-track-y {
        right: 0;
        width: ${size}px;
        opacity: 1;
        background: linear-gradient(to bottom, ${colors.neons.purple.default}, ${colors.neons.yellow.default});
        display: ${isHorizontal ? 'none' : 'block'};
      }
      .scrollbar-thumb-y {
        width: ${size}px;
        background: linear-gradient(to bottom, ${colors.neons.cyan.default}, ${colors.neons.pink.default});
        border-radius: 4px;
        box-shadow: 0 0 8px ${colors.neons.cyan.default}, 0 0 15px rgba(0,255,255,0.4);
        min-height: 100px;
      }
      .scrollbar-track-x {
        bottom: 0;
        height: ${size}px;
        opacity: 1;
        background: linear-gradient(to right, ${colors.neons.purple.default}, ${colors.neons.yellow.default});
        display: ${isHorizontal ? 'block' : 'none'};
      }
      .scrollbar-thumb-x {
        height: ${size}px;
        background: linear-gradient(to right, ${colors.neons.cyan.default}, ${colors.neons.pink.default});
        border-radius: 4px;
        box-shadow: 0 0 8px ${colors.neons.cyan.default}, 0 0 15px rgba(0,255,255,0.4);
        min-width: 100px;
      }
    `
    }, [isHorizontal])

    const updateScrollbar = useCallback(() => {
        if (updatePendingRef.current) return
        updatePendingRef.current = true
        requestAnimationFrame(() => {
            if (scrollbarInstance) {
                checkIfScrollingNeeded()
                updateContainerPadding()
                applyScrollbarStyles()
                try {
                    scrollbarInstance.update()
                } catch {
                    console.warn('scrollbarInstance.update() failed')
                }
            }
            updatePendingRef.current = false
        })
    }, [scrollbarInstance, checkIfScrollingNeeded, updateContainerPadding, applyScrollbarStyles])

    useEffect(() => {
        if (!scrollbarRef.current || scrollbarInstance) return
        const scrollbar = Scrollbar.init(scrollbarRef.current, {
            damping: 0.1,
            thumbMinSize: 100,
            renderByPixels: true,
            alwaysShowTracks: true,
            continuousScrolling: true,
        })
        setScrollbarInstance(scrollbar)
        applyScrollbarStyles()
        checkIfScrollingNeeded()
        updateContainerPadding()
    }, [applyScrollbarStyles, checkIfScrollingNeeded, updateContainerPadding, scrollbarInstance])

    useEffect(() => {
        if (!scrollbarInstance || !onScroll) return
        const listener = ({ offset: { y } }: { offset: { x: number; y: number } }) => {
            onScroll(y)
        }
        scrollbarInstance.addListener(listener)
        return () => {
            scrollbarInstance.removeListener(listener)
        }
    }, [scrollbarInstance, onScroll])

    useEffect(() => {
        if (scrollbarInstance) updateScrollbar()
    }, [children, scrollbarInstance, updateScrollbar])

    useEffect(() => () => scrollbarInstance?.destroy(), [scrollbarInstance])

    return (
        <div
            ref={scrollbarRef}
            className={`smooth-scrollbar-container ${className || ''}`}
            style={{
                width: '100%',
                height: height,
                overflow: 'hidden',
                position: 'relative',
                boxSizing: 'border-box',
            }}
        >
            <div style={{ paddingRight: '16px' }}>{children}</div>
        </div>
    )
}

export default CustomScrollbar
