export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/client/", "/api/"],
    },
    sitemap: "https://c2cclarity.com/sitemap.xml",
  };
}
