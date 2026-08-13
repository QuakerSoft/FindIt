import { useEffect, useState } from "react";
import {
  Link,
  useSearchParams,
} from "react-router-dom";
import { getAllItems, getClaimsByOwner, getBookmarkedItemIds, removeItemBookmark, saveItemBookmark, } from "../firebase/firestore";
import { ITEM_CATEGORIES } from "../constants/categories";
import { CAMPUS_BUILDINGS } from "../constants/buildings";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";
import ReportActionsMenu from "./ReportActionsMenu";
import ReportPost from "./ReportPost";
import BookmarkButton from "./BookmarkButton";

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

function ItemCardImage({ item }) {
  const [imageStatus, setImageStatus] = useState(
    item.imageUrl ? "loading" : "missing"
  );

  const shouldShowImage =
    item.imageUrl &&
    imageStatus !== "error" &&
    imageStatus !== "missing";

  return (
    <div className="relative mb-4 flex h-44 items-center justify-center overflow-hidden rounded-xl bg-[#FAF7F2] p-3">
      {imageStatus === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#E5E0D8] border-t-[#A6192E]" />
        </div>
      )}

      {shouldShowImage ? (
        <img
          src={item.imageUrl}
          alt={item.title}
          className={`h-full w-full object-contain transition-opacity ${
            imageStatus === "loading"
              ? "opacity-0"
              : "opacity-100"
          }`}
          referrerPolicy="no-referrer"
          onLoad={() => setImageStatus("loaded")}
          onError={() => setImageStatus("error")}
        />
      ) : (
        <div className="flex flex-col items-center text-center text-[#6B6560]/70">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-8 w-8"
            aria-hidden="true"
          >
            <rect
              x="3"
              y="4"
              width="18"
              height="16"
              rx="2"
            />
            <circle cx="8.5" cy="9" r="1.5" />
            <path d="m4 17 5-5 4 4 2-2 5 5" />
          </svg>

          <p className="mt-2 text-xs font-medium">
            {imageStatus === "error"
              ? "Image unavailable"
              : "No image provided"}
          </p>
        </div>
      )}
    </div>
  );
}

