import React from 'react';
import { Box, Typography } from '@mui/material';

const PageTitle = ({ icon: IconComponent, title, description }) => {
  return (
    <Box mb={3}>
      <Box display="flex" alignItems="center" mb={description ? 1 : 0}>
        {IconComponent ? (
          <IconComponent sx={{ 
            mr: 2, 
            fontSize: 32, 
            color: '#4caf50',
            filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.3))'
          }} />
        ) : null}
        <Typography 
          variant="h4" 
          component="h1" 
          fontWeight="bold"
          sx={{
            color: 'rgba(255, 255, 255, 0.95)',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
            filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
          }}
        >
          {title}
        </Typography>
      </Box>
      {description && (
        <Typography 
          variant="body1" 
          sx={{ 
            ml: 0,
            color: 'rgba(255, 255, 255, 0.8)',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
            filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2))'
          }}
        >
          {description}
        </Typography>
      )}
    </Box>
  );
};

export default PageTitle;


