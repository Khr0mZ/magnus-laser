import { useEffect, useRef } from 'react'

interface UseThreeCallbackRefsProps {
    panelTokenOnDuplicate: (id: string) => void
    panelTokenOnCopy: (id: string) => void
    panelTokenOnCut: (id: string) => void
    pixiOnCutAllTokens: () => void
    onBlastCopy?: (id: string) => void
    onBlastCut?: (id: string) => void
}

export const useThreeCallbackRefs = (props: UseThreeCallbackRefsProps) => {
    const panelTokenOnDuplicateRef = useRef(props.panelTokenOnDuplicate)
    const panelTokenOnCopyRef = useRef(props.panelTokenOnCopy)
    const panelTokenOnCutRef = useRef(props.panelTokenOnCut)
    const pixiOnCutAllTokensRef = useRef(props.pixiOnCutAllTokens)
    const onBlastCopyRef = useRef(props.onBlastCopy)
    const onBlastCutRef = useRef(props.onBlastCut)

    useEffect(() => {
        panelTokenOnDuplicateRef.current = props.panelTokenOnDuplicate
    }, [props.panelTokenOnDuplicate])

    useEffect(() => {
        panelTokenOnCopyRef.current = props.panelTokenOnCopy
    }, [props.panelTokenOnCopy])

    useEffect(() => {
        panelTokenOnCutRef.current = props.panelTokenOnCut
    }, [props.panelTokenOnCut])

    useEffect(() => {
        pixiOnCutAllTokensRef.current = props.pixiOnCutAllTokens
    }, [props.pixiOnCutAllTokens])

    useEffect(() => {
        onBlastCopyRef.current = props.onBlastCopy
    }, [props.onBlastCopy])

    useEffect(() => {
        onBlastCutRef.current = props.onBlastCut
    }, [props.onBlastCut])

    return {
        panelTokenOnDuplicateRef,
        panelTokenOnCopyRef,
        panelTokenOnCutRef,
        pixiOnCutAllTokensRef,
        onBlastCopyRef,
        onBlastCutRef,
    }
}
