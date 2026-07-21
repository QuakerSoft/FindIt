import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
} from "firebase/firestore";

import { db } from "./config";

export async function createItem(itemData) {
    const itemsRef = collection(db, "items");

    const newItem = {
        title: itemData.title,
        description: itemData.description,
        category: itemData.category,
        building: itemData.building,
        location: itemData.location,
        type: itemData.type,
        status: "open",
        imageUrl: itemData.imageUrl || "",
        ownerId: itemData.ownerId,
        ownerEmail: itemData.ownerEmail,
        dateReported: itemData.dateReported,
        createdAt: serverTimestamp(),
    };

    const documentReference = await addDoc(itemsRef, newItem);

    return documentReference.id;
}

export async function getAllItems() {
    const itemsRef = collection(db, "items");
    const querySnapshot = await getDocs(itemsRef);

    const items = querySnapshot.docs.map((itemDoc) => ({
        id: itemDoc.id,
        ...itemDoc.data(),
    }));

    return items;
}

export async function getItemById(id) {
    const itemRef = doc(db, "items", id);
    const itemSnapshot = await getDoc(itemRef);

    if (!itemSnapshot.exists()) {
        return null;
    }

    return {
        id: itemSnapshot.id,
        ...itemSnapshot.data(),
    };
}

export async function updateItem(id, updateData) {
    const itemRef = doc(db, "items", id);

    await updateDoc(itemRef, updateData);
}

export async function deleteItem(id) {
    const itemRef = doc(db, "items", id);

    await deleteDoc(itemRef);
}