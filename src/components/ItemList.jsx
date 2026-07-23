import { useEffect, useState } from "react";
import { getAllItems } from "../firebase/firestore";

function ItemList() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    async function loadItems() {
      try {
        const itemData = await getAllItems();
        setItems(itemData);
      } catch (error) {
        console.error(error);
        setErrorMessage("Unable to load item reports.");
      } finally {
        setIsLoading(false);
      }
    }

    loadItems();
  }, []);

  if (isLoading) {
    return <p>Loading items...</p>;
  }

  if (errorMessage) {
    return <p>{errorMessage}</p>;
  }

  if (items.length === 0) {
    return <p>No lost or found items have been reported yet.</p>;
  }

  const filteredItems = items.filter((item) => {
    const searchText = searchTerm.toLowerCase();

    const matchesSearch =
      item.title?.toLowerCase().includes(searchText) ||
      item.description?.toLowerCase().includes(searchText) ||
      item.category?.toLowerCase().includes(searchText) ||
      item.building?.toLowerCase().includes(searchText) ||
      item.location?.toLowerCase().includes(searchText);

    const matchesType =
      typeFilter === "all" || item.type === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <section>
      <h2>Reported Items</h2>

      <label htmlFor="item-search">Search items</label>
      <input
        id="item-search"
        type="search"
        placeholder="Search by title, category, building, or description"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
      />

      <label htmlFor="type-filter">Filter by type</label>
      <select
        id="type-filter"
        value={typeFilter}
        onChange={(event) => setTypeFilter(event.target.value)}
      >
        <option value="all">All items</option>
        <option value="lost">Lost items</option>
        <option value="found">Found items</option>
      </select>

      {filteredItems.length === 0 && (
        <p>No items match your search.</p>
      )}

      {filteredItems.map((item) => (
        <article key={item.id}>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
          <p>Type: {item.type}</p>
          <p>Category: {item.category}</p>
          <p>Building: {item.building}</p>
          <p>Location: {item.location}</p>
          <p>Status: {item.status}</p>
          <hr />
        </article>
      ))}
    </section>
  );
}

export default ItemList;