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
    deleteField,
} from "firebase/firestore";

import { db } from "./config";
import { rankMatches } from "../utils/matching";

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
        moderationStatus: "visible",
        ownerViewedModeration: true,
        imageUrl: itemData.imageUrl || "",
        imagePath: itemData.imagePath || "",
        aiTags: itemData.aiTags || [],
        ownerId: itemData.ownerId,
        ownerFirstName,
        dateReported: itemData.dateReported,
        createdAt: serverTimestamp(),
    };

    const documentReference = await addDoc(itemsRef, newItem);

    // Best-effort: suggest matches against opposite-type items.
    // Never let a matching failure block the item post itself.
    try {
        await findAndSaveMatches(documentReference.id, newItem);
    } catch (error) {
        console.error("findAndSaveMatches failed:", error);
    }

    return documentReference.id;
}

/**
 * Compares a newly created item against existing open items of the
 * opposite type (lost <-> found), scores them with Jaccard similarity
 * over their text + AI-generated tags, and saves the top candidates to
 * a `matches` subcollection — written on BOTH sides, so the new item
 * sees the match immediately, and each existing candidate it matched
 * against also picks up the match on its own page (since matching only
 * runs once, at creation time, older posts would never otherwise learn
 * about a newer item that matches them).
 */
export async function clearItemMatches(itemId) {
    if (!itemId) {
        throw new Error("An item ID is required.");
    }

    const matchesRef = collection(
        db,
        "items",
        itemId,
        "matches"
    );

    const matchesSnapshot = await getDocs(matchesRef);

    if (matchesSnapshot.empty) {
        return;
    }

    const batch = writeBatch(db);

    matchesSnapshot.docs.forEach((matchDoc) => {
        const matchData = matchDoc.data();
        const matchedItemId =
            matchData.matchedItemId;

        batch.delete(matchDoc.ref);

        if (matchedItemId) {
            const reverseMatchRef = doc(
                db,
                "items",
                matchedItemId,
                "matches",
                itemId
            );

            batch.delete(reverseMatchRef);
        }
    });

    await batch.commit();
}

export async function findAndSaveMatches(itemId, itemData) {
    if (!itemId) {
        throw new Error("An item ID is required.");
    }

    await clearItemMatches(itemId);

    if (
        itemData.status !== "open" ||
        itemData.moderationStatus !== "visible"
    ) {
        return [];
    }

    const oppositeType =
        itemData.type === "lost"
            ? "found"
            : "lost";

    const candidates = await getItemsByType(
        oppositeType
    );

    const eligibleCandidates = candidates.filter(
        (candidate) =>
            candidate.id !== itemId &&
            candidate.status === "open" &&
            candidate.moderationStatus === "visible"
    );

    const topMatches = rankMatches(
        itemData,
        eligibleCandidates
    );

    if (topMatches.length === 0) {
        return [];
    }

    const batch = writeBatch(db);

    topMatches.forEach((match) => {
        const forwardRef = doc(
            db,
            "items",
            itemId,
            "matches",
            match.itemId
        );

        batch.set(forwardRef, {
            matchedItemId: match.itemId,
            score: match.score,
            createdAt: serverTimestamp(),
        });

        const reverseRef = doc(
            db,
            "items",
            match.itemId,
            "matches",
            itemId
        );

        batch.set(reverseRef, {
            matchedItemId: itemId,
            score: match.score,
            createdAt: serverTimestamp(),
        });
    });

    await batch.commit();

    return topMatches;
}

/**
 * Reads the saved matches for an item and hydrates each with the
 * matched item's actual document data, ranked by score descending.
 */
export async function getItemMatches(itemId) {
    const matchesRef = collection(
        db,
        "items",
        itemId,
        "matches"
    );

    const matchesSnapshot = await getDocs(
        matchesRef
    );

    const matches = matchesSnapshot.docs
        .map((matchDoc) => matchDoc.data())
        .sort((matchA, matchB) =>
            matchB.score - matchA.score
        );

    const hydratedMatches = await Promise.all(
        matches.map(async (match) => {
            const matchedItem = await getItemById(
                match.matchedItemId
            );

            return {
                ...match,
                item: matchedItem,
            };
        })
    );

    return hydratedMatches.filter(
        (match) =>
            match.item !== null &&
            match.item.status === "open" &&
            match.item.moderationStatus === "visible"
    );
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
        throw new Error(
            'Item type must be either "lost" or "found".'
        );
    }

    const itemsRef = collection(db, "items");

    const itemsQuery = query(
        itemsRef,
        where("type", "==", type),
        where("status", "==", "open"),
        where(
            "moderationStatus",
            "==",
            "visible"
        )
    );

    const querySnapshot = await getDocs(
        itemsQuery
    );

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

