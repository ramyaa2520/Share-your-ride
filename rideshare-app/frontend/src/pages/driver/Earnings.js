import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PaymentsIcon from '@mui/icons-material/Payments';
import StarIcon from '@mui/icons-material/Star';

import { useDriverStore } from '../../store/driverStore';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters';

const Earnings = () => {
  const { earnings, getEarnings, loading, error } = useDriverStore();
  
  // Date filter state
  const [startDate, setStartDate] = useState(dayjs().subtract(7, 'day'));
  const [endDate, setEndDate] = useState(dayjs());
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Stats state
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalRides: 0,
    avgPerRide: 0,
    avgRating: 0
  });
  
  // Fetch earnings on component mount
  useEffect(() => {
    getEarnings();
  }, [getEarnings]);
  
  // Update stats when earnings change or filters change
  useEffect(() => {
    if (earnings && earnings.transactions) {
      // Filter transactions based on date range
      const filteredTransactions = filterTransactionsByDate(earnings.transactions);
      
      // Calculate stats from filtered transactions
      const totalEarnings = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      const totalRides = filteredTransactions.filter(tx => tx.type === 'ride_fare' || tx.type === 'tip').length;
      const ridesWithRating = filteredTransactions.filter(tx => tx.ride && tx.ride.rating);
      
      setStats({
        totalEarnings,
        totalRides,
        avgPerRide: totalRides > 0 ? totalEarnings / totalRides : 0,
        avgRating: ridesWithRating.length > 0 ? 
          ridesWithRating.reduce((sum, tx) => sum + tx.ride.rating, 0) / ridesWithRating.length : 0
      });
    }
  }, [earnings, startDate, endDate]);
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle filter by date
  const handleFilter = () => {
    // Reapply filter 
    const filteredTransactions = filterTransactionsByDate(earnings.transactions);
    
    // Recalculate stats
    const totalEarnings = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalRides = filteredTransactions.filter(tx => tx.type === 'ride_fare' || tx.type === 'tip').length;
    const ridesWithRating = filteredTransactions.filter(tx => tx.ride && tx.ride.rating);
    
    setStats({
      totalEarnings,
      totalRides,
      avgPerRide: totalRides > 0 ? totalEarnings / totalRides : 0,
      avgRating: ridesWithRating.length > 0 ? 
        ridesWithRating.reduce((sum, tx) => sum + tx.ride.rating, 0) / ridesWithRating.length : 0
    });
  };
  
  // Filter transactions by date range
  const filterTransactionsByDate = (transactions) => {
    if (!transactions) return [];
    
    const start = startDate.startOf('day');
    const end = endDate.endOf('day');
    
    return transactions.filter(tx => {
      const txDate = dayjs(tx.timestamp);
      return txDate.isAfter(start) && txDate.isBefore(end);
    });
  };
  
  // Get current page transactions
  const getCurrentTransactions = () => {
    if (!earnings || !earnings.transactions) return [];
    
    const filteredTransactions = filterTransactionsByDate(earnings.transactions);
    
    return filteredTransactions
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  };
  
  // Format transaction description
  const formatTransactionDescription = (transaction) => {
    switch (transaction.type) {
      case 'ride_fare':
        return `Ride fare ${transaction.ride ? `- ${transaction.ride.pickup.address.substring(0, 15)}... to ${transaction.ride.destination.address.substring(0, 15)}...` : ''}`;
      case 'tip':
        return 'Rider tip';
      case 'bonus':
        return `Bonus - ${transaction.description || ''}`;
      case 'adjustment':
        return `Adjustment - ${transaction.description || ''}`;
      case 'payout':
        return 'Payout to bank account';
      default:
        return transaction.description || transaction.type;
    }
  };
  
  // If loading, show loading spinner
  if (loading && !earnings) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Earnings
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Track your earnings and payment history
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card elevation={1} sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <AttachMoneyIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h5" align="center">{formatCurrency(stats.totalEarnings)}</Typography>
                <Typography variant="body2" color="text.secondary" align="center">Total Earnings</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card elevation={1} sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <DirectionsCarIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h5" align="center">{stats.totalRides}</Typography>
                <Typography variant="body2" color="text.secondary" align="center">Total Rides</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card elevation={1} sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <PaymentsIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h5" align="center">{formatCurrency(stats.avgPerRide)}</Typography>
                <Typography variant="body2" color="text.secondary" align="center">Average Per Ride</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card elevation={1} sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <StarIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h5" align="center">{stats.avgRating.toFixed(1)}</Typography>
                <Typography variant="body2" color="text.secondary" align="center">Average Rating</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4} md={3}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4} md={3}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4} md={2}>
              <Button
                variant="contained"
                onClick={handleFilter}
                fullWidth
              >
                Filter
              </Button>
            </Grid>
          </Grid>
        </LocalizationProvider>
        
        <Divider sx={{ my: 2 }} />
        
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="earnings table">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getCurrentTransactions().length > 0 ? (
                getCurrentTransactions().map((transaction) => (
                  <TableRow key={transaction._id} hover>
                    <TableCell>{formatDate(transaction.timestamp)}</TableCell>
                    <TableCell>{formatTime(transaction.timestamp)}</TableCell>
                    <TableCell>{formatTransactionDescription(transaction)}</TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        color={transaction.amount >= 0 ? 'success.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        {formatCurrency(transaction.amount)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No transactions found for the selected period
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filterTransactionsByDate(earnings?.transactions || []).length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default Earnings; 