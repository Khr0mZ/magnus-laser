import { Container, Typography } from '@mui/material'
import { useDocumentTitle } from '@uidotdev/usehooks'

const FixerJobView = () => {
    useDocumentTitle(`RNG Manager - Fixer Job`)

    return (
        <Container maxWidth={'xxl'}>
            <Typography variant="h1">PROTOTYPE</Typography>
        </Container>
    )
}

export default FixerJobView
