import React from 'react';
import { Box, Typography } from '@mui/material';

const PageTitle = ({ icon: IconComponent, title, description }) => {
  return (
    <Box mb={3}>
      <Box display="flex" alignItems="center" mb={description ? 1 : 0}>
        {IconComponent ? (
          <IconComponent sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        ) : null}
        <Typography variant="h4" component="h1" fontWeight="bold">
          {title}
        </Typography>
      </Box>
      {description && (
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ ml: 0 }}
        >
          {description}
        </Typography>
      )}
    </Box>
  );
};

export default PageTitle;


