import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Browse from './pages/Browse';
import PostItem from './pages/PostItem';
import ItemDetails from "./pages/ItemDetails";
import Auth from './components/Auth';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/items/:itemId" element={<ItemDetails />} />
          <Route path="/post" element={<PostItem />} />
          <Route path="/login" element={<Auth />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
export default App;