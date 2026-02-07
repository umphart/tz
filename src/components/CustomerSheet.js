import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Snackbar, Alert, Button } from '@mui/material';
import { supabase } from '../config/supabase';
import CustomerSheetHeader from './CustomerSheetHeader';
import TransactionTable from './TransactionTable';
import SummaryPanel from './SummaryPanel';
import AddProductDialog from './AddProductDialog';

const CustomerSheet = ({ customer, onBack }) => {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (customer && customer.id) {
      fetchTransactions();
      fetchProducts();
    }
  }, [customer]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          products (*)
        `)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching transactions:', error);
        showSnackbar('Error loading transactions', 'error');
      } else {
        setTransactions(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      showSnackbar('Error loading transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (!error && data) {
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleAddProduct = async (transactionData) => {
    try {
      const transaction = {
        customer_id: customer.id,
        product_id: transactionData.product.id,
        quantity: transactionData.quantity,
        price: transactionData.price,
        unit: transactionData.unit,
        total_amount: transactionData.total_amount,
      };

      const { error } = await supabase
        .from('transactions')
        .insert([transaction]);

      if (error) {
        console.error('Error adding transaction:', error);
        showSnackbar('Error adding product. Please try again.', 'error');
        return;
      }

      // Refresh transactions
      await fetchTransactions();
      setOpenProductDialog(false);
      showSnackbar('Product added successfully!', 'success');
    } catch (error) {
      console.error('Error:', error);
      showSnackbar('Error adding product. Please try again.', 'error');
    }
  };

  const handleDeleteTransaction = async (id) => {
    // Show confirmation snackbar instead of browser alert
    setSnackbar({
      open: true,
      message: 'Are you sure you want to delete this transaction?',
      severity: 'warning',
      action: (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            color="inherit" 
            size="small" 
            onClick={() => setSnackbar({ ...snackbar, open: false })}
          >
            Cancel
          </Button>
          <Button 
            color="error" 
            size="small" 
            variant="contained"
            onClick={async () => {
              setSnackbar({ ...snackbar, open: false });
              try {
                const { error } = await supabase
                  .from('transactions')
                  .delete()
                  .eq('id', id);
                
                if (error) throw error;
                
                setTransactions(transactions.filter(t => t.id !== id));
                showSnackbar('Transaction deleted successfully!', 'success');
              } catch (error) {
                console.error('Error deleting transaction:', error);
                showSnackbar('Error deleting transaction. Please try again.', 'error');
              }
            }}
          >
            Delete
          </Button>
        </Box>
      ),
    });
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  const handlePrint = () => {
    if (transactions.length === 0) {
      showSnackbar('No transactions to print. Add products first.', 'warning');
      return;
    }

    const printWindow = window.open('', '_blank');
    const totalAmount = transactions.reduce((sum, t) => sum + (parseFloat(t.total_amount) || 0), 0);
    
    printWindow.document.write(`
      <html>
        <head>
          <title>TZ Scraps Receipt - ${customer.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #333; }
            .customer-info { margin-bottom: 20px; display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .total { text-align: right; font-size: 20px; font-weight: bold; margin-top: 30px; padding-top: 20px; border-top: 2px solid #333; }
            .footer { text-align: center; margin-top: 40px; color: #666; font-size: 12px; padding-top: 20px; border-top: 1px solid #ddd; }
            .amount { font-weight: bold; color: #1976d2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin-bottom: 10px;">TZ Scraps</h1>
            <p style="color: #666; margin: 5px 0;">Scrap Collection & Recycling</p>
            <p style="color: #666; margin: 5px 0;">Contact: +234 123 456 7890</p>
          </div>
          
          <div class="customer-info">
            <div>
              <h3 style="margin-bottom: 10px;">Customer Details</h3>
              <p><strong>Name:</strong> ${customer.name}</p>
              <p><strong>Phone:</strong> ${customer.phone || 'Not provided'}</p>
            </div>
            <div style="text-align: right;">
              <h3 style="margin-bottom: 10px;">Receipt Details</h3>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
              <p><strong>Receipt No:</strong> TZ-${Date.now().toString().slice(-8)}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Serial No</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map(t => `
                <tr>
                  <td>${t.products?.name || 'N/A'}</td>
                  <td>${t.products?.serial_number || 'N/A'}</td>
                  <td>₦${parseFloat(t.price || 0).toFixed(2)}/${t.unit || 'unit'}</td>
                  <td>${t.quantity} ${t.unit || 'unit'}</td>
                  <td class="amount">₦${parseFloat(t.total_amount || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total">
            Total Amount: <span style="color: #1976d2; font-size: 24px;">₦${totalAmount.toFixed(2)}</span>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing TZ Scraps!</p>
            <p>This is a computer generated receipt. No signature required.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    showSnackbar('Receipt generated successfully!', 'success');
  };

  const totalAmount = transactions.reduce((sum, transaction) => 
    sum + (parseFloat(transaction.total_amount) || 0), 0
  );

  const totalItems = transactions.reduce((sum, transaction) => 
    sum + (parseFloat(transaction.quantity) || 0), 0
  );

  if (!customer) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="textSecondary">
          No customer selected
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <CustomerSheetHeader
        customer={customer}
        onBack={onBack}
        onPrint={handlePrint}
        onAddProduct={() => setOpenProductDialog(true)}
        transactions={transactions}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <TransactionTable
            transactions={transactions}
            onDeleteTransaction={handleDeleteTransaction}
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <SummaryPanel
            transactions={transactions}
            totalAmount={totalAmount}
            totalItems={totalItems}
          />
        </Grid>
      </Grid>

      <AddProductDialog
        open={openProductDialog}
        onClose={() => setOpenProductDialog(false)}
        products={products}
        onAddProduct={handleAddProduct}
        customer={customer}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'warning' ? null : 6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ 
            width: '100%',
            borderRadius: 2,
            alignItems: 'center',
            '& .MuiAlert-message': {
              flexGrow: 1
            }
          }}
          action={snackbar.action}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomerSheet;