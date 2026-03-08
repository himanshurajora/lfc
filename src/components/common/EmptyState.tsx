import { FC } from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/** Reusable empty state placeholder. */
export const EmptyState: FC<EmptyStateProps> = ({
  icon = 'pi pi-inbox',
  title,
  description,
  action,
}) => (
  <div className="flex flex-col items-center justify-center p-12 gap-3 text-center">
    <i className={`${icon} text-4xl text-gray-400`} />
    <h3 className="text-lg font-semibold text-gray-600">{title}</h3>
    {description && <p className="text-gray-400 text-sm max-w-md">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);
