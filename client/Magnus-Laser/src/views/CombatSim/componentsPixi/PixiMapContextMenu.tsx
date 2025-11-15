import { t } from 'i18next'
import { Viewport } from 'pixi-viewport'
import { MenuItem, PixiContextMenu } from './PixiContextMenu'

export interface PixiMapContextMenuProps {
    x: number // World X coordinate
    y: number // World Y coordinate
    viewport: Viewport
    onDeleteAllTokens: () => void
    onDeleteAllWalls: () => void
    onDeleteAllBlasts: () => void
    onCutAllTokens: () => void
    onPasteToken: () => void
    onPasteBlast: () => void
    canPasteToken: boolean
    canPasteBlast: boolean
    onClose: () => void
}

/**
 * PixiJS Map Context Menu
 */
export class PixiMapContextMenu extends PixiContextMenu {
    constructor(props: PixiMapContextMenuProps) {
        const items: MenuItem[] = [
            {
                label: t('combatSim.mapContextMenu.pasteToken'),
                icon: '📋',
                disabled: !props.canPasteToken,
                onClick: () => {
                    props.onPasteToken()
                    props.onClose()
                },
            },
            {
                label: t('combatSim.mapContextMenu.pasteBlast'),
                icon: '📋',
                disabled: !props.canPasteBlast,
                onClick: () => {
                    props.onPasteBlast()
                    props.onClose()
                },
            },
            {
                label: t('combatSim.mapContextMenu.cutAllTokens'),
                icon: '✂️',
                color: 0xffa500, // #ffa500 (orange)
                onClick: () => {
                    props.onCutAllTokens()
                    props.onClose()
                },
            },
            {
                label: t('combatSim.mapContextMenu.deleteAllTokens'),
                icon: '🗑️',
                color: 0xff6b6b, // #ff6b6b
                onClick: () => {
                    props.onDeleteAllTokens()
                    props.onClose()
                },
            },
            {
                label: t('combatSim.mapContextMenu.deleteAllWalls'),
                icon: '🗑️',
                color: 0xff6b6b, // #ff6b6b
                onClick: () => {
                    props.onDeleteAllWalls()
                    props.onClose()
                },
            },
            {
                label: t('combatSim.mapContextMenu.deleteAllBlasts'),
                icon: '🗑️',
                color: 0xff6b6b, // #ff6b6b
                onClick: () => {
                    props.onDeleteAllBlasts()
                    props.onClose()
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
