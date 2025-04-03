import React from 'react';
import { Box, Typography } from '@mui/material';

const Dashboard: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1">
        Welcome to the Scouting Data Visualizer Dashboard. Use the navigation above to import data or view visualizations.
      </Typography>
    </Box>
  );
};

export default Dashboard; 