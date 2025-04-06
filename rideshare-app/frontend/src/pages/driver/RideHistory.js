import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useRideStore } from '../../store/rideStore';
import { formatCurrency, formatDate, formatTime, getRideStatusColor } from '../../utils/formatters';

const RideHistory = () => {
  const navigate = useNavigate();
  const { rides, getDriverRides, loading, error } = useRideStore();
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Fetch ride history on component mount
  useEffect(() => {
    getDriverRides();
  }, [getDriverRides]);
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle view ride details
  const handleViewRide = (rideId) => {
    navigate(`/driver/rides/${rideId}`);
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };
  
  // Filter rides based on status
  const filteredRides = rides.filter(ride => {
    if (statusFilter === 'all') return true;
    return ride.status === statusFilter;
  });
  
  // Get current page rides
  const currentRides = filteredRides.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  // If loading, show loading spinner
  if (loading) {
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
          Ride History
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          View all your past rides and their details
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        {error ? (
          <Typography color="error" sx={{ my: 2 }}>
            {error}
          </Typography>
        ) : (
          <>
            <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small" variant="outlined">
                  <InputLabel id="status-filter-label">Status</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    id="status-filter"
                    value={statusFilter}
                    onChange={handleStatusFilterChange}
                    label="Status"
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    <MenuItem value="requested">Requested</MenuItem>
                    <MenuItem value="accepted">Accepted</MenuItem>
                    <MenuItem value="arrived">Arrived</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            {rides.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6">
                  No ride history available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  When you complete rides, they'll appear here
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table aria-label="ride history table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Pickup</TableCell>
                        <TableCell>Destination</TableCell>
                        <TableCell>Passenger</TableCell>
                        <TableCell>Fare</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentRides.map((ride) => (
                        <TableRow key={ride._id} hover>
                          <TableCell>{formatDate(ride.requestedAt)}</TableCell>
                          <TableCell>{formatTime(ride.requestedAt)}</TableCell>
                          <TableCell>
                            {ride.pickup.address.substring(0, 20)}
                            {ride.pickup.address.length > 20 ? '...' : ''}
                          </TableCell>
                          <TableCell>
                            {ride.destination.address.substring(0, 20)}
                            {ride.destination.address.length > 20 ? '...' : ''}
                          </TableCell>
                          <TableCell>
                            {ride.user?.name || 'Unknown User'}
                          </TableCell>
                          <TableCell>{formatCurrency(ride.fare)}</TableCell>
                          <TableCell>
                            <Chip
                              label={ride.status.replace('_', ' ')}
                              size="small"
                              sx={{
                                backgroundColor: getRideStatusColor(ride.status),
                                color: '#fff',
                                textTransform: 'capitalize',
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleViewRide(ride._id)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={filteredRides.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default RideHistory; 