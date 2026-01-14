import { Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import WelcomePage from "./pages/WelcomePage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";

import EventsPage from "./pages/EventsPage";
import CreateEventPage from "./pages/CreateEventPage";
import EditEventPage from "./pages/EditEventPage";
import EventDetailsPage from "./pages/EventDetailsPage";
import MyEventsPage from "./pages/MyEventsPage";
import MapPage from "./pages/MapPage";

import CalendarPage from "./pages/CalendarPage";
import SettingsPage from "./pages/SettingsPage";

import PrivateRoute from "./components/PrivateRoute";
import InvitesPage from "./pages/InvitesPage";
import AcceptInvitePage from "./pages/AcceptInvitePage";
import RespondInviteQuickPage from "./pages/RespondInviteQuickPage";

function App() {
  return (
    <Routes>


      <Route
        path="/my-events"
        element={
          <PrivateRoute>
            <MyEventsPage />
          </PrivateRoute>
        }
      />



      <Route
        path="/invites"
        element={
          <PrivateRoute>
            <InvitesPage />
          </PrivateRoute>
        }
      />

      {/* Públicas */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
      <Route path="/respond-invite-quick" element={<RespondInviteQuickPage />} />

      {/* Protegidas */}
      <Route
        path="/events"
        element={
          <PrivateRoute>
            <EventsPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/create-event"
        element={
          <PrivateRoute>
            <CreateEventPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/events/:id/edit"
        element={
          <PrivateRoute>
            <EditEventPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/events/:id"
        element={
          <PrivateRoute>
            <EventDetailsPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/calendar"
        element={
          <PrivateRoute>
            <CalendarPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/map"
        element={
          <PrivateRoute>
            <MapPage />
          </PrivateRoute>
        }
      />

      {/* Mapa padrão em /map */}

      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <SettingsPage />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;
