import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Trash2, Loader2 } from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { addComment, deleteComment, deletePost, getComments } from '@/lib/communityPosts';
import { timeAgo } from '@/lib/timeAgo';
import type { CommunityComment, CommunityPost } from '@/data/types';

interface CommentsModalProps {
  post: CommunityPost;
  onClose: () => void;
  /** Called after any mutation (comment added/deleted, or the post itself deleted) so the caller's list can refresh. */
  onChanged: () => void;
}

// Full post + its comment thread, with delete on both the post (owner only)
// and each comment (owner only) — this is what Community's post cards and
// the Profile page's "My Posts" section both open. Mirrors EventModal.tsx's
// portal/escape-key/scroll-lock structure.
export function CommentsModal({ post, onClose, onChanged }: CommentsModalProps) {
  const { user, isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeletePost, setConfirmDeletePost] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState<number | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      setComments(await getComments(post.id));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn || !user) return;
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      await addComment({
        postId: post.id,
        clerkUserId: user.id,
        displayName: user.fullName ?? user.username ?? 'A Born to Fire member',
        body: text,
      });
      setInput('');
      await refresh();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not comment, please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleDeletePost = async () => {
    if (!user) return;
    setDeletingPost(true);
    try {
      await deletePost(post.id, user.id);
      onChanged();
      onClose();
    } finally {
      setDeletingPost(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!user) return;
    await deleteComment(commentId, user.id);
    setConfirmDeleteCommentId(null);
    await refresh();
    onChanged();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Post and comments"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-5 dark:border-gray-700">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{post.displayName}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {timeAgo(post.createdAt)} &middot; {post.state}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {post.body && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-gray-300">{post.body}</p>
          )}
          {post.imageUrl && (
            <img src={post.imageUrl} alt="" className="mt-3 max-h-80 w-full rounded-2xl object-cover" />
          )}

          {user?.id === post.clerkUserId && (
            <div className="mt-4">
              {confirmDeletePost ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Delete this post?</span>
                  <button
                    onClick={handleDeletePost}
                    disabled={deletingPost}
                    className="font-semibold text-red-500 hover:text-red-600 disabled:opacity-60"
                  >
                    {deletingPost ? 'Deleting...' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setConfirmDeletePost(false)}
                    className="font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeletePost(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete post
                </button>
              )}
            </div>
          )}

          <div className="mt-6 space-y-4 border-t border-gray-100 pt-5 dark:border-gray-700">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {comments.length} comment{comments.length === 1 ? '' : 's'}
            </p>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : comments.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">No comments yet - be the first to reply.</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      {c.displayName} <span className="font-normal text-gray-400 dark:text-gray-500">&middot; {timeAgo(c.createdAt)}</span>
                    </p>
                    <p className="mt-0.5 whitespace-pre-line text-sm text-gray-600 dark:text-gray-300">{c.body}</p>
                  </div>
                  {user?.id === c.clerkUserId &&
                    (confirmDeleteCommentId === c.id ? (
                      <div className="flex shrink-0 items-center gap-1.5 text-xs">
                        <button onClick={() => handleDeleteComment(c.id)} className="font-semibold text-red-500 hover:text-red-600">
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteCommentId(null)}
                          className="font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteCommentId(c.id)}
                        aria-label="Delete comment"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-300 transition hover:bg-red-50 hover:text-red-500 dark:text-gray-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ))}
                </div>
              ))
            )}
          </div>
        </div>

        {error && <p className="px-5 pb-1 text-xs text-red-500">{error}</p>}

        {isSignedIn ? (
          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-100 p-4 dark:border-gray-700">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Write a comment..."
              maxLength={500}
              disabled={sending}
              className="flex-1 rounded-full border-0 bg-gray-100 px-4 py-2.5 text-sm text-gray-900 outline-none ring-1 ring-transparent transition focus:ring-orange-500 disabled:opacity-60 dark:bg-gray-700 dark:text-white"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition-all duration-300 hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <div className="border-t border-gray-100 p-4 dark:border-gray-700">
            <button onClick={() => openSignIn()} className="btn-primary w-full !py-2.5 text-sm">
              Sign in to comment
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
