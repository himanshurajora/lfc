import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { confirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { isAdmin, ADMIN_UID } from '../../config/admin';
import { useAuthContext } from '../../contexts/AuthContext';
import { adminService } from '../../services/admin.service';
import { UserProfile } from '../../types/user';
import { LoadingSpinner } from '../common/LoadingSpinner';

/**
 * Admin dashboard — lists all users with ban/unban functionality.
 * Only accessible by the platform admin (ADMIN_UID).
 */
export const AdminPage: FC = () => {
  const { user, loading: authLoading } = useAuthContext();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const allUsers = await adminService.getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      console.error('Failed to load users:', err);
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin(user?.uid)) {
      fetchUsers();
    }
  }, [user?.uid, fetchUsers]);

  const filteredUsers = useMemo(() => {
    if (!filter.trim()) return users;
    const q = filter.toLowerCase();
    return users.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.displayName?.toLowerCase().includes(q) ||
        u.uid.toLowerCase().includes(q),
    );
  }, [users, filter]);

  const handleBan = useCallback(
    (targetUser: UserProfile) => {
      if (targetUser.uid === ADMIN_UID) {
        toast.error("You can't ban yourself.");
        return;
      }
      confirmDialog({
        message: `Are you sure you want to ban "${targetUser.displayName || targetUser.username}"? They will be unable to log in and their projects will be hidden.`,
        header: 'Confirm Ban',
        icon: 'pi pi-exclamation-triangle',
        acceptClassName: 'p-button-danger',
        accept: async () => {
          try {
            await adminService.banUser(targetUser.uid);
            setUsers((prev) =>
              prev.map((u) =>
                u.uid === targetUser.uid ? { ...u, banned: true } : u,
              ),
            );
            toast.success(`${targetUser.displayName || targetUser.username} has been banned.`);
          } catch {
            toast.error('Failed to ban user.');
          }
        },
      });
    },
    [],
  );

  const handleUnban = useCallback(
    async (targetUser: UserProfile) => {
      try {
        await adminService.unbanUser(targetUser.uid);
        setUsers((prev) =>
          prev.map((u) =>
            u.uid === targetUser.uid ? { ...u, banned: false } : u,
          ),
        );
        toast.success(`${targetUser.displayName || targetUser.username} has been unbanned.`);
      } catch {
        toast.error('Failed to unban user.');
      }
    },
    [],
  );

  // Auth guard
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  if (!isAdmin(user?.uid)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {users.length} registered users · {users.filter((u) => u.banned).length} banned
          </p>
        </div>
        <Button
          icon="pi pi-refresh"
          label="Refresh"
          severity="secondary"
          outlined
          size="small"
          onClick={fetchUsers}
          loading={loading}
        />
      </div>

      <div className="mb-4">
        <span className="p-input-icon-left w-full sm:w-80">
          <i className="pi pi-search" />
          <InputText
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search by username, name, or UID..."
            className="w-full"
          />
        </span>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading users..." />
      ) : (
        <DataTable
          value={filteredUsers}
          paginator
          rows={15}
          rowsPerPageOptions={[15, 30, 50]}
          sortField="createdAt"
          sortOrder={-1}
          emptyMessage="No users found."
          stripedRows
          size="small"
          className="text-sm"
        >
          <Column
            header="User"
            body={(rowData: UserProfile) => (
              <div className="flex items-center gap-2">
                <Avatar
                  image={rowData.avatarUrl}
                  shape="circle"
                  size="normal"
                />
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    {rowData.displayName || rowData.username}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    @{rowData.username}
                  </div>
                </div>
              </div>
            )}
            sortable
            sortField="username"
            style={{ minWidth: '200px' }}
          />
          <Column
            header="UID"
            body={(rowData: UserProfile) => (
              <span className="text-xs font-mono text-gray-500 truncate block max-w-[180px]" title={rowData.uid}>
                {rowData.uid}
              </span>
            )}
            style={{ minWidth: '120px' }}
          />
          <Column
            header="Experience"
            field="experienceLevel"
            body={(rowData: UserProfile) => (
              <Tag
                value={rowData.experienceLevel ?? 'beginner'}
                severity={
                  rowData.experienceLevel === 'expert'
                    ? 'danger'
                    : rowData.experienceLevel === 'advanced'
                      ? 'warning'
                      : rowData.experienceLevel === 'intermediate'
                        ? 'info'
                        : 'success'
                }
              />
            )}
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column
            header="Projects"
            field="projectsCreated"
            sortable
            style={{ minWidth: '90px', textAlign: 'center' }}
          />
          <Column
            header="Status"
            body={(rowData: UserProfile) =>
              rowData.banned ? (
                <Tag value="Banned" severity="danger" />
              ) : (
                <Tag value="Active" severity="success" />
              )
            }
            sortable
            sortField="banned"
            style={{ minWidth: '90px' }}
          />
          <Column
            header="Action"
            body={(rowData: UserProfile) => {
              if (rowData.uid === ADMIN_UID) return null;
              return rowData.banned ? (
                <Button
                  label="Unban"
                  icon="pi pi-check"
                  severity="success"
                  size="small"
                  outlined
                  onClick={() => handleUnban(rowData)}
                />
              ) : (
                <Button
                  label="Ban"
                  icon="pi pi-ban"
                  severity="danger"
                  size="small"
                  outlined
                  onClick={() => handleBan(rowData)}
                />
              );
            }}
            style={{ minWidth: '100px' }}
          />
        </DataTable>
      )}
    </div>
  );
};
