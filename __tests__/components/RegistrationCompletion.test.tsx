import { render, screen } from '@testing-library/react';
import RegistrationCompletion from '../../components/RegistrationCompletion';

// Mock the router
jest.mock('next/router', () => ({
    useRouter: () => ({
        query: {},
        push: jest.fn()
    })
}));

// Mock fetch
global.fetch = jest.fn();

describe('RegistrationCompletion', () => {
    test('renders loading state initially', () => {
        render(<RegistrationCompletion />);
        expect(screen.getByText('Verifying invitation...')).toBeInTheDocument();
    });
});