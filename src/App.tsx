import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ChatWidget } from '@/components/ChatWidget';
import { FriendIdBootstrap } from '@/components/FriendIdBootstrap';
import { ScrollProgressBar } from '@/components/ScrollProgressBar';
import { BackToTop } from '@/components/BackToTop';
import { RouterProvider, useRouter } from '@/lib/router';
import { useGlobalRipple } from '@/lib/useGlobalRipple';
// Home stays a static import — it's the page the overwhelming majority of
// visits land on, so eagerly bundling it avoids a loading flash on the
// single most common first paint. Every other page is lazy — before this,
// the whole app (chatbot, community, membership, translator, everything)
// shipped as one ~950KB chunk regardless of which page a visitor opened.
import { HomePage } from '@/pages/HomePage';
const AboutPage = lazy(() => import('@/pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ProgramsPage = lazy(() => import('@/pages/ProgramsPage').then((m) => ({ default: m.ProgramsPage })));
const ExercisesPage = lazy(() => import('@/pages/ExercisesPage').then((m) => ({ default: m.ExercisesPage })));
const ArticlesPage = lazy(() => import('@/pages/ArticlesPage').then((m) => ({ default: m.ArticlesPage })));
const CommunityPage = lazy(() => import('@/pages/CommunityPage').then((m) => ({ default: m.CommunityPage })));
const MembershipPage = lazy(() => import('@/pages/MembershipPage').then((m) => ({ default: m.MembershipPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const ContactPage = lazy(() => import('@/pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const ToolsPage = lazy(() => import('@/pages/ToolsPage').then((m) => ({ default: m.ToolsPage })));
const AppComingSoonPage = lazy(() =>
  import('@/pages/AppComingSoonPage').then((m) => ({ default: m.AppComingSoonPage }))
);
const TermsPage = lazy(() => import('@/pages/TermsPage').then((m) => ({ default: m.TermsPage })));
const PrivacyPolicyPage = lazy(() =>
  import('@/pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage }))
);

function PageLoadingFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-green-500" />
    </div>
  );
}

function Routes() {
  const { path } = useRouter();
  useGlobalRipple();

  const page = (() => {
    switch (path) {
      case '/':
        return <HomePage />;
      case '/about':
        return <AboutPage />;
      case '/programs':
      case '/events':
        // Merged into one page (see ProgramsPage.tsx) - both routes still
        // resolve so any existing links/bookmarks to /events keep working.
        return <ProgramsPage />;
      case '/exercises':
        return <ExercisesPage />;
      case '/articles':
        return <ArticlesPage />;
      case '/community':
        return <CommunityPage />;
      case '/membership':
        return <MembershipPage />;
      case '/profile':
        return <ProfilePage />;
      case '/contact':
        return <ContactPage />;
      case '/tools':
        return <ToolsPage />;
      case '/app':
        return <AppComingSoonPage />;
      case '/terms':
        return <TermsPage />;
      case '/privacy':
        return <PrivacyPolicyPage />;
      default:
        return <HomePage />;
    }
  })();

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
      <ScrollProgressBar />
      <Navbar />
      <main key={path} className="page-transition flex-1">
        <ErrorBoundary key={path}>
          <Suspense fallback={<PageLoadingFallback />}>{page}</Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <ChatWidget />
      <FriendIdBootstrap />
      <BackToTop />
    </div>
  );
}

function App() {
  return (
    <RouterProvider>
      <Routes />
    </RouterProvider>
  );
}

export default App;
