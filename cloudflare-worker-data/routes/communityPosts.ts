import type { Env } from '../env';
import { db } from '../db';
import { errorResponse, json, readJsonBody } from '../http';
import { isNonEmptyString, isOneOf, MAX_IMAGE_DATA_URL_CHARS, MAX_VIDEO_DATA_URL_CHARS } from '../validate';

const GROUP_TYPES = ['india', 'state', 'age', 'interest', 'event', 'members'] as const;
const POST_BODY_LIMIT = 1000;
const COMMENT_LIMIT = 500;
const POST_LIMIT = 100;

interface PostRow {
  id: number;
  clerk_user_id: string;
  display_name: string;
  state: string;
  group_type: string;
  group_key: string;
  body: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  comment_count: string;
}

function toPost(row: PostRow) {
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

export async function getPosts(env: Env, groupType: string, groupKey: string, headers: HeadersInit): Promise<Response> {
  if (!isOneOf(groupType, GROUP_TYPES) || !groupKey) return errorResponse('Invalid group.', headers);
  const sql = db(env);
  const rows = (await sql`
    SELECT p.id, p.clerk_user_id, p.display_name, p.state, p.group_type, p.group_key, p.body, p.image_url, p.video_url, p.created_at,
      COUNT(c.id) AS comment_count
    FROM community_posts p LEFT JOIN community_post_comments c ON c.post_id = p.id
    WHERE p.group_type = ${groupType} AND p.group_key = ${groupKey}
    GROUP BY p.id ORDER BY p.created_at DESC LIMIT ${POST_LIMIT}
  `) as PostRow[];
  return json(rows.map(toPost), headers);
}

export async function getMyPosts(env: Env, userId: string, headers: HeadersInit): Promise<Response> {
  const sql = db(env);
  const rows = (await sql`
    SELECT p.id, p.clerk_user_id, p.display_name, p.state, p.group_type, p.group_key, p.body, p.image_url, p.video_url, p.created_at,
      COUNT(c.id) AS comment_count
    FROM community_posts p LEFT JOIN community_post_comments c ON c.post_id = p.id
    WHERE p.clerk_user_id = ${userId} GROUP BY p.id ORDER BY p.created_at DESC
  `) as PostRow[];
  return json(rows.map(toPost), headers);
}

interface CreatePostBody {
  displayName: string;
  state: string;
  groupType: (typeof GROUP_TYPES)[number];
  groupKey: string;
  body: string;
  imageDataUrl?: string | null;
  videoDataUrl?: string | null;
}

function isCreatePostBody(body: unknown): body is CreatePostBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    isNonEmptyString(b.displayName, 200) &&
    isNonEmptyString(b.state, 100) &&
    isOneOf(b.groupType, GROUP_TYPES) &&
    isNonEmptyString(b.groupKey, 100) &&
    typeof b.body === 'string' &&
    b.body.length <= POST_BODY_LIMIT &&
    (b.imageDataUrl === undefined || b.imageDataUrl === null || (typeof b.imageDataUrl === 'string' && b.imageDataUrl.length <= MAX_IMAGE_DATA_URL_CHARS)) &&
    (b.videoDataUrl === undefined || b.videoDataUrl === null || (typeof b.videoDataUrl === 'string' && b.videoDataUrl.length <= MAX_VIDEO_DATA_URL_CHARS))
  );
}

export async function createPost(request: Request, env: Env, userId: string, headers: HeadersInit): Promise<Response> {
  const body = await readJsonBody(request);
  if (!isCreatePostBody(body)) return errorResponse('Invalid request shape.', headers);

  const trimmed = body.body.trim();
  if (!trimmed && !body.imageDataUrl && !body.videoDataUrl) {
    return errorResponse('Write something or add a photo/video before posting.', headers);
  }

  const sql = db(env);
  await sql`
    INSERT INTO community_posts (clerk_user_id, display_name, state, group_type, group_key, body, image_url, video_url)
    VALUES (${userId}, ${body.displayName}, ${body.state}, ${body.groupType}, ${body.groupKey}, ${trimmed}, ${body.imageDataUrl ?? null}, ${body.videoDataUrl ?? null})
  `;
  return json({ ok: true }, headers, 201);
}

export async function deletePost(env: Env, userId: string, postId: number, headers: HeadersInit): Promise<Response> {
  const sql = db(env);
  await sql`DELETE FROM community_posts WHERE id = ${postId} AND clerk_user_id = ${userId}`;
  return json({ ok: true }, headers);
}

interface CommentRow {
  id: number;
  post_id: number;
  clerk_user_id: string;
  display_name: string;
  body: string;
  created_at: string;
}

function toComment(row: CommentRow) {
  return {
    id: row.id,
    postId: row.post_id,
    clerkUserId: row.clerk_user_id,
    displayName: row.display_name,
    body: row.body,
    createdAt: row.created_at,
  };
}

export async function getComments(env: Env, postId: number, headers: HeadersInit): Promise<Response> {
  const sql = db(env);
  const rows = (await sql`
    SELECT id, post_id, clerk_user_id, display_name, body, created_at
    FROM community_post_comments WHERE post_id = ${postId} ORDER BY created_at ASC
  `) as CommentRow[];
  return json(rows.map(toComment), headers);
}

interface AddCommentBody {
  displayName: string;
  body: string;
}

function isAddCommentBody(body: unknown): body is AddCommentBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return isNonEmptyString(b.displayName, 200) && isNonEmptyString(b.body, COMMENT_LIMIT);
}

export async function addComment(
  request: Request,
  env: Env,
  userId: string,
  postId: number,
  headers: HeadersInit
): Promise<Response> {
  const body = await readJsonBody(request);
  if (!isAddCommentBody(body)) return errorResponse('Invalid request shape.', headers);

  const sql = db(env);
  await sql`
    INSERT INTO community_post_comments (post_id, clerk_user_id, display_name, body)
    VALUES (${postId}, ${userId}, ${body.displayName}, ${body.body.trim()})
  `;
  return json({ ok: true }, headers, 201);
}

export async function deleteComment(env: Env, userId: string, commentId: number, headers: HeadersInit): Promise<Response> {
  const sql = db(env);
  await sql`DELETE FROM community_post_comments WHERE id = ${commentId} AND clerk_user_id = ${userId}`;
  return json({ ok: true }, headers);
}
