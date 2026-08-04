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
    onSnapshot,
    writeBatch,
} from "firebase/firestore";

import { db } from "./config";

export async function createItem(itemData) {
    const ownerFirstName =
        itemData.ownerFirstName?.trim();

    if (!ownerFirstName) {
        throw new Error(
            "The report owner’s first name is required."
        );
    }

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
        ownerFirstName,
        dateReported: itemData.dateReported,
        createdAt: serverTimestamp(),
    };

    const documentReference = await addDoc(itemsRef, newItem);

    return documentReference.id;
}

export async function getAllItems() {
    const itemsRef = collection(db, "items");
    const publicItemsQuery = query(
        itemsRef,
        where("status", "==", "open"),
        where("moderationStatus", "==", "visible")
    );
    const querySnapshot = await getDocs(publicItemsQuery);

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
    const itemsQuery = query(
        itemsRef,
        where("type", "==", type)
    );

    const querySnapshot = await getDocs(itemsQuery);

    return querySnapshot.docs.map((itemDoc) => ({
        id: itemDoc.id,
        ...itemDoc.data(),
    }));
}

export async function getItemById(id) {
    if (!id) {
        throw new Error("An item ID is required.");
    }

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
    if (!id) {
        throw new Error("An item ID is required.");
    }

    const itemRef = doc(db, "items", id);

    await updateDoc(itemRef, updateData);
}

export async function deleteItem(id) {
    if (!id) {
        throw new Error("An item ID is required.");
    }

    const itemRef = doc(db, "items", id);

    await deleteDoc(itemRef);
}

export async function createReport(reportData) {
    if (!reportData.itemId) {
        throw new Error("An item ID is required.");
    }

    if (!reportData.reporterId) {
        throw new Error("You must be logged in to report an item.");
    }

    const reportsRef = collection(db, "reports");
    const reporterQuery = query(
        reportsRef,
        where("reporterId", "==", reportData.reporterId)
    );

    const reporterReportsSnapshot = await getDocs(
        reporterQuery
    );

    const existingReport =
        reporterReportsSnapshot.docs.find(
            (reportDoc) =>
                reportDoc.data().itemId === reportData.itemId
        );

    if (existingReport) {
        throw new Error("ALREADY_REPORTED");
    }

    const reportId = `${reportData.itemId}_${reportData.reporterId}`;
    const reportRef = doc(db, "reports", reportId);

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

    return reportId;
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
}

export async function createClaim(claimData) {
    if (!claimData.itemId) {
        throw new Error("An item ID is required.");
    }

    if (!claimData.ownerId) {
        throw new Error("The report owner is required.");
    }

    if (!claimData.claimantId) {
        throw new Error("You must be logged in to submit a request.");
    }

    if (claimData.ownerId === claimData.claimantId) {
        throw new Error(
            "You cannot submit a request for your own report."
        );
    }

    const trimmedMessage = claimData.message?.trim();

    if (!trimmedMessage) {
        throw new Error(
            "Please explain why you believe this item belongs to you or what you found."
        );
    }

    const claimsRef = collection(db, "claims");
    const claimantQuery = query(
        claimsRef,
        where("claimantId", "==", claimData.claimantId)
    );

    const claimantClaimsSnapshot = await getDocs(claimantQuery);

    const existingClaim = claimantClaimsSnapshot.docs.find(
        (claimDoc) =>
            claimDoc.data().itemId === claimData.itemId
    );

    if (existingClaim) {
        throw new Error(
            "You have already submitted a request for this report."
        );
    }

    const claimId = `${claimData.itemId}_${claimData.claimantId}`;
    const claimRef = doc(db, "claims", claimId);

    const newClaim = {
        itemId: claimData.itemId,
        itemTitle: claimData.itemTitle,
        itemType: claimData.itemType,
        requestType: claimData.requestType,

        ownerId: claimData.ownerId,

        claimantId: claimData.claimantId,
        claimantFirstName: claimData.claimantFirstName,
        claimantEmail: claimData.claimantEmail,
        claimantContact: claimData.claimantContact,

        message: trimmedMessage,
        status: "pending",

        ownerContact: null,

        ownerViewed: false,
        claimantViewedResponse: true,

        createdAt: serverTimestamp(),
        respondedAt: null,
    };

    await setDoc(claimRef, newClaim);

    return claimId;
}

export async function getClaimsByOwner(ownerId) {
    if (!ownerId) {
        throw new Error("An owner ID is required.");
    }

    const claimsRef = collection(db, "claims");
    const ownerQuery = query(
        claimsRef,
        where("ownerId", "==", ownerId)
    );

    const querySnapshot = await getDocs(ownerQuery);

    return querySnapshot.docs.map((claimDoc) => ({
        id: claimDoc.id,
        ...claimDoc.data(),
    }));
}

