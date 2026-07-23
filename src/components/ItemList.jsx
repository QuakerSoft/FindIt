import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllItems } from "../firebase/firestore";

function ItemList() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [categoryFilter, setCategoryFilter] = useState("all");

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
    return (
      <section className="flex flex-col items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-red-600"></div>
        <p className="mt-4 text-slate-600">Fetching campus reports...</p>
      </section>
    );
  }

  if (errorMessage) {
    return <p>{errorMessage}</p>;
  }

  if (items.length === 0) {
    return (
      <section>
        <div aria-hidden="true">📦</div>
        <h2>No lost or found reports yet.</h2>
        <p>Be the first to report a lost or found item!</p>
        <Link to="/post">Post an Item</Link>
      </section>
    );
  }

  const categories = [
    ...new Set(
      items
        .map((item) => item.category)
        .filter(Boolean)
    ),
  ].sort((categoryA, categoryB) => {
    if (categoryA === "Other") return 1;
    if (categoryB === "Other") return -1;

    return categoryA.localeCompare(categoryB);
  });

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

    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

  const sortedItems = [...filteredItems].sort((itemA, itemB) => {
  const timeA = itemA.createdAt?.toDate
    ? itemA.createdAt.toDate().getTime()
    : 0;

  const timeB = itemB.createdAt?.toDate
    ? itemB.createdAt.toDate().getTime()
    : 0;

  return sortOrder === "newest"
    ? timeB - timeA
    : timeA - timeB;
  });
  
  let noResultsMessage = "No matching items found.";

  if (typeFilter === "lost") {
    noResultsMessage = "No lost items match your search.";
  } else if (typeFilter === "found") {
    noResultsMessage = "No found items match your search.";
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm sm:p-8">
      <h2 className="text-sm font-medium text-slate-700">Reported Items</h2>

    <div className="ml--10 grid grid-cols-[300px_1fr] gap-6 item-start">
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="item-search" className="mt-5 block text-sm font-medium text-slate-700">Search items</label>
          <input
            id="item-search"
            type="search"
            placeholder="Search by title, category, building, or description"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="type-filter" className="text-sm font-medium text-slate-700">Filter by type
          <select
          id="type-filter"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          >
          <option value="all">All items</option>
          <option value="lost">Lost items</option>
          <option value="found">Found items</option>
          </select>
          </label>
        </div>

        <div>
          <label htmlFor="category-filter" className="text-sm font-medium text-slate-700">Filter by category
          <select
            id="category-filter"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          </label>
        </div>

        <div>
        <label htmlFor="sort-order" className="text-sm font-medium text-slate-700">Sort items
        <select
          id="sort-order"
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        </label>
        </div>
      </div>

      <div>
        {filteredItems.length === 0 && (
          <p>{noResultsMessage}</p>
        )}
        <div className="grid grid-cols-4 gap-4">
          {sortedItems.map((item) => (
            <article key={item.id}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
             <p>Type: {item.type}</p>
              <p>Category: {item.category}</p>
              <p>Building: {item.building}</p>
              <p>Location: {item.location}</p>
              <p>Status: {item.status}</p>
              <p>Reported:{" "}
                 {item.createdAt?.toDate
                  ? item.createdAt.toDate().toLocaleDateString()
                  : "Date unavailable"}
              </p>
              <hr />
            </article>
         ))}
        </div>
      </div>
    </div>
    </section>
  );
}

export default ItemList;