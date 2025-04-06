import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Container,
  useMediaQuery,
  useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import PaymentIcon from '@mui/icons-material/Payment';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ArticleIcon from '@mui/icons-material/Article';
import LoginIcon from '@mui/icons-material/Login';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import FindRideIcon from '@mui/icons-material/Search';
import OfferRideIcon from '@mui/icons-material/AddBox';
import MyRidesIcon from '@mui/icons-material/CommuteOutlined';
import { useAuthStore } from '../../store/authStore';

const drawerWidth = 240;

const Layout = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { user, isAuthenticated, loading, logout } = useAuthStore();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  
  const isDriver = user?.role === 'driver';
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleMenuItemClick = (path) => {
    navigate(path);
    handleProfileMenuClose();
    if (isMobile) {
      setMobileOpen(false);
    }
  };
  
  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
    navigate('/login');
  };
  
  // User navigation items
  const userMenuItems = [
    { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { text: 'Find a Ride', path: '/find-ride', icon: <FindRideIcon /> },
    { text: 'Offer a Ride', path: '/offer-ride', icon: <OfferRideIcon /> },
    { text: 'My Rides', path: '/my-rides', icon: <MyRidesIcon /> },
    { text: 'Ride History', path: '/ride-history', icon: <HistoryIcon /> },
    { text: 'Profile', path: '/profile', icon: <PersonIcon /> },
  ];
  
  // Driver navigation items
  const driverNavItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/driver/dashboard' },
    { text: 'Ride History', icon: <HistoryIcon />, path: '/driver/rides' },
    { text: 'Earnings', icon: <AccountBalanceWalletIcon />, path: '/driver/earnings' },
    { text: 'Documents', icon: <ArticleIcon />, path: '/driver/documents' }
  ];
  
  // Public navigation items
  const publicNavItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'Login', icon: <LoginIcon />, path: '/login' },
    { text: 'Sign Up', icon: <HowToRegIcon />, path: '/register' }
  ];
  
  // Determine which nav items to show based on authentication and role
  const navItems = isAuthenticated 
    ? (isDriver ? driverNavItems : userMenuItems)
    : publicNavItems;
  
  const drawer = (
    <Box>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" noWrap component="div">
          RideShare
        </Typography>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleMenuItemClick(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      {isAuthenticated && (
        <>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleMenuItemClick('/profile')}>
                <ListItemIcon><PersonIcon /></ListItemIcon>
                <ListItemText primary="Profile" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemIcon><LogoutIcon /></ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </List>
        </>
      )}
    </Box>
  );
  
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` }
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1 }}
          >
            {isDriver ? 'RideShare Driver' : 'RideShare'}
          </Typography>
          
          {isAuthenticated ? (
            <>
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <Avatar
                  alt={user?.name}
                  src={user?.profileImage}
                  sx={{ bgcolor: 'primary.dark' }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
              >
                <MenuItem onClick={() => handleMenuItemClick('/profile')}>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button
                color="inherit"
                onClick={() => navigate('/login')}
                sx={{ mr: 1 }}
              >
                Login
              </Button>
              <Button
                color="secondary"
                variant="contained"
                onClick={() => navigate('/register')}
              >
                Sign Up
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      
      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="navigation drawer"
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          marginTop: '64px'
        }}
      >
        <Container maxWidth="xl">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 