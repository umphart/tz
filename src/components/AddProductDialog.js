import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Paper,
  Typography,
  Box,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';

const AddProductDialog = ({ 
  open, 
  onClose, 
  products, 
  onAddProduct,
  customer 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [error, setError] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Filter products whenever search term or products change
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = products.filter(product => {
        if (!product) return false;
        
        // Search in name, serial number, and description
        const nameMatch = product.name?.toLowerCase().includes(searchLower);
        const serialMatch = product.serial_number?.toLowerCase().includes(searchLower);
        const descMatch = product.description?.toLowerCase().includes(searchLower);
        
        return nameMatch || serialMatch || descMatch;
      });
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const handleSubmit = () => {
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      setError('Please enter a valid price');
      return;
    }

    if (!unit) {
      setError('Please select a unit');
      return;
    }

    const transactionData = {
      product: selectedProduct,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      unit: unit,
      total_amount: parseFloat(price) * parseFloat(quantity),
    };

    onAddProduct(transactionData);
    resetForm();
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setQuantity('1');
    setPrice('');
    setUnit('kg');
    setSearchTerm('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 3,
          height: '90vh',
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Add Scrap Product
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Customer: <strong>{customer?.name}</strong> • Select product and enter transaction details
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              m: 2, 
              borderRadius: 2,
              '& .MuiAlert-icon': {
                alignItems: 'center'
              }
            }}
            action={
              <IconButton size="small" onClick={() => setError('')}>
                <ClearIcon fontSize="small" />
              </IconButton>
            }
          >
            {error}
          </Alert>
        )}

        {/* Search Bar */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            placeholder="Search products by name, serial number, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'action.active' }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton onClick={clearSearch} size="small">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
              sx: { borderRadius: 2 }
            }}
            size="medium"
            autoFocus
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography variant="caption" color="textSecondary">
              {products.length} total products • {filteredProducts.length} filtered
            </Typography>
            {searchTerm && (
              <Typography variant="caption" color="primary">
                Showing results for: "{searchTerm}"
              </Typography>
            )}
          </Box>
        </Box>

        {/* Two Column Layout */}
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Column: Product Selection */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto', 
            p: 2, 
            borderRight: 1, 
            borderColor: 'divider',
            maxHeight: 'calc(90vh - 200px)'
          }}>
            {products.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <FilterListIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="textSecondary" gutterBottom variant="h6">
                  No products available
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Add products from the Products tab first
                </Typography>
              </Box>
            ) : filteredProducts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="textSecondary" gutterBottom variant="h6">
                  No products found
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Try a different search term
                </Typography>
              </Box>
            ) : (
              <>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <FilterListIcon sx={{ mr: 1, fontSize: 20 }} />
                  Select Product ({filteredProducts.length} found)
                </Typography>
                
                <Grid container spacing={2}>
                  {filteredProducts.map((product) => (
                    <Grid item xs={12} sm={6} md={4} key={product.id}>
                      <Paper
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          border: selectedProduct?.id === product.id ? 2 : 1,
                          borderColor: selectedProduct?.id === product.id ? 'primary.main' : 'grey.300',
                          bgcolor: selectedProduct?.id === product.id ? 'primary.50' : 'white',
                          borderRadius: 2,
                          transition: 'all 0.2s',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          '&:hover': {
                            bgcolor: selectedProduct?.id === product.id ? 'primary.50' : 'grey.50',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          },
                        }}
                        onClick={() => handleProductSelect(product)}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            {product.name}
                          </Typography>
                          
                          <Chip 
                            label={product.serial_number}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ 
                              fontWeight: 500,
                              mb: 1
                            }}
                          />
                          
                          {product.description && (
                            <Typography 
                              variant="body2" 
                              color="textSecondary" 
                              sx={{ 
                                fontSize: '0.75rem',
                                mt: 1,
                                lineHeight: 1.4
                              }}
                            >
                              {product.description.length > 80 
                                ? `${product.description.substring(0, 80)}...` 
                                : product.description}
                            </Typography>
                          )}
                        </Box>
                        
                        <Box sx={{ mt: 2, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                          <Typography variant="caption" color="textSecondary">
                            Click to select
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </Box>

          {/* Right Column: Simplified Transaction Details */}
          <Box sx={{ 
            flex: 0.8, 
            p: 3, 
            bgcolor: 'grey.50',
            display: 'flex',
            flexDirection: 'column',
            minWidth: '400px'
          }}>
            {selectedProduct ? (
              <>
                {/* Simplified Selected Product Info */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Selected Product
                  </Typography>
                  <Typography variant="h5" fontWeight={600} color="primary.main">
                    {selectedProduct.name}
                  </Typography>
                </Box>

                {/* Transaction Form - Quantity and Price side by side */}
                <Box sx={{ flex: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <TextField
                            label="Quantity"
                            type="number"
                            fullWidth
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            InputProps={{
                              inputProps: { min: 0.01, step: 0.01 },
                              sx: { borderRadius: 2 }
                            }}
                            required
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            label="Price"
                            type="number"
                            fullWidth
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            InputProps={{
                              startAdornment: <Typography sx={{ mr: 1 }}>₦</Typography>,
                              inputProps: { min: 0, step: 0.01 },
                              sx: { borderRadius: 2 }
                            }}
                            required
                            size="small"
                          />
                        </Grid>
                      </Grid>
                    </Grid>

                    <Grid item xs={12}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Unit</InputLabel>
                        <Select
                          value={unit}
                          label="Unit"
                          onChange={(e) => setUnit(e.target.value)}
                          sx={{ borderRadius: 2 }}
                          required
                        >
                          <MenuItem value="kg">Kilogram (kg)</MenuItem>
                          <MenuItem value="g">Gram (g)</MenuItem>
                          <MenuItem value="piece">Piece</MenuItem>
                          <MenuItem value="liter">Liter</MenuItem>
                          <MenuItem value="packet">Packet</MenuItem>
                          <MenuItem value="bag">Bag</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>
              </>
            ) : (
              <Box sx={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                textAlign: 'center',
                p: 4
              }}>
                <Box sx={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  bgcolor: 'grey.200',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3
                }}>
                  <Typography variant="h4" color="text.secondary">→</Typography>
                </Box>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Select a Product
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Choose a product from the list to enter transaction details
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Button 
          onClick={handleClose}
          variant="outlined"
          sx={{ 
            borderRadius: 2,
            px: 3,
            py: 1,
            textTransform: 'none'
          }}
        >
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        
        {/* Transaction Summary in Footer */}
        {selectedProduct && quantity && price && unit && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            mr: 2,
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'primary.50'
          }}>
            <Box>
              <Typography variant="body2" color="textSecondary">
                Transaction Summary
              </Typography>
              <Typography variant="caption" color="textSecondary" display="block">
                {quantity} {unit} × ₦{parseFloat(price || 0).toFixed(2)}
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight={700} color="primary.main">
              ₦{(parseFloat(price || 0) * parseFloat(quantity || 0)).toFixed(2)}
            </Typography>
          </Box>
        )}
        
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={!selectedProduct || !quantity || !price || !unit || 
                   parseFloat(quantity) <= 0 || parseFloat(price) <= 0}
          sx={{ 
            borderRadius: 2,
            px: 4,
            py: 1,
            textTransform: 'none',
            fontWeight: 600,
            minWidth: '140px'
          }}
        >
          Add to Sheet
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddProductDialog;