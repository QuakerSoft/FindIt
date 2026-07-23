import { useState } from "react";
import { auth } from "../firebase/config";
import { createItem } from "../firebase/firestore";

function ItemForm() {
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
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setMessage("You must be logged in to report an item.");
      return;
    }
    try {
      setIsSubmitting(true);
      setMessage("");
      await createItem({
        ...formData,
        ownerId: currentUser.uid,
        ownerEmail: currentUser.email,
      });
      setMessage("Item reported successfully!");
      setFormData({
        title: "",
        description: "",
        category: "",
        building: "",
        location: "",
        type: "lost",
        imageUrl: "",
        dateReported: "",
      });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="px-15 pt-10 pb-15 border-3 border-[#D22030] rounded-2xl bg-[#D22030]/8">
      <h2 class="pb-5 text-center text-xl">Report an Item</h2>
      <label htmlFor="type">Report Type: </label>
      <select className="bg-white/75 border border-[#D22030] rounded-sm"
        id="type"
        name="type"
        value={formData.type}
        on Change={handleChange}
      >
        <option value="lost">Lost Item</option>
        <option value="found">Found Item</option>
      </select>

      <br />
      <br />

      <label htmlFor="title">Item Title: </label>
      <input 
        className="p-0.5 border border-[#D22030] bg-white/75 rounded-sm"
        id="title"
        name="title"
        type="text"
        placeholder="Black Backpack"
        value={formData.title}
        onChange={handleChange}
        required
       />

      <br />
      <br />

      <label htmlFor="description">Description: </label>
      <textarea
        className="resize-none inline-block align-top p-0.5 border border-[#D22030] bg-white/75 rounded-sm"
        id="description"
        name="description"
        placeholder="Black backbag that had pins attached..."
        value={formData.description}
        onChange={handleChange}
        required
      />

      <br />
      <br />

      <label htmlFor="category">Category: </label>
      <input
        className="p-0.5 border border-[#D22030] bg-white/75 rounded-sm"
        id="category"
        name="category"
        type="text"
        placeholder="Backpack"
        value={formData.category}
        onChange={handleChange}
        required
      />

      <br />
      <br />

      <label htmlFor="building">Building: </label>
      <input
        className="p-0.5 border border-[#D22030] bg-white/75 rounded-sm"
        id="building"
        name="building"
        type="text"
        placeholder="Jacaranda Hall"
        value={formData.building}
        onChange={handleChange}
        required
      />

      <br />
      <br />

      <label htmlFor="location">Specific Location: </label>
      <input
        className="p-0.5 border border-[#D22030] bg-white/75 rounded-sm"
        id="location"
        name="location"
        type="text"
        placeholder="Second floor hallway"
        value={formData.location}
        onChange={handleChange}
        required
      />

      <br />
      <br />

      <label htmlFor="dateReported">Date Item Was Lost or Found: </label>
      <input class="p-0.5 bg-white/75 border border-[#D22030] rounded-sm"
        id="dateReported"
        name="dateReported"
        type="date"
        value={formData.dateReported}
        onChange={handleChange}
        required
      />

      <br />
      <br />

      <label htmlFor="imageUrl">Image URL: </label>
      <input
        className="p-0.5 border border-[#D22030] bg-white/75 rounded-sm"
        id="imageUrl"
        name="imageUrl"
        type="url"
        placeholder="Optional image link"
        value={formData.imageUrl}
        onChange={handleChange}
      />

      <br />
      <br />
      <div class="text-center text-xl">
        <button type="submit" disabled={isSubmitting} class="text-white bg-[#D22030] p-3 rounded-xl">
          {isSubmitting ? "Submitting..." : "Submit Report"}
        </button>
      </div>
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
          <input
            name="category"
            type="text"
            placeholder="e.g., Electronics"
            value={formData.category}
            onChange={handleChange}
            className={inputClass}
            required
          />
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

      <label className="mt-5 block text-sm font-medium text-slate-700">
        Image URL (optional)
        <input
          name="imageUrl"
          type="url"
          placeholder="Optional image link"
          value={formData.imageUrl}
          onChange={handleChange}
          className={inputClass}
        />
      </label>

      <div className="mt-7 flex items-center justify-end gap-4 border-t border-slate-100 pt-6">
        {message && <p className="text-sm text-slate-600">{message}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-red-100 transition hover:bg-red-700 disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Submit report"}
        </button>
      </div>
    </form>
  );
}

export default ItemForm;