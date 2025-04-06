import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Stack,
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import DateRangeIcon from '@mui/icons-material/DateRange';
import { useRideStore } from '../../store/rideStore';
import { formatDate, formatTime, formatCurrency, formatRideStatus } from '../../utils/formatters';

// Tab values
const ALL_RIDES = 0;
const COMPLETED_RIDES = 1;
const CANCELLED_RIDES = 2;

const RideHistory = () => {
  const navigate = useNavigate();
  const { getUserRides, rides, loading } = useRideStore();
  
  // Local state
  const [filteredRides, setFilteredRides] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState(ALL_RIDES);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Fetch rides on mount
  useEffect(() => {
    getUserRides();
  }, [getUserRides]);
  
  // Filter rides when rides data changes or filters change
  useEffect(() => {
    if (!rides) return;
    
    let result = [...rides];
    
    // Apply tab filter
    if (currentTab === COMPLETED_RIDES) {
      result = result.filter(ride => ride.status === 'completed');
    } else if (currentTab === CANCELLED_RIDES) {
      result = result.filter(ride => ride.status === 'cancelled');
    }
    
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(ride => 
        (ride.pickup?.address && ride.pickup.address.toLowerCase().includes(query)) ||
        (ride.destination?.address && ride.destination.address.toLowerCase().includes(query)) ||
        (ride.driver?.user?.name && ride.driver.user.name.toLowerCase().includes(query)) ||
        (ride.rideType && ride.rideType.toLowerCase().includes(query)) ||
        (ride._id && ride._id.toLowerCase().includes(query))
      );
    }
    
    // Sort by most recent first
    result.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
    
    setFilteredRides(result);
  }, [rides, searchQuery, currentTab]);
  
  // Handle changing tabs
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    setPage(0);
  };
  
  // Handle changing page
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle changing rows per page
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };
  
  // Handle clicking a ride row
  const handleRideClick = (rideId) => {
    navigate(`/rides/${rideId}`);
  };
  
  // Get ride status chip color
  const getRideStatusColor = (status) => {
    switch (status) {
      case 'requested':
        return 'info';
      case 'accepted':
        return 'info';
      case 'arrived':
        return 'secondary';
      case 'in_progress':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };
  
  if (loading && !rides) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredRides.length) : 0;
  
  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Ride History
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
          <TextField
            placeholder="Search rides..."
            variant="outlined"
            fullWidth
            size="small"
            value={searchQuery}
            onChange={handleSearch}
            sx={{ maxWidth: { sm: 300 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All Rides" />
            <Tab label="Completed" />
            <Tab label="Cancelled" />
          </Tabs>
        </Box>
        
        {filteredRides.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No rides found
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {searchQuery 
                ? "No rides match your search criteria." 
                : "You haven't taken any rides yet."}
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate('/book')}
            >
              Book a Ride
            </Button>
          </Box>
        ) : (
          <>
            {/* Desktop view: Table */}
            <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Pickup</TableCell>
                    <TableCell>Destination</TableCell>
                    <TableCell>Ride Type</TableCell>
                    <TableCell>Fare</TableCell>
                    <TableCell>Driver</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRides
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((ride) => (
                      <TableRow 
                        key={ride._id}
                        hover
                        onClick={() => handleRideClick(ride._id)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Typography variant="body2" component="div">
                            {formatDate(ride.requestedAt)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatTime(ride.requestedAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {ride.pickup?.address}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {ride.destination?.address}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {ride.rideType}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatCurrency(ride.fare?.estimatedFare)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {ride.driver?.user?.name || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={formatRideStatus(ride.status)}
                            color={getRideStatusColor(ride.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRideClick(ride._id);
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={8} />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Mobile view: Cards */}
            <Stack 
              spacing={2} 
              sx={{ 
                display: { xs: 'flex', md: 'none' }, 
                mb: 2 
              }}
            >
              {filteredRides
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((ride) => (
                  <Card 
                    key={ride._id} 
                    variant="outlined"
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleRideClick(ride._id)}
                  >
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {formatDate(ride.requestedAt)}
                        </Typography>
                        <Chip
                          label={formatRideStatus(ride.status)}
                          color={getRideStatusColor(ride.status)}
                          size="small"
                        />
                      </Stack>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', mb: 1 }}>
                            <LocationOnIcon color="primary" fontSize="small" sx={{ mr: 1, mt: 0.2 }} />
                            <Typography variant="body2" noWrap>
                              From: {ride.pickup?.address}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex' }}>
                            <LocationOnIcon color="secondary" fontSize="small" sx={{ mr: 1, mt: 0.2 }} />
                            <Typography variant="body2" noWrap>
                              To: {ride.destination?.address}
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Divider />
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <DirectionsCarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                              {ride.rideType}
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AttachMoneyIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {formatCurrency(ride.fare?.estimatedFare)}
                            </Typography>
                          </Box>
                        </Grid>
                        
                        {ride.driver?.user?.name && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              Driver: {ride.driver.user.name}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <Button
                          endIcon={<NavigateNextIcon />}
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRideClick(ride._id);
                          }}
                        >
                          Details
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
            </Stack>
            
            {/* Pagination */}
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
      </Paper>
    </Box>
  );
};

export default RideHistory; 