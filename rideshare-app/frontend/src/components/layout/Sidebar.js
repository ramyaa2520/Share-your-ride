import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  useMediaQuery,
  useTheme
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import HistoryIcon from '@mui/icons-material/History';
import AddCardIcon from '@mui/icons-material/AddCard';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DriveEtaIcon from '@mui/icons-material/DriveEta';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const drawerWidth = 240;

const Sidebar = ({ open, onClose, userRole }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const CommonMenuItems = () => (
    <>
      <ListItem disablePadding>
        <ListItemButton onClick={() => handleNavigate(userRole === 'driver' ? '/driver/dashboard' : '/dashboard')}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton onClick={() => handleNavigate(userRole === 'driver' ? '/driver/profile' : '/profile')}>
          <ListItemIcon>
            <AccountCircleIcon />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton onClick={() => handleNavigate(userRole === 'driver' ? '/driver/ride-history' : '/ride-history')}>
          <ListItemIcon>
            <HistoryIcon />
          </ListItemIcon>
          <ListItemText primary="Ride History" />
        </ListItemButton>
      </ListItem>
    </>
  );

  const PassengerMenuItems = () => (
    <>
      <ListItem disablePadding>
        <ListItemButton onClick={() => handleNavigate('/book-ride')}>
          <ListItemIcon>
            <DirectionsCarIcon />
          </ListItemIcon>
          <ListItemText primary="Book a Ride" />
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton onClick={() => handleNavigate('/payment-methods')}>
          <ListItemIcon>
            <AddCardIcon />
          </ListItemIcon>
          <ListItemText primary="Payment Methods" />
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton onClick={() => handleNavigate('/saved-addresses')}>
          <ListItemIcon>
            <LocationOnIcon />
          </ListItemIcon>
          <ListItemText primary="Saved Addresses" />
        </ListItemButton>
      </ListItem>
      <Divider />
      <ListItem disablePadding>
        <ListItemButton onClick={() => handleNavigate('/become-driver')}>
          <ListItemIcon>
            <DriveEtaIcon />
          </ListItemIcon>
          <ListItemText primary="Become a Driver" />
        </ListItemButton>
      </ListItem>
    </>
  );

  const DriverMenuItems = () => (
    <>
      <ListItem disablePadding>
        <ListItemButton onClick={() => handleNavigate('/driver/documents')}>
          <ListItemIcon>
            <FileUploadIcon />
          </ListItemIcon>
          <ListItemText primary="Driver Documents" />
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton onClick={() => handleNavigate('/driver/earnings')}>
          <ListItemIcon>
            <AttachMoneyIcon />
          </ListItemIcon>
          <ListItemText primary="Earnings" />
        </ListItemButton>
      </ListItem>
    </>
  );

  const drawerContent = (
    <>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-end',
        p: 1 
      }}>
        <IconButton onClick={onClose}>
          <ChevronLeftIcon />
        </IconButton>
      </Box>
      <Divider />
      <List>
        <CommonMenuItems />
        <Divider />
        {userRole === 'driver' ? <DriverMenuItems /> : <PassengerMenuItems />}
      </List>
    </>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={open}
          onClose={onClose}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              width: drawerWidth, 
              boxSizing: 'border-box',
              position: 'relative',
              marginTop: '64px', // AppBar height
              height: 'calc(100vh - 64px)',
              borderRight: '1px solid rgba(0, 0, 0, 0.12)'
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </Box>
  );
};

export default Sidebar; 