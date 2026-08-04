import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { auth } from "../firebase/config";
import {
  getItemById,
  updateItem,
} from "../firebase/firestore";
import { ITEM_CATEGORIES } from "../constants/categories";

function EditItem() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [originalFormData, setOriginalFormData] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    building: "",
    location: "",
    type: "lost",
    imageUrl: "",
    dateReported: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    async function loadItem() {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setErrorMessage("Please log in before editing a report.");
        setIsLoading(false);
        return;
      }

      try {
        const itemData = await getItemById(itemId);

        if (!itemData) {
          setErrorMessage("This report could not be found.");
          return;
        }

        if (itemData.ownerId !== currentUser.uid) {
          setErrorMessage(
            "You can only edit reports that you created."
          );
          return;
        }

        if (itemData.status === "resolved") {
          setErrorMessage(
            "Resolved reports can no longer be edited."
          );
          return;
        }

        const loadedFormData = {
            title: itemData.title || "",
            description: itemData.description || "",
            category: itemData.category || "",
            building: itemData.building || "",
            location: itemData.location || "",
            type: itemData.type || "lost",
            imageUrl: itemData.imageUrl || "",
            dateReported: itemData.dateReported || "",
        };

        setFormData(loadedFormData);
        setOriginalFormData(loadedFormData);
      } catch (error) {
        console.error("Item loading error:", error);
        setErrorMessage("Unable to load this report.");
      } finally {
        setIsLoading(false);
      }
    }

    loadItem();
  }, [itemId]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
        ...currentData,
        [name]: value,
    }));

    if (name === "imageUrl") {
        setImageError(false);
    }
    }

    const hasChanges =
    originalFormData !== null &&
    JSON.stringify(formData) !== JSON.stringify(originalFormData);

  async function handleSubmit(event) {
    event.preventDefault();

    const currentUser = auth.currentUser;

    if (!hasChanges) {
        return;
        }

    if (!currentUser) {
      setErrorMessage("Please log in again before saving.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");

      const existingItem = await getItemById(itemId);

      if (!existingItem) {
        setErrorMessage("This report no longer exists.");
        return;
      }

      if (existingItem.ownerId !== currentUser.uid) {
        setErrorMessage(
          "You can only edit reports that you created."
        );
        return;
      }

      if (existingItem.status === "resolved") {
        setErrorMessage(
          "This report was resolved and can no longer be edited."
        );
        return;
      }

      await updateItem(itemId, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        building: formData.building.trim(),
        location: formData.location.trim(),
        type: formData.type,
        imageUrl: formData.imageUrl.trim(),
        dateReported: formData.dateReported,
      });

      navigate(`/items/${itemId}`);
    } catch (error) {
      console.error("Item update error:", error);
      setErrorMessage(
        "Unable to save your changes. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-4 focus:ring-red-50";

  if (isLoading) {
    return (
      <main className="flex flex-col items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-red-600" />

        <p className="mt-4 text-slate-600">
          Loading your report...
        </p>
      </main>
    );
  }

  if (errorMessage && !formData.title) {
    return (
      <main className="mx-auto max-w-3xl py-10">
        <h1 className="text-2xl font-bold text-slate-900">
          Unable to edit report
        </h1>

        <p className="mt-2 text-slate-600">
          {errorMessage}
        </p>

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
    <main className="mx-auto max-w-3xl">
      <div className="mb-7">
        <p className="text-sm font-semibold text-[#A6192E]">
          EDIT REPORT
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Update your lost or found item
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Make any necessary corrections, then save your changes.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        {errorMessage && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Report type
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className={`${inputClass} bg-white`}
            >
              <option value="lost">Lost item</option>
              <option value="found">Found item</option>
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Item title
            <input
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </label>
        </div>

        <label className="mt-5 block text-sm font-medium text-slate-700">
          Description
          <textarea
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            className={`${inputClass} resize-none`}
            required
          />
        </label>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Building
            <input
              name="building"
              type="text"
              value={formData.building}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Category
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`${inputClass} bg-white`}
              required
            >
              <option value="">Select a category</option>

              {ITEM_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Specific location
            <input
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Date lost or found
            <input
              name="dateReported"
              type="date"
              value={formData.dateReported}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </label>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-medium text-slate-700">
            Image link
            <input
              name="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={handleChange}
              className={inputClass}
            />
          </label>

          {formData.imageUrl && (
            <div className="mt-4">
              {imageError ? (
                <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-red-300 bg-red-50 px-6 text-center">
                  <p className="text-sm text-red-700">
                    Unable to preview this image.
                  </p>
                </div>
              ) : (
                <img
                  src={formData.imageUrl}
                  alt="Updated item preview"
                  className="h-72 w-full rounded-2xl border border-slate-200 bg-slate-50 object-contain p-2"
                  onError={() => setImageError(true)}
                  onLoad={() => setImageError(false)}
                />
              )}
            </div>
          )}
        </div>

        <div className="mt-7 flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
          <Link
            to={`/items/${itemId}`}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSaving || !hasChanges}
            className="rounded-xl bg-[#A6192E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:opacity-100"
            >
            {isSaving ? "Saving..." : "Save Changes"}
            </button>
        </div>
      </form>
    </main>
  );
}

export default EditItem;