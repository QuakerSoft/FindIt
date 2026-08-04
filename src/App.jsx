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
import Account from "./pages/Account";
import EditItem from "./pages/EditItem";
import Admin from "./pages/Admin";
import AdminRoute from "./components/AdminRoute";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/items/:itemId" element={<ItemDetails />} />
          <Route
            path="/items/:itemId/edit"
            element={
              <ProtectedRoute>
                <EditItem />
              </ProtectedRoute>
            }
          />
          <Route
            path="/post"
            element={
              <ProtectedRoute>
                <PostItem />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
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