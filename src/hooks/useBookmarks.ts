import { useCallback, useEffect, useState } from 'react';
import { bookmarkService } from '../services/bookmark.service';
import { Bookmark } from '../types/bookmark';
import toast from 'react-hot-toast';

/**
 * Hook for managing user bookmarks.
 */
export function useBookmarks(userId: string | null) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchBookmarks = useCallback(async () => {
    if (!userId) {
      setBookmarks([]);
      setBookmarkedIds(new Set());
      return;
    }

    setLoading(true);
    try {
      const list = await bookmarkService.getBookmarks(userId);
      setBookmarks(list);
      setBookmarkedIds(new Set(list.map((b) => b.projectId)));
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const toggleBookmark = useCallback(
    async (projectId: string, projectName: string, authorUsername: string) => {
      if (!userId) {
        toast.error('You must be logged in to bookmark projects.');
        return;
      }

      try {
        if (bookmarkedIds.has(projectId)) {
          await bookmarkService.removeBookmark(userId, projectId);
          setBookmarkedIds((prev) => {
            const next = new Set(prev);
            next.delete(projectId);
            return next;
          });
          setBookmarks((prev) => prev.filter((b) => b.projectId !== projectId));
          toast.success('Bookmark removed.');
        } else {
          const bookmark = await bookmarkService.addBookmark(
            userId,
            projectId,
            projectName,
            authorUsername,
          );
          setBookmarkedIds((prev) => new Set(prev).add(projectId));
          setBookmarks((prev) => [bookmark, ...prev]);
          toast.success('Project bookmarked!');
        }
      } catch (error) {
        console.error('Bookmark toggle failed:', error);
        toast.error('Failed to update bookmark.');
      }
    },
    [userId, bookmarkedIds],
  );

  const isBookmarked = useCallback(
    (projectId: string) => bookmarkedIds.has(projectId),
    [bookmarkedIds],
  );

  return {
    bookmarks,
    loading,
    toggleBookmark,
    isBookmarked,
    refetchBookmarks: fetchBookmarks,
  };
}
