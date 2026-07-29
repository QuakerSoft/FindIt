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
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    async function loadItems() {
      try {
        const itemData = await getAllItems();
        setItems(itemData);
      } catch (error) {
        console.error("Unable to load items:", error);
        setErrorMessage("Unable to load item reports.");
      } finally {
        setIsLoading(false);
      }
    }

    loadItems();
  }, []);

  function clearFilters() {
    setSearchTerm("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setSortOrder("newest");
  }

  function getCreatedTime(item) {
    if (item.createdAt?.toDate) {
      return item.createdAt.toDate().getTime();
    }

    return 0;
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredItems = items.filter((item) => {
    const title = item.title?.toLowerCase() || "";
    const description = item.description?.toLowerCase() || "";
    const category = item.category?.toLowerCase() || "";
    const building = item.building?.toLowerCase() || "";
    const location = item.location?.toLowerCase() || "";

    const matchesSearch =
      normalizedSearch === "" ||
      title.includes(normalizedSearch) ||
      description.includes(normalizedSearch) ||
      category.includes(normalizedSearch) ||
      building.includes(normalizedSearch) ||
      location.includes(normalizedSearch);

    const matchesType =
      typeFilter === "all" || item.type === typeFilter;

    const matchesCategory =
      categoryFilter === "all" ||
      item.category === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

  const sortedItems = [...filteredItems].sort((itemA, itemB) => {
    const timeA = getCreatedTime(itemA);
    const timeB = getCreatedTime(itemB);

    if (sortOrder === "oldest") {
      return timeA - timeB;
    }

    return timeB - timeA;
  });

  if (isLoading) {
    return (
      <section className="flex flex-col items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-red-600" />

        <p className="mt-4 text-slate-600">
          Fetching campus reports...
        </p>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
        {errorMessage}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="text-4xl" aria-hidden="true">
          📦
        </div>

        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          No lost or found reports yet
        </h1>

        <p className="mt-2 text-slate-600">
          Be the first person to report a lost or found item.
        </p>

        <Link
          to="/post"
          className="mt-6 inline-block rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
        >
          Post an Item
        </Link>
      </section>
    );
  }

  return (
    <section>
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Browse Reported Items
        </h1>

        <p className="mt-2 text-slate-600">
          Search for lost and found items reported around campus.
        </p>
      </div>

      {/* Search box */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label htmlFor="item-search" className="sr-only">
          Search items
        </label>

        <input
          id="item-search"
          type="search"
          placeholder="Search by item name, category, building, or description..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
        />
      </div>

      {/* Listings and right sidebar */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        {/* Item listings */}
        <div className="order-2 min-w-0 lg:order-1">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Reported Items
            </h2>

            <p className="text-sm text-slate-500">
              {sortedItems.length}{" "}
              {sortedItems.length === 1 ? "item" : "items"}
            </p>
          </div>

          {sortedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="text-4xl" aria-hidden="true">
                🔍
              </div>

              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No matching items found
              </h3>

              <p className="mt-2 max-w-md text-sm text-slate-600">
                Try another search word or change the selected filters.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:text-red-600"
              >
                Clear search and filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {sortedItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/items/${item.id}`}
                  aria-label={`View item: ${item.title}`}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-red-300 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-red-100"
                >
                  {/* Item picture */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
                      No image available
                    </div>

                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.title || "Reported item"}
                        referrerPolicy="no-referrer"
                        className="relative z-10 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </div>

                  {/* Item name */}
                  <div className="p-4">
                    <h3 className="truncate text-base font-semibold text-slate-900 transition group-hover:text-red-600">
                      {item.title || "Untitled item"}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right filter sidebar */}
        <aside className="order-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:order-2 lg:sticky lg:top-24">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Filters
            </h2>

            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium text-red-600 transition hover:text-red-700"
            >
              Clear
            </button>
          </div>

          <div className="space-y-5">
            {/* Type filter */}
            <div>
              <label
                htmlFor="type-filter"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Item type
              </label>

              <select
                id="type-filter"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100"
              >
                <option value="all">All items</option>
                <option value="lost">Lost items</option>
                <option value="found">Found items</option>
              </select>
            </div>

            {/* Category filter */}
            <div>
              <label
                htmlFor="category-filter"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Category
              </label>

              <select
                id="category-filter"
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100"
              >
                <option value="all">All categories</option>

                {ITEM_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort filter */}
            <div>
              <label
                htmlFor="sort-order"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Sort by
              </label>

              <select
                id="sort-order"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default ItemList;