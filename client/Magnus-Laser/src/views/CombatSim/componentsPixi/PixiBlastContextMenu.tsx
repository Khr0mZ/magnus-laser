import { t } from 'i18next'
import { Viewport } from 'pixi-viewport'
import { MenuItem, PixiContextMenu } from './PixiContextMenu'

export interface PixiBlastContextMenuProps {
    x: number // World X coordinate
    y: number // World Y coordinate
    viewport: Viewport
    blastId: string | null
    isLocked: boolean
    onDelete: (id: string) => void
    onCopy: (id: string) => void
    onCut: (id: string) => void
    onLock: (id: string, locked: boolean) => void
    onClose: () => void
}

/**
 * PixiJS Blast Context Menu
 */
export class PixiBlastContextMenu extends PixiContextMenu {
    constructor(props: PixiBlastContextMenuProps) {
        const items: MenuItem[] = [
            {
                label: props.isLocked ? t('combatSim.blastContextMenu.unlock') : t('combatSim.blastContextMenu.lock'),
                icon: props.isLocked ? '🔓' : '🔒',
                onClick: () => {
                    if (props.blastId) {
                        props.onLock(props.blastId, !props.isLocked)
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
                label: t('combatSim.blastContextMenu.copy'),
                icon: '📄',
                onClick: () => {
                    if (props.blastId) {
                        props.onCopy(props.blastId)
                        props.onClose()
                    }
                },
            },
            {
                label: t('combatSim.blastContextMenu.cut'),
                icon: '✂️',
                onClick: () => {
                    if (props.blastId) {
                        props.onCut(props.blastId)
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
                label: t('combatSim.blastContextMenu.delete'),
                icon: '🗑️',
                color: 0xff4444, // #ff4444
                onClick: () => {
                    if (props.blastId) {
                        props.onDelete(props.blastId)
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
