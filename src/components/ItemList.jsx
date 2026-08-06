import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllItems, getClaimsByOwner } from "../firebase/firestore";
import { ITEM_CATEGORIES } from "../constants/categories";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";
import ReportActionsMenu from "./ReportActionsMenu";
import ReportPost from "./ReportPost";

const fieldClasses =
  "w-full rounded-xl border border-[#E5E0D8] bg-white px-3 py-2.5 text-sm text-[#1C1B19] outline-none transition placeholder:text-[#6B6560]/60 focus:border-[#A6192E] focus:ring-4 focus:ring-[#A6192E]/10";

const labelClasses = "block text-xs font-semibold uppercase tracking-wide text-[#6B6560]";

function getTypeBadgeClasses(type) {
  return type === "found"
    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
    : "bg-[#A6192E]/10 text-[#A6192E] border border-[#A6192E]/20";
}

function getStatusBadgeClasses(status) {
  if (status === "resolved" || status === "claimed") {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }
  return "bg-[#FAF7F2] text-[#6B6560] border border-[#E5E0D8]";
}

function ItemList() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingClaimCounts, setPendingClaimCounts] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return unsubscribe;
  }, []);

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

  useEffect(() => {
    async function loadPendingClaimCounts() {
      if (!currentUser) {
        setPendingClaimCounts({});
        return;
      }

      try {
        const ownerClaims = await getClaimsByOwner(currentUser.uid);

        const claimCounts = ownerClaims.reduce((counts, claim) => {
          if (claim.status !== "pending") {
            return counts;
          }

          counts[claim.itemId] = (counts[claim.itemId] || 0) + 1;
          return counts;
        }, {});

        setPendingClaimCounts(claimCounts);
      } catch (error) {
        console.error("Unable to load pending request counts:", error);
        setPendingClaimCounts({});
      }
    }

    loadPendingClaimCounts();
  }, [currentUser]);

  if (isLoading) {
    return (
      <section className="flex flex-col items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E5E0D8] border-t-[#A6192E]"></div>
        <p className="mt-4 text-sm text-[#6B6560]">Fetching campus reports...</p>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center text-sm text-red-700">
        {errorMessage}
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="flex flex-col items-center rounded-3xl border border-dashed border-[#E5E0D8] bg-white px-6 py-16 text-center">
        <div className="text-4xl" aria-hidden="true">
          📦
        </div>
        <h2 className="mt-4 font-[Archivo_Black] text-xl text-[#1C1B19]">
          No lost or found reports yet.
        </h2>
        <p className="mt-2 text-sm text-[#6B6560]">
          Be the first to report a lost or found item!
        </p>
        <Link
          to="/post"
          className="mt-5 rounded-sm border border-transparent bg-[#A6192E] px-6 py-2.5 text-sm font-medium text-white transition hover:border-[#A6192E] hover:bg-white hover:text-[#A6192E]"
        >
          Post an Item
        </Link>
      </section>
    );
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredItems = items.filter((item) => {
    if (
      item.status === "resolved" ||
      item.moderationStatus === "pending_review" ||
      item.moderationStatus === "hidden"
    ) {
      return false;
    }

    const matchesSearch =
      normalizedSearch === "" ||
      item.title?.toLowerCase().includes(normalizedSearch) ||
      item.description?.toLowerCase().includes(normalizedSearch) ||
      item.category?.toLowerCase().includes(normalizedSearch) ||
      item.building?.toLowerCase().includes(normalizedSearch) ||
      item.location?.toLowerCase().includes(normalizedSearch);

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

  const hasActiveFilters =
    searchTerm !== "" || typeFilter !== "all" || categoryFilter !== "all";

  function clearFilters() {
    setSearchTerm("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setSortOrder("newest");
  }

  let noResultsMessage = "No matching items found.";

  if (typeFilter === "lost") {
    noResultsMessage = "No lost items match your search.";
  } else if (typeFilter === "found") {
    noResultsMessage = "No found items match your search.";
  }

  return (
    <section>
      <h2 className="font-[Archivo_Black] text-xl text-[#1C1B19]">Reported Items</h2>

      {/* Filter toolbar */}
      <div className="mt-4 rounded-2xl border border-[#E5E0D8] bg-[#FAF7F2] p-5">
        <label htmlFor="item-search" className={labelClasses}>
          Search items
        </label>
        <input
          className={`${fieldClasses} mt-2`}
          id="item-search"
          type="search"
          placeholder="Search by title, category, building, or description"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="type-filter" className={labelClasses}>
              Filter by type
            </label>
            <select
              className={`${fieldClasses} mt-2`}
              id="type-filter"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="all">All items</option>
              <option value="lost">Lost items</option>
              <option value="found">Found items</option>
            </select>
          </div>

          <div>
            <label htmlFor="category-filter" className={labelClasses}>
              Filter by category
            </label>
            <select
              className={`${fieldClasses} mt-2`}
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
          </div>

          <div>
            <label htmlFor="sort-order" className={labelClasses}>
              Sort items
            </label>
            <select
              className={`${fieldClasses} mt-2`}
              id="sort-order"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#A6192E] transition hover:underline"
          >
            Clear search and filters
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="mt-6 text-sm text-[#6B6560]">
        {sortedItems.length} {sortedItems.length === 1 ? "item" : "items"} found
      </p>

      {sortedItems.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E5E0D8] bg-white px-6 py-16 text-center">
          <div className="text-3xl" aria-hidden="true">
            🔍
          </div>

          <h3 className="mt-3 text-lg font-semibold text-[#1C1B19]">
            {noResultsMessage}
          </h3>

          <p className="mt-2 max-w-md text-sm text-[#6B6560]">
            Try checking your spelling, using a different keyword, or changing your
            filters.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 rounded-xl border border-[#E5E0D8] px-4 py-2 text-sm font-semibold text-[#1C1B19] transition hover:border-[#A6192E] hover:text-[#A6192E]"
          >
            Clear search and filters
          </button>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedItems.map((item) => {
            const isOwner = currentUser?.uid === item.ownerId;

            return (
              <article
                key={item.id}
                className="group relative flex cursor-pointer flex-col rounded-2xl border border-[#E5E0D8] bg-white p-4 transition hover:z-40 hover:-translate-y-1 hover:border-[#A6192E]/40 hover:shadow-lg focus-within:z-40"
              >
                <Link
                  to={`/items/${item.id}`}
                  state={{ from: "browse" }}
                  aria-label={`View report: ${item.title}`}
                  className="absolute inset-0 z-10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#A6192E]/10"
                />

                {isOwner && pendingClaimCounts[item.id] > 0 && (
                  <div className="pointer-events-none absolute left-3 top-3 z-30 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 shadow-sm">
                    {pendingClaimCounts[item.id] === 1
                      ? "1 pending request"
                      : `${pendingClaimCounts[item.id]} pending requests`}
                  </div>
                )}

                <div className="absolute right-3 top-3 z-30">
                  {isOwner ? (
                    <ReportActionsMenu
                      item={item}
                      onResolved={(resolvedItemId) => {
                        setItems((currentItems) =>
                          currentItems.map((currentItem) =>
                            currentItem.id === resolvedItemId
                              ? {
                                  ...currentItem,
                                  status: "resolved",
                                }
                              : currentItem
                          )
                        );
                      }}
                      onDeleted={(deletedItemId) => {
                        setItems((currentItems) =>
                          currentItems.filter(
                            (currentItem) =>
                              currentItem.id !== deletedItemId
                          )
                        );
                      }}
                    />
                  ) : (
                    <ReportPost
                      item={item}
                      showAsMenu
                      onReported={(reportedItemId) => {
                        setItems((currentItems) =>
                          currentItems.map((currentItem) =>
                            currentItem.id === reportedItemId
                              ? {
                                  ...currentItem,
                                  moderationStatus: "pending_review",
                                }
                              : currentItem
                          )
                        );
                      }}
                    />
                  )}
                </div>

                {item.imageUrl && (
                  <div className="mb-3 flex h-32 items-center justify-center overflow-hidden rounded-xl bg-[#FAF7F2] p-2">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-contain"
                      referrerPolicy="no-referrer"
                      onError={(event) => {
                        event.currentTarget.parentElement.style.display =
                          "none";
                      }}
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${getTypeBadgeClasses(
                      item.type
                    )}`}
                  >
                    {item.type}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${getStatusBadgeClasses(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>

                <h3 className="mt-3 font-semibold text-[#1C1B19]">
                  {item.title}
                </h3>

                <p className="mt-1 line-clamp-2 text-sm text-[#6B6560]">
                  {item.description}
                </p>

                <div className="mt-3 space-y-1 border-t border-[#E5E0D8] pt-3 text-xs text-[#6B6560]">
                  <p>
                    {item.category} &middot; {item.building}
                  </p>
                  <p>{item.location}</p>
                  <p className="pt-1 text-[#6B6560]/70">
                    Reported{" "}
                    {item.createdAt?.toDate
                      ? item.createdAt.toDate().toLocaleDateString()
                      : "date unavailable"}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default ItemList;
;