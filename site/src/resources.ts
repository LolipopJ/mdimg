const resourceBase =
  "https://raw.githubusercontent.com/LolipopJ/mdimg/main/test/static/";

export function resourceUrl(value: string): string {
  const url = new URL(value, resourceBase);
  if (
    url.protocol !== "https:" &&
    url.protocol !== "http:" &&
    !value.startsWith("data:image/")
  ) {
    throw new Error(
      "Use remote HTTP(S) resources or embedded data images; local files are not supported.",
    );
  }
  return url.href;
}
