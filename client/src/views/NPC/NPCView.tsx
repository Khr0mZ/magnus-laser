import { Container, Typography } from '@mui/material'
import { useDocumentTitle } from '@uidotdev/usehooks'

const NPCView = () => {
    useDocumentTitle(`Magnus Laser - NPC`)

    return (
        <Container maxWidth={'xxl'}>
            <Typography variant="h1">PROTOTYPE</Typography>
        </Container>
    )
}

export default NPCView
