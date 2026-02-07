import React, { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Typography,
  Grid,
  Alert,
  Chip,
  Snackbar,
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import PrintIcon from '@mui/icons-material/Print';
import { supabase } from '../config/supabase';
import { format } from 'date-fns';

const CustomerManagement = ({ onSelectCustomer }) => {
  const [customers, setCustomers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching customers:', error);
        showSnackbar('Error loading customers', 'error');
      } else {
        // Add SN numbers to customers
        const customersWithSN = (data || []).map((customer, index) => ({
          ...customer,
          sn: index + 1
        }));
        setCustomers(customersWithSN);
      }
    } catch (error) {
      console.error('Error:', error);
      showSnackbar('Error loading customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newCustomer.name || !newCustomer.name.trim()) {
      setError('Customer name is required');
      return;
    }

    // Phone is optional, but if provided, validate format
    const phone = newCustomer.phone?.trim();
    if (phone && !/^[\d\s\+\-\(\)]{8,15}$/.test(phone)) {
      setError('Please enter a valid phone number (8-15 digits) or leave it empty');
      return;
    }

    // Prepare data - send null for empty phone
    const customerData = {
      name: newCustomer.name.trim(),
      phone: phone || null, // Send null for empty phone
    };

    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', editingCustomer.id);
        
        if (error) throw error;
        
        fetchCustomers();
        handleCloseDialog();
        showSnackbar('Customer updated successfully!', 'success');
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([customerData]);
        
        if (error) throw error;
        
        fetchCustomers();
        handleCloseDialog();
        showSnackbar('Customer added successfully!', 'success');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      
      // Handle specific database errors
      if (error.code === '23502') {
        showSnackbar('Database error: Phone column requires a value. Please update database schema.', 'error');
      } else {
        showSnackbar('Error saving customer. Please try again.', 'error');
      }
    }
  };

  const handleDelete = async (id) => {
    // Show confirmation in snackbar
    setSnackbar({
      open: true,
      message: 'Are you sure you want to delete this customer? This will also delete all their transactions.',
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
                  .from('customers')
                  .delete()
                  .eq('id', id);
                
                if (error) throw error;
                
                fetchCustomers();
                showSnackbar('Customer deleted successfully!', 'success');
              } catch (error) {
                console.error('Error deleting customer:', error);
                showSnackbar('Error deleting customer. Please try again.', 'error');
              }
            }}
          >
            Delete
          </Button>
        </Box>
      ),
    });
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setNewCustomer({
      name: customer.name || '',
      phone: customer.phone || '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCustomer(null);
    setNewCustomer({ name: '', phone: '' });
    setError('');
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

  const filteredCustomers = customers.filter(customer => {
    if (!customer) return false;
    const nameMatch = customer.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const phoneMatch = customer.phone?.includes(searchTerm);
    const snMatch = customer.sn?.toString().includes(searchTerm);
    return nameMatch || phoneMatch || snMatch;
  });

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Typography variant="h5" gutterBottom>
            Customers
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage your scrap customers. Phone number is optional.
          </Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Search by SN, name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />,
              }}
              size="small"
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  borderRadius: 2 
                } 
              }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
              sx={{ borderRadius: 2 }}
            >
              Add
            </Button>
          </Box>
        </Grid>
      </Grid>

      {loading ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography color="textSecondary">Loading customers...</Typography>
        </Paper>
      ) : (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.50' }}>
                  <TableCell sx={{ fontWeight: 600, width: '80px' }}>SN</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Customer Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Joined Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '140px' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                          {customers.length === 0 ? '📋 No Customers Yet' : '🔍 No Results Found'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {customers.length === 0 
                            ? 'Add your first customer to get started!' 
                            : 'Try adjusting your search terms'}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow 
                      key={customer.id}
                      hover
                      sx={{ 
                        cursor: 'pointer', 
                        '&:hover': { backgroundColor: 'action.hover' },
                        '&:last-child td': { borderBottom: 0 },
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => onSelectCustomer(customer)}
                    >
                      <TableCell>
                        <Chip 
                          label={customer.sn}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ 
                            fontWeight: 600,
                            borderRadius: 1,
                            borderWidth: 2
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {customer.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            ID: {customer.id?.slice(0, 8)}...
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {customer.phone ? (
                          <Typography variant="body2">
                            {customer.phone}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="textSecondary" fontStyle="italic">
                            No phone
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.created_at ? (
                          <Box>
                            <Typography variant="body2">
                              {format(new Date(customer.created_at), 'dd MMM yyyy')}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {format(new Date(customer.created_at), 'hh:mm a')}
                            </Typography>
                          </Box>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(customer);
                            }}
                            size="small"
                            title="Edit customer"
                            sx={{ 
                              border: '1px solid',
                              borderColor: 'primary.main',
                              '&:hover': { 
                                backgroundColor: 'primary.light' 
                              }
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(customer.id);
                            }}
                            size="small"
                            title="Delete customer"
                            sx={{ 
                              border: '1px solid',
                              borderColor: 'error.main',
                              '&:hover': { 
                                backgroundColor: 'error.light' 
                              }
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                          <IconButton
                            color="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCustomer(customer);
                            }}
                            size="small"
                            title="Open customer sheet"
                            sx={{ 
                              border: '1px solid',
                              borderColor: 'secondary.main',
                              '&:hover': { 
                                backgroundColor: 'secondary.light' 
                              }
                            }}
                          >
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth 
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {editingCustomer ? `Editing: ${editingCustomer.name}` : 'Add a new scrap customer'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2, 
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  alignItems: 'center'
                }
              }}
            >
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Customer Name *"
            fullWidth
            value={newCustomer.name}
            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
            required
            sx={{ mb: 2 }}
            helperText="Enter the customer's full name"
            InputProps={{ 
              sx: { borderRadius: 2 },
              endAdornment: (
                <Typography variant="caption" color="textSecondary">
                  Required
                </Typography>
              )
            }}
          />
          <TextField
            margin="dense"
            label="Phone Number (Optional)"
            fullWidth
            value={newCustomer.phone}
            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
            helperText="Enter phone number if available. Leave empty if no phone."
            placeholder="e.g., 08012345678"
            InputProps={{ 
              sx: { borderRadius: 2 },
              endAdornment: (
                <Typography variant="caption" color="textSecondary">
                  Optional
                </Typography>
              )
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              px: 3,
              py: 1
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none', 
              fontWeight: 600,
              px: 3,
              py: 1
            }}
          >
            {editingCustomer ? 'Update Customer' : 'Add Customer'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default CustomerManagement;