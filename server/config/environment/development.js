'use strict';

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
  mongo: {
    //uri: 'mongodb://funtootstageqa.southeastasia.cloudapp.azure.com:57017/wpapp'
    uri: 'mongodb://localhost:27017/wpapp-dev'
  },

  seedDB: false
};
