export const Role = {
  club_president: "club_president",
  club_hod: "club_hod",
  admin: "admin",
  viewer: "viewer",
} as const;

export type Role = "club_president" | "club_hod" | "admin" | "viewer";

export const Status = {
  awaiting_poster: "awaiting_poster",
  pending_hod_approval: "pending_hod_approval",
  pending_admin_approval: "pending_admin_approval",
  approved: "approved",
  rejected: "rejected",
  ineligible: "ineligible",
  live: "live",
  archived: "archived",
} as const;

export type Status =
  | "awaiting_poster"
  | "pending_hod_approval"
  | "pending_admin_approval"
  | "approved"
  | "rejected"
  | "ineligible"
  | "live"
  | "archived";
