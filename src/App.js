import React, { useState } from 'react';
import {
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
} from '@mui/material';
import { blue, orange } from '@mui/material/colors';
import ScrapIcon from '@mui/icons-material/Recycling';
import CustomerManagement from './components/CustomerManagement';
import ProductManagement from './components/ProductManagement';
import CustomerSheet from './components/CustomerSheet';
import Reports from './components/Reports';

const theme = createTheme({
  palette: {
    primary: blue,
    secondary: orange,
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Google Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
});

function App() {
  const [activeTab, setActiveTab] = useState('customers');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <ScrapIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              TZ Scraps Management System
            </Typography>
            <IconButton 
              color="inherit" 
              onClick={() => {
                setActiveTab('customers');
                setSelectedCustomer(null);
              }}
            >
              <Typography variant="button">Customers</Typography>
            </IconButton>
            <IconButton 
              color="inherit" 
              onClick={() => {
                setActiveTab('products');
                setSelectedCustomer(null);
              }}
            >
              <Typography variant="button">Products</Typography>
            </IconButton>
            <IconButton 
              color="inherit" 
              onClick={() => {
                setActiveTab('reports');
                setSelectedCustomer(null);
              }}
            >
              <Typography variant="button">Reports</Typography>
            </IconButton>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          {activeTab === 'customers' && !selectedCustomer && (
            <CustomerManagement onSelectCustomer={setSelectedCustomer} />
          )}
          {selectedCustomer && activeTab === 'customers' && (
            <CustomerSheet 
              customer={selectedCustomer} 
              onBack={() => setSelectedCustomer(null)}
            />
          )}
          {activeTab === 'products' && (
            <ProductManagement />
          )}
          {activeTab === 'reports' && (
            <Reports />
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;