import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/signin"
  }
});

export const config = {
  matcher: ["/students/:path*", "/criteria/:path*", "/evaluations/:path*"]
};
