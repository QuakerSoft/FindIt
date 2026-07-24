import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getItemById } from "../firebase/firestore";

function ItemDetails() {
  const { itemId } = useParams();

  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    async function loadItem() {
      try {
        setImageError(false);

        const itemData = await getItemById(itemId);

        if (!itemData) {
          setErrorMessage("This item report could not be found.");
          return;
        }

        setItem(itemData);
      } catch (error) {
        console.error(error);
        setErrorMessage("Unable to load this item report.");
      } finally {
        setIsLoading(false);
      }
    }

    loadItem();
  }, [itemId]);

  if (isLoading) {
    return (
      <main className="flex flex-col items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-red-600" />
        <p className="mt-4 text-slate-600">Fetching item details...</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="mx-auto max-w-3xl py-10">
        <h1 className="text-2xl font-bold text-slate-900">
          Item not found
        </h1>

        <p className="mt-2 text-slate-600">{errorMessage}</p>

        <Link
          to="/browse"
          className="mt-6 inline-block rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Back to Browse
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl py-10">
      <Link
        to="/browse"
        className="text-sm font-medium text-red-600 hover:text-red-700"
      >
        ← Back to Browse
      </Link>

      <article className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
          {item.type} item
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          {item.title}
        </h1>

        <p className="mt-4 text-slate-600">{item.description}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <p>
            <span className="font-semibold">Category:</span> {item.category}
          </p>

          <p>
            <span className="font-semibold">Status:</span> {item.status}
          </p>

          <p>
            <span className="font-semibold">Building:</span> {item.building}
          </p>

          <p>
            <span className="font-semibold">Location:</span> {item.location}
          </p>

          <p>
            <span className="font-semibold">Date lost or found:</span>{" "}
            {item.dateReported || "Date unavailable"}
          </p>

          <p>
            <span className="font-semibold">Reported:</span>{" "}
            {item.createdAt?.toDate
              ? item.createdAt.toDate().toLocaleDateString()
              : "Date unavailable"}
          </p>
        </div>

        {item.imageUrl && (
          <div className="mt-6">
            {imageError ? (
              <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
                <p className="text-sm text-slate-600">
                  This item’s image could not be loaded.
                </p>
              </div>
            ) : (
              <img
                src={item.imageUrl}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="max-h-96 w-full rounded-2xl border border-slate-200 bg-slate-50 object-contain p-2"
                onError={() => setImageError(true)}
                onLoad={() => setImageError(false)}
              />
            )}
          </div>
        )}
      </article>
    </main>
  );
}

export default ItemDetails;