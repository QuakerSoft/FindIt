import {
  useEffect,
  useRef,
  useState,
} from "react";
import { auth } from "../firebase/config";
import { createItem, getUserProfile } from "../firebase/firestore";
import { ITEM_CATEGORIES } from "../constants/categories";
import {
  uploadItemImage,
  validateItemImage,
} from "../services/cloudinary";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // reader.result looks like "data:image/png;base64,iVBORw0K..."
      // strip the prefix, the API only wants the raw base64 payload.
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function getAiTagsForImage(file) {
  try {
    const imageBase64 = await fileToBase64(file);

    const response = await fetch("/api/analyze-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64,
        mediaType: file.type,
      }),
    });

    if (!response.ok) {
      console.error("AI tag analysis failed:", response.status);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data.tags) ? data.tags : [];
  } catch (error) {
    // AI tagging is an enhancement, not a requirement — never block
    // item submission if this fails for any reason.
    console.error("AI tag analysis error:", error);
    return [];
  }
}

function ItemForm() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    building: "",
    location: "",
    type: "lost",
    dateReported: "",
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageFile, setImageFile] =
    useState(null);

  const [imagePreviewUrl, setImagePreviewUrl] =
    useState("");

  const imageInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((previousData) => ({
      ...previousData,
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

    setMessage("");
    setImageError(false);
    setImageFile(selectedFile);
    setImagePreviewUrl(
      URL.createObjectURL(selectedFile)
    );
  } catch (error) {
    setMessage(error.message);
    setImageFile(null);
    setImagePreviewUrl("");

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }
}

function removeSelectedImage() {
  setImageFile(null);
  setImagePreviewUrl("");
  setImageError(false);

  if (imageInputRef.current) {
    imageInputRef.current.value = "";
  }
}

  async function handleSubmit(event) {
    event.preventDefault();

    const currentUser = auth.currentUser;

    if (!currentUser) {
      setMessage(
        "You must be logged in to report an item."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("");

      const userProfile = await getUserProfile(
        currentUser.uid
      );

      const ownerFirstName =
        userProfile?.firstName?.trim();

      if (!ownerFirstName) {
        throw new Error(
          "Please complete your profile before reporting an item."
        );
      }

      let imageUrl = "";
      let imagePath = "";
      let aiTags = [];

      if (imageFile) {
        const uploadedImage =
          await uploadItemImage(
            imageFile,
            currentUser.uid
          );

        imageUrl = uploadedImage.imageUrl;
        imagePath = uploadedImage.imagePath;

        // Best-effort AI tagging from the photo — feeds the matching
        // algorithm but should never block the report if it fails.
        aiTags = await getAiTagsForImage(imageFile);
      }

      await createItem({
        ...formData,
        imageUrl,
        imagePath,
        aiTags,
        ownerId: currentUser.uid,
        ownerFirstName,
      });

      setMessage("Item reported successfully!");

      setFormData({
        title: "",
        description: "",
        category: "",
        building: "",
        location: "",
        type: "lost",
        dateReported: "",
      });

      setImageFile(null);
      setImagePreviewUrl("");
      setImageError(false);

      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Item submission error:", error);

      setMessage(
        error.message ||
          "Unable to submit this report."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-4 focus:ring-red-50";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
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
            placeholder="e.g., Black Hydro Flask"
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
          placeholder="Color, brand, identifying details…"
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
            placeholder="e.g., University Library"
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
            placeholder="e.g., Second floor hallway"
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
        <p className="text-sm font-medium text-slate-700">
          Item image (optional)
        </p>

        <input
          ref={imageInputRef}
          id="item-image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
          className="sr-only"
        />

        {!imagePreviewUrl ? (
          <label
            htmlFor="item-image"
            className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-red-400 hover:bg-red-50"
          >
            <span className="text-3xl" aria-hidden="true">
              📷
            </span>

            <span className="mt-3 text-sm font-semibold text-slate-800">
              Click to choose an image
            </span>

            <span className="mt-1 text-xs text-slate-500">
              JPG, PNG, or WebP — maximum 5 MB
            </span>
          </label>
        ) : (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-slate-700">
              Image preview
            </p>

            {imageError ? (
              <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-red-300 bg-red-50 px-6 text-center">
                <p className="text-sm text-red-700">
                  Unable to preview this image.
                </p>
              </div>
            ) : (
              <img
                src={imagePreviewUrl}
                alt="Selected item preview"
                className="h-72 w-full rounded-2xl border border-slate-200 bg-slate-50 object-contain p-2"
                onError={() => setImageError(true)}
                onLoad={() => setImageError(false)}
              />
            )}

            <div className="mt-3 flex flex-wrap gap-3">
              <label
                htmlFor="item-image"
                className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Choose a different image
              </label>

              <button
                type="button"
                onClick={removeSelectedImage}
                className="rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
              >
                Remove image
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-7 flex items-center justify-end gap-4 border-t border-slate-100 pt-6">
        {message && <p className="text-sm text-slate-600">{message}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl border border-transparent bg-[#A6192E] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-red-100 transition hover:border-[#A6192E] hover:bg-white hover:text-[#A6192E] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Submit report"}
        </button>
      </div>
    </form>
  );
}
export default ItemForm;