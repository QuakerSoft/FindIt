import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllItems } from "../firebase/firestore";
import { ITEM_CATEGORIES } from "../constants/categories";

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
      <h2 className="text-xl font-medium">Reported Items</h2>

    <div className="ml--10 grid grid-cols-[300px_1fr] gap-6 item-start">
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="item-search" className="mt-5 block text-sm font-medium text-slate-700">Search items</label>
          <input
            className="mt-3 text-sm resize-none w-auto rounded-xl px-2 py-2 border border-slate-200 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-4 focus:ring-red-50"
            id="item-search"
            type="search"
            placeholder="Search by title, category, building, or description"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="flex items-center gap-4">
          <label htmlFor="type-filter" className="flex items-center gap-2 text-sm font-medium text-slate-700">Filter by type
          <select
          className="w-auto rounded-xl px-2 py-2 border border-slate-200 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-4 focus:ring-red-50"
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

        <div className="flex items-center gap-4">
          <label htmlFor="category-filter" className="flex items-center gap-2 text-sm font-medium text-slate-700">Filter by category
          <select
            className="w-auto rounded-xl px-2 py-2 border border-slate-200 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-4 focus:ring-red-50"
            id="category-filter"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="all">All categories</option>
            {ITEM_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          </label>
        </div>

        <div>
        <label htmlFor="sort-order" className="flex items-center gap-2 text-sm font-medium text-slate-700">Sort items
        <select
          className="w-auto rounded-xl px-2 py-2 border border-slate-200 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-4 focus:ring-red-50"
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
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center">
            <div className="text-3xl" aria-hidden="true">
              🔍
            </div>

            <h3 className="mt-3 text-lg font-semibold text-slate-900">
              {noResultsMessage}
            </h3>

            <p className="mt-2 max-w-md text-sm text-slate-600">
              Try checking your spelling, using a different keyword, or changing your
              filters.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("all");
                setCategoryFilter("all");
                setSortOrder("newest");
              }}
              className="mt-5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:text-red-600"
            >
              Clear search and filters
            </button>
          </div>
        )}
        <div className="grid grid-cols-4 gap-4">
          {sortedItems.map((item) => (
            <Link
              key={item.id}
              to={`/items/${item.id}`}
              className="block rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-1 hover:border-red-300 hover:shadow-md"
            >
              <article>
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
            </article>
          </Link>
         ))}
        </div>
      </div>
    </div>
    </section>
  );
}

export default ItemList;