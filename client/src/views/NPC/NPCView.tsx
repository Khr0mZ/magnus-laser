import { Container, Typography } from '@mui/material'
import { useDocumentTitle } from '@uidotdev/usehooks'

const NPCView = () => {
    useDocumentTitle(`RNG Manager - NPC`)

    return (
        <Container maxWidth={'xxl'}>
            <Typography variant="h1">PROTOTYPE</Typography>
        </Container>
    )
}

export default NPCView
