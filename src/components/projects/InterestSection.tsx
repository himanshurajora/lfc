import { FC, useCallback, useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { Chip } from 'primereact/chip';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { useNavigate } from 'react-router-dom';
import { Project } from '../../types/project';
import { ContributorInterest, InterestStatus } from '../../types/interest';
import { interestService } from '../../services/interest.service';
import { useAuthContext } from '../../contexts';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { githubService } from '../../services/github.service';
import toast from 'react-hot-toast';

interface InterestSectionProps {
  project: Project;
}

const STATUS_SEVERITY: Record<InterestStatus, 'warning' | 'success' | 'danger' | 'info'> = {
  [InterestStatus.PENDING]: 'warning',
  [InterestStatus.ACCEPTED]: 'success',
  [InterestStatus.REJECTED]: 'danger',
  [InterestStatus.WITHDRAWN]: 'info',
};

/**
 * Section showing contributor interests and allowing new applications.
 */
export const InterestSection: FC<InterestSectionProps> = ({ project }) => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [interests, setInterests] = useState<ContributorInterest[]>([]);
  const [myInterest, setMyInterest] = useState<ContributorInterest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [message, setMessage] = useState('');
  const [skills, setSkills] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isOwner = user?.uid === project.authorId;

  const fetchInterests = useCallback(async () => {
    setLoading(true);
    try {
      const list = await interestService.getInterests(project.id);
      setInterests(list);

      if (user) {
        const my = list.find((i) => i.userId === user.uid) ?? null;
        setMyInterest(my);
      }
    } catch (error) {
      console.error('Failed to fetch interests:', error);
    } finally {
      setLoading(false);
    }
  }, [project.id, user]);

  useEffect(() => {
    fetchInterests();
  }, [fetchInterests]);

  const handleExpressInterest = async () => {
    if (!user) {
      toast.error('Please log in to express interest.');
      return;
    }

    if (message.length < 20) {
      toast.error('Message must be at least 20 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await interestService.expressInterest(
        project.id,
        user.uid,
        user.username,
        user.avatarUrl,
        {
          message,
          skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        },
        project.authorId,
        project.name,
      );
      toast.success('Interest submitted!');
      setShowDialog(false);
      setMessage('');
      setSkills('');
      fetchInterests();
    } catch (error) {
      console.error('Failed to express interest:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit interest.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (interest: ContributorInterest) => {
    try {
      await interestService.acceptInterest(
        project.id,
        interest.id,
        interest.userId,
        project.name,
      );
      toast.success(`Accepted ${interest.username}!`);
      fetchInterests();
    } catch (error) {
      console.error('Failed to accept interest:', error);
      toast.error('Failed to accept interest.');
    }
  };

  const handleReject = async (interest: ContributorInterest) => {
    try {
      await interestService.rejectInterest(
        project.id,
        interest.id,
        interest.userId,
        project.name,
      );
      toast.success('Interest rejected.');
      fetchInterests();
    } catch (error) {
      console.error('Failed to reject interest:', error);
      toast.error('Failed to reject interest.');
    }
  };

  const handleWithdraw = async () => {
    if (!myInterest) return;
    try {
      await interestService.withdrawInterest(project.id, myInterest.id);
      toast.success('Interest withdrawn.');
      setMyInterest(null);
      fetchInterests();
    } catch (error) {
      console.error('Failed to withdraw:', error);
      toast.error('Failed to withdraw interest.');
    }
  };

  if (loading) return <LoadingSpinner message="Loading contributor interests..." />;

  return (
    <div className="flex flex-col gap-4">
      {/* Action Button */}
      {!isOwner && user && !myInterest && (
        <Button
          label="I Want to Contribute!"
          icon="pi pi-heart"
          className="w-fit"
          onClick={() => setShowDialog(true)}
        />
      )}

      {myInterest && !isOwner && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          <Tag
            value={`Your interest: ${myInterest.status}`}
            severity={STATUS_SEVERITY[myInterest.status]}
          />
          {myInterest.status === InterestStatus.PENDING && (
            <Button
              label="Withdraw"
              icon="pi pi-times"
              severity="danger"
              size="small"
              outlined
              onClick={handleWithdraw}
            />
          )}
        </div>
      )}

      {!user && (
        <p className="text-gray-500 text-sm">
          Log in to express interest in contributing.
        </p>
      )}

      {/* Interest List */}
      {interests.length === 0 ? (
        <EmptyState
          icon="pi pi-users"
          title="No Contributors Yet"
          description="Be the first to express interest in contributing to this project!"
        />
      ) : (
        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-lg">
            {interests.length} Interested Contributor{interests.length > 1 ? 's' : ''}
          </h3>
          {interests.map((interest) => (
            <div
              key={interest.id}
              className="p-4 border rounded-lg bg-white hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Chip
                    label={interest.username}
                    image={githubService.getAvatarUrl(interest.username)}
                    className="cursor-pointer"
                    onClick={() => navigate(`/profile/${interest.userId}`)}
                  />
                  <Tag
                    value={interest.status}
                    severity={STATUS_SEVERITY[interest.status]}
                    className="text-xs"
                  />
                </div>

                {isOwner && interest.status === InterestStatus.PENDING && (
                  <div className="flex gap-2">
                    <Button
                      label="Accept"
                      icon="pi pi-check"
                      severity="success"
                      size="small"
                      onClick={() => handleAccept(interest)}
                    />
                    <Button
                      label="Reject"
                      icon="pi pi-times"
                      severity="danger"
                      size="small"
                      outlined
                      onClick={() => handleReject(interest)}
                    />
                  </div>
                )}
              </div>

              <p className="mt-2 text-sm text-gray-700">{interest.message}</p>

              {interest.skills.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {interest.skills.map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      className="text-xs bg-green-100 text-green-700"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Express Interest Dialog */}
      <Dialog
        header="Express Interest"
        visible={showDialog}
        style={{ width: '40vw' }}
        onHide={() => setShowDialog(false)}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="font-semibold text-sm block mb-1">
              Why do you want to contribute? *
            </label>
            <InputTextarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full"
              placeholder="Share your motivation, relevant experience, and what you'd like to work on..."
            />
            <small className="text-gray-400">
              {message.length}/1000 characters (min 20)
            </small>
          </div>

          <div>
            <label className="font-semibold text-sm block mb-1">
              Your Skills (comma-separated) *
            </label>
            <InputTextarea
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              rows={2}
              className="w-full"
              placeholder="e.g. React, TypeScript, Node.js, Docker"
            />
          </div>

          <Divider />

          <div className="flex justify-end gap-2">
            <Button
              label="Cancel"
              severity="secondary"
              outlined
              onClick={() => setShowDialog(false)}
            />
            <Button
              label="Submit"
              icon="pi pi-send"
              onClick={handleExpressInterest}
              loading={submitting}
              disabled={message.length < 20 || skills.trim().length === 0}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};
