import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';

describe('LoadingSpinner', () => {
  it('renders with default message', () => {
    render(<LoadingSpinner />);
    // Should render a spinner element (ProgressSpinner from PrimeReact)
    expect(document.querySelector('.p-progress-spinner')).toBeTruthy();
  });

  it('renders with custom message', () => {
    render(<LoadingSpinner message="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        icon="pi pi-inbox"
        title="Nothing Here"
        description="There are no items to display."
      />,
    );
    expect(screen.getByText('Nothing Here')).toBeInTheDocument();
    expect(
      screen.getByText('There are no items to display.'),
    ).toBeInTheDocument();
  });
});

describe('ErrorBoundary', () => {
  // Suppress error output for intentional error test
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

  afterAll(() => spy.mockRestore());

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('renders error fallback when child throws', () => {
    const ThrowError = () => {
      throw new Error('Boom');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
  });
});
