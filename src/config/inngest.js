import { Inngest } from "inngest";
import connectToDB from "./db.js";
import { User } from "../models/user.model.js";

export const inngest = new Inngest({ id: "nexent" });

const syncUser = inngest.createFunction(
  { id: "sync-user" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    try {
      await connectToDB();

      const { id, email_addresses, first_name, last_name, image_url } =
        event.data;

      const hasEmail =
        Array.isArray(email_addresses) && email_addresses.length > 0;
      if (!hasEmail) {
        throw new Error("User must have at least one email address");
      }

      const email = email_addresses[0].email_address || "";

      const newUser = {
        clerkId: id,
        email,
        name: `${first_name || ""} ${last_name || ""}`.trim() || "User",
        imageUrl: image_url || "",
        addresses: [],
        wishlist: [],
      };

      // ...existing code...
      const user = await User.create(newUser);
      // ...existing code...
    } catch (error) {
      const eventId = event?.id || event?.data?.id || "unknown";
      console.error(`Error syncing user (event id: ${eventId}):`, error);
      // Optionally, handle error gracefully (e.g., return, notify, etc.)
    }
  },
);

const deleteUser = inngest.createFunction(
  { id: "delete-user-from-db" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    try {
      await connectToDB();
      const { id } = event.data;
      const result = await User.deleteOne({ clerkId: id });
      if (!result || result.deletedCount === 0) {
        console.warn(`No user found to delete with clerkId: ${id}`);
      }
    } catch (error) {
      console.error("Error deleting user from DB:", error);
    }
  },
);

export const functions = [syncUser, deleteUser];
