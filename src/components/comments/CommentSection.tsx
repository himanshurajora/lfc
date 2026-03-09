import { FC, useCallback, useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Divider } from 'primereact/divider';
import { Comment as CommentType } from '../../types/comment';
import { commentService } from '../../services/comment.service';
import { notificationService } from '../../services/notification.service';
import { NotificationType } from '../../types/notification';
import { projectService } from '../../services/project.service';
import { useAuthContext } from '../../contexts';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { CommentItem } from './CommentItem';
import toast from 'react-hot-toast';

interface CommentSectionProps {
  projectId: string;
}

/**
 * Threaded comment section for project discussions.
 */
export const CommentSection: FC<CommentSectionProps> = ({ projectId }) => {
  const { user } = useAuthContext();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const list = await commentService.getComments(projectId);
      setComments(list);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    // Use real-time subscription
    const unsubscribe = commentService.subscribeToComments(
      projectId,
      (updatedComments) => {
        setComments(updatedComments);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [projectId]);

  const handleAddComment = async () => {
    if (!user) {
      toast.error('Please log in to comment.');
      return;
    }
    if (newComment.trim().length < 3) {
      toast.error('Comment must be at least 3 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await commentService.addComment(
        projectId,
        user.uid,
        user.username,
        user.avatarUrl,
        { content: newComment.trim(), parentId: null },
      );

      // Notify the project author
      const project = await projectService.getProject(projectId);
      if (project && project.authorId !== user.uid) {
        await notificationService.createNotification(
          project.authorId,
          NotificationType.COMMENT_ADDED,
          'New Comment',
          `${user.username} commented on "${project.name}"`,
          projectId,
          { projectId },
        );
      }

      setNewComment('');
      toast.success('Comment added!');
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentService.deleteComment(projectId, commentId);
      toast.success('Comment deleted.');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment.');
    }
  };

  if (loading) return <LoadingSpinner message="Loading discussion..." />;

  return (
    <div className="flex flex-col gap-4">
      {/* New Comment Box */}
      {user ? (
        <div className="flex flex-col gap-2">
          <InputTextarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="w-full"
            placeholder="Join the discussion..."
          />
          <div className="flex justify-between items-center">
            <small className="text-gray-400">
              {newComment.length}/2000 characters
            </small>
            <Button
              label="Post Comment"
              icon="pi pi-send"
              size="small"
              onClick={handleAddComment}
              loading={submitting}
              disabled={newComment.trim().length < 3}
            />
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-sm bg-slate-50 p-3 rounded">
          Log in to join the discussion.
        </p>
      )}

      <Divider />

      {/* Comment List */}
      {comments.length === 0 ? (
        <EmptyState
          icon="pi pi-comments"
          title="No Comments Yet"
          description="Start the conversation!"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              projectId={projectId}
              onDelete={handleDeleteComment}
              depth={0}
            />
          ))}
        </div>
      )}
    </div>
  );
};
