declare module "virtual:site-manifest" {
  const manifest: import("./config").Manifest;
  export default manifest;
}
