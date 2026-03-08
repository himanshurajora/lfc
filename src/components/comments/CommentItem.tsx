import { FC, useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Chip } from 'primereact/chip';
import { formatDistanceToNow } from 'date-fns';
import { Comment as CommentType } from '../../types/comment';
import { commentService } from '../../services/comment.service';
import { useAuthContext } from '../../contexts';
import { githubService } from '../../services/github.service';
import toast from 'react-hot-toast';

interface CommentItemProps {
  comment: CommentType;
  projectId: string;
  onDelete: (commentId: string) => void;
  depth: number;
}

const MAX_REPLY_DEPTH = 3;

/**
 * Single comment with nested reply support.
 */
export const CommentItem: FC<CommentItemProps> = ({
  comment,
  projectId,
  onDelete,
  depth,
}) => {
  const { user } = useAuthContext();
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replies, setReplies] = useState<CommentType[]>([]);
  const [showReplies, setShowReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isAuthor = user?.uid === comment.authorId;
  const createdDate = comment.createdAt?.toDate?.()
    ? comment.createdAt.toDate()
    : new Date();

  const fetchReplies = async () => {
    if (comment.replyCount === 0) return;
    setLoadingReplies(true);
    try {
      const list = await commentService.getReplies(projectId, comment.id);
      setReplies(list);
    } catch (error) {
      console.error('Failed to fetch replies:', error);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleToggleReplies = () => {
    if (!showReplies && replies.length === 0) {
      fetchReplies();
    }
    setShowReplies(!showReplies);
  };

  const handleReply = async () => {
    if (!user || replyContent.trim().length < 3) return;

    setSubmitting(true);
    try {
      await commentService.addComment(
        projectId,
        user.uid,
        user.username,
        user.avatarUrl,
        { content: replyContent.trim(), parentId: comment.id },
      );
      setReplyContent('');
      setShowReplyBox(false);
      toast.success('Reply added!');
      // Refresh replies
      fetchReplies();
      setShowReplies(true);
    } catch (error) {
      console.error('Failed to reply:', error);
      toast.error('Failed to post reply.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`flex flex-col gap-2 ${
        depth > 0 ? 'ml-6 pl-4 border-l-2 border-slate-200' : ''
      }`}
    >
      <div className="p-3 bg-white rounded-lg border hover:bg-slate-50 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Chip
              label={comment.authorUsername}
              image={githubService.getAvatarUrl(comment.authorUsername)}
              className="text-xs"
            />
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(createdDate, { addSuffix: true })}
            </span>
          </div>

          {isAuthor && (
            <Button
              icon="pi pi-trash"
              size="small"
              severity="danger"
              text
              rounded
              onClick={() => onDelete(comment.id)}
            />
          )}
        </div>

        {/* Content */}
        <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-2">
          {depth < MAX_REPLY_DEPTH && user && (
            <Button
              label="Reply"
              icon="pi pi-reply"
              size="small"
              text
              onClick={() => setShowReplyBox(!showReplyBox)}
            />
          )}
          {comment.replyCount > 0 && (
            <Button
              label={`${showReplies ? 'Hide' : 'Show'} ${comment.replyCount} ${
                comment.replyCount === 1 ? 'reply' : 'replies'
              }`}
              icon={showReplies ? 'pi pi-chevron-up' : 'pi pi-chevron-down'}
              size="small"
              text
              onClick={handleToggleReplies}
            />
          )}
        </div>

        {/* Reply Input */}
        {showReplyBox && (
          <div className="flex flex-col gap-2 mt-2">
            <InputTextarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={2}
              className="w-full text-sm"
              placeholder="Write a reply..."
            />
            <div className="flex justify-end gap-2">
              <Button
                label="Cancel"
                size="small"
                severity="secondary"
                text
                onClick={() => setShowReplyBox(false)}
              />
              <Button
                label="Reply"
                icon="pi pi-send"
                size="small"
                onClick={handleReply}
                loading={submitting}
                disabled={replyContent.trim().length < 3}
              />
            </div>
          </div>
        )}
      </div>

      {/* Nested Replies */}
      {showReplies && (
        <div className="flex flex-col gap-2">
          {loadingReplies ? (
            <p className="text-xs text-gray-400 ml-6">Loading replies...</p>
          ) : (
            replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                projectId={projectId}
                onDelete={onDelete}
                depth={depth + 1}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
