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
import { supabase } from '../config/supabase';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    serial_number: '',
    name: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Snackbar states for notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success', // 'success', 'error', 'warning', 'info'
  });

 useEffect(() => {
  fetchProducts();
}, [fetchProducts]); // Add fetchProducts here

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching products:', error);
        showSnackbar('Error loading products', 'error');
      } else {
        setProducts(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      showSnackbar('Error loading products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateSerialNumber = () => {
    return `TZ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleSubmit = async () => {
    if (!newProduct.name) {
      setError('Product name is required');
      return;
    }

    try {
      const productData = {
        name: newProduct.name.trim(),
        description: newProduct.description?.trim() || '',
      };

      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        
        if (error) throw error;
        
        fetchProducts();
        handleCloseDialog();
        showSnackbar('Product updated successfully!', 'success');
      } else {
        // Add new product
        productData.serial_number = generateSerialNumber();
        
        const { error } = await supabase
          .from('products')
          .insert([productData]);
        
        if (error) throw error;
        
        fetchProducts();
        handleCloseDialog();
        showSnackbar('Product added successfully!', 'success');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      showSnackbar('Error saving product. Please try again.', 'error');
    }
  };

  const handleDelete = async (id) => {
    // Show confirmation dialog
    setSnackbar({
      open: true,
      message: 'Are you sure you want to delete this product?',
      severity: 'warning',
      action: (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            color="inherit" 
            size="small" 
            onClick={() => {
              setSnackbar({ ...snackbar, open: false });
            }}
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
                  .from('products')
                  .delete()
                  .eq('id', id);
                
                if (error) throw error;
                
                fetchProducts();
                showSnackbar('Product deleted successfully!', 'success');
              } catch (error) {
                console.error('Error deleting product:', error);
                showSnackbar('Error deleting product. Please try again.', 'error');
              }
            }}
          >
            Delete
          </Button>
        </Box>
      ),
    });
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setNewProduct({
      serial_number: product.serial_number || '',
      name: product.name || '',
      description: product.description || '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
    setNewProduct({ serial_number: '', name: '', description: '' });
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
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Typography variant="h5" gutterBottom>
            Scrap Products
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Add and manage scrap products. These products will appear in customer sheets for selection.
          </Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Search products by name, serial, or description..."
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
          <Typography color="textSecondary">Loading products...</Typography>
        </Paper>
      ) : (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'secondary.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Serial No.</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Product Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '120px' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                          {products.length === 0 ? '📦 No Products Yet' : '🔍 No Results Found'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {products.length === 0 
                            ? 'Add your first scrap product to get started!' 
                            : 'Try adjusting your search terms'}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow 
                      key={product.id} 
                      hover
                      sx={{ 
                        '&:hover': { backgroundColor: 'action.hover' },
                        '&:last-child td': { borderBottom: 0 }
                      }}
                    >
                      <TableCell>
                        {product.serial_number ? (
                          <Chip 
                            label={product.serial_number} 
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ 
                              fontWeight: 500,
                              borderRadius: 1,
                              borderWidth: 2
                            }}
                          />
                        ) : (
                          <Typography variant="body2" color="textSecondary">N/A</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {product.name || 'Unnamed Product'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {product.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            color="primary"
                            onClick={() => handleEdit(product)}
                            size="small"
                            title="Edit product"
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
                            onClick={() => handleDelete(product.id)}
                            size="small"
                            title="Delete product"
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
            {editingProduct ? 'Edit Product' : 'Add New Scrap Product'}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {editingProduct ? `Editing: ${editingProduct.name}` : 'Add a new scrap product'}
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
            label="Product Name *"
            fullWidth
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            required
            sx={{ mb: 2 }}
            helperText="Enter the name of the scrap product"
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
            label="Description (Optional)"
            fullWidth
            multiline
            rows={3}
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            helperText="Optional description of the scrap product"
            InputProps={{ 
              sx: { borderRadius: 2 },
              endAdornment: (
                <Typography variant="caption" color="textSecondary">
                  Optional
                </Typography>
              )
            }}
          />
          {editingProduct && (
            <TextField
              margin="dense"
              label="Serial Number"
              fullWidth
              value={newProduct.serial_number}
              disabled
              sx={{ mt: 2 }}
              helperText="Auto-generated serial number"
              InputProps={{ sx: { borderRadius: 2 } }}
            />
          )}
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
            {editingProduct ? 'Update Product' : 'Add Product'}
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

export default ProductManagement;