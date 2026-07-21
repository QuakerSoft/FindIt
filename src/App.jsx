import Auth from "./components/Auth";

function Header() {
  return (
    <div>
      <h1>FindIt CSUN</h1>
      <h2>Cal State Northridge Lost and Found Site</h2>
    </div>
  )
}

function App() {
  return (
    <>
      <Auth />
      <Header />
    </>
  );
}

export default App;