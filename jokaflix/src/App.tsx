import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import MoviesPage from "./pages/Movies";
import SeriesPage from "./pages/Series";
import GenresPage, { GenreDetailPage } from "./pages/Genres";
import DetailPage from "./pages/Detail";
import Header from "./components/layout/Header";
import MediaPlayer from "./components/global/play/MediaPlayer";
import SearchDrawer from "./components/global/search/Search";
import { Toaster } from "sonner";

export default function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

function AppShell() {
  const location = useLocation();
  const isPlayerRoute = location.pathname.startsWith("/play/");

  return (
    <>
      {!isPlayerRoute && <Header />}
      {!isPlayerRoute && <SearchDrawer />}
      <Toaster richColors position="top-center" toastOptions={{ className: "jokaflix-toast" }} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/series" element={<SeriesPage />} />
        <Route path="/genres" element={<GenresPage />} />
        <Route path="/genres/:id" element={<GenreDetailPage />} />
        <Route path="/movie/:id" element={<DetailPage mediaType="movie" />} />
        <Route path="/series/:id" element={<DetailPage mediaType="tv" />} />
        <Route path="/play/:category/:id" element={<MediaPlayer />} />
      </Routes>
    </>
  );
}
