import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import type { CommunityComment, CommunityGroupType, CommunityPost } from '@/data/types';
import { apiFetch, authedFetch } from '@/lib/dataApi';

export interface CreatePostParams {
  displayName: string;
  state: string;
  groupType: CommunityGroupType;
  groupKey: string;
  body: string;
  /** Base64 data URI from compressImageToDataUrl, or omitted for no image. Mutually exclusive with videoDataUrl. */
  imageDataUrl?: string | null;
  /** Base64 data URI from videoFileToDataUrl, or omitted for no video. Mutually exclusive with imageDataUrl. */
  videoDataUrl?: string | null;
}

export async function createPost(params: CreatePostParams, token: string | null): Promise<void> {
  await authedFetch('/community/posts', token, { method: 'POST', body: JSON.stringify(params) });
}

export async function getPosts(groupType: CommunityGroupType, groupKey: string): Promise<CommunityPost[]> {
  return apiFetch<CommunityPost[]>(
    `/community/posts?groupType=${encodeURIComponent(groupType)}&groupKey=${encodeURIComponent(groupKey)}`
  );
}

export async function getMyPosts(token: string | null): Promise<CommunityPost[]> {
  return authedFetch<CommunityPost[]>('/community/my-posts', token);
}

export async function deletePost(postId: number, token: string | null): Promise<void> {
  await authedFetch(`/community/posts/${postId}`, token, { method: 'DELETE' });
}

export async function getComments(postId: number): Promise<CommunityComment[]> {
  return apiFetch<CommunityComment[]>(`/community/posts/${postId}/comments`);
}

export interface AddCommentParams {
  postId: number;
  displayName: string;
  body: string;
}

export async function addComment(params: AddCommentParams, token: string | null): Promise<void> {
  await authedFetch(`/community/posts/${params.postId}/comments`, token, {
    method: 'POST',
    body: JSON.stringify({ displayName: params.displayName, body: params.body }),
  });
}

export async function deleteComment(commentId: number, token: string | null): Promise<void> {
  await authedFetch(`/community/comments/${commentId}`, token, { method: 'DELETE' });
}

// Polls less often than the live chat (useCommunityMessages' 7s) since a
// posts feed is a slower-paced, browse-when-you-open-it surface, not a
// real-time conversation.
const POST_POLL_INTERVAL_MS = 15000;

export function usePosts(groupType: CommunityGroupType, groupKey: string) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(false);
  const keyRef = useRef(groupKey);
  keyRef.current = groupKey;

  const refresh = useCallback(async () => {
    if (!keyRef.current) {
      setPosts([]);
      return;
    }
    setLoading(true);
    try {
      setPosts(await getPosts(groupType, keyRef.current));
    } catch (err) {
      console.error('Failed to load Community posts:', err);
    } finally {
      setLoading(false);
    }
  }, [groupType]);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, POST_POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [refresh, groupKey]);

  return { posts, loading, refresh };
}

// Powers the Profile page's "My Posts" section — fetches once on mount
// (no polling; a user's own post list doesn't need near-real-time refresh)
// and exposes `refresh` to call after a delete.
export function useMyPosts() {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSignedIn || !user) {
      setPosts([]);
      return;
    }
    setLoading(true);
    try {
      setPosts(await getMyPosts(await getToken()));
    } catch (err) {
      console.error('Failed to load your posts:', err);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, user, getToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { posts, loading, refresh };
}
