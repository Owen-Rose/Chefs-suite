// jest.setup.js
import '@testing-library/jest-dom';

// Add TextEncoder/TextDecoder polyfill
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock environment variables for MongoDB
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.MONGODB_DB = 'test';

// Import our MongoDB mock
require('./__tests__/mocks/mongodb');