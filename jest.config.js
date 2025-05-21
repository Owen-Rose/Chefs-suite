const nextJest = require('next/jest');

/**
 * CreateJestConfig is a wrapper function from Next.js
 * It configures Jest for Next.js automatically (e.g., handling image imports, CSS modules, etc.).
 */
const createJestConfig = nextJest({
    // Provide the path to your Next.js application
    // If your next.config.mjs and pages/ folder live in the project root, this is './'.
    dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
    // Use ts-jest to handle TypeScript files
    preset: 'ts-jest',

    // Environment simulates the browser for React component tests
    testEnvironment: 'jsdom',

    // Run this setup file after Jest is installed in the environment
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

    // Tells Jest where to find your test files
    // This pattern looks in `_tests_` for any .test or .spec files with js, ts, jsx, or tsx extensions
    testMatch: [
        '<rootDir>/__tests__/**/*.(test|spec).{js,jsx,ts,tsx}',
    ],

    // Collect coverage from relevant folders (adjust to your preference)
    collectCoverageFrom: [
        'components/**/*.{ts,tsx}',
        'context/**/*.{ts,tsx}',
        'hooks/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
        'models/**/*.{ts,tsx}',
        'pages/**/*.{ts,tsx}',
        'utils/**/*.{ts,tsx}',
    ],

    // Exclude certain folders from test discovery or coverage
    // This is especially useful for ignoring build outputs, coverage reports, etc.
    testPathIgnorePatterns: [
        '<rootDir>/.next/',
        '<rootDir>/coverage/',
        '<rootDir>/node_modules/',
    ],
    coveragePathIgnorePatterns: [
        '<rootDir>/.next/',
        '<rootDir>/coverage/',
        '<rootDir>/node_modules/',
    ],

    transformIgnorePatterns: [
        '/node_modules/(?!(next-auth|@next-auth|jose|openid-client|@panva|cookie)/)'
    ],

    // If you use path aliases in tsconfig.json (e.g., @/components), map them here
    // moduleNameMapper: {
    //   '^@/(.*)$': '<rootDir>/$1',
    // },
};

// Wrap your custom config with next/jest's createJestConfig
module.exports = createJestConfig(customJestConfig);
