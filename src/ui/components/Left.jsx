import { useState, useEffect } from 'react';
import {
    Button,
    Paper,
    Box,
    Typography,
    Container,
    Snackbar,
    Alert
  } from '@mui/material';
import { styled } from '@mui/material/styles';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
 
const StyledButton = styled(Button)(({ theme, isconnected }) => ({
  width: 200,
  height: 200,
  borderRadius: '50%',
  fontSize: '1.5rem',
  backgroundColor: isconnected === 'true' ? theme.palette.success.main : theme.palette.error.main,
  '&:hover': {
    backgroundColor: isconnected === 'true' ? theme.palette.success.dark : theme.palette.error.dark,
  },
}));

export default function LayoutLeftSection() {
    const [isConnected, setIsConnected] = useState(false);
    const [snackbar, setSnackbar] = useState({
      open: false,
      message: '',
      severity: '',
      key: Date.now()
    })

    const handleCloseSnackbar = () => {
      setSnackbar(prevState => ({
        ...prevState,
        open: false,
      }));
    };
  
    const showSnackbar = (message, severity) => {
      setSnackbar({ open: true, message, severity, key: Date.now()});
    };

   async function startProxy() {
      try {
        await window.electronAPI.checkOutbounds(false);
        await window.electronAPI.startProxy();
        window.electronAPI.startXray();
        setIsConnected(true)
      } catch (error) {
        showSnackbar(error.message, "error")
      } 

  }

  async function stopProxy() {
      try {
        await window.electronAPI.stopProxy();
        window.electronAPI.stopXray();
        setIsConnected(false)
      } catch (error) {
        showSnackbar(error.message, "error")
      }    
    }

    function toggleConnection() {
      if (isConnected) {
        stopProxy();
      } else {
        startProxy()
      }
    }

    useEffect(() => {
      window.electronCallbackFunctions.onXrayOutput(() => {
        showSnackbar("Connected Successfully", 'success');
      })
      window.electronCallbackFunctions.onXrayOutputError((error) => {
        showSnackbar(`Xray Error: ${error}`, 'error');
        window.electronAPI.stopProxy();
        setIsConnected(false);
      })
      window.electronCallbackFunctions.onXrayError((error) => {
        showSnackbar(`Xray Error: ${error}`, 'error');
        window.electronAPI.stopProxy();
        setIsConnected(false);
      })
      window.electronCallbackFunctions.onXrayNotFound((error) => {
        showSnackbar(`Xray Not Found: ${error}`, 'error');
        window.electronAPI.stopProxy();
        setIsConnected(false);
      })
      window.electronCallbackFunctions.onXrayExit((code) => {
        if (code) {
          showSnackbar(`Exited with code: ${code}`, 'error');
          setIsConnected(false);
        } else {
          showSnackbar('Connection Terminated', 'info');
        }
        window.electronAPI.stopProxy();
      })

    }, []);

    return (
      <>
        <Box sx={{ width: '25%', m: 3, display: 'flex', justifyContent: 'center'}}>
          <Container component={Paper} sx={{ height: 850, p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
          <StyledButton
              onClick={() => {
                toggleConnection();
                showSnackbar('Connnected Successfully')
              }}
              isconnected={isConnected.toString()}
              variant="contained"
              id='proxy-connection'
          >
              <PowerSettingsNewIcon sx={{ fontSize: 64 }} />
          </StyledButton>
          <Typography variant="h5" sx={{ mt: 2 }}>
              {isConnected ? 'Connected' : 'Disconnected'}
          </Typography>
          <Typography variant="h5" sx={{ mt: 2 }}>
          </Typography>
          </Container>
        </Box>
        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </>
    )
} 