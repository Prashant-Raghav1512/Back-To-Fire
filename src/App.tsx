import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { RouterProvider, useRouter } from '@/lib/router';
import { HomePage } from '@/pages/HomePage';
import { AboutPage } from '@/pages/AboutPage';
import { ProgramsPage } from '@/pages/ProgramsPage';
import { ExercisesPage } from '@/pages/ExercisesPage';
import { EventsPage } from '@/pages/EventsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ContactPage } from '@/pages/ContactPage';

function Routes() {
  const { path } = useRouter();

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
      case '/profile':
        return <ProfilePage />;
      case '/contact':
        return <ContactPage />;
      default:
        return <HomePage />;
    }
  })();

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
      <Navbar />
      <main className="flex-1">{page}</main>
      <Footer />
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
