import type { Logger } from "pino";

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
      log: Logger;
      identity?: {
        subject: string;
      };
      principal?: {
        userId: string;
        membershipId: string;
        organizationId: string;
        permissions: ReadonlySet<string>;
      };
    }
  }
}

export {};
