const nextJest = require('next/jest')

const createJestConfig = nextJest({
    dir: './',
})

const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-jsdom',
    moduleDirectories: ['node_modules', '<rootDir>/'],
    testPathIgnorePatterns: ['<rootDir>/cypress/'],
    collectCoverage: true,
    collectCoverageFrom: [
        '**/*.{js,jsx,ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!<rootDir>/out/**',
        '!<rootDir>/.next/**',
        '!<rootDir>/*.config.js',
        '!<rootDir>/coverage/**',
    ],
}

module.exports = createJestConfig(customJestConfig)