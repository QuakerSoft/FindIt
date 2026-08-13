import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { auth } from "../firebase/config";
import {
  getItemById,
  updateItem,
} from "../firebase/firestore";
import { ITEM_CATEGORIES } from "../constants/categories";
import { CAMPUS_BUILDINGS } from "../constants/buildings";
import {
  uploadItemImage,
  validateItemImage,
} from "../services/cloudinary";
import { getAiTagsForImage } from "../services/imageAnalysis";

function EditItem() {
  const { itemId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const itemDetailsState = location.state?.returnTo
    ? {
        from: location.state.from || "account",
        returnTo: location.state.returnTo,
      }
    : undefined;
  const [originalFormData, setOriginalFormData] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    building: "",
    location: "",
    type: "lost",
    imageUrl: "",
    imagePath: "",
    dateReported: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [imageError, setImageError] = useState(false);
  const [newImageFile, setNewImageFile] =
    useState(null);

  const [newImagePreviewUrl, setNewImagePreviewUrl] =
    useState("");

  const [shouldRemoveImage, setShouldRemoveImage] =
    useState(false);

  const imageInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (newImagePreviewUrl) {
        URL.revokeObjectURL(
          newImagePreviewUrl
        );
      }
    };
  }, [newImagePreviewUrl]);

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
            imagePath: itemData.imagePath || "",
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
  }

  function handleImageChange(event) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    try {
      validateItemImage(selectedFile);

      setErrorMessage("");
      setImageError(false);
      setShouldRemoveImage(false);
      setNewImageFile(selectedFile);
      setNewImagePreviewUrl(
        URL.createObjectURL(selectedFile)
      );
    } catch (error) {
      setErrorMessage(error.message);
      setNewImageFile(null);
      setNewImagePreviewUrl("");

      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  }

  function removeImage() {
    setNewImageFile(null);
    setNewImagePreviewUrl("");
    setShouldRemoveImage(true);
    setImageError(false);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }

    const hasChanges =
      originalFormData !== null &&
      (
        JSON.stringify(formData) !==
          JSON.stringify(originalFormData) ||
        newImageFile !== null ||
        shouldRemoveImage
      );

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

      let updatedImageUrl =
        shouldRemoveImage
          ? ""
          : formData.imageUrl;

      let updatedImagePath =
        shouldRemoveImage
          ? ""
          : formData.imagePath;

      let updatedAiTags =
        shouldRemoveImage
          ? []
          : Array.isArray(existingItem.aiTags)
            ? existingItem.aiTags
            : [];

      if (newImageFile) {
        const uploadedImage =
          await uploadItemImage(
            newImageFile,
            currentUser.uid
          );

        updatedImageUrl =
          uploadedImage.imageUrl;

        updatedImagePath =
          uploadedImage.imagePath;

        try {
          const analyzedTags =
            await getAiTagsForImage(
              newImageFile
            );

          updatedAiTags = Array.isArray(
            analyzedTags
          )
            ? analyzedTags
            : [];
        } catch (analysisError) {
          console.error(
            "Unable to analyze updated item image:",
            analysisError
          );

          updatedAiTags = [];
        }
      }

      await updateItem(itemId, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        building: formData.building.trim(),
        location: formData.location.trim(),
        type: formData.type,
        imageUrl: updatedImageUrl,
        imagePath: updatedImagePath,
        aiTags: updatedAiTags,
        dateReported: formData.dateReported,
      });

      navigate(`/items/${itemId}`, {
      state: itemDetailsState,
    });
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
  "mt-2 w-full rounded-xl border border-[#D8D1C8] bg-white px-3 py-2.5 text-sm text-[#1C1B19] outline-none transition placeholder:text-[#8A837C] focus:border-[#A6192E] focus:ring-4 focus:ring-[#A6192E]/10";

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

  const displayedImageUrl =
    newImagePreviewUrl ||
    (
      !shouldRemoveImage
        ? formData.imageUrl
        : ""
    );

  return (
    <main className="mx-auto max-w-3xl">
      <header className="mb-7 border-b border-[#E5E0D8] pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A6192E]">
          Edit report
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1C1B19] sm:text-4xl">
          Update your lost or found item
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6560] sm:text-base">
          Make any necessary corrections, then save your changes.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-[#E5E0D8] bg-white p-6 shadow-md sm:p-8"
      >
        {errorMessage && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-semibold text-[#494541]">
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

          <label className="text-sm font-semibold text-[#494541]">
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

        <label className="mt-5 block text-sm font-semibold text-[#494541]">
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
          <label className="text-sm font-semibold text-[#494541]">
            Campus building or area
            <select
              name="building"
              value={formData.building}
              onChange={handleChange}
              className={inputClass}
              required
            >
              <option value="">
                Select a campus location
              </option>

              {!CAMPUS_BUILDINGS.includes(
                formData.building
              ) &&
                formData.building && (
                  <option value={formData.building}>
                    {formData.building} (previous entry)
                  </option>
                )}

              {CAMPUS_BUILDINGS.map((building) => (
                <option
                  key={building}
                  value={building}
                >
                  {building}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-[#494541]">
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
          <label className="text-sm font-semibold text-[#494541]">
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

          <label className="text-sm font-semibold text-[#494541]">
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
          <p className="text-sm font-semibold text-[#494541]">
            Item image
            <span className="ml-1 font-normal text-[#6B6560]">
              (optional)
            </span>
          </p>

          <input
            ref={imageInputRef}
            id="edit-item-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="sr-only"
          />

          {displayedImageUrl ? (
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-[#494541]">
                {newImageFile
                  ? "New image preview"
                  : "Current image"}
              </p>

              {imageError ? (
                <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-red-300 bg-red-50 px-6 text-center">
                  <p className="text-sm text-red-700">
                    Unable to preview this image.
                  </p>
                </div>
              ) : (
                <img
                  src={displayedImageUrl}
                  alt="Item preview"
                  className="h-72 w-full rounded-2xl border border-[#E5E0D8] bg-[#FAF7F2] object-contain p-3"
                  onError={() => setImageError(true)}
                  onLoad={() => setImageError(false)}
                />
              )}

              <div className="mt-3 flex flex-wrap gap-3">
                <label
                  htmlFor="edit-item-image"
                  className="cursor-pointer rounded-xl border border-[#D8D1C8] bg-white px-4 py-2 text-sm font-semibold text-[#1C1B19] transition hover:border-[#A6192E]/40 hover:bg-[#FAF7F2]"
                >
                  Choose a different image
                </label>

                <button
                  type="button"
                  onClick={removeImage}
                  className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                >
                  Remove image
                </button>
              </div>
            </div>
          ) : (
            <label
              htmlFor="edit-item-image"
              className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D8D1C8] bg-[#FAF7F2] px-6 py-10 text-center transition hover:border-[#A6192E]/50 hover:bg-[#A6192E]/5"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#A6192E]/10 text-[#A6192E]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path d="M4 7h3l1.5-2h7L17 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </span>

              <span className="mt-3 text-sm font-semibold text-[#1C1B19]">
                Click to choose an image
              </span>

              <span className="mt-1 text-xs text-[#6B6560]">
                JPG, PNG, or WebP — maximum 5 MB
              </span>
            </label>
          )}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-end gap-3 border-t border-[#E5E0D8] pt-6">
          <Link
            to={`/items/${itemId}`}
            state={itemDetailsState}
            className="rounded-xl border border-[#D8D1C8] bg-white px-5 py-3 text-sm font-semibold text-[#1C1B19] transition hover:border-[#A6192E]/40 hover:bg-[#FAF7F2]"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSaving || !hasChanges}
            className="rounded-xl bg-[#A6192E] px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:opacity-100"
            >
            {isSaving ? "Saving..." : "Save Changes"}
            </button>
        </div>
      </form>
    </main>
  );
}

export default EditItem;