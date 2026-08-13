import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/config";
import { createItem, getUserProfile } from "../firebase/firestore";
import { ITEM_CATEGORIES } from "../constants/categories";
import { CAMPUS_BUILDINGS } from "../constants/buildings";
import {
  uploadItemImage,
  validateItemImage,
} from "../services/cloudinary";
import { getAiTagsForImage } from "../services/imageAnalysis";

function ItemForm() {
  const navigate = useNavigate();
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

    if (
      formData.type === "found" &&
      !imageFile
    ) {
      setMessage(
        "Please add an image when reporting a found item."
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

        // AI tags improve matching, but an analysis failure
        // should never prevent the report from being posted.
        try {
          const analyzedTags =
            await getAiTagsForImage(imageFile);

          aiTags = Array.isArray(analyzedTags)
            ? analyzedTags
            : [];
        } catch (analysisError) {
          console.error(
            "Unable to analyze item image:",
            analysisError
          );

          aiTags = [];
        }
      }

      const newItemId = await createItem({
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        building: formData.building.trim(),
        location: formData.location.trim(),
        imageUrl,
        imagePath,
        aiTags,
        ownerId: currentUser.uid,
        ownerFirstName,
      });

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
      
      navigate(`/items/${newItemId}`, {
        state: {
          newlyPosted: true,
          scrollToMatches: true,
        },
      });

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
  "mt-2 w-full rounded-xl border border-[#D8D1C8] bg-white px-3 py-2.5 text-sm text-[#1C1B19] outline-none transition placeholder:text-[#8A837C] focus:border-[#A6192E] focus:ring-4 focus:ring-[#A6192E]/10";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-[#E5E0D8] bg-white p-6 shadow-md sm:p-8"
    >
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
            placeholder="e.g., Black Hydro Flask"
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
          placeholder="Color, brand, identifying details…"
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
            placeholder="e.g., Second floor hallway"
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
            {formData.type === "found"
              ? "(required)"
              : "(optional)"}
          </span>
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
        ) : (
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-[#494541]">
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
                className="h-72 w-full rounded-2xl border border-[#E5E0D8] bg-[#FAF7F2] object-contain p-3"
                onError={() => setImageError(true)}
                onLoad={() => setImageError(false)}
              />
            )}

            <div className="mt-3 flex flex-wrap gap-3">
              <label
                htmlFor="item-image"
                className="cursor-pointer rounded-xl border border-[#D8D1C8] bg-white px-4 py-2 text-sm font-semibold text-[#1C1B19] transition hover:border-[#A6192E]/40 hover:bg-[#FAF7F2]"
              >
                Choose a different image
              </label>

              <button
                type="button"
                onClick={removeSelectedImage}
                className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
              >
                Remove image
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-7 border-t border-[#E5E0D8] pt-6">
        {message && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {message}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-[#A6192E] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          >
            {isSubmitting
              ? "Submitting report..."
              : "Submit Report"}
          </button>
        </div>
      </div>
    </form>
  );
}
export default ItemForm;