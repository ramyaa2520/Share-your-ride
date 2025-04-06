import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Paper,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Stack,
  Divider
} from '@mui/material';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import PaymentsIcon from '@mui/icons-material/Payments';
import StarIcon from '@mui/icons-material/Star';
import ShieldIcon from '@mui/icons-material/Shield';
import { useAuthStore } from '../store/authStore';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate(user?.role === 'driver' ? '/driver/dashboard' : '/dashboard');
    } else {
      navigate('/register');
    }
  };

  const handleBecomeDriver = () => {
    if (isAuthenticated) {
      navigate('/become-driver');
    } else {
      navigate('/register');
    }
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          height: { xs: '80vh', md: '70vh' },
          background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          textAlign: 'center',
          px: 2
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
            Your Ride, Your Way
          </Typography>
          <Typography variant="h5" component="h2" paragraph>
            Fast, reliable, and affordable rides at your fingertips.
            Join thousands of riders who trust RideShare for their daily commute.
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              color="secondary"
              onClick={handleGetStarted}
              sx={{ px: 4, py: 1.5, mr: 2, fontWeight: 'bold' }}
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
            </Button>
            {!isAuthenticated && (
              <Button
                variant="outlined"
                size="large"
                color="inherit"
                onClick={() => navigate('/login')}
                sx={{ px: 4, py: 1.5, fontWeight: 'bold', borderWidth: 2 }}
              >
                Sign In
              </Button>
            )}
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          component="h2"
          align="center"
          gutterBottom
          sx={{ mb: 6, fontWeight: 'bold' }}
        >
          Why Choose RideShare?
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={2} sx={{ p: 3, height: '100%', textAlign: 'center' }}>
              <LocalTaxiIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" component="h3" gutterBottom fontWeight="bold">
                Quick Pickup
              </Typography>
              <Typography variant="body1">
                Get picked up within minutes of requesting a ride. Our large network of drivers ensures minimal wait times.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={2} sx={{ p: 3, height: '100%', textAlign: 'center' }}>
              <PaymentsIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" component="h3" gutterBottom fontWeight="bold">
                Affordable Rates
              </Typography>
              <Typography variant="body1">
                Competitive pricing with transparent fare estimates before you book. No hidden charges or surge pricing.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={2} sx={{ p: 3, height: '100%', textAlign: 'center' }}>
              <StarIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" component="h3" gutterBottom fontWeight="bold">
                Top-Rated Drivers
              </Typography>
              <Typography variant="body1">
                All our drivers are vetted and highly rated. Enjoy a comfortable ride with professional service.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={2} sx={{ p: 3, height: '100%', textAlign: 'center' }}>
              <ShieldIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" component="h3" gutterBottom fontWeight="bold">
                Safety First
              </Typography>
              <Typography variant="body1">
                Your safety is our priority. Track your ride in real-time and share your trip details with friends.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ bgcolor: 'background.default', py: 8 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            align="center"
            gutterBottom
            sx={{ mb: 6, fontWeight: 'bold' }}
          >
            How It Works
          </Typography>

          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%'
              }}>
                <Box
                  component="img"
                  sx={{
                    maxWidth: '100%',
                    height: 'auto',
                    maxHeight: 400,
                    animation: 'float 3s ease-in-out infinite',
                    '@keyframes float': {
                      '0%': { transform: 'translateY(0px)' },
                      '50%': { transform: 'translateY(-10px)' },
                      '100%': { transform: 'translateY(0px)' }
                    }
                  }}
                  src="https://cdn-icons-png.flaticon.com/512/4832/4832328.png"
                  alt="Ride Booking Illustration"
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={4}>
                <Box>
                  <Typography variant="h5" component="h3" gutterBottom fontWeight="bold">
                    1. Request a Ride
                  </Typography>
                  <Typography variant="body1">
                    Open the app, enter your destination, and select your ride type. You'll see the estimated fare upfront.
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h5" component="h3" gutterBottom fontWeight="bold">
                    2. Get Matched with a Driver
                  </Typography>
                  <Typography variant="body1">
                    A nearby driver will accept your request. You can view the driver's profile, ratings, and vehicle details.
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h5" component="h3" gutterBottom fontWeight="bold">
                    3. Track Your Ride
                  </Typography>
                  <Typography variant="body1">
                    Watch your driver arrive in real-time on the map. You'll receive notifications when your driver is approaching.
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h5" component="h3" gutterBottom fontWeight="bold">
                    4. Enjoy and Rate
                  </Typography>
                  <Typography variant="body1">
                    After reaching your destination, payment is automatically processed. Rate your driver and provide feedback.
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Driver Section */}
      <Box sx={{ bgcolor: 'primary.light', py: 8, color: 'white' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" component="h2" gutterBottom fontWeight="bold">
                Become a Driver
              </Typography>
              <Typography variant="h6" paragraph>
                Join our growing team of drivers and earn money on your own schedule.
              </Typography>
              <Typography variant="body1" paragraph>
                Enjoy flexible hours, weekly payouts, and bonus incentives. Our driver app makes it easy to track your earnings and manage your schedule.
              </Typography>
              <Typography variant="body1" paragraph>
                All you need is a valid driver's license, a vehicle in good condition, and a smartphone to get started.
              </Typography>
              <Button
                variant="contained"
                size="large"
                color="secondary"
                onClick={handleBecomeDriver}
                sx={{ mt: 2, px: 4, py: 1.5, fontWeight: 'bold' }}
              >
                {isAuthenticated ? 'Become a Driver' : 'Sign Up to Drive'}
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                sx={{
                  width: '100%',
                  maxWidth: 400,
                  height: 'auto',
                  mx: 'auto',
                  display: 'block'
                }}
                src="https://cdn-icons-png.flaticon.com/512/2830/2830312.png"
                alt="Driver earnings illustration"
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Ride Types Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          component="h2"
          align="center"
          gutterBottom
          sx={{ mb: 6, fontWeight: 'bold' }}
        >
          Choose Your Ride
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea>
                <CardMedia
                  component="img"
                  height="140"
                  image="https://cdn-icons-png.flaticon.com/512/3202/3202926.png"
                  alt="Economy car"
                />
                <CardContent>
                  <Typography variant="h5" component="div" gutterBottom>
                    Economy
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Affordable rides for everyday trips. Clean, comfortable cars with great value.
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea>
                <CardMedia
                  component="img"
                  height="140"
                  image="https://cdn-icons-png.flaticon.com/512/3097/3097136.png"
                  alt="Comfort car"
                />
                <CardContent>
                  <Typography variant="h5" component="div" gutterBottom>
                    Comfort
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Newer cars with extra legroom. Perfect for business trips or when you need more space.
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea>
                <CardMedia
                  component="img"
                  height="140"
                  image="https://cdn-icons-png.flaticon.com/512/741/741407.png"
                  alt="Premium car"
                />
                <CardContent>
                  <Typography variant="h5" component="div" gutterBottom>
                    Premium
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    High-end cars with top-rated drivers. Experience luxury with premium service.
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea>
                <CardMedia
                  component="img"
                  height="140"
                  image="https://cdn-icons-png.flaticon.com/512/3774/3774278.png"
                  alt="SUV"
                />
                <CardContent>
                  <Typography variant="h5" component="div" gutterBottom>
                    SUV
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Spacious vehicles for groups up to 6 people. Perfect for families or traveling with luggage.
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'secondary.light', py: 8 }}>
        <Container maxWidth="md">
          <Typography variant="h3" component="h2" align="center" gutterBottom fontWeight="bold">
            Ready to Get Moving?
          </Typography>
          <Typography variant="h6" align="center" paragraph>
            Join thousands of happy riders who use RideShare every day.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              color="primary"
              onClick={handleGetStarted}
              sx={{ px: 4, py: 1.5, mr: 2, fontWeight: 'bold' }}
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Sign Up Now'}
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 