function ItemList() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchParams, setSearchParams] =
    useSearchParams();

  const searchTerm =
    searchParams.get("search") || "";

  const requestedType =
    searchParams.get("type") || "all";

  const typeFilter = ["all", "lost", "found"].includes(
    requestedType
  )
    ? requestedType
    : "all";

  const requestedSort =
    searchParams.get("sort") || "newest";

  const sortOrder = ["newest", "oldest"].includes(
    requestedSort
  )
    ? requestedSort
    : "newest";

  const categoryFilter =
    searchParams.get("category") || "all";

  const buildingFilter =
    searchParams.get("building") || "all";

  const [currentUser, setCurrentUser] = useState(null);
  const [pendingClaimCounts, setPendingClaimCounts] = useState({});
  const [
    bookmarkedItemIds,
    setBookmarkedItemIds,
  ] = useState([]);

  useEffect(() => {
  async function loadBookmarks() {
    if (!currentUser) {
      setBookmarkedItemIds([]);
      return;
    }

    try {
      const itemIds =
        await getBookmarkedItemIds(
          currentUser.uid
        );

      setBookmarkedItemIds(itemIds);
    } catch (error) {
      console.error(
        "Unable to load saved items:",
        error
      );

      setBookmarkedItemIds([]);
    }
  }

  loadBookmarks();
}, [currentUser]);

  const [
    workingBookmarkItemId,
    setWorkingBookmarkItemId,
  ] = useState("");
  const [
    isMobileFiltersOpen,
    setIsMobileFiltersOpen,
  ] = useState(false);

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

  useEffect(() => {
    if (
      isLoading ||
      !window.location.hash.startsWith(
        "#browse-item-"
      )
    ) {
      return;
    }

    const targetId =
      window.location.hash.replace("#", "");

    const scrollTimer = window.setTimeout(() => {
      document
        .getElementById(targetId)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 150);

    return () => {
      window.clearTimeout(scrollTimer);
    };
  }, [isLoading, items]);

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
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#A6192E]/10 text-[#A6192E]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z" />
            <path d="m3 7.5 9 4.5 9-4.5M12 12v9" />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-bold text-[#1C1B19]">
          No lost or found reports yet.
        </h2>
        <p className="mt-2 text-sm text-[#6B6560]">
          Be the first to report a lost or found item!
        </p>
        <Link
          to="/post"
          className="mt-5 rounded-xl bg-[#A6192E] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800"
        >
          Post an Item
        </Link>
      </section>
    );
  }

  const availableBuildings =
    CAMPUS_BUILDINGS.filter((building) =>
      items.some(
        (item) =>
          item.building === building
      )
    );

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
      categoryFilter === "all" ||
      item.category === categoryFilter;

    const matchesBuilding =
      buildingFilter === "all" ||
      item.building === buildingFilter;

    return (
      matchesSearch &&
      matchesType &&
      matchesCategory &&
      matchesBuilding
    );
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
    searchTerm !== "" ||
    typeFilter !== "all" ||
    categoryFilter !== "all" ||
    buildingFilter !== "all" ||
    sortOrder !== "newest";

  function updateSearchTerm(newSearchTerm) {
    const nextSearchParams =
      new URLSearchParams(searchParams);

    if (newSearchTerm) {
      nextSearchParams.set(
        "search",
        newSearchTerm
      );
    } else {
      nextSearchParams.delete("search");
    }

    setSearchParams(nextSearchParams, {
      replace: true,
    });
  }

  function updateBrowseFilter(
  parameterName,
  newValue,
  defaultValue = "all"
) {
  const nextSearchParams =
    new URLSearchParams(searchParams);

  if (newValue === defaultValue) {
    nextSearchParams.delete(parameterName);
  } else {
    nextSearchParams.set(
      parameterName,
      newValue
    );
  }

  setSearchParams(nextSearchParams, {
    replace: true,
  });
}

  async function toggleBookmark(item) {
  if (!currentUser) {
    window.location.href = "/login";
    return;
  }

  if (item.ownerId === currentUser.uid) {
    return;
  }

  const isCurrentlySaved =
    bookmarkedItemIds.includes(item.id);

  try {
    setWorkingBookmarkItemId(item.id);

    if (isCurrentlySaved) {
      await removeItemBookmark(
        currentUser.uid,
        item.id
      );

      setBookmarkedItemIds(
        (currentItemIds) =>
          currentItemIds.filter(
            (itemId) => itemId !== item.id
          )
      );
    } else {
      await saveItemBookmark(
        currentUser.uid,
        item.id
      );

      setBookmarkedItemIds(
        (currentItemIds) => [
          ...currentItemIds,
          item.id,
        ]
      );
    }
  } catch (error) {
    console.error(
      "Unable to update saved item:",
      error
    );
  } finally {
    setWorkingBookmarkItemId("");
  }
}

  function clearFilters() {
    setSearchParams({}, {
      replace: true,
    });

    setIsMobileFiltersOpen(false);
  }

  let noResultsMessage = "No matching items found.";

  if (typeFilter === "lost") {
    noResultsMessage = "No lost items match your search.";
  } else if (typeFilter === "found") {
    noResultsMessage = "No found items match your search.";
  }

    return (
    <section>
            <button
        type="button"
        onClick={() =>
          setIsMobileFiltersOpen(
            (currentValue) => !currentValue
          )
        }
        aria-expanded={isMobileFiltersOpen}
        aria-controls="browse-filters"
        className="mb-4 flex w-full items-center justify-between rounded-xl border border-[#E5E0D8] bg-white px-4 py-3 text-sm font-semibold text-[#1C1B19] shadow-sm lg:hidden"
      >
        <span>
          {isMobileFiltersOpen
            ? "Hide Filters"
            : "Show Filters"}
        </span>

        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className={`h-4 w-4 transition ${
            isMobileFiltersOpen
              ? "rotate-180"
              : ""
          }`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Desktop filter sidebar */}
        <aside
          id="browse-filters"
          className={`rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm lg:sticky lg:top-28 lg:block ${
            isMobileFiltersOpen ? "block" : "hidden"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[#1C1B19]">
              Filters
            </h2>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-[#A6192E] transition hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          <div className="mt-5">
            <label htmlFor="type-filter" className={labelClasses}>
              Report type
            </label>

            <select
              className={`${fieldClasses} mt-2`}
              id="type-filter"
              value={typeFilter}
              onChange={(event) =>
                updateBrowseFilter(
                  "type",
                  event.target.value
                )
              }
            >
              <option value="all">All reports</option>
              <option value="lost">Lost items</option>
              <option value="found">Found items</option>
            </select>
          </div>

          <div className="mt-5">
            <label
              htmlFor="category-filter"
              className={labelClasses}
            >
              Category
            </label>

            <select
              className={`${fieldClasses} mt-2`}
              id="category-filter"
              value={categoryFilter}
              onChange={(event) =>
                updateBrowseFilter(
                  "category",
                  event.target.value
                )
              }
            >
              <option value="all">All categories</option>

              {ITEM_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

                    <div className="mt-5">
            <label
              htmlFor="building-filter"
              className={labelClasses}
            >
              Campus building
            </label>

            <select
              className={`${fieldClasses} mt-2`}
              id="building-filter"
              value={buildingFilter}
              onChange={(event) =>
                updateBrowseFilter(
                  "building",
                  event.target.value
                )
              }
            >
              <option value="all">All buildings</option>

              {availableBuildings.map((building) => (
                <option key={building} value={building}>
                  {building}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 border-t border-[#E5E0D8] pt-5">
            <p className="text-xs leading-5 text-[#6B6560]">
              Only open and publicly visible reports appear
              in Browse.
            </p>

            <p className="mt-2 text-xs leading-5 text-[#6B6560]">
              Don’t see a campus location in the dropdown?
              It currently has no active reports.
            </p>
          </div>
        </aside>

        {/* Search and item results */}
        <div className="min-w-0">
          <div className="rounded-2xl border border-[#E5E0D8] bg-[#FAF7F2] p-4 shadow-sm">
            <label
              htmlFor="item-search"
              className={labelClasses}
            >
              Search campus reports
            </label>

            <div className="mt-2 flex w-full flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B6560]"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>

                <input
                  className={`${fieldClasses} pl-10`}
                  id="item-search"
                  type="search"
                  placeholder="Search by title, description, building, or location"
                  value={searchTerm}
                  onChange={(event) =>
                    updateSearchTerm(event.target.value)
                  }
                />
              </div>

              <div className="sm:w-44">
                <label htmlFor="sort-order" className="sr-only">
                  Sort reports
                </label>

                <select
                  className={fieldClasses}
                  id="sort-order"
                  value={sortOrder}
                  onChange={(event) =>
                    updateBrowseFilter(
                      "sort",
                      event.target.value,
                      "newest"
                    )
                  }
                >
                  <option value="newest">Most recent</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
            </div>
          </div>

                    <div className="mt-4 flex flex-col gap-4 rounded-2xl bg-[#A6192E] px-5 py-4 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">
                Lost or found something on campus?
              </h2>

              <p className="mt-1 text-sm text-white/80">
                Create a report so the CSUN community can
                help reunite it with its owner.
              </p>
            </div>

            <Link
              to="/post"
              className="shrink-0 rounded-xl bg-white px-5 py-2.5 text-center text-sm font-semibold text-[#A6192E] transition hover:bg-[#FAF7F2]"
            >
              Post an Item
            </Link>
          </div>

          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#1C1B19]">
                Reported Items
              </h2>

              <p className="mt-1 text-sm text-[#6B6560]">
                {sortedItems.length}{" "}
                {sortedItems.length === 1
                  ? "report found"
                  : "reports found"}
              </p>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-semibold text-[#A6192E] transition hover:underline lg:hidden"
              >
                Clear filters
              </button>
            )}
          </div>

      {sortedItems.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E5E0D8] bg-white px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#A6192E]/10 text-[#A6192E]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m15.5 15.5 5 5" />
            </svg>
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
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {sortedItems.map((item) => {
            const isOwner = currentUser?.uid === item.ownerId;

            return (
              <article
                key={item.id}
                id={`browse-item-${item.id}`}
                className="group relative scroll-mt-24 flex cursor-pointer flex-col rounded-2xl border border-[#E5E0D8] bg-white p-4 shadow-sm transition duration-200 hover:z-40 hover:-translate-y-1 hover:border-[#A6192E]/30 hover:shadow-xl focus-within:z-40"
              >
                <Link
                  to={`/items/${item.id}`}
                  state={{
                    from: "browse",
                    returnTo: `/browse${
                      searchParams.toString()
                        ? `?${searchParams.toString()}`
                        : ""
                    }#browse-item-${item.id}`,
                  }}
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

                {!isOwner && currentUser && (
                  <div className="absolute right-14 top-3 z-30">
                    <BookmarkButton
                      item={item}
                      isSaved={bookmarkedItemIds.includes(
                        item.id
                      )}
                      isWorking={
                        workingBookmarkItemId ===
                        item.id
                      }
                      onToggle={toggleBookmark}
                    />
                  </div>
                )}

                <div className="absolute right-3 top-3 z-30">
                  {isOwner ? (
                    <ReportActionsMenu
                      item={item}
                      editState={{
                      from: "browse",
                      returnTo: `/browse${
                        searchParams.toString()
                          ? `?${searchParams.toString()}`
                          : ""
                      }#browse-item-${item.id}`,
                    }}
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

                <ItemCardImage
                  key={item.imageUrl || "no-image"}
                  item={item}
                />

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

                <h3 className="mt-3 line-clamp-1 text-lg font-bold text-[#1C1B19]">
                  {item.title}
                </h3>

                <p className="mt-1 text-xs text-[#6B6560]">
                  Posted by{" "}
                  <span className="font-medium text-[#1C1B19]">
                    {item.ownerFirstName || "a CSUN community member"}
                  </span>
                </p>

                <p className="mt-3 line-clamp-2 text-sm leading-5 text-[#6B6560]">
                  {item.description || "No description provided."}
                </p>

                <div className="mt-3 space-y-1 border-t border-[#E5E0D8] pt-3 text-xs text-[#6B6560]">
                  <p>
                    {item.category} &middot; {item.building}
                  </p>
                  <p className="truncate">
                    {item.location || "Location unavailable"}
                  </p>
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
        </div>
      </div>
    </section>
  );
}

export default ItemList;
;