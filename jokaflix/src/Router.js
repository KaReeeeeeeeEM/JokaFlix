import Error404 from "./components/Error404";
import Home from "./components/Home";

const Router = [
    { key:'1', path: '/', element: <Home/>},
    { key:'2', path: '*', element: <Error404/>},

]

export default Router;