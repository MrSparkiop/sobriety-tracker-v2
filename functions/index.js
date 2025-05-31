const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// --- DEFINE YOUR ADMIN EMAIL HERE ---
// This email is authorized to call this function.
// For production, use Firebase Custom Claims for roles.
const ADMIN_EMAIL = "blagoyhristov03@gmail.com"; // Admin email

/**
 * Toggles a user's disabled status in Firebase Authentication
 * and updates a corresponding flag in their Firestore document.
 *
 * @param {object} data - The data passed to the function.
 * @param {string} data.uid - The UID of the user to update.
 * @param {boolean} data.disable - True to disable the user, false to enable.
 * @param {object} context - The context of the function call.
 * @param {object} context.auth - Auth info about the calling user.
 * @returns {Promise<{success: boolean, message: string}>} Result.
 */
exports.toggleUserActivation = functions.https.onCall(async (data, context) => {
  // 1. Authentication Check: Ensure the caller is an admin.
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated.",
    );
  }

  const callerEmail = context.auth.token.email;
  if (callerEmail !== ADMIN_EMAIL) {
    throw new functions.https.HttpsError(
        "permission-denied",
        "You must be an admin to perform this action.",
    );
  }

  // 2. Input Validation
  const {uid, disable} = data;

  if (!uid || typeof uid !== "string") {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with a 'uid' (string) argument.",
    );
  }
  if (typeof disable !== "boolean") {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with a 'disable' (boolean) argument.",
    );
  }

  try {
    // 3. Update Firebase Authentication user record
    await admin.auth().updateUser(uid, {
      disabled: disable,
    });

    // 4. Update the 'isDisabledByAdmin' flag in the user's Firestore document
    const userFirestoreRef = admin.firestore().collection("users").doc(uid);
    await userFirestoreRef.set(
        {isDisabledByAdmin: disable},
        {merge: true},
    );

    const action = disable ? "disabled" : "enabled";
    const successMessage = `User ${uid} has been successfully ${action}.`;
    console.log(`${successMessage} by admin ${callerEmail}.`);
    return {
      success: true,
      message: successMessage,
    };
  } catch (error) {
    const errorMessage = `Failed to toggle user activation for ${uid}.`;
    console.error(`${errorMessage} Error:`, error);
    throw new functions.https.HttpsError(
        "internal",
        `${errorMessage} ${error.message}`,
    );
  }
});

// ENSURE THERE IS AN EMPTY LINE AFTER THIS COMMENT
