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
    <form onSubmit={handleSubmit}>
      <h2>Report an Item</h2>

      <label htmlFor="type">Report Type</label>
      <select
        id="type"
        name="type"
        value={formData.type}
        onChange={handleChange}
      >
        <option value="lost">Lost Item</option>
        <option value="found">Found Item</option>
      </select>

      <br />
      <br />

      <label htmlFor="title">Item Title</label>
      <input
        id="title"
        name="title"
        type="text"
        placeholder="Black backpack"
        value={formData.title}
        onChange={handleChange}
        required
      />

      <br />
      <br />

      <label htmlFor="description">Description</label>
      <textarea
        id="description"
        name="description"
        placeholder="Describe the item"
        value={formData.description}
        onChange={handleChange}
        required
      />

      <br />
      <br />

      <label htmlFor="category">Category</label>
      <input
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

      <label htmlFor="building">Building</label>
      <input
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

      <label htmlFor="location">Specific Location</label>
      <input
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

      <label htmlFor="dateReported">
        Date Item Was Lost or Found
      </label>
      <input
        id="dateReported"
        name="dateReported"
        type="date"
        value={formData.dateReported}
        onChange={handleChange}
        required
      />

      <br />
      <br />

      <label htmlFor="imageUrl">Image URL</label>
      <input
        id="imageUrl"
        name="imageUrl"
        type="url"
        placeholder="Optional image link"
        value={formData.imageUrl}
        onChange={handleChange}
      />

      <br />
      <br />

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit Report"}
      </button>

      {message && <p>{message}</p>}
    </form>
  );
}

export default ItemForm;