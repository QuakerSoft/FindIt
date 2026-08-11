function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result
        .split(",")[1];

      resolve(base64);
    };

    reader.onerror = () => {
      reject(reader.error);
    };

    reader.readAsDataURL(file);
  });
}

export async function getAiTagsForImage(file) {
  if (!file) {
    return [];
  }

  try {
    const imageBase64 =
      await fileToBase64(file);

    const response = await fetch(
      "/api/analyze-image",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64,
          mediaType: file.type,
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "AI tag analysis failed:",
        response.status
      );

      return null;
    }

    const data = await response.json();

    return Array.isArray(data.tags)
      ? data.tags
      : [];
  } catch (error) {
    console.error(
      "Unable to analyze item image:",
      error
    );

    return null;
  }
}