import { useMemo, useState } from "react";
import "./App.css";

const posts = [
  { id: 1, type: "Found", title: "Black Hydro Flask", place: "University Library", date: "Today", tags: ["water bottle", "black"], icon: "💧", color: "blue" },
  { id: 2, type: "Lost", title: "Silver AirPods Case", place: "Sierra Hall", date: "Yesterday", tags: ["electronics", "apple"], icon: "🎧", color: "violet" },
  { id: 3, type: "Found", title: "CSUN Student ID", place: "Matador Bookstore", date: "Jul 18", tags: ["id card", "student"], icon: "🪪", color: "orange" },
  { id: 4, type: "Lost", title: "Navy Blue Backpack", place: "Jacaranda Walk", date: "Jul 17", tags: ["bag", "school"], icon: "🎒", color: "teal" },
];

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.2 4.2"/></svg>;
}

function App() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);
  const filteredPosts = useMemo(() => posts.filter((post) => {
    const searchable = `${post.title} ${post.place} ${post.tags.join(" ")}`.toLowerCase();
    return (type === "All" || post.type === type) && searchable.includes(query.toLowerCase());
  }), [query, type]);

  return (
    <main>
      <nav className="nav-shell">
        <a className="brand" href="#top" aria-label="FindIt home"><span className="brand-mark">F</span>Find<span>It</span></a>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">☰</button>
        <div className={`nav-links ${menuOpen ? "open" : ""}`}>
          <a href="#browse">Browse items</a>
          <a href="#how-it-works">How it works</a>
          <button className="text-button">Log in</button>
          <button className="primary-button small">Post an item <span>+</span></button>
        </div>
      </nav>

      <section className="hero-section" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span className="pulse"/> CSUN’s lost &amp; found network</p>
          <h1>Lost something?<br/><em>Let’s find it.</em></h1>
          <p className="hero-description">FindIt helps the CSUN community reunite with lost belongings—faster, simpler, and all in one place.</p>
          <div className="hero-actions">
            <a className="primary-button" href="#browse">Browse lost &amp; found <span>→</span></a>
            <button className="secondary-button">I found an item</button>
          </div>
          <div className="community-proof"><div className="avatars"><span>J</span><span>M</span><span>A</span><span>K</span></div><p>Trusted by the <strong>CSUN community</strong></p></div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="arch arch-one"/><div className="arch arch-two"/>
          <div className="item-card main-card"><div className="item-image backpack">🎒</div><div><span className="found-pill">FOUND</span><h3>Navy blue backpack</h3><p>Near Jacaranda Hall</p></div></div>
          <div className="match-bubble"><span className="spark">✦</span><div><strong>Potential match found!</strong><small>We think these could belong together.</small></div></div>
          <div className="mini-card"><span>🔑</span><div><b>Keys</b><small>Found today</small></div></div>
          <div className="circle-doodle">✦</div>
        </div>
      </section>

      <section className="browse-section" id="browse">
        <div className="section-heading"><div><p className="eyebrow">Recently reported</p><h2>Help bring things <em>home.</em></h2></div><a href="#browse">View all items <span>→</span></a></div>
        <div className="search-row">
          <label className="search-box"><SearchIcon/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search items, locations, or tags" /></label>
          <div className="filter-group">{["All", "Lost", "Found"].map((label) => <button key={label} className={type === label ? "active" : ""} onClick={() => setType(label)}>{label}</button>)}</div>
        </div>
        <div className="post-grid">
          {filteredPosts.map((post) => <article className="post-card" key={post.id}>
            <div className={`post-image ${post.color}`}><span>{post.icon}</span><div className={`type-label ${post.type.toLowerCase()}`}>{post.type}</div></div>
            <div className="post-info"><div className="post-title"><h3>{post.title}</h3><span>{post.date}</span></div><p className="location">⌖ {post.place}</p><div className="tags">{post.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
          </article>)}
          {!filteredPosts.length && <p className="empty-state">No reports match that search. Try another keyword.</p>}
        </div>
      </section>

      <section className="steps-section" id="how-it-works"><p className="eyebrow">Simple by design</p><h2>Good things come back around.</h2><div className="steps"><div><span>01</span><h3>Post an item</h3><p>Tell the community what you lost or found in a few quick steps.</p></div><div><span>02</span><h3>Discover a match</h3><p>Our matching system helps connect related reports for you.</p></div><div><span>03</span><h3>Make someone’s day</h3><p>Coordinate safely, reunite the item, and mark it resolved.</p></div></div></section>
    </main>
  );
}

export default App;
