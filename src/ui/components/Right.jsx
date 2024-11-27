import { useState, useEffect } from 'react';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Snackbar,
  Alert
} from '@mui/material';

import GetAppIcon from '@mui/icons-material/GetApp';
import AddIcon from '@mui/icons-material/Add';

export default function LayoutRightSection () {
  const [protocols, setProtocols] = useState([
    {id: 1, remarks: "Test", protocol: "Test", address: "0.0.0.0", port: "2000", transport: "tcp", tls: "none", latency: "", speed: ""}
  ]);
  const [selectedRow, setRowSelected] = useState(null);
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

  function decodeLink(link) {
    const protocol = link.split("://")[0]

    switch (protocol) {
      case "ss":
        return window.electronAPI.decodeShadowSocks(link) 
      case "vmess":
        return window.electronAPI.decodeVmess(link);
      case "trojan":
        return window.electronAPI.decodeTroless(link);
      case "vless":
       return window.electronAPI.decodeTroless(link);
      default:
        throw new Error("Invalid Link");
    }
  }
  
  function importLink() {
    window.electronAPI.readClipboard()
      .then(async (content) => {
        try {
          const decoded = await decodeLink(content)
          setProtocols((prevProtocols) => {
            // Calculate the new ID based on the length of the current array
            const newId = prevProtocols.length > 0 ? Math.max(...prevProtocols.map(p => p.id)) + 1 : 0;
            
            // Add the new outbound to the protocols array
            const newProtocol = {
              id: newId,
              remarks: decoded.ps,
              protocol: decoded.protocol,
              add: decoded.add,
              port: decoded.port,
              net: decoded.net || "-",
              tls: decoded.tls || "-",
              uuid: decoded.id,
              scy: decoded.scy,
              type: decoded.type,
              aid: decoded.aid || "-",
              v: decoded.v,
              method: decoded.method,
              latency: decoded.latency || "-",
              speed: decoded.speed || "-"
            }
            
            // Show snackbar for success import
            showSnackbar("Link Copied from Clipboard", "success")

            return [...prevProtocols, newProtocol]; // Return a new array with the new protocol added
          });
        } catch (error) {
          showSnackbar(error.message, "error")
        }
      })
      .catch((error) => {
        console.error('Error reading clipboard:', error)
      })
  }

  async function handleRowClick(config) {
    setRowSelected(config.id);

    try {
      await window.electronAPI.processConfig(config)
    } catch (error) {
      showSnackbar(error.message, "error")
    }      

  }

  useEffect(() => {
    window.electronCallbackFunctions.onUnsupportedLink((err) => {
      showSnackbar(err, 'error');
    })

  }, []);

  return (
    <>
      <Box sx={{ width: '75%', p: 3, display: 'flex', flexDirection: 'column' }}>
        <TableContainer component={Paper} sx={{ flexGrow: 1, mb: 2, maxHeight: 850, overflow: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Remarks</TableCell>
                <TableCell>Protocol</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Port</TableCell>
                <TableCell>Transport</TableCell>
                <TableCell>TLS</TableCell>
                <TableCell>Latency (ms)</TableCell>
                <TableCell>Speed (Mbps)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {protocols.map((protocol) => (
                <TableRow 
                key={protocol.id} 
                hover 
                style={{ cursor: 'pointer', backgroundColor: selectedRow === protocol.id ? 'lightblue' : 'inherit'}} 
                onClick={() => handleRowClick(protocol)}
                >
                  <TableCell>{protocol.remarks}</TableCell>
                  <TableCell>{protocol.protocol}</TableCell>
                  <TableCell>{protocol.add}</TableCell>
                  <TableCell>{protocol.port}</TableCell>
                  <TableCell>{protocol.net}</TableCell>
                  <TableCell>{protocol.tls}</TableCell>
                  <TableCell>{protocol.latency}</TableCell>
                  <TableCell>{protocol.speed}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={importLink}
            startIcon={<GetAppIcon />}>
            Import Link
          </Button>
          <Button variant="contained" startIcon={<AddIcon />}>
            Add New Configuration
          </Button>
        </Box>
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
  );
};
