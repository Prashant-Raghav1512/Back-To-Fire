// Data API Worker — replaces every browser-direct Neon connection
// (VITE_NEON_CONTACT_URL, now retired) across the site. Holds the real
// Neon credential server-side and verifies the visitor's actual Clerk
// session before trusting any user-scoped request — see auth.ts. Same
// deploy conventions as cloudflare-worker/ (the Groq proxy): npx
// wrangler login/secret put/deploy from inside this directory, secrets
// never committed, kept as a separate Worker so either can be rotated
// independently.
import type { Env } from './env';
import { corsHeaders, errorResponse, json } from './http';
import { verifyAuth } from './auth';

import { submitContact } from './routes/contact';
import { subscribeToNewsletter } from './routes/newsletter';
import { createEnrollment, listMyEnrollments } from './routes/enrollments';
import {
  addFamilyMember,
  cancelMembership,
  createMembership,
  getMyMembership,
  removeFamilyMember,
  searchMemberByMemberId,
} from './routes/membership';
import { getMessages, getMyProfile, postMessage, saveMyProfile } from './routes/community';
import {
  addComment,
  createPost,
  deleteComment,
  deletePost,
  getComments,
  getMyPosts,
  getPosts,
} from './routes/communityPosts';
import {
  cancelFriendRequest,
  listMyFriendRows,
  removeFriend,
  respondToFriendRequest,
  sendFriendRequest,
} from './routes/friends';
import { getConversation, sendDirectMessage } from './routes/directMessages';
import { getOrCreateFriendId, getTotalMemberCount, searchByFriendId } from './routes/friendId';
import {
  getArticleTranslation,
  getExerciseTranslation,
  saveArticleTranslation,
  saveExerciseTranslation,
} from './routes/translations';

