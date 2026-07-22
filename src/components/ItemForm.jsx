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