import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'

function StartPage() {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Reading Tracker
        </Typography>
        <Typography variant="h6" component="p" color="text.secondary">
          Keep track of what you're reading, what's next, and how much you've read.
        </Typography>
      </Container>
    </Box>
  )
}

export default StartPage
