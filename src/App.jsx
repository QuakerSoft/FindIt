import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Browse from './pages/Browse';
import PostItem from './pages/PostItem';
import ItemDetails from "./pages/ItemDetails";
import Auth from './components/Auth';
import ProtectedRoute from "./components/ProtectedRoute";
import CompleteProfile from "./pages/CompleteProfile";
import ForgotPassword from "./pages/ForgotPassword";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/items/:itemId" element={<ItemDetails />} />
          <Route
            path="/post"
            element={
              <ProtectedRoute>
                <PostItem />
              </ProtectedRoute>
            }
          />
            <Route
              path="/complete-profile"
              element={
            <ProtectedRoute>
              <CompleteProfile />
            </ProtectedRoute>
          }
        />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/login" element={<Auth />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
export default App;