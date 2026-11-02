const ALLOWED = new Set(["ibb.co","postimg.cc","i.ibb.co","i.postimg.cc"]);
export async function onRequestGet({request}) {
  const u = new URL(request.url);
  const raw = u.searchParams.get("url");
  if (!raw) return new Response("Missing url", {status:400});
  let source;
  try { source = new URL(raw); } catch { return new Response("Invalid url", {status:400}); }
  if (source.protocol !== "https:" || !ALLOWED.has(source.hostname)) return new Response("Host not allowed", {status:403});
  try {
    const page = await fetch(source.href, {headers:{"User-Agent":"Mozilla/5.0 (compatible; BATARAXX/1.0)","Accept":"text/html"},redirect:"follow"});
    if (!page.ok) return new Response("Image source unavailable", {status:502});
    const html = await page.text();
    const match = html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i);
    if (!match) return new Response("Image not found in source page", {status:404});
    const imageUrl = new URL(match[1].replaceAll("&amp;","&"), page.url);
    if (imageUrl.protocol !== "https:" || !["i.ibb.co","i.postimg.cc","ibb.co","postimg.cc"].includes(imageUrl.hostname)) return new Response("Invalid image host", {status:403});
    return Response.redirect(imageUrl.href, 302);
  } catch { return new Response("Could not resolve image", {status:502}); }
}