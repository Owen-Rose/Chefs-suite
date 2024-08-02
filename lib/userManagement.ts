import { auth } from "./firebaseAdmin";
import { UserRole } from "../types/Roles";

export async function setUserRole(uid: string, role: UserRole) {
  try {
    await auth.setCustomUserClaims(uid, { role: role });
    console.log(`Role ${role} set successfully for user ${uid}`);
  } catch (error) {
    console.error("Error setting custom claims:", error);
    throw error;
  }
}