export async function checkIsAdmin(userId) {
    if (!userId) {
        return false;
    }

    const adminRef = doc(db, "admins", userId);
    const adminSnapshot = await getDoc(adminRef);

    return adminSnapshot.exists();
}

export async function getReportsForAdmin() {
    const reportsRef = collection(db, "reports");
    const querySnapshot = await getDocs(reportsRef);

    return querySnapshot.docs.map((reportDoc) => ({
        id: reportDoc.id,
        ...reportDoc.data(),
    }));
}

export async function dismissModerationReport(
    reportId,
    itemId,
    adminId
) {
    if (!reportId || !itemId) {
        throw new Error(
            "A moderation report and item ID are required."
        );
    }

    if (!adminId) {
        throw new Error(
            "An administrator ID is required."
        );
    }

    const reportRef = doc(
        db,
        "reports",
        reportId
    );

    const itemRef = doc(
        db,
        "items",
        itemId
    );

    const batch = writeBatch(db);

    batch.update(reportRef, {
        status: "dismissed",
        reviewedBy: adminId,
        reviewedAt: serverTimestamp(),
    });

    batch.update(itemRef, {
        moderationStatus: "visible",
        ownerViewedModeration: true,
        moderatedBy: adminId,
        moderatedAt: serverTimestamp(),
    });
        await batch.commit();

    try {
        const dismissedItem = await getItemById(
            itemId
        );

        if (
            dismissedItem &&
            dismissedItem.status === "open"
        ) {
            await findAndSaveMatches(
                itemId,
                dismissedItem
            );
        }
    } catch (error) {
        console.error(
            "Unable to refresh dismissed item matches:",
            error
        );
    }
}

export async function hideModeratedItem(
    reportId,
    itemId,
    adminId
) {
    if (!reportId || !itemId) {
        throw new Error(
            "A moderation report and item ID are required."
        );
    }

    if (!adminId) {
        throw new Error(
            "An administrator ID is required."
        );
    }

    const reportRef = doc(
        db,
        "reports",
        reportId
    );

    const itemRef = doc(
        db,
        "items",
        itemId
    );

    const claimsRef = collection(db, "claims");
    const itemClaimsQuery = query(
        claimsRef,
        where("itemId", "==", itemId)
    );

    const claimsSnapshot = await getDocs(
        itemClaimsQuery
    );

    const pendingClaims = claimsSnapshot.docs.filter(
        (claimDoc) =>
            claimDoc.data().status === "pending"
    );

    const batch = writeBatch(db);

    batch.update(reportRef, {
        status: "actioned",
        reviewedBy: adminId,
        reviewedAt: serverTimestamp(),
    });

    batch.update(itemRef, {
        moderationStatus: "hidden",
        ownerViewedModeration: false,
        moderatedBy: adminId,
        moderatedAt: serverTimestamp(),
    });

    pendingClaims.forEach((claimDoc) => {
        batch.update(claimDoc.ref, {
            status: "closed",
            closedReason: "moderation",
            ownerContact: null,
            claimantViewedResponse: false,
            respondedAt: serverTimestamp(),
        });
    });

        await batch.commit();

    try {
        await clearItemMatches(itemId);
    } catch (error) {
        console.error(
            "Unable to clear hidden item matches:",
            error
        );
    }

    return pendingClaims.length;
}

export async function restoreModeratedItem(
    reportId,
    itemId,
    adminId
) {
    if (!reportId || !itemId) {
        throw new Error(
            "A moderation report and item ID are required."
        );
    }

    if (!adminId) {
        throw new Error(
            "An administrator ID is required."
        );
    }

    const reportRef = doc(
        db,
        "reports",
        reportId
    );

    const itemRef = doc(
        db,
        "items",
        itemId
    );

    const batch = writeBatch(db);

    batch.update(reportRef, {
        status: "restored",
        reviewedBy: adminId,
        reviewedAt: serverTimestamp(),
    });

    batch.update(itemRef, {
        moderationStatus: "visible",
        ownerViewedModeration: false,
        moderatedBy: adminId,
        moderatedAt: serverTimestamp(),
    });

    await batch.commit();

    try {
        const restoredItem = await getItemById(
            itemId
        );

        if (
            restoredItem &&
            restoredItem.status === "open"
        ) {
            await findAndSaveMatches(
                itemId,
                restoredItem
            );
        }
    } catch (error) {
        console.error(
            "Unable to refresh restored item matches:",
            error
        );
    }
}

