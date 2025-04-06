import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  Popover,
  Divider
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HomeIcon from '@mui/icons-material/Home';
import WorkIcon from '@mui/icons-material/Work';
import StarIcon from '@mui/icons-material/Star';

const AddressMenu = ({
  open,
  onClose,
  addresses = [],
  onSelect,
  anchorEl
}) => {
  // Function to determine the icon based on address type
  const getAddressIcon = (type) => {
    switch (type) {
      case 'home':
        return <HomeIcon color="primary" />;
      case 'work':
        return <WorkIcon color="primary" />;
      case 'favorite':
        return <StarIcon color="primary" />;
      default:
        return <LocationOnIcon color="primary" />;
    }
  };

  return (
    <Popover
      open={open}
      onClose={onClose}
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      PaperProps={{
        elevation: 3,
        sx: { 
          width: 320,
          maxHeight: 350,
          borderRadius: 2,
          mt: 1
        }
      }}
    >
      <Paper>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight="medium">
            Saved Addresses
          </Typography>
        </Box>
        
        {addresses && addresses.length > 0 ? (
          <List sx={{ pt: 0 }}>
            {addresses.map((address, index) => (
              <React.Fragment key={address._id || index}>
                <ListItem 
                  button
                  onClick={() => onSelect(address)}
                  sx={{ 
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getAddressIcon(address.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body1" fontWeight="medium">
                        {address.name || (address.type ? address.type.charAt(0).toUpperCase() + address.type.slice(1) : 'Address')}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {address.address}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < addresses.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No saved addresses found.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add addresses in your profile settings.
            </Typography>
          </Box>
        )}
      </Paper>
    </Popover>
  );
};

export default AddressMenu; 