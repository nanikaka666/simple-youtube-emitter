export async function fetchAsJson(url: string) {
  const res = await fetch(url);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return await res.json();
}
