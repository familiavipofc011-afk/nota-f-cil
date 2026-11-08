export function pageHead(title: string, description: string) {
  return { meta: [
    { title: `${title} — Casa da Mãe` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — Casa da Mãe` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] };
}