export function subscribeToClaimNotificationCount(
    userId,
    onCountChange,
    onError
) {
    if (!userId) {
        throw new Error("A user ID is required.");
    }

    const claimsRef = collection(db, "claims");

    const ownerQuery = query(
        claimsRef,
        where("ownerId", "==", userId)
    );

    const claimantQuery = query(
        claimsRef,
        where("claimantId", "==", userId)
    );

    let newRequestCount = 0;
    let newResponseCount = 0;

    function sendUpdatedCount() {
        onCountChange(
            newRequestCount + newResponseCount
        );
    }

    const unsubscribeFromOwnerClaims = onSnapshot(
        ownerQuery,
        (querySnapshot) => {
            newRequestCount =
                querySnapshot.docs.filter(
                    (claimDoc) =>
                        claimDoc.data().ownerViewed === false
                ).length;

            sendUpdatedCount();
        },
        (error) => {
            console.error(
                "Received-request notification error:",
                error
            );

            onError?.(error);
        }
    );

    const unsubscribeFromClaimantClaims = onSnapshot(
        claimantQuery,
        (querySnapshot) => {
            newResponseCount =
                querySnapshot.docs.filter((claimDoc) => {
                    const claim = claimDoc.data();

                    return (
                        claim.status !== "pending" &&
                        claim.claimantViewedResponse === false
                    );
                }).length;

            sendUpdatedCount();
        },
        (error) => {
            console.error(
                "Submitted-request notification error:",
                error
            );

            onError?.(error);
        }
    );

    return () => {
        unsubscribeFromOwnerClaims();
        unsubscribeFromClaimantClaims();
    };
}

export async function getClaimsByClaimant(claimantId) {
    if (!claimantId) {
        throw new Error("A claimant ID is required.");
    }

    const claimsRef = collection(db, "claims");
    const claimantQuery = query(
        claimsRef,
        where("claimantId", "==", claimantId)
    );

    const querySnapshot = await getDocs(claimantQuery);

    return querySnapshot.docs.map((claimDoc) => ({
        id: claimDoc.id,
        ...claimDoc.data(),
    }));
}

export async function updateClaimStatus(
    claimId,
    status,
    ownerContact = null
) {
    if (!claimId) {
        throw new Error("A claim ID is required.");
    }

    if (status !== "accepted" && status !== "rejected") {
        throw new Error(
            'Claim status must be either "accepted" or "rejected".'
        );
    }

    if (status === "accepted" && !ownerContact) {
        throw new Error(
            "Contact information is required when accepting a request."
        );
    }

    const claimRef = doc(db, "claims", claimId);

    await updateDoc(claimRef, {
        status,
        ownerContact:
            status === "accepted" ? ownerContact : null,
        claimantViewedResponse: false,
        respondedAt: serverTimestamp(),
    });
}

export async function markReceivedClaimsViewed(claims) {
    const unreadClaims = claims.filter(
        (claim) => claim.ownerViewed === false
    );

    await Promise.all(
        unreadClaims.map((claim) => {
            const claimRef = doc(db, "claims", claim.id);

            return updateDoc(claimRef, {
                ownerViewed: true,
            });
        })
    );
}

export async function markSubmittedClaimResponsesViewed(
    claims
) {
    const unreadResponses = claims.filter(
        (claim) =>
            claim.status !== "pending" &&
            claim.claimantViewedResponse === false
    );

    await Promise.all(
        unreadResponses.map((claim) => {
            const claimRef = doc(db, "claims", claim.id);

            return updateDoc(claimRef, {
                claimantViewedResponse: true,
            });
        })
    );
}

export async function markItemResolved(
    itemId,
    ownerId
) {
    if (!itemId) {
        throw new Error("An item ID is required.");
    }

    if (!ownerId) {
        throw new Error("An owner ID is required.");
    }

    const itemRef = doc(db, "items", itemId);
    const claimsRef = collection(db, "claims");

    const ownerClaimsQuery = query(
        claimsRef,
        where("ownerId", "==", ownerId)
    );

    const claimsSnapshot = await getDocs(
        ownerClaimsQuery
    );

    const pendingItemClaims =
        claimsSnapshot.docs.filter((claimDoc) => {
            const claim = claimDoc.data();

            return (
                claim.itemId === itemId &&
                claim.status === "pending"
            );
        });

    const batch = writeBatch(db);

    batch.update(itemRef, {
        status: "resolved",
        resolvedAt: serverTimestamp(),
    });

    pendingItemClaims.forEach((claimDoc) => {
        batch.update(claimDoc.ref, {
            status: "closed",
            ownerContact: null,
            claimantViewedResponse: false,
            respondedAt: serverTimestamp(),
        });
    });

    await batch.commit();

    return pendingItemClaims.length;
}