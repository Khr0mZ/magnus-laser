import { Container, Typography } from '@mui/material'
import { useDocumentTitle } from '@uidotdev/usehooks'

const CorporationView = () => {
    useDocumentTitle(`Magnus Laser - Corporation`)

    return (
        <Container maxWidth={'xxl'}>
            <Typography variant="h1">PROTOTYPE</Typography>
        </Container>
    )
}

export default CorporationView
