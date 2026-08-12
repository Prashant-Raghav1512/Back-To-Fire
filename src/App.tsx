import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ChatWidget } from '@/components/ChatWidget';
import { ScrollProgressBar } from '@/components/ScrollProgressBar';
import { BackToTop } from '@/components/BackToTop';
import { RouterProvider, useRouter } from '@/lib/router';
import { useGlobalRipple } from '@/lib/useGlobalRipple';
import { HomePage } from '@/pages/HomePage';
import { AboutPage } from '@/pages/AboutPage';
import { ProgramsPage } from '@/pages/ProgramsPage';
import { ExercisesPage } from '@/pages/ExercisesPage';
import { ArticlesPage } from '@/pages/ArticlesPage';
import { CommunityPage } from '@/pages/CommunityPage';
import { MembershipPage } from '@/pages/MembershipPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ContactPage } from '@/pages/ContactPage';
import { ToolsPage } from '@/pages/ToolsPage';
import { AppComingSoonPage } from '@/pages/AppComingSoonPage';
import { TermsPage } from '@/pages/TermsPage';
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage';

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
        {page}
      </main>
      <Footer />
      <ChatWidget />
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
