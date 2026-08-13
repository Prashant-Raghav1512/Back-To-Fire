import { useFriendId } from '@/lib/friendId';

// No UI — mounted once in App.tsx (same "mount app-wide, outside the route
// switch" pattern as ChatWidget) purely so a signed-in visitor's Friend ID
// exists as early as possible after loading any page, not only once they
// happen to open Profile or Community.
export function FriendIdBootstrap() {
  useFriendId();
  return null;
}
