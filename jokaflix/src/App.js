import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Router from './Router';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
          {Router.map(route => <Route key={route.key} path={route.path} element={route.element} />)}
      </Routes>
    </BrowserRouter>)
}

export default App;
