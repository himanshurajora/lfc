import { FC, useCallback, useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Chip } from 'primereact/chip';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import _ from 'lodash';
import { Project } from '../../types/project';
import { ProjectIssue, IssueDifficulty } from '../../types/issue';
import { issueService } from '../../services/issue.service';
import { useAuthContext } from '../../contexts';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import toast from 'react-hot-toast';

interface IssueListProps {
  project: Project;
}

const DIFFICULTY_SEVERITY: Record<IssueDifficulty, 'success' | 'info' | 'warning' | 'danger'> = {
  [IssueDifficulty.GOOD_FIRST_ISSUE]: 'success',
  [IssueDifficulty.EASY]: 'info',
  [IssueDifficulty.MEDIUM]: 'warning',
  [IssueDifficulty.HARD]: 'danger',
};

const difficultyOptions = Object.values(IssueDifficulty).map((d) => ({
  value: d,
  label: _.startCase(d),
}));

const contributionTypeOptions = [
  { value: 'code', label: 'Code' },
  { value: 'docs', label: 'Documentation' },
  { value: 'design', label: 'Design' },
  { value: 'testing', label: 'Testing' },
  { value: 'other', label: 'Other' },
];

/**
 * Issue/task list with create dialog for project owners.
 */
export const IssueList: FC<IssueListProps> = ({ project }) => {
  const { user } = useAuthContext();
  const [issues, setIssues] = useState<ProjectIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [githubIssueUrl, setGithubIssueUrl] = useState('');
  const [difficulty, setDifficulty] = useState<IssueDifficulty>(IssueDifficulty.EASY);
  const [labels, setLabels] = useState('');
  const [contributionType, setContributionType] = useState('code');

  const isOwner = user?.uid === project.authorId;

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const list = await issueService.getIssues(project.id);
      setIssues(list);
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setGithubIssueUrl('');
    setDifficulty(IssueDifficulty.EASY);
    setLabels('');
    setContributionType('code');
  };

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required.');
      return;
    }

    setSubmitting(true);
    try {
      await issueService.createIssue(project.id, {
        title: title.trim(),
        description: description.trim(),
        githubIssueUrl: githubIssueUrl.trim() || undefined,
        difficulty,
        labels: labels
          .split(',')
          .map((l) => l.trim())
          .filter(Boolean),
        contributionType,
      });
      toast.success('Issue created!');
      setShowCreateDialog(false);
      resetForm();
      fetchIssues();
    } catch (error) {
      console.error('Failed to create issue:', error);
      toast.error('Failed to create issue.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (issue: ProjectIssue) => {
    try {
      if (issue.isOpen) {
        await issueService.closeIssue(project.id, issue.id);
        toast.success('Issue closed.');
      } else {
        await issueService.updateIssue(project.id, issue.id, { isOpen: true });
        toast.success('Issue reopened.');
      }
      fetchIssues();
    } catch (error) {
      console.error('Failed to toggle issue:', error);
    }
  };

  const handleDelete = async (issueId: string) => {
    try {
      await issueService.deleteIssue(project.id, issueId);
      toast.success('Issue deleted.');
      fetchIssues();
    } catch (error) {
      console.error('Failed to delete issue:', error);
    }
  };

  if (loading) return <LoadingSpinner message="Loading issues..." />;

  return (
    <div className="flex flex-col gap-4">
      {isOwner && (
        <Button
          label="Add Issue / Task"
          icon="pi pi-plus"
          className="w-fit"
          onClick={() => setShowCreateDialog(true)}
        />
      )}

      {issues.length === 0 ? (
        <EmptyState
          icon="pi pi-list"
          title="No Issues or Tasks"
          description={
            isOwner
              ? 'Add issues or tasks that contributors can work on.'
              : 'No contribution tasks have been added yet.'
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className={`p-4 border rounded-lg ${
                issue.isOpen ? 'bg-white' : 'bg-gray-50 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <i
                    className={`pi ${
                      issue.isOpen ? 'pi-circle text-green-500' : 'pi-check-circle text-gray-400'
                    }`}
                  />
                  <h4 className={`font-semibold ${!issue.isOpen ? 'line-through' : ''}`}>
                    {issue.title}
                  </h4>
                  <Tag
                    value={_.startCase(issue.difficulty)}
                    severity={DIFFICULTY_SEVERITY[issue.difficulty]}
                    className="text-xs"
                  />
                  <Tag
                    value={_.startCase(issue.contributionType)}
                    className="text-xs bg-blue-100 text-blue-700"
                  />
                </div>

                {isOwner && (
                  <div className="flex gap-1">
                    <Button
                      icon={issue.isOpen ? 'pi pi-check' : 'pi pi-refresh'}
                      size="small"
                      text
                      severity={issue.isOpen ? 'success' : 'warning'}
                      tooltip={issue.isOpen ? 'Close' : 'Reopen'}
                      onClick={() => handleToggle(issue)}
                    />
                    <Button
                      icon="pi pi-trash"
                      size="small"
                      text
                      severity="danger"
                      onClick={() => handleDelete(issue.id)}
                    />
                  </div>
                )}
              </div>

              <p className="mt-2 text-sm text-gray-600">{issue.description}</p>

              {issue.labels.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {issue.labels.map((label) => (
                    <Chip
                      key={label}
                      label={label}
                      className="text-xs bg-slate-100"
                    />
                  ))}
                </div>
              )}

              {issue.githubIssueUrl && (
                <a
                  href={issue.githubIssueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline mt-2 inline-block"
                >
                  <i className="pi pi-external-link mr-1" />
                  View on GitHub
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Issue Dialog */}
      <Dialog
        header="Add Issue / Task"
        visible={showCreateDialog}
        style={{ width: '45vw' }}
        onHide={() => setShowCreateDialog(false)}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="font-semibold text-sm block mb-1">Title *</label>
            <InputText
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full"
              placeholder="e.g. Add dark mode support"
            />
          </div>

          <div>
            <label className="font-semibold text-sm block mb-1">
              Description *
            </label>
            <InputTextarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full"
              placeholder="Describe the task, expected outcome, and any links to design docs..."
            />
          </div>

          <div>
            <label className="font-semibold text-sm block mb-1">
              GitHub Issue URL
            </label>
            <InputText
              value={githubIssueUrl}
              onChange={(e) => setGithubIssueUrl(e.target.value)}
              className="w-full"
              placeholder="https://github.com/user/repo/issues/1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-sm block mb-1">
                Difficulty *
              </label>
              <Dropdown
                value={difficulty}
                onChange={(e) => setDifficulty(e.value)}
                options={difficultyOptions}
                optionLabel="label"
                className="w-full"
              />
            </div>
            <div>
              <label className="font-semibold text-sm block mb-1">
                Contribution Type *
              </label>
              <Dropdown
                value={contributionType}
                onChange={(e) => setContributionType(e.value)}
                options={contributionTypeOptions}
                optionLabel="label"
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-sm block mb-1">
              Labels (comma-separated)
            </label>
            <InputText
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              className="w-full"
              placeholder="e.g. frontend, ui, enhancement"
            />
          </div>

          <Divider />

          <div className="flex justify-end gap-2">
            <Button
              label="Cancel"
              severity="secondary"
              outlined
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
            />
            <Button
              label="Create Issue"
              icon="pi pi-check"
              onClick={handleCreate}
              loading={submitting}
              disabled={!title.trim() || !description.trim()}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};
