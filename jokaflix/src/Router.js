import Error404 from "./components/Error404";
import Home from "./components/Home";
import MoviePlayer from "./components/MoviePlayer";

const Router = [
    { key:'1', path: '/', element: <Home/>},
    { key:'2', path: '/play/:vidId', element: <MoviePlayer />},
    { key:'3', path: '*', element: <Error404/>},

]

export default Router;