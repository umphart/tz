import React from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import PrintIcon from '@mui/icons-material/Print';

const CustomerSheetHeader = ({ 
  customer, 
  onBack, 
  onPrint, 
  onAddProduct,
  transactions,
  showPrintButton = true 
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <IconButton onClick={onBack} sx={{ p: 1.5, border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            {customer?.name}'s Scrap Sheet
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="textSecondary">
              <strong>Phone:</strong> {customer?.phone}
            </Typography>
            {customer?.address && (
              <Typography variant="body2" color="textSecondary">
                <strong>Address:</strong> {customer.address}
              </Typography>
            )}
            <Typography variant="body2" color="textSecondary">
              <strong>ID:</strong> {customer?.id?.slice(0, 8)}...
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {showPrintButton && transactions.length > 0 && (
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              color="secondary"
              onClick={onPrint}
              sx={{ 
                px: 3,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                '&:hover': {
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                }
              }}
            >
              Print Receipt
            </Button>
          )}
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddProduct}
            sx={{ 
              px: 3,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              '&:hover': {
                boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
              }
            }}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      {transactions.length === 0 && (
        <Alert 
          severity="info" 
          sx={{ 
            borderRadius: 2,
            backgroundColor: 'info.light',
            color: 'info.dark',
            '& .MuiAlert-icon': {
              color: 'info.main',
            }
          }}
        >
          <Typography variant="body2" fontWeight="medium">
            No scrap transactions yet. Click "Add Product" to start recording scrap items.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default CustomerSheetHeader;