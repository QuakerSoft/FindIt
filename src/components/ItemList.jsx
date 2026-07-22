import { useEffect, useState } from "react";
import { getAllItems } from "../firebase/firestore";

function ItemList() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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

  return (
    <section>
      <h2>Reported Items</h2>

      {items.map((item) => (
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