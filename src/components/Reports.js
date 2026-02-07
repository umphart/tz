import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  GridOn as ExcelIcon,
  Print as PrintIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { supabase } from '../config/supabase';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    customers: [],
    products: [],
    transactions: [],
    summary: null,
  });
  const [dateRange, setDateRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);

      // Build date filter (though it's not used in current implementation)
      let dateFilter = {};
      if (dateRange === 'month') {
        const start = startOfMonth(new Date());
        const end = endOfMonth(new Date());
        dateFilter = { created_at: { gte: start.toISOString(), lte: end.toISOString() } };
      } else if (dateRange === 'lastMonth') {
        const start = startOfMonth(subMonths(new Date(), 1));
        const end = endOfMonth(subMonths(new Date(), 1));
        dateFilter = { created_at: { gte: start.toISOString(), lte: end.toISOString() } };
      } else if (dateRange === 'custom' && startDate && endDate) {
        dateFilter = { created_at: { gte: startDate, lte: endDate } };
      }

      // Note: dateFilter is not currently used in the queries below
      // but kept for future implementation

      // Fetch all data in parallel
      const [
        customersResponse,
        productsResponse,
        transactionsResponse
      ] = await Promise.all([
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('transactions')
          .select(`
            *,
            customers (name, phone),
            products (name, serial_number)
          `)
          .order('created_at', { ascending: false })
      ]);

      // Calculate summary
      const transactions = transactionsResponse.data || [];
      const totalAmount = transactions.reduce((sum, t) => sum + (parseFloat(t.total_amount) || 0), 0);
      const totalQuantity = transactions.reduce((sum, t) => sum + (parseFloat(t.quantity) || 0), 0);
      
      // Calculate customer spending
      const customerSpending = {};
      transactions.forEach(t => {
        if (t.customer_id && t.customers) {
          if (!customerSpending[t.customer_id]) {
            customerSpending[t.customer_id] = {
              name: t.customers.name,
              phone: t.customers.phone,
              total: 0,
              transactions: 0
            };
          }
          customerSpending[t.customer_id].total += parseFloat(t.total_amount) || 0;
          customerSpending[t.customer_id].transactions += 1;
        }
      });

      // Calculate product sales (renamed to productPurchases for clarity)
      const productPurchases = {};
      transactions.forEach(t => {
        if (t.product_id && t.products) {
          if (!productPurchases[t.product_id]) {
            productPurchases[t.product_id] = {
              name: t.products.name,
              serial: t.products.serial_number,
              quantity: 0,
              amount: 0
            };
          }
          productPurchases[t.product_id].quantity += parseFloat(t.quantity) || 0;
          productPurchases[t.product_id].amount += parseFloat(t.total_amount) || 0;
        }
      });

      setReportData({
        customers: customersResponse.data || [],
        products: productsResponse.data || [],
        transactions: transactions,
        summary: {
          totalCustomers: customersResponse.data?.length || 0,
          totalProducts: productsResponse.data?.length || 0,
          totalTransactions: transactions.length,
          totalAmount,
          totalQuantity,
          customerSpending: Object.values(customerSpending).sort((a, b) => b.total - a.total),
          productPurchases: Object.values(productPurchases).sort((a, b) => b.amount - a.amount),
          dateRange: getDateRangeText(),
        }
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, startDate, endDate]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const getDateRangeText = () => {
    switch (dateRange) {
      case 'month': return 'This Month';
      case 'lastMonth': return 'Last Month';
      case 'custom': return `Custom: ${format(new Date(startDate), 'dd/MM/yyyy')} - ${format(new Date(endDate), 'dd/MM/yyyy')}`;
      default: return 'All Time';
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('TZ Scraps - Business Report', 20, 20);
    
    // Date Range
    doc.setFontSize(12);
    doc.text(`Report Period: ${reportData.summary?.dateRange || 'All Time'}`, 20, 35);
    doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy hh:mm a')}`, 20, 42);
    
    let yPos = 55;
    
    // Summary Stats
    doc.setFontSize(14);
    doc.text('Summary Statistics', 20, yPos);
    yPos += 10;
    
    const summaryData = [
      ['Total Customers', reportData.summary?.totalCustomers || 0],
      ['Total Products', reportData.summary?.totalProducts || 0],
      ['Total Transactions', reportData.summary?.totalTransactions || 0],
      ['Total Amount', `₦${(reportData.summary?.totalAmount || 0).toFixed(2)}`],
      ['Total Quantity', (reportData.summary?.totalQuantity || 0).toFixed(2)],
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
    
    // Export based on active tab
    switch (activeTab) {
      case 0: // Customer Spending
        if (reportData.summary?.customerSpending?.length > 0) {
          doc.setFontSize(14);
          doc.text('Customer Spending Report', 20, yPos);
          yPos += 10;
          
          const customerData = reportData.summary.customerSpending.map(c => [
            c.name,
            c.phone || 'No Phone',
            c.transactions,
            `₦${c.total.toFixed(2)}`
          ]);
          
          autoTable(doc, {
            startY: yPos,
            head: [['Customer', 'Phone', 'Transactions', 'Total Spent']],
            body: customerData,
            theme: 'grid',
          });
        }
        break;
        
      case 1: // Product Buy
        if (reportData.summary?.productPurchases?.length > 0) {
          doc.setFontSize(14);
          doc.text('Product Buy Report', 20, yPos);
          yPos += 10;
          
          const productData = reportData.summary.productPurchases.map(p => [
            p.name,
            p.serial,
            p.quantity.toFixed(2),
            `₦${p.amount.toFixed(2)}`
          ]);
          
          autoTable(doc, {
            startY: yPos,
            head: [['Product', 'Serial', 'Quantity BUY', 'Amount']],
            body: productData,
            theme: 'grid',
          });
        }
        break;
        
      case 2: // Recent Transactions
        if (reportData.transactions?.length > 0) {
          doc.setFontSize(14);
          doc.text('Recent Transactions Report', 20, yPos);
          yPos += 10;
          
          const transactionData = reportData.transactions.slice(0, 100).map(t => [
            format(new Date(t.created_at), 'dd/MM/yy hh:mm a'),
            t.customers?.name || 'Unknown',
            t.products?.name || 'Unknown',
            `${t.quantity} ${t.unit}`,
            `₦${parseFloat(t.total_amount || 0).toFixed(2)}`
          ]);
          
          autoTable(doc, {
            startY: yPos,
            head: [['Date', 'Customer', 'Product', 'Quantity', 'Amount']],
            body: transactionData,
            theme: 'grid',
          });
        }
        break;
        
      case 3: // Customer List
        if (reportData.customers?.length > 0) {
          doc.setFontSize(14);
          doc.text('Customer List Report', 20, yPos);
          yPos += 10;
          
          const customerListData = reportData.customers.map(c => [
            c.name,
            c.phone || 'No Phone',
            format(new Date(c.created_at), 'dd MMM yyyy'),
            'Active'
          ]);
          
          autoTable(doc, {
            startY: yPos,
            head: [['Customer Name', 'Phone', 'Joined Date', 'Status']],
            body: customerListData,
            theme: 'grid',
          });
        }
        break;
        
      case 4: // Product List
        if (reportData.products?.length > 0) {
          doc.setFontSize(14);
          doc.text('Product List Report', 20, yPos);
          yPos += 10;
          
          const productListData = reportData.products.map(p => [
            p.name,
            p.serial_number,
            p.description || 'No description',
            format(new Date(p.created_at), 'dd MMM yyyy')
          ]);
          
          autoTable(doc, {
            startY: yPos,
            head: [['Product Name', 'Serial No', 'Description', 'Added Date']],
            body: productListData,
            theme: 'grid',
          });
        }
        break;
        
      default:
        // Handle default case
        doc.text('No data available for export', 20, yPos);
        break;
    }
    
    // Save PDF
    doc.save(`TZ-Scraps-Report-${format(new Date(), 'yyyy-MM-dd')}-Tab-${activeTab + 1}.pdf`);
  };

  const generateExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // Summary Sheet
    const summaryData = [
      ['TZ Scraps - Business Report'],
      [`Report Period: ${reportData.summary?.dateRange || 'All Time'}`],
      [`Generated: ${format(new Date(), 'dd/MM/yyyy hh:mm a')}`],
      [],
      ['Summary Statistics'],
      ['Metric', 'Value'],
      ['Total Customers', reportData.summary?.totalCustomers || 0],
      ['Total Products', reportData.summary?.totalProducts || 0],
      ['Total Transactions', reportData.summary?.totalTransactions || 0],
      ['Total Amount', reportData.summary?.totalAmount || 0],
      ['Total Quantity', reportData.summary?.totalQuantity || 0],
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Add sheet based on active tab
    switch (activeTab) {
      case 0: // Customer Spending
        if (reportData.summary?.customerSpending?.length > 0) {
          const customerData = [
            ['Customer Spending Report'],
            [],
            ['Customer Name', 'Phone', 'Transactions', 'Total Spent']
          ];
          
          reportData.summary.customerSpending.forEach(c => {
            customerData.push([
              c.name,
              c.phone || '',
              c.transactions,
              c.total
            ]);
          });
          
          const customerSheet = XLSX.utils.aoa_to_sheet(customerData);
          XLSX.utils.book_append_sheet(workbook, customerSheet, 'Customer Spending');
        }
        break;
        
      case 1: // Product Buy
        if (reportData.summary?.productPurchases?.length > 0) {
          const productData = [
            ['Product Buy Report'],
            [],
            ['Product Name', 'Serial Number', 'Quantity BUY', 'Amount']
          ];
          
          reportData.summary.productPurchases.forEach(p => {
            productData.push([
              p.name,
              p.serial,
              p.quantity,
              p.amount
            ]);
          });
          
          const productSheet = XLSX.utils.aoa_to_sheet(productData);
          XLSX.utils.book_append_sheet(workbook, productSheet, 'Product Buy');
        }
        break;
        
      case 2: // Recent Transactions
        if (reportData.transactions?.length > 0) {
          const transactionData = [
            ['Recent Transactions Report'],
            [],
            ['Date', 'Customer', 'Product', 'Quantity', 'Unit', 'Price', 'Total Amount']
          ];
          
          reportData.transactions.slice(0, 1000).forEach(t => {
            transactionData.push([
              format(new Date(t.created_at), 'dd/MM/yyyy hh:mm a'),
              t.customers?.name || 'Unknown',
              t.products?.name || 'Unknown',
              t.quantity,
              t.unit,
              t.price,
              t.total_amount
            ]);
          });
          
          const transactionSheet = XLSX.utils.aoa_to_sheet(transactionData);
          XLSX.utils.book_append_sheet(workbook, transactionSheet, 'Transactions');
        }
        break;
        
      case 3: // Customer List
        if (reportData.customers?.length > 0) {
          const customerListData = [
            ['Customer List Report'],
            [],
            ['Customer Name', 'Phone', 'Joined Date', 'Status']
          ];
          
          reportData.customers.forEach(c => {
            customerListData.push([
              c.name,
              c.phone || '',
              format(new Date(c.created_at), 'dd MMM yyyy'),
              'Active'
            ]);
          });
          
          const customerListSheet = XLSX.utils.aoa_to_sheet(customerListData);
          XLSX.utils.book_append_sheet(workbook, customerListSheet, 'Customers');
        }
        break;
        
      case 4: // Product List
        if (reportData.products?.length > 0) {
          const productListData = [
            ['Product List Report'],
            [],
            ['Product Name', 'Serial No', 'Description', 'Added Date']
          ];
          
          reportData.products.forEach(p => {
            productListData.push([
              p.name,
              p.serial_number,
              p.description || '',
              format(new Date(p.created_at), 'dd MMM yyyy')
            ]);
          });
          
          const productListSheet = XLSX.utils.aoa_to_sheet(productListData);
          XLSX.utils.book_append_sheet(workbook, productListSheet, 'Products');
        }
        break;
        
      default:
        // Handle default case
        const defaultData = [
          ['No data available for export']
        ];
        const defaultSheet = XLSX.utils.aoa_to_sheet(defaultData);
        XLSX.utils.book_append_sheet(workbook, defaultSheet, 'Data');
        break;
    }
    
    // Save Excel
    XLSX.writeFile(workbook, `TZ-Scraps-Report-${format(new Date(), 'yyyy-MM-dd')}-Tab-${activeTab + 1}.xlsx`);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    
    // Get tab content based on active tab
    let tabContent = '';
    switch (activeTab) {
      case 0:
        tabContent = generatePrintContentForCustomerSpending();
        break;
      case 1:
        tabContent = generatePrintContentForProductBuy();
        break;
      case 2:
        tabContent = generatePrintContentForTransactions();
        break;
      case 3:
        tabContent = generatePrintContentForCustomerList();
        break;
      case 4:
        tabContent = generatePrintContentForProductList();
        break;
      default:
        tabContent = '<h2>No data available for printing</h2>';
        break;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>TZ Scraps Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary-cards { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 30px; }
            .card { flex: 1; min-width: 200px; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>TZ Scraps - Business Report</h1>
            <p>Report Period: ${reportData.summary?.dateRange || 'All Time'}</p>
            <p>Generated: ${format(new Date(), 'dd/MM/yyyy hh:mm a')}</p>
          </div>
          
          <div class="summary-cards">
            <div class="card">
              <h3>Total Customers</h3>
              <p>${reportData.summary?.totalCustomers || 0}</p>
            </div>
            <div class="card">
              <h3>Total Products</h3>
              <p>${reportData.summary?.totalProducts || 0}</p>
            </div>
            <div class="card">
              <h3>Total Transactions</h3>
              <p>${reportData.summary?.totalTransactions || 0}</p>
            </div>
            <div class="card">
              <h3>Total Amount</h3>
              <p>₦${(reportData.summary?.totalAmount || 0).toFixed(2)}</p>
            </div>
          </div>
          
          ${tabContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  // Helper functions for print content
  const generatePrintContentForCustomerSpending = () => {
    if (!reportData.summary?.customerSpending?.length) return '<h2>No customer spending data available</h2>';
    
    let tableContent = `
      <h2>Customer Spending Report</h2>
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Phone</th>
            <th>Transactions</th>
            <th>Total Spent</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    reportData.summary.customerSpending.forEach(customer => {
      tableContent += `
        <tr>
          <td>${customer.name}</td>
          <td>${customer.phone || 'No phone'}</td>
          <td>${customer.transactions}</td>
          <td>₦${customer.total.toFixed(2)}</td>
        </tr>
      `;
    });
    
    tableContent += '</tbody></table>';
    return tableContent;
  };

  const generatePrintContentForProductBuy = () => {
    if (!reportData.summary?.productPurchases?.length) return '<h2>No product buy data available</h2>';
    
    let tableContent = `
      <h2>Product Buy Report</h2>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Serial No</th>
            <th>Quantity BUY</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    reportData.summary.productPurchases.forEach(product => {
      tableContent += `
        <tr>
          <td>${product.name}</td>
          <td>${product.serial}</td>
          <td>${product.quantity.toFixed(2)}</td>
          <td>₦${product.amount.toFixed(2)}</td>
        </tr>
      `;
    });
    
    tableContent += '</tbody></table>';
    return tableContent;
  };

  const generatePrintContentForTransactions = () => {
    if (!reportData.transactions?.length) return '<h2>No transaction data available</h2>';
    
    let tableContent = `
      <h2>Recent Transactions Report</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Customer</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    reportData.transactions.slice(0, 50).forEach(transaction => {
      tableContent += `
        <tr>
          <td>${format(new Date(transaction.created_at), 'dd/MM/yy hh:mm a')}</td>
          <td>${transaction.customers?.name || 'Unknown'}</td>
          <td>${transaction.products?.name || 'Unknown'}</td>
          <td>${transaction.quantity} ${transaction.unit}</td>
          <td>₦${parseFloat(transaction.total_amount || 0).toFixed(2)}</td>
        </tr>
      `;
    });
    
    tableContent += '</tbody></table>';
    return tableContent;
  };

  const generatePrintContentForCustomerList = () => {
    if (!reportData.customers?.length) return '<h2>No customer data available</h2>';
    
    let tableContent = `
      <h2>Customer List Report</h2>
      <table>
        <thead>
          <tr>
            <th>Customer Name</th>
            <th>Phone</th>
            <th>Joined Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    reportData.customers.forEach(customer => {
      tableContent += `
        <tr>
          <td>${customer.name}</td>
          <td>${customer.phone || 'No phone'}</td>
          <td>${format(new Date(customer.created_at), 'dd MMM yyyy')}</td>
          <td>Active</td>
        </tr>
      `;
    });
    
    tableContent += '</tbody></table>';
    return tableContent;
  };

  const generatePrintContentForProductList = () => {
    if (!reportData.products?.length) return '<h2>No product data available</h2>';
    
    let tableContent = `
      <h2>Product List Report</h2>
      <table>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Serial No</th>
            <th>Description</th>
            <th>Added Date</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    reportData.products.forEach(product => {
      tableContent += `
        <tr>
          <td>${product.name}</td>
          <td>${product.serial_number}</td>
          <td>${product.description || 'No description'}</td>
          <td>${format(new Date(product.created_at), 'dd MMM yyyy')}</td>
        </tr>
      `;
    });
    
    tableContent += '</tbody></table>';
    return tableContent;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Business Reports
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Analyze your scrap business performance and generate reports
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Print Report">
            <IconButton color="primary" onClick={handlePrint}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download PDF">
            <IconButton color="error" onClick={generatePDF}>
              <PdfIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download Excel">
            <IconButton color="success" onClick={generateExcel}>
              <ExcelIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Date Range Filter */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRange}
                label="Date Range"
                onChange={(e) => setDateRange(e.target.value)}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
                <MenuItem value="lastMonth">Last Month</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {dateRange === 'custom' && (
            <>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Start Date"
                  type="date"
                  fullWidth
                  size="small"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="End Date"
                  type="date"
                  fullWidth
                  size="small"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </>
          )}
          
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              onClick={fetchReportData}
              fullWidth
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PeopleIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Customers</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {reportData.summary?.totalCustomers || 0}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Total registered customers
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <InventoryIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Products</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {reportData.summary?.totalProducts || 0}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Available scrap products
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6">Transactions</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {reportData.summary?.totalTransactions || 0}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Total scrap transactions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 2, bgcolor: 'primary.main', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <MoneyIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">Amount</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    ₦{(reportData.summary?.totalAmount || 0).toFixed(2)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'white', opacity: 0.9 }}>
                    Total scrap Buy Amount
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tabs */}
          <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
              variant="fullWidth"
            >
              <Tab label="Customer Spending" />
              <Tab label="Product Buy" />
              <Tab label="Recent Transactions" />
              <Tab label="Customer List" />
              <Tab label="Product List" />
            </Tabs>

            {/* Tab Content */}
            <Box sx={{ p: 3 }}>
              {activeTab === 0 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Customer</strong></TableCell>
                        <TableCell><strong>Phone</strong></TableCell>
                        <TableCell align="right"><strong>Transactions</strong></TableCell>
                        <TableCell align="right"><strong>Total Spent</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.summary?.customerSpending?.map((customer, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {customer.name}
                            </Typography>
                          </TableCell>
                          <TableCell>{customer.phone || 'No phone'}</TableCell>
                          <TableCell align="right">{customer.transactions}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body1" fontWeight="bold" color="primary.main">
                              ₦{customer.total.toFixed(2)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {activeTab === 1 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Product</strong></TableCell>
                        <TableCell><strong>Serial No</strong></TableCell>
                        <TableCell align="right"><strong>Quantity BUY</strong></TableCell>
                        <TableCell align="right"><strong>Amount</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.summary?.productPurchases?.map((product, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {product.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={product.serial} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell align="right">{product.quantity.toFixed(2)}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body1" fontWeight="bold" color="primary.main">
                              ₦{product.amount.toFixed(2)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {activeTab === 2 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell><strong>Customer</strong></TableCell>
                        <TableCell><strong>Product</strong></TableCell>
                        <TableCell align="right"><strong>Quantity</strong></TableCell>
                        <TableCell align="right"><strong>Amount</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.transactions?.slice(0, 50).map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {format(new Date(transaction.created_at), 'dd/MM/yy hh:mm a')}
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {transaction.customers?.name || 'Unknown'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {transaction.products?.name || 'Unknown'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {transaction.quantity} {transaction.unit}
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight="bold" color="primary.main">
                              ₦{parseFloat(transaction.total_amount || 0).toFixed(2)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {activeTab === 3 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Customer Name</strong></TableCell>
                        <TableCell><strong>Phone</strong></TableCell>
                        <TableCell><strong>Joined Date</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.customers?.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {customer.name}
                            </Typography>
                          </TableCell>
                          <TableCell>{customer.phone || 'No phone'}</TableCell>
                          <TableCell>
                            {format(new Date(customer.created_at), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label="Active" 
                              size="small" 
                              color="success" 
                              variant="outlined" 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {activeTab === 4 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Product Name</strong></TableCell>
                        <TableCell><strong>Serial No</strong></TableCell>
                        <TableCell><strong>Description</strong></TableCell>
                        <TableCell><strong>Added Date</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.products?.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {product.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={product.serial_number} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="textSecondary">
                              {product.description || 'No description'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {format(new Date(product.created_at), 'dd MMM yyyy')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Paper>

          {/* Report Period Info */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Report Period: <strong>{reportData.summary?.dateRange || 'All Time'}</strong> • 
              Generated: {format(new Date(), 'dd/MM/yyyy hh:mm a')} • 
              Total Data Points: {reportData.transactions?.length || 0} transactions
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
};

export default Reports;