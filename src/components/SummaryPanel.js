import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Divider,
  Chip,
  Alert,
} from '@mui/material';
import { format } from 'date-fns';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const SummaryPanel = ({ transactions, totalAmount, totalItems }) => {
  const getTotalItemsFormatted = () => {
    const total = totalItems.toFixed(2);
    return total.endsWith('.00') ? parseInt(total) : total;
  };

  return (
    <Paper sx={{ 
      p: 3, 
      borderRadius: 2,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      height: '100%'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TrendingUpIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" fontWeight={600}>
          Summary Dashboard
        </Typography>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Stats Cards */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <InventoryIcon sx={{ mr: 2, color: 'secondary.main' }} />
          <Box>
            <Typography variant="body2" color="textSecondary">
              Total Transactions
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {transactions.length}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Box sx={{ mr: 2, color: 'success.main' }}>
            <Typography variant="h5">📦</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">
              Total Items
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {getTotalItemsFormatted()}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Total Amount Card */}
      <Box sx={{ mb: 3, p: 2.5, bgcolor: 'primary.50', borderRadius: 2, border: '1px solid', borderColor: 'primary.100' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <AttachMoneyIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="body2" color="textSecondary">
            Total Amount
          </Typography>
        </Box>
        <Typography variant="h3" fontWeight={800} color="primary.main">
          ₦{totalAmount.toFixed(2)}
        </Typography>
        <Chip 
          label="Amount due" 
          size="small" 
          sx={{ 
            mt: 1,
            fontWeight: 500,
            backgroundColor: 'primary.100',
            color: 'primary.main'
          }}
        />
      </Box>

      {/* Last Updated */}
      <Alert 
        severity="success" 
        sx={{ 
          borderRadius: 2,
          backgroundColor: 'success.light',
          color: 'success.dark',
          '& .MuiAlert-icon': {
            color: 'success.main',
          }
        }}
      >
        <Box>
          <Typography variant="body2" fontWeight={500}>
            Last Updated
          </Typography>
          <Typography variant="caption" display="block">
            {format(new Date(), 'dd MMM yyyy, hh:mm a')}
          </Typography>
        </Box>
      </Alert>
    </Paper>
  );
};

export default SummaryPanel;