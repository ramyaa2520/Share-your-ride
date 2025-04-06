import React from 'react';
import { Box, Container, Typography, Link, Grid, IconButton } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.primary.main,
        color: 'white',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              RideShare
            </Typography>
            <Typography variant="body2">
              The modern way to get around town. Safe, reliable and affordable rides at your fingertips.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Typography variant="body2">
              <Link href="/" color="inherit" sx={{ display: 'block', mb: 1 }}>
                Home
              </Link>
              <Link href="/about" color="inherit" sx={{ display: 'block', mb: 1 }}>
                About Us
              </Link>
              <Link href="/contact" color="inherit" sx={{ display: 'block', mb: 1 }}>
                Contact Us
              </Link>
              <Link href="/privacy" color="inherit" sx={{ display: 'block', mb: 1 }}>
                Privacy Policy
              </Link>
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Connect With Us
            </Typography>
            <Box>
              <IconButton color="inherit" aria-label="Facebook">
                <FacebookIcon />
              </IconButton>
              <IconButton color="inherit" aria-label="Twitter">
                <TwitterIcon />
              </IconButton>
              <IconButton color="inherit" aria-label="Instagram">
                <InstagramIcon />
              </IconButton>
              <IconButton color="inherit" aria-label="LinkedIn">
                <LinkedInIcon />
              </IconButton>
            </Box>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Download our mobile app
            </Typography>
            <Typography variant="body2">
              <Link href="#" color="inherit">
                iOS
              </Link>
              {' | '}
              <Link href="#" color="inherit">
                Android
              </Link>
            </Typography>
          </Grid>
        </Grid>
        <Box mt={3}>
          <Typography variant="body2" align="center">
            {'© '}
            {new Date().getFullYear()}
            {' RideShare. All rights reserved.'}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 