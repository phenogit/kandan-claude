import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      image?: string;
      username?: string;
      displayName?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    image?: string;
    username?: string;
    displayName?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}
