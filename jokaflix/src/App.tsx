import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import TrendingMovies from "./components/global/trending-movies/TrendingMovies";
import PopularMovies from "./components/global/popular-movies/PopularMovies";
import TVShows from "./components/global/tv-shows/TVShows";
import MediaPlayer from "./components/global/play/MediaPlayer";
import Categories from "./components/global/categories/Categories";
import SearchDrawer from "./components/global/search/Search";

export default function App() {
  return (
    <Router>
      <Header />
      <SearchDrawer />
      <Routes>
        {/* <Route path="/" element={<Home />} /> */}
        <Route path="/play/:category/:id" element={<MediaPlayer />} />
      </Routes>
      <Home />
      <Categories />
      <TrendingMovies />
      <PopularMovies />
      <TVShows />
      <Footer />
    </Router>
  );
}