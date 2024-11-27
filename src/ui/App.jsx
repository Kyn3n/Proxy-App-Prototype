import { Container } from '@mui/material';
import LayoutRightSection from './components/Right';
import LayoutLeftSection from './components/Left';
export default function App() {

  return (
      <Container maxWidth={false} disableGutters sx={{ height: '900px', width: '1750px', display: 'flex'}}>
        <LayoutLeftSection />
        <LayoutRightSection />
      </Container>
  )
}