function matchPath(pattern: string, pathname: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const p = patternParts[i];
    if (p.startsWith(':')) {
      params[p.slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (p !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

function parseIntParam(v: string | undefined): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const allowedOrigins = env.ALLOWED_ORIGIN.split(',').map((o) => o.trim());
    const origin = request.headers.get('Origin');
    const headers = corsHeaders(origin, allowedOrigins);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    const url = new URL(request.url);
    const { pathname, searchParams } = url;
    const method = request.method;

    // ---- Public routes (no session required) ----
    if (method === 'POST' && pathname === '/contact') return submitContact(request, env, headers);
    if (method === 'POST' && pathname === '/newsletter') return subscribeToNewsletter(request, env, headers);

    if (method === 'GET' && pathname === '/community/messages') {
      return getMessages(env, searchParams.get('groupType') ?? '', searchParams.get('groupKey') ?? '', headers);
    }
    if (method === 'GET' && pathname === '/community/posts') {
      return getPosts(env, searchParams.get('groupType') ?? '', searchParams.get('groupKey') ?? '', headers);
    }
    {
      const p = matchPath('/community/posts/:id/comments', pathname);
      if (method === 'GET' && p) {
        const postId = parseIntParam(p.id);
        if (postId === null) return errorResponse('Invalid post id.', headers, 400);
        return getComments(env, postId, headers);
      }
    }
    if (method === 'GET' && pathname === '/membership/search') {
      return searchMemberByMemberId(env, searchParams.get('memberId') ?? '', headers);
    }
    if (method === 'GET' && pathname === '/friend-id/search') {
      return searchByFriendId(env, searchParams.get('friendId') ?? '', headers);
    }
    if (method === 'GET' && pathname === '/member-count') {
      return getTotalMemberCount(env, headers);
    }
    if (method === 'GET' && pathname === '/translations/article') {
      return getArticleTranslation(env, searchParams.get('articleId') ?? '', searchParams.get('lang') ?? '', headers);
    }
    if (method === 'POST' && pathname === '/translations/article') {
      return saveArticleTranslation(request, env, headers);
    }
    if (method === 'GET' && pathname === '/translations/exercise') {
      return getExerciseTranslation(env, searchParams.get('exerciseId') ?? '', searchParams.get('lang') ?? '', headers);
    }
    if (method === 'POST' && pathname === '/translations/exercise') {
      return saveExerciseTranslation(request, env, headers);
    }

    // ---- Everything below requires a verified Clerk session ----
    const AUTH_REQUIRED_PREFIXES = [
      '/enrollments',
      '/membership',
      '/community/profile',
      '/community/my-posts',
      '/community/posts',
      '/community/comments',
      '/friends',
      '/friend-id',
      '/dm',
    ];
    if (AUTH_REQUIRED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
      const userId = await verifyAuth(request, env, allowedOrigins);
      if (!userId) return errorResponse('Sign-in required.', headers, 401);

      if (method === 'POST' && pathname === '/enrollments') return createEnrollment(request, env, userId, headers);
      if (method === 'GET' && pathname === '/enrollments') return listMyEnrollments(env, userId, headers);

      if (method === 'GET' && pathname === '/membership') return getMyMembership(env, userId, headers);
      if (method === 'POST' && pathname === '/membership') return createMembership(request, env, userId, headers);
      if (method === 'DELETE' && pathname === '/membership') return cancelMembership(env, userId, headers);
      if (method === 'POST' && pathname === '/membership/family') return addFamilyMember(request, env, userId, headers);
      {
        const p = matchPath('/membership/family/:id', pathname);
        if (method === 'DELETE' && p) {
          const id = parseIntParam(p.id);
          if (id === null) return errorResponse('Invalid id.', headers, 400);
          return removeFamilyMember(env, userId, id, headers);
        }
      }

      if (method === 'GET' && pathname === '/community/profile') return getMyProfile(env, userId, headers);
      if (method === 'POST' && pathname === '/community/profile') return saveMyProfile(request, env, userId, headers);
      if (method === 'POST' && pathname === '/community/messages') return postMessage(request, env, userId, headers);
      if (method === 'POST' && pathname === '/community/posts') return createPost(request, env, userId, headers);
      if (method === 'GET' && pathname === '/community/my-posts') return getMyPosts(env, userId, headers);
      {
        const p = matchPath('/community/posts/:id', pathname);
        if (method === 'DELETE' && p) {
          const id = parseIntParam(p.id);
          if (id === null) return errorResponse('Invalid post id.', headers, 400);
          return deletePost(env, userId, id, headers);
        }
      }
      {
        const p = matchPath('/community/posts/:id/comments', pathname);
        if (method === 'POST' && p) {
          const postId = parseIntParam(p.id);
          if (postId === null) return errorResponse('Invalid post id.', headers, 400);
          return addComment(request, env, userId, postId, headers);
        }
      }
      {
        const p = matchPath('/community/comments/:id', pathname);
        if (method === 'DELETE' && p) {
          const id = parseIntParam(p.id);
          if (id === null) return errorResponse('Invalid comment id.', headers, 400);
          return deleteComment(env, userId, id, headers);
        }
      }

      if (method === 'GET' && pathname === '/friends') return listMyFriendRows(env, userId, headers);
      if (method === 'POST' && pathname === '/friends/request') return sendFriendRequest(request, env, userId, headers);
      if (method === 'POST' && pathname === '/friends/respond') return respondToFriendRequest(request, env, userId, headers);
      {
        const p = matchPath('/friends/:id/cancel', pathname);
        if (method === 'DELETE' && p) {
          const id = parseIntParam(p.id);
          if (id === null) return errorResponse('Invalid request id.', headers, 400);
          return cancelFriendRequest(env, userId, id, headers);
        }
      }
      {
        const p = matchPath('/friends/:id', pathname);
        if (method === 'DELETE' && p) {
          const id = parseIntParam(p.id);
          if (id === null) return errorResponse('Invalid request id.', headers, 400);
          return removeFriend(env, userId, id, headers);
        }
      }

      if (method === 'GET' && pathname === '/friend-id') {
        return getOrCreateFriendId(env, userId, searchParams.get('displayName') ?? '', headers);
      }

      if (method === 'GET' && pathname === '/dm') return getConversation(env, userId, searchParams.get('with') ?? '', headers);
      if (method === 'POST' && pathname === '/dm') return sendDirectMessage(request, env, userId, headers);

      return errorResponse('Not found.', headers, 404);
    }

    return json({ error: { message: 'Not found.' } }, headers, 404);
  },
};