export async function updateItem(id, updateData) {
    if (!id) {
        throw new Error("An item ID is required.");
    }

    const itemRef = doc(db, "items", id);

    await updateDoc(itemRef, updateData);

    try {
        const updatedItem = await getItemById(id);

        if (updatedItem) {
            await findAndSaveMatches(
                id,
                updatedItem
            );
        }
    } catch (error) {
        console.error(
            "Unable to refresh item matches:",
            error
        );
    }
}

export async function deleteItem(id) {
    if (!id) {
        throw new Error("An item ID is required.");
    }

    const itemRef = doc(db, "items", id);

    // This must happen before deleting the item because the
    // security rules use the item document to verify ownership.
    await clearItemMatches(id);
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

    const reportId =
    `${reportData.itemId}_${reportData.reporterId}`;

    const reportRef = doc(
        db,
        "reports",
        reportId
    );

    const itemRef = doc(
        db,
        "items",
        reportData.itemId
    );

    const itemSnapshot = await getDoc(itemRef);

    if (!itemSnapshot.exists()) {
        throw new Error("ITEM_NOT_FOUND");
    }

    const item = itemSnapshot.data();
    const moderationStatus =
        item.moderationStatus || "visible";

    if (
        item.status === "resolved" ||
        moderationStatus === "pending_review" ||
        moderationStatus === "hidden"
    ) {
        throw new Error("ITEM_UNAVAILABLE");
    }

    const batch = writeBatch(db);

    batch.set(reportRef, {
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

    batch.update(itemRef, {
        moderationStatus: "pending_review",
        ownerViewedModeration: false,
        flaggedAt: serverTimestamp(),
    });

    await batch.commit();

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

    const canResubmitClosedRequest =
        existingClaim &&
        existingClaim.data().status === "closed";

    if (
        existingClaim &&
        !canResubmitClosedRequest
    ) {
        throw new Error(
            "You have already submitted a request for this report."
        );
    }

    const claimId = `${claimData.itemId}_${claimData.claimantId}`;
    const claimRef = doc(db, "claims", claimId);

    if (canResubmitClosedRequest) {
        await updateDoc(existingClaim.ref, {
            claimantFirstName:
                claimData.claimantFirstName,
            claimantEmail:
                claimData.claimantEmail,
            claimantContact:
                claimData.claimantContact,

            message: trimmedMessage,
            status: "pending",

            ownerContact: null,

            ownerViewed: false,
            claimantViewedResponse: true,

            createdAt: serverTimestamp(),
            respondedAt: null,
            closedReason: deleteField(),
        });

        return existingClaim.id;
    }

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

export function subscribeToModerationNotificationCount(
    ownerId,
    onCountChange,
    onError
) {
    if (!ownerId) {
        throw new Error("An owner ID is required.");
    }

    const itemsRef = collection(db, "items");

    const ownerItemsQuery = query(
        itemsRef,
        where("ownerId", "==", ownerId)
    );

    return onSnapshot(
        ownerItemsQuery,
        (querySnapshot) => {
            const notificationCount =
                querySnapshot.docs.filter((itemDoc) => {
                    const item = itemDoc.data();

                    return (
                        item.ownerViewedModeration === false
                    );
                }).length;

            onCountChange(notificationCount);
        },
        (error) => {
            console.error(
                "Moderation notification error:",
                error
            );

            onError?.(error);
        }
    );
}

export async function markModerationNoticesViewed(
    items
) {
    const unreadModerationItems = items.filter(
        (item) =>
            item.ownerViewedModeration === false
    );

    if (unreadModerationItems.length === 0) {
        return;
    }

    const batch = writeBatch(db);

    unreadModerationItems.forEach((item) => {
        const itemRef = doc(db, "items", item.id);

        batch.update(itemRef, {
            ownerViewedModeration: true,
        });
    });

    await batch.commit();
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

    try {
        await clearItemMatches(itemId);
    } catch (error) {
        console.error(
            "Unable to clear resolved item matches:",
            error
        );
    }

    return pendingItemClaims.length;
}