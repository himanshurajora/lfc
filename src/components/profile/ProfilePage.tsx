import { FC, useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { MultiSelect } from 'primereact/multiselect';
import { Chip } from 'primereact/chip';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

import { useAuthContext } from '../../contexts';
import { UserProfile } from '../../types/user';
import { Project } from '../../types/project';
import { SUPPORTED_LANGUAGES } from '../../types/project';
import { authService } from '../../services/auth.service';
import { projectService } from '../../services/project.service';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { ProjectCard } from '../projects/ProjectCard';

/**
 * Profile page showing user information, skills, and projects.
 * If viewing own profile, allows editing.
 */
export const ProfilePage: FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, updateProfile: updateAuthProfile } = useAuthContext();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogVisible, setEditDialogVisible] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    websiteUrl: '',
    skills: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  const isOwnProfile = user?.uid === userId;

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const [userProfile, userProjects] = await Promise.all([
        authService.getProfile(userId),
        projectService.getProjectsByAuthor(userId),
      ]);
      setProfile(userProfile);
      setProjects(userProjects);
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const openEditDialog = () => {
    if (!profile) return;
    setEditForm({
      displayName: profile.displayName || '',
      bio: profile.bio || '',
      websiteUrl: profile.websiteUrl || '',
      skills: profile.skills || [],
    });
    setEditDialogVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    try {
      setSaving(true);
      await authService.updateProfile(userId, {
        displayName: editForm.displayName,
        bio: editForm.bio,
        websiteUrl: editForm.websiteUrl,
        skills: editForm.skills,
      });
      if (updateAuthProfile) {
        updateAuthProfile({
          displayName: editForm.displayName,
          bio: editForm.bio,
          websiteUrl: editForm.websiteUrl,
          skills: editForm.skills,
        });
      }
      setProfile((prev) =>
        prev ? { ...prev, ...editForm } : prev
      );
      setEditDialogVisible(false);
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading profile..." />;

  if (!profile) {
    return (
      <EmptyState
        icon="pi pi-user"
        title="User Not Found"
        description="The profile you are looking for does not exist."
      />
    );
  }

  const joinedDate = profile.createdAt?.toDate?.()
    ? profile.createdAt.toDate()
    : new Date();

  const skillOptions = SUPPORTED_LANGUAGES.map((lang) => ({
    label: lang,
    value: lang,
  }));

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start gap-6">
          <img
            src={
              profile.avatarUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                profile.displayName || 'User'
              )}&background=6366f1&color=fff&size=128`
            }
            alt={profile.displayName || 'User'}
            className="w-24 h-24 rounded-full object-cover border-2 border-indigo-200"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.displayName || 'Unknown User'}
                </h1>
                {profile.username && (
                  <a
                    href={profile.githubUrl || `https://github.com/${profile.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <i className="pi pi-github" /> @{profile.username}
                  </a>
                )}
              </div>

              {isOwnProfile && (
                <Button
                  label="Edit Profile"
                  icon="pi pi-pencil"
                  size="small"
                  outlined
                  onClick={openEditDialog}
                />
              )}
            </div>

            {profile.bio && (
              <p className="text-gray-600 mt-2">{profile.bio}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
              {profile.email && (
                <span className="flex items-center gap-1">
                  <i className="pi pi-envelope" /> {profile.email}
                </span>
              )}
              {profile.websiteUrl && (
                <a
                  href={profile.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <i className="pi pi-globe" /> Website
                </a>
              )}
              <span className="flex items-center gap-1">
                <i className="pi pi-calendar" /> Joined{' '}
                {formatDistanceToNow(joinedDate, { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <>
            <Divider />
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Skills & Technologies
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <Chip key={skill} label={skill} className="text-sm" />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Projects"
          value={projects.length}
          icon="pi pi-folder"
        />
        <StatCard
          label="Total Views"
          value={projects.reduce((sum, p) => sum + (p.viewCount ?? 0), 0)}
          icon="pi pi-eye"
        />
        <StatCard
          label="Total Interests"
          value={projects.reduce((sum, p) => sum + (p.interestCount ?? 0), 0)}
          icon="pi pi-heart"
        />
      </div>

      {/* Projects */}
      <div>
        <h2 className="text-lg font-bold mb-4">
          {isOwnProfile ? 'Your Projects' : `${profile.displayName}'s Projects`}
        </h2>

        {projects.length === 0 ? (
          <EmptyState
            icon="pi pi-folder-open"
            title="No Projects Yet"
            description={
              isOwnProfile
                ? "You haven't added any projects yet. Add one to start finding contributors!"
                : 'This user has no projects listed.'
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile Dialog */}
      <Dialog
        header="Edit Profile"
        visible={editDialogVisible}
        onHide={() => setEditDialogVisible(false)}
        className="w-full md:w-[28rem]"
        modal
      >
        <div className="flex flex-col gap-4 pt-2">
          <div>
            <label className="block text-sm font-medium mb-1">
              Display Name
            </label>
            <InputText
              value={editForm.displayName}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  displayName: e.target.value,
                }))
              }
              className="w-full"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <InputTextarea
              value={editForm.bio}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  bio: e.target.value,
                }))
              }
              className="w-full"
              rows={3}
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Website URL
            </label>
            <InputText
              value={editForm.websiteUrl}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  websiteUrl: e.target.value,
                }))
              }
              className="w-full"
              placeholder="https://your-website.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Skills</label>
            <MultiSelect
              value={editForm.skills}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  skills: e.value as string[],
                }))
              }
              options={skillOptions}
              placeholder="Select skills"
              className="w-full"
              filter
              maxSelectedLabels={5}
            />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button
              label="Cancel"
              severity="secondary"
              text
              onClick={() => setEditDialogVisible(false)}
            />
            <Button
              label="Save"
              icon={saving ? '' : 'pi pi-check'}
              loading={saving}
              onClick={handleSaveProfile}
              disabled={!editForm.displayName.trim()}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

/** Small stat card component */
const StatCard: FC<{ label: string; value: number; icon: string }> = ({
  label,
  value,
  icon,
}) => (
  <div className="bg-white rounded-lg shadow p-4 text-center">
    <i className={`${icon} text-xl text-indigo-500`} />
    <p className="text-2xl font-bold mt-1">{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </div>
);
