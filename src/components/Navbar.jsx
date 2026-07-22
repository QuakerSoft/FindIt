import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold">
        CSUN FindIt
      </Link>
      <div className="flex gap-6">
        <Link to="/" className="hover:text-blue-200">Home</Link>
        <Link to="/browse" className="hover:text-blue-200">Browse</Link>
        <Link to="/post" className="hover:text-blue-200">Post Item</Link>
        <Link to="/login" className="hover:text-blue-200">Login</Link>
      </div>
    </nav>
  );
}
export default Navbar;