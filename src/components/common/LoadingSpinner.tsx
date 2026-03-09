import { FC } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';

interface LoadingSpinnerProps {
  message?: string;
  fullPage?: boolean;
}

/** Reusable loading indicator with optional message. */
export const LoadingSpinner: FC<LoadingSpinnerProps> = ({
  message,
  fullPage = false,
}) => (
  <div
    className={`flex flex-col items-center justify-center gap-3 ${
      fullPage ? 'min-h-[80vh]' : 'p-8'
    }`}
  >
    <ProgressSpinner
      style={{ width: '50px', height: '50px' }}
      strokeWidth="4"
    />
    {message && <p className="text-gray-500 text-sm">{message}</p>}
  </div>
);
