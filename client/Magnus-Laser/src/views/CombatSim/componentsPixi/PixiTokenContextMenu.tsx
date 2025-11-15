import { t } from 'i18next'
import { Viewport } from 'pixi-viewport'
import { MenuItem, PixiContextMenu } from './PixiContextMenu'

export interface PixiTokenContextMenuProps {
    x: number // World X coordinate
    y: number // World Y coordinate
    viewport: Viewport
    tokenId: string | null
    onDelete: (id: string) => void
    onDuplicate: (id: string) => void
    onCopy: (id: string) => void
    onCut: (id: string) => void
    onClose: () => void
}

/**
 * PixiJS Token Context Menu
 */
export class PixiTokenContextMenu extends PixiContextMenu {
    constructor(props: PixiTokenContextMenuProps) {
        const items: MenuItem[] = [
            {
                label: t('combatSim.tokenContextMenu.duplicate'),
                icon: '📋',
                onClick: () => {
                    if (props.tokenId) {
                        props.onDuplicate(props.tokenId)
                        props.onClose()
                    }
                },
            },
            {
                label: t('combatSim.tokenContextMenu.copy'),
                icon: '📄',
                onClick: () => {
                    if (props.tokenId) {
                        props.onCopy(props.tokenId)
                        props.onClose()
                    }
                },
            },
            {
                label: t('combatSim.tokenContextMenu.cut'),
                icon: '✂️',
                onClick: () => {
                    if (props.tokenId) {
                        props.onCut(props.tokenId)
                        props.onClose()
                    }
                },
            },
            {
                isDivider: true,
                label: '',
                onClick: () => {},
            },
            {
                label: t('combatSim.tokenContextMenu.delete'),
                icon: '🗑️',
                color: 0xff6b6b, // #ff6b6b
                onClick: () => {
                    if (props.tokenId) {
                        props.onDelete(props.tokenId)
                        props.onClose()
                    }
                },
            },
        ]

        super({
            x: props.x,
            y: props.y,
            zoom: props.viewport.scale.x,
            viewport: props.viewport,
            items,
            onClose: props.onClose,
        })
    }
}
