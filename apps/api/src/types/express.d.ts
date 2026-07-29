import type { AuthSession, User, UserDevice, UserProfile } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        account: User;
        profile: UserProfile;
        session: AuthSession;
        device: UserDevice | null;
      };
    }
  }
}

export {};
