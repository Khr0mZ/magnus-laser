import React, { useCallback, useEffect, useState } from 'react'
import CustomScrollbar2 from '../CustomScrollbar2'

interface VirtualizedListProps {
    height: number
    itemCount: number
    itemSize: number
    width: string | number
    renderItem: ({ index, style }: { index: number; style: React.CSSProperties }) => React.ReactNode
    className?: string
    style?: React.CSSProperties
}

const VirtualizedList: React.FC<VirtualizedListProps> = ({
    height,
    itemCount,
    itemSize,
    width,
    renderItem,
    className,
    style,
}) => {
    if (itemCount <= 20) {
        return (
            <SimpleList
                height={height}
                itemCount={itemCount}
                itemSize={itemSize}
                width={width}
                renderItem={renderItem}
                className={className}
                style={style}
            />
        )
    }
    return (
        <VirtualizedListImpl
            height={height}
            itemCount={itemCount}
            itemSize={itemSize}
            width={width}
            renderItem={renderItem}
            className={className}
            style={style}
        />
    )
}

const SimpleList: React.FC<VirtualizedListProps> = ({ height, itemCount, itemSize, renderItem, className }) => {
    const allItems: Array<{ index: number; style: React.CSSProperties }> = []
    for (let i = 0; i < itemCount; i++) {
        allItems.push({
            index: i,
            style: {
                position: 'absolute',
                top: i * itemSize,
                left: 0,
                width: '100%',
                height: itemSize,
            },
        })
    }
    const innerStyle: React.CSSProperties = {
        position: 'relative',
        width: '100%',
        height: itemCount * itemSize,
    }
    const content = (
        <div style={innerStyle}>
            {allItems.map((item) => (
                <div key={item.index}>{renderItem(item)}</div>
            ))}
        </div>
    )
    return (
        <CustomScrollbar2 height={height} className={className}>
            {content}
        </CustomScrollbar2>
    )
}

const VirtualizedListImpl: React.FC<VirtualizedListProps> = ({
    height,
    itemCount,
    itemSize,
    renderItem,
    className,
}) => {
    const [visibleIndices, setVisibleIndices] = useState<number[]>([])

    const calculateVisibleIndices = useCallback(
        (scrollPos: number) => {
            const visibleCount = Math.ceil(height / itemSize) + 2
            const start = Math.max(0, Math.floor(scrollPos / itemSize) - 1)
            const end = Math.min(itemCount - 1, start + visibleCount + 1)
            const indices: number[] = []
            for (let i = start; i <= end; i++) indices.push(i)
            return indices
        },
        [height, itemCount, itemSize]
    )

    useEffect(() => {
        setVisibleIndices(calculateVisibleIndices(0))
    }, [calculateVisibleIndices])

    const content = (indices: number[]) => {
        const innerStyle: React.CSSProperties = {
            position: 'relative',
            width: '100%',
            height: itemCount * itemSize,
        }
        return (
            <div style={innerStyle}>
                {indices.map((index) => (
                    <div key={index}>
                        {renderItem({
                            index,
                            style: {
                                position: 'absolute',
                                top: index * itemSize,
                                left: 0,
                                width: '100%',
                                height: itemSize,
                            },
                        })}
                    </div>
                ))}
            </div>
        )
    }

    return (
        <CustomScrollbar2
            height={height}
            className={className}
            onScroll={(scrollTop: number) => {
                setVisibleIndices(calculateVisibleIndices(scrollTop))
            }}
        >
            {content(visibleIndices)}
        </CustomScrollbar2>
    )
}

export default VirtualizedList
