import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  updateDoc,
  deleteDoc,
  setDoc,
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

  return querySnapshot.docs.map((itemDoc) => ({
    id: itemDoc.id,
    ...itemDoc.data(),
  }));
}

export async function getItemsByType(type) {
  if (type !== "lost" && type !== "found") {
    throw new Error('Item type must be either "lost" or "found".');
  }

  const itemsRef = collection(db, "items");
  const itemsQuery = query(itemsRef, where("type", "==", type));
  const querySnapshot = await getDocs(itemsQuery);

  return querySnapshot.docs.map((itemDoc) => ({
    id: itemDoc.id,
    ...itemDoc.data(),
  }));
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

<<<<<<< HEAD
  await deleteDoc(itemRef);
}

export async function createReport(reportData) {
  const reportId = `${reportData.itemId}_${reportData.reporterId}`;
  const reportRef = doc(db, "reports", reportId);
  const existingReport = await getDoc(reportRef);

  if (existingReport.exists()) {
    throw new Error("ALREADY_REPORTED");
  }

  await setDoc(reportRef, {
    itemId: reportData.itemId,
    itemTitle: reportData.itemTitle,
    itemOwnerId: reportData.itemOwnerId,
    reporterId: reportData.reporterId,
    reporterEmail: reportData.reporterEmail,
    reason: reportData.reason,
    details: reportData.details || "",
    status: "pending",
    createdAt: serverTimestamp(),
  });
=======
    await deleteDoc(itemRef);
}

export async function getUserProfile(userId) {
    if (!userId) {
        throw new Error("A user ID is required to load a profile.");
    }

    const userRef = doc(db, "users", userId);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
        return null;
    }

    return {
        id: userSnapshot.id,
        ...userSnapshot.data(),
    };
}

export async function updateUserProfile(userId, profileData) {
    if (!userId) {
        throw new Error("A user ID is required to update a profile.");
    }

    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phoneNumber: profileData.phoneNumber,
        contactPreference: profileData.contactPreference,
    });
}

export async function getItemsByOwner(ownerId) {
    if (!ownerId) {
        throw new Error("A user ID is required to load reports.");
    }

    const itemsRef = collection(db, "items");
    const ownerQuery = query(
        itemsRef,
        where("ownerId", "==", ownerId)
    );

    const querySnapshot = await getDocs(ownerQuery);

    return querySnapshot.docs.map((itemDoc) => ({
        id: itemDoc.id,
        ...itemDoc.data(),
    }));
>>>>>>> 0f564a1740036822c6e2340534bba844e27792b1
}