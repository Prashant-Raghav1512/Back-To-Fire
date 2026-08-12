import { useState } from 'react';
import {
  Search,
  Pencil,
  MessageSquare,
  Users,
  MapPin,
  Flag,
  Sparkles,
  Move,
  Dumbbell,
  Flame,
  Wind,
  TrendingDown,
  Apple,
  Star,
  GraduationCap,
  Trophy,
  Video,
  PartyPopper,
} from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { SectionHeading } from '@/components/SectionHeading';
import { AnimatedPageBackground } from '@/components/AnimatedPageBackground';
import { GroupChat } from '@/components/community/GroupChat';
import { GroupPosts } from '@/components/community/GroupPosts';
import { useCommunityProfile } from '@/lib/community';
import {
  INDIA_GROUP,
  STATE_GROUPS,
  AGE_GROUPS,
  INTEREST_GROUPS,
  getEventGroups,
  type CommunityGroupOption,
} from '@/lib/communityGroups';

const ICONS = {
  MapPin,
  Flag,
  Users,
  Sparkles,
  Move,
  Dumbbell,
  Flame,
  Wind,
  TrendingDown,
  Apple,
  Star,
  GraduationCap,
  Trophy,
  Video,
  PartyPopper,
} as const;

function GroupIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name as keyof typeof ICONS] ?? Users;
  return <Icon className={className} />;
}

