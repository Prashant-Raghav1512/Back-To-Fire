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
import { EventsPage } from '@/pages/EventsPage';
import { ArticlesPage } from '@/pages/ArticlesPage';
import { CommunityPage } from '@/pages/CommunityPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ContactPage } from '@/pages/ContactPage';
import { ToolsPage } from '@/pages/ToolsPage';
import { AppComingSoonPage } from '@/pages/AppComingSoonPage';

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
        return <ProgramsPage />;
      case '/exercises':
        return <ExercisesPage />;
      case '/events':
        return <EventsPage />;
      case '/articles':
        return <ArticlesPage />;
      case '/community':
        return <CommunityPage />;
      case '/profile':
        return <ProfilePage />;
      case '/contact':
        return <ContactPage />;
      case '/tools':
        return <ToolsPage />;
      case '/app':
        return <AppComingSoonPage />;
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
