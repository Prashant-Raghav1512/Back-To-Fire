import { useCallback, useEffect, useRef, useState } from 'react';
import { neon } from '@neondatabase/serverless';
import { useUser } from '@clerk/clerk-react';
import type { CommunityComment, CommunityGroupType, CommunityPost } from '@/data/types';

// SECURITY NOTE: same browser-exposed connection as the rest of the
// Community feature (src/lib/community.ts) and contact/enrollments — see
// those files' own SECURITY NOTE comments for why a separate role wouldn't
// add real access restriction on this project.
const connectionString = import.meta.env.VITE_NEON_CONTACT_URL;

function client() {
  if (!connectionString) {
    throw new Error('Community is not configured (VITE_NEON_CONTACT_URL is unset).');
  }
  return neon(connectionString);
}

interface PostRow {
  id: number;
  clerk_user_id: string;
  display_name: string;
  state: string;
  group_type: CommunityGroupType;
  group_key: string;
  body: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  comment_count: string; // COUNT(...) comes back as a string from the driver
}

function rowToPost(row: PostRow): CommunityPost {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    displayName: row.display_name,
    state: row.state,
    groupType: row.group_type,
    groupKey: row.group_key,
    body: row.body,
    imageUrl: row.image_url,
    videoUrl: row.video_url,
    createdAt: row.created_at,
    commentCount: Number(row.comment_count),
  };
}

const POST_BODY_LIMIT = 1000;

export interface CreatePostParams {
  clerkUserId: string;
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

export async function createPost(params: CreatePostParams): Promise<void> {
  const trimmed = params.body.trim();
  if (!trimmed && !params.imageDataUrl && !params.videoDataUrl) {
    throw new Error('Write something or add a photo/video before posting.');
  }
  if (trimmed.length > POST_BODY_LIMIT) {
    throw new Error(`Keep posts under ${POST_BODY_LIMIT} characters.`);
  }

  const sql = client();
  await sql`
    INSERT INTO community_posts (clerk_user_id, display_name, state, group_type, group_key, body, image_url, video_url)
    VALUES (${params.clerkUserId}, ${params.displayName}, ${params.state}, ${params.groupType}, ${params.groupKey}, ${trimmed}, ${params.imageDataUrl ?? null}, ${params.videoDataUrl ?? null})
  `;
}

const POST_LIMIT = 100;

export async function getPosts(groupType: CommunityGroupType, groupKey: string): Promise<CommunityPost[]> {
  const sql = client();
  const rows = (await sql`
    SELECT p.id, p.clerk_user_id, p.display_name, p.state, p.group_type, p.group_key, p.body, p.image_url, p.video_url, p.created_at,
      COUNT(c.id) AS comment_count
    FROM community_posts p
    LEFT JOIN community_post_comments c ON c.post_id = p.id
    WHERE p.group_type = ${groupType} AND p.group_key = ${groupKey}
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT ${POST_LIMIT}
  `) as PostRow[];
  return rows.map(rowToPost);
}

export async function getMyPosts(clerkUserId: string): Promise<CommunityPost[]> {
  const sql = client();
  const rows = (await sql`
    SELECT p.id, p.clerk_user_id, p.display_name, p.state, p.group_type, p.group_key, p.body, p.image_url, p.video_url, p.created_at,
      COUNT(c.id) AS comment_count
    FROM community_posts p
    LEFT JOIN community_post_comments c ON c.post_id = p.id
    WHERE p.clerk_user_id = ${clerkUserId}
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `) as PostRow[];
  return rows.map(rowToPost);
}

// Scoped to the owner (WHERE ... AND clerk_user_id = ...) even though every
// visitor's browser already has full write access to this table directly
// (see the SECURITY NOTE above) — this isn't a real access control, just a
// guard against the app's own UI accidentally deleting the wrong row.
export async function deletePost(postId: number, clerkUserId: string): Promise<void> {
  const sql = client();
  await sql`DELETE FROM community_posts WHERE id = ${postId} AND clerk_user_id = ${clerkUserId}`;
}

interface CommentRow {
  id: number;
  post_id: number;
  clerk_user_id: string;
  display_name: string;
  body: string;
  created_at: string;
}

function rowToComment(row: CommentRow): CommunityComment {
  return {
    id: row.id,
    postId: row.post_id,
    clerkUserId: row.clerk_user_id,
    displayName: row.display_name,
    body: row.body,
    createdAt: row.created_at,
  };
}

export async function getComments(postId: number): Promise<CommunityComment[]> {
  const sql = client();
  const rows = (await sql`
    SELECT id, post_id, clerk_user_id, display_name, body, created_at
    FROM community_post_comments
    WHERE post_id = ${postId}
    ORDER BY created_at ASC
  `) as CommentRow[];
  return rows.map(rowToComment);
}

const COMMENT_LIMIT = 500;

export interface AddCommentParams {
  postId: number;
  clerkUserId: string;
  displayName: string;
  body: string;
}

export async function addComment(params: AddCommentParams): Promise<void> {
  const trimmed = params.body.trim();
  if (!trimmed) throw new Error('Comment cannot be empty.');
  if (trimmed.length > COMMENT_LIMIT) throw new Error(`Keep comments under ${COMMENT_LIMIT} characters.`);

  const sql = client();
  await sql`
    INSERT INTO community_post_comments (post_id, clerk_user_id, display_name, body)
    VALUES (${params.postId}, ${params.clerkUserId}, ${params.displayName}, ${trimmed})
  `;
}

export async function deleteComment(commentId: number, clerkUserId: string): Promise<void> {
  const sql = client();
  await sql`DELETE FROM community_post_comments WHERE id = ${commentId} AND clerk_user_id = ${clerkUserId}`;
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
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSignedIn || !user) {
      setPosts([]);
      return;
    }
    setLoading(true);
    try {
      setPosts(await getMyPosts(user.id));
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { posts, loading, refresh };
}
