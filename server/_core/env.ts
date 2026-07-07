export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  teamAccessCode: process.env.TEAM_ACCESS_CODE ?? "",

  // Local-filesystem storage for image uploads (Railway Volume / local disk).
  uploadDir: process.env.UPLOAD_DIR ?? "./uploads",
  // Absolute base URL of the app, used to build absolute image URLs so the PDF
  // generator can load them (e.g. https://your-app.up.railway.app).
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? "",
};
