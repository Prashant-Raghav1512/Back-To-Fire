import { useRef, useState } from 'react';
import { ImagePlus, MessageCircle, Sparkles, Video, X } from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { createPost, usePosts } from '@/lib/communityPosts';
import { compressImageToDataUrl } from '@/lib/imageUpload';
import { videoFileToDataUrl } from '@/lib/videoUpload';
import { timeAgo } from '@/lib/timeAgo';
import { sendFriendRequest, respondToFriendRequest, type UseFriendsResult } from '@/lib/friends';
import { FriendActionButton } from '@/components/community/FriendActionButton';
import { CommentsModal } from '@/components/community/CommentsModal';
import type { CommunityGroupType, CommunityPost, CommunityProfile } from '@/data/types';

interface GroupPostsProps {
  groupType: CommunityGroupType;
  groupKey: string;
  groupLabel: string;
  profile: CommunityProfile | null;
  friends: UseFriendsResult;
}

// A slower-paced feed alongside GroupChat's live chat — supports one
// optional attachment per post, either an image (compressed client-side,
// see src/lib/imageUpload.ts) or a video (size-capped only, no compression
// possible client-side — see src/lib/videoUpload.ts; video is deliberately
// posts-only, not also in GroupChat, since chat polls every 7s vs. posts'
// 15s, see db/schema.sql's community_messages comment) — and opens
// CommentsModal for replies. Posts are never seeded/mocked here: the feed
// only ever shows what usePosts() actually returns from Neon.
export function GroupPosts({ groupType, groupKey, groupLabel, profile, friends }: GroupPostsProps) {
  const { user, isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const { posts, refresh } = usePosts(groupType, groupKey);
  const [body, setBody] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [videoDataUrl, setVideoDataUrl] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [processingVideo, setProcessingVideo] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePost, setActivePost] = useState<CommunityPost | null>(null);
  const [friendBusyId, setFriendBusyId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleSendFriendRequest = async (toUserId: string, toDisplayName: string) => {
    if (!user || friendBusyId) return;
    setFriendBusyId(toUserId);
    try {
      await sendFriendRequest({
        fromUserId: user.id,
        fromDisplayName: user.fullName ?? user.username ?? 'A Born to Fire member',
        toUserId,
        toDisplayName,
      });
      await friends.refresh();
    } catch {
      // Button just stays in its current state - not worth a dedicated error UI for a secondary action.
    } finally {
      setFriendBusyId(null);
    }
  };

  const handleAcceptFriendRequest = async (requestId: number, fromUserId: string) => {
    if (!user || friendBusyId) return;
    setFriendBusyId(fromUserId);
    try {
      await respondToFriendRequest(requestId, user.id, true);
      await friends.refresh();
    } finally {
      setFriendBusyId(null);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMediaError(null);
    setCompressing(true);
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setImageDataUrl(dataUrl);
      setVideoDataUrl(null); // a post carries at most one attachment
    } catch (err) {
      setMediaError(err instanceof Error ? err.message : 'Could not process that image.');
    } finally {
      setCompressing(false);
    }
  };

  const handleVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMediaError(null);
    setProcessingVideo(true);
    try {
      const dataUrl = await videoFileToDataUrl(file);
      setVideoDataUrl(dataUrl);
      setImageDataUrl(null); // a post carries at most one attachment
    } catch (err) {
      setMediaError(err instanceof Error ? err.message : 'Could not process that video.');
    } finally {
      setProcessingVideo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || posting) return;
    setPosting(true);
    setError(null);
    try {
      await createPost({
        clerkUserId: user.id,
        displayName: profile.displayName,
        state: profile.state,
        groupType,
        groupKey,
        body,
        imageDataUrl,
        videoDataUrl,
      });
      setBody('');
      setImageDataUrl(null);
      setVideoDataUrl(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post, please try again.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {isSignedIn && profile ? (
        <form onSubmit={handleSubmit} className="space-y-3 border-b border-gray-100 p-4 dark:border-gray-700">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Share something with ${groupLabel}...`}
            maxLength={1000}
            rows={2}
            className="w-full resize-none rounded-2xl border-0 bg-gray-100 px-4 py-2.5 text-sm text-gray-900 outline-none ring-1 ring-transparent transition focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
          />
          {imageDataUrl && (
            <div className="relative inline-block">
              <img src={imageDataUrl} alt="" className="h-28 rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => setImageDataUrl(null)}
                aria-label="Remove image"
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-white shadow"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {videoDataUrl && (
            <div className="relative inline-block">
              <video src={videoDataUrl} controls className="h-28 rounded-xl" />
              <button
                type="button"
                onClick={() => setVideoDataUrl(null)}
                aria-label="Remove video"
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-white shadow"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {mediaError && <p className="text-xs text-red-500">{mediaError}</p>}
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={compressing || processingVideo}
                className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-200 disabled:opacity-60 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <ImagePlus className="h-3.5 w-3.5" /> {compressing ? 'Processing...' : 'Photo'}
              </button>
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={compressing || processingVideo}
                className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-200 disabled:opacity-60 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <Video className="h-3.5 w-3.5" /> {processingVideo ? 'Processing...' : 'Video'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoFile} className="hidden" />
            </div>
            <button
              type="submit"
              disabled={(!body.trim() && !imageDataUrl && !videoDataUrl) || posting}
              className="btn-primary !py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            >
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      ) : (
        <div className="border-b border-gray-100 p-4 dark:border-gray-700">
          <button onClick={() => openSignIn()} className="btn-primary w-full !py-2.5 text-sm">
            Sign in to post
          </button>
        </div>
      )}

      <div className="flex-1 space-y-4 p-4">
        {posts.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-500 dark:bg-orange-500/15 dark:text-orange-400">
              <Sparkles className="h-7 w-7" />
            </span>
            <div>
              <p className="font-display text-base font-bold text-gray-900 dark:text-white">
                No posts in {groupLabel} yet
              </p>
              <p className="mt-1 max-w-xs text-sm text-gray-500 dark:text-gray-400">
                Share a win, a question, or a photo/video — yours could be the first thing people see here.
              </p>
            </div>
          </div>
        )}
        {posts.map((p) => {
          const mine = p.clerkUserId === user?.id;
          return (
            <div
              key={p.id}
              onClick={() => setActivePost(p)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActivePost(p);
                }
              }}
              role="button"
              tabIndex={0}
              className="block w-full cursor-pointer rounded-2xl bg-gray-50 p-4 text-left transition hover:bg-gray-100 dark:bg-gray-700/40 dark:hover:bg-gray-700/70"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-gray-900 dark:text-white">
                  {p.displayName} <span className="font-normal text-gray-400 dark:text-gray-500">&middot; {timeAgo(p.createdAt)}</span>
                </p>
                {!mine && isSignedIn && profile && (
                  <span onClick={(e) => e.stopPropagation()}>
                    <FriendActionButton
                      friendStatus={friends.statusFor(p.clerkUserId)}
                      onSend={() => handleSendFriendRequest(p.clerkUserId, p.displayName)}
                      onAccept={(requestId) => handleAcceptFriendRequest(requestId, p.clerkUserId)}
                      busy={friendBusyId === p.clerkUserId}
                    />
                  </span>
                )}
              </div>
              {p.body && (
                <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-gray-600 dark:text-gray-300">{p.body}</p>
              )}
              {p.imageUrl && <img src={p.imageUrl} alt="" className="mt-2 max-h-52 w-full rounded-xl object-cover" />}
              {p.videoUrl && (
                <video
                  src={p.videoUrl}
                  controls
                  onClick={(e) => e.stopPropagation()}
                  className="mt-2 max-h-52 w-full rounded-xl bg-black"
                />
              )}
              <p className="mt-2 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <MessageCircle className="h-3.5 w-3.5" /> {p.commentCount} comment{p.commentCount === 1 ? '' : 's'}
              </p>
            </div>
          );
        })}
      </div>

      {activePost && <CommentsModal post={activePost} onClose={() => setActivePost(null)} onChanged={refresh} />}
    </div>
  );
}
