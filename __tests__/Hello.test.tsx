// tests/Hello.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import Hello from '../components/Hello';

test('renders the Hello component', () => {
    render(<Hello />);
    const headingElement = screen.getByRole('heading', { name: /hello world/i });
    expect(headingElement).toBeInTheDocument();
});
