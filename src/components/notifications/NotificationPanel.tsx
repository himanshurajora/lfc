import { FC } from 'react';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts';
import { useNotifications } from '../../hooks/useNotifications';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { NotificationType } from '../../types/notification';

const ICON_MAP: Record<NotificationType, string> = {
  [NotificationType.INTEREST_RECEIVED]: 'pi pi-heart text-pink-500',
  [NotificationType.INTEREST_ACCEPTED]: 'pi pi-check-circle text-green-500',
  [NotificationType.INTEREST_REJECTED]: 'pi pi-times-circle text-red-500',
  [NotificationType.COMMENT_ADDED]: 'pi pi-comment text-blue-500',
  [NotificationType.COMMENT_REPLY]: 'pi pi-reply text-blue-400',
  [NotificationType.PROJECT_BOOKMARKED]: 'pi pi-bookmark text-yellow-500',
  [NotificationType.PROJECT_UPDATED]: 'pi pi-refresh text-purple-500',
};

/**
 * Notification panel displayed in the navbar overlay.
 */
export const NotificationPanel: FC = () => {
  const { user } = useAuthContext();
  const { notifications, loading, markAsRead, markAllAsRead, unreadCount } =
    useNotifications(user?.uid ?? null);
  const navigate = useNavigate();

  if (!user) {
    return <p className="p-4 text-gray-500 text-sm">Log in to see notifications.</p>;
  }

  if (loading) return <LoadingSpinner message="Loading notifications..." />;

  return (
    <div className="flex flex-col max-h-96 overflow-auto">
      <div className="flex items-center justify-between p-2 sticky top-0 bg-white z-10">
        <h3 className="font-bold text-sm">Notifications</h3>
        {unreadCount > 0 && (
          <Button
            label="Mark all read"
            size="small"
            text
            onClick={markAllAsRead}
          />
        )}
      </div>

      <Divider className="my-0" />

      {notifications.length === 0 ? (
        <EmptyState
          icon="pi pi-bell"
          title="No Notifications"
          description="You're all caught up!"
        />
      ) : (
        notifications.map((notification) => {
          const createdDate = notification.createdAt?.toDate?.()
            ? notification.createdAt.toDate()
            : new Date();

          return (
            <div
              key={notification.id}
              className={`flex gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors border-b ${
                !notification.read ? 'bg-blue-50' : ''
              }`}
              onClick={() => {
                markAsRead(notification.id);
                if (notification.metadata?.projectId) {
                  navigate(`/project/${notification.metadata.projectId}`);
                }
              }}
            >
              <i
                className={`${
                  ICON_MAP[notification.type] ?? 'pi pi-bell text-gray-500'
                } text-lg mt-1`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {notification.title}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(createdDate, { addSuffix: true })}
                </p>
              </div>
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