function GroupRow({ group, active, onSelect }: { group: CommunityGroupOption; active: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
        active
          ? 'bg-orange-500 text-white font-semibold shadow-sm shadow-orange-500/30'
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/60'
      }`}
    >
      <GroupIcon name={group.icon} className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{group.label}</span>
      {group.sublabel && (
        <span className={`shrink-0 text-xs ${active ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`}>
          {group.sublabel}
        </span>
      )}
    </button>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{title}</p>
      <div className="mt-2 space-y-1">{children}</div>
    </div>
  );
}

export function CommunityPage() {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const { profile, saveState } = useCommunityProfile();
  const [activeGroup, setActiveGroup] = useState<CommunityGroupOption>(INDIA_GROUP);
  const [tab, setTab] = useState<'chat' | 'posts'>('chat');
  const [pickingState, setPickingState] = useState(false);
  const [stateSearch, setStateSearch] = useState('');

  const eventGroups = getEventGroups();
  const filteredStates = STATE_GROUPS.filter((s) => s.label.toLowerCase().includes(stateSearch.toLowerCase()));

  const handlePickState = async (name: string) => {
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    await saveState(name);
    setPickingState(false);
    setStateSearch('');
    setActiveGroup({ type: 'state', key: name, label: name, icon: 'MapPin' });
  };

  return (
    <div className="pt-16 sm:pt-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-900 py-16 sm:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900/95 to-orange-900/50" />
        <div className="relative container-x mx-auto px-5 sm:px-8">
          <span className="inline-block rounded-full bg-orange-500/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-300 ring-1 ring-orange-500/20">
            Community
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold leading-tight text-white sm:text-5xl">
            Find your people
          </h1>
          <p className="mt-3 max-w-2xl text-gray-300">
            Chat and post with members nationwide, from your state, in your age group, or around a
            shared interest or event - pick a group on the left to get started.
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden section-pad bg-white dark:bg-gray-950">
        <AnimatedPageBackground
          blobs={[
            {
              color: 'bg-orange-300',
              size: 'h-96 w-96',
              position: { top: '-6rem', left: '-8rem' },
              x: [0, 55, 0],
              y: [0, 35, 0],
              scale: [1, 1.15, 1],
              duration: 24,
            },
            {
              color: 'bg-rose-200',
              size: 'h-72 w-72',
              position: { bottom: '5%', right: '-4rem' },
              x: [0, -45, 0],
              y: [0, -30, 0],
              duration: 28,
            },
          ]}
        />

        <div className="relative z-10 container-x mx-auto">
          <SectionHeading eyebrow="Groups" title="Where do you want to hang out?" center={false} />

          <div className="mt-10 grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* Sidebar */}
            <div className="card max-h-[600px] overflow-y-auto p-4">
              <div className="space-y-6">
                <SidebarSection title="Nationwide">
                  <GroupRow group={INDIA_GROUP} active={activeGroup.type === 'india'} onSelect={() => setActiveGroup(INDIA_GROUP)} />
                </SidebarSection>

                <SidebarSection title="Your State">
                  {profile ? (
                    <GroupRow
                      group={{ type: 'state', key: profile.state, label: profile.state, icon: 'MapPin' }}
                      active={activeGroup.type === 'state' && activeGroup.key === profile.state}
                      onSelect={() => setActiveGroup({ type: 'state', key: profile.state, label: profile.state, icon: 'MapPin' })}
                    />
                  ) : (
                    <button
                      onClick={() => setPickingState(true)}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-500/10"
                    >
                      <MapPin className="h-4 w-4 shrink-0" /> Set your state
                    </button>
                  )}
                  <button
                    onClick={() => setPickingState((v) => !v)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-left text-xs font-semibold text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    <Pencil className="h-3 w-3" /> {profile ? 'Change / browse all states' : 'Browse all states'}
                  </button>
                  {pickingState && (
                    <div className="mt-2 rounded-xl bg-gray-50 p-3 dark:bg-gray-700/40">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                        <input
                          value={stateSearch}
                          onChange={(e) => setStateSearch(e.target.value)}
                          placeholder="Search states..."
                          className="w-full rounded-full border-0 bg-white py-2 pl-8 pr-3 text-xs text-gray-900 outline-none ring-1 ring-gray-200 transition focus:ring-orange-500 dark:bg-gray-800 dark:text-white dark:ring-gray-600"
                        />
                      </div>
                      <div className="mt-2 max-h-48 space-y-0.5 overflow-y-auto">
                        {filteredStates.map((s) => (
                          <button
                            key={s.key}
                            onClick={() => handlePickState(s.key)}
                            className="block w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-gray-600 hover:bg-orange-100 hover:text-orange-700 dark:text-gray-300 dark:hover:bg-orange-500/15 dark:hover:text-orange-400"
                          >
                            {s.label}
                          </button>
                        ))}
                        {filteredStates.length === 0 && (
                          <p className="px-2.5 py-2 text-xs text-gray-400">No states match "{stateSearch}".</p>
                        )}
                      </div>
                    </div>
                  )}
                </SidebarSection>

                <SidebarSection title="Age Groups">
                  {AGE_GROUPS.map((g) => (
                    <GroupRow key={g.key} group={g} active={activeGroup.type === 'age' && activeGroup.key === g.key} onSelect={() => setActiveGroup(g)} />
                  ))}
                </SidebarSection>

                <SidebarSection title="Interests">
                  {INTEREST_GROUPS.map((g) => (
                    <GroupRow key={g.key} group={g} active={activeGroup.type === 'interest' && activeGroup.key === g.key} onSelect={() => setActiveGroup(g)} />
                  ))}
                </SidebarSection>

                {eventGroups.length > 0 && (
                  <SidebarSection title="Events">
                    {eventGroups.map((g) => (
                      <GroupRow key={g.key} group={g} active={activeGroup.type === 'event' && activeGroup.key === g.key} onSelect={() => setActiveGroup(g)} />
                    ))}
                  </SidebarSection>
                )}
              </div>
            </div>

            {/* Main panel */}
            <div className="card flex h-[600px] flex-col overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-4 dark:border-gray-700">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
                    <GroupIcon name={activeGroup.icon} className="h-5 w-5" />
                  </span>
                  <p className="truncate font-display text-sm font-bold text-gray-900 dark:text-white">{activeGroup.label}</p>
                </div>
                <div className="flex shrink-0 gap-1 rounded-full bg-gray-100 p-1 dark:bg-gray-700/60">
                  <button
                    onClick={() => setTab('chat')}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      tab === 'chat' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Chat
                  </button>
                  <button
                    onClick={() => setTab('posts')}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      tab === 'posts' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Posts
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1">
                {tab === 'chat' ? (
                  <GroupChat groupType={activeGroup.type} groupKey={activeGroup.key} groupLabel={activeGroup.label} profile={profile} />
                ) : (
                  <GroupPosts groupType={activeGroup.type} groupKey={activeGroup.key} groupLabel={activeGroup.label} profile={profile} />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
