// cPanel Node.js application startup file
// This wraps the Next.js standalone server for Passenger/cPanel compatibility
process.env.HOSTNAME = '0.0.0.0';
process.env.PORT = process.env.PORT || '3000';

require('./server.js');
