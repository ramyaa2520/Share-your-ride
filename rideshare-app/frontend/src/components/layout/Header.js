import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Container,
  Avatar,
  Button,
  Tooltip,
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import HistoryIcon from '@mui/icons-material/History';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PaymentIcon from '@mui/icons-material/Payment';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DriveEtaIcon from '@mui/icons-material/DriveEta';
import { useAuthStore } from '../../store/authStore';

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [anchorElUser, setAnchorElUser] = useState(null);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    logout();
    handleCloseUserMenu();
    navigate('/');
  };

  const getProfileLink = () => {
    return user?.role === 'driver' ? '/driver/profile' : '/profile';
  };

  const getDashboardLink = () => {
    return user?.role === 'driver' ? '/driver/dashboard' : '/dashboard';
  };

  const getRideHistoryLink = () => {
    return user?.role === 'driver' ? '/driver/ride-history' : '/ride-history';
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Mobile menu button */}
          {isAuthenticated && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={toggleSidebar}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <DirectionsCarIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            RideShare
          </Typography>

          {/* Mobile logo */}
          <DirectionsCarIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            RideShare
          </Typography>

          {/* Nav links - displayed on desktop */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {!isAuthenticated ? (
              <>
                <Button
                  onClick={() => navigate('/login')}
                  sx={{ my: 2, color: 'white', display: 'block' }}
                >
                  Login
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  sx={{ my: 2, color: 'white', display: 'block' }}
                >
                  Register
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => navigate(getDashboardLink())}
                  sx={{ my: 2, color: 'white', display: 'block' }}
                >
                  Dashboard
                </Button>
                {user?.role !== 'driver' && (
                  <Button
                    onClick={() => navigate('/book-ride')}
                    sx={{ my: 2, color: 'white', display: 'block' }}
                  >
                    Book a Ride
                  </Button>
                )}
                <Button
                  onClick={() => navigate(getRideHistoryLink())}
                  sx={{ my: 2, color: 'white', display: 'block' }}
                >
                  Ride History
                </Button>
              </>
            )}
          </Box>

          {/* User menu */}
          {isAuthenticated ? (
            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar alt={user?.name} src={user?.profilePicture} />
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                <MenuItem onClick={() => { navigate(getDashboardLink()); handleCloseUserMenu(); }}>
                  <DashboardIcon sx={{ mr: 1 }} /> Dashboard
                </MenuItem>
                <MenuItem onClick={() => { navigate(getProfileLink()); handleCloseUserMenu(); }}>
                  <AccountCircleIcon sx={{ mr: 1 }} /> Profile
                </MenuItem>
                <MenuItem onClick={() => { navigate(getRideHistoryLink()); handleCloseUserMenu(); }}>
                  <HistoryIcon sx={{ mr: 1 }} /> Ride History
                </MenuItem>
                
                {user?.role === 'driver' ? (
                  <MenuItem onClick={() => { navigate('/driver/earnings'); handleCloseUserMenu(); }}>
                    <PaymentIcon sx={{ mr: 1 }} /> Earnings
                  </MenuItem>
                ) : (
                  <>
                    <MenuItem onClick={() => { navigate('/payment-methods'); handleCloseUserMenu(); }}>
                      <PaymentIcon sx={{ mr: 1 }} /> Payment Methods
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/saved-addresses'); handleCloseUserMenu(); }}>
                      <LocationOnIcon sx={{ mr: 1 }} /> Saved Addresses
                    </MenuItem>
                  </>
                )}
                
                {user?.role !== 'driver' && (
                  <MenuItem onClick={() => { navigate('/become-driver'); handleCloseUserMenu(); }}>
                    <DriveEtaIcon sx={{ mr: 1 }} /> Become a Driver
                  </MenuItem>
                )}
                
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1 }} /> Logout
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                size="large"
                color="inherit"
                onClick={() => navigate('/login')}
              >
                <AccountCircleIcon />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header; 