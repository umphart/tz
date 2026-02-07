import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';

const TransactionTable = ({ transactions, onDeleteTransaction, loading }) => {
  if (loading) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
        <Typography color="textSecondary">Loading transactions...</Typography>
      </Paper>
    );
  }

  if (transactions.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            📋 No Transactions
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Start by adding scrap items using the "Add Product" button
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.50' }}>
              <TableCell sx={{ fontWeight: 600, py: 2 }}>Date & Time</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Serial No</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Price</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Quantity</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow 
                key={transaction.id}
                hover
                sx={{ 
                  '&:hover': { 
                    backgroundColor: 'action.hover' 
                  },
                  '&:last-child td': { 
                    borderBottom: 0 
                  }
                }}
              >
                <TableCell sx={{ py: 2 }}>
                  <Typography variant="body2">
                    {transaction.created_at ? 
                      format(new Date(transaction.created_at), 'dd/MM/yy hh:mm a') : 
                      'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="medium">
                    {transaction.products?.name || 'Unknown Product'}
                  </Typography>
                  {transaction.products?.description && (
                    <Typography variant="caption" color="textSecondary" display="block">
                      {transaction.products.description.length > 30 
                        ? `${transaction.products.description.substring(0, 30)}...` 
                        : transaction.products.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {transaction.products?.serial_number ? (
                    <Chip 
                      label={transaction.products.serial_number} 
                      size="small"
                      variant="outlined"
                      sx={{ 
                        fontWeight: 500,
                        borderColor: 'primary.main',
                        color: 'primary.main'
                      }}
                    />
                  ) : (
                    <Typography variant="body2" color="textSecondary">N/A</Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="medium">
                    ₦{parseFloat(transaction.price || 0).toFixed(2)}/{transaction.unit || 'unit'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {transaction.quantity} {transaction.unit || 'unit'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body1" fontWeight="bold" color="primary.main">
                    ₦{parseFloat(transaction.total_amount || 0).toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => onDeleteTransaction(transaction.id)}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'error.light',
                      }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TransactionTable;