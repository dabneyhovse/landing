import SiteConfig from "@/lib/db/models/siteConfig";

let _enabled: boolean | null = null;

export async function isFrotatorEnabled(): Promise<boolean> {
  if (_enabled !== null) return _enabled;
  try {
    const config = await SiteConfig.findOne({ where: { key: "frotatorEnabled" } });
    _enabled = config ? (config.get("value") as string) === "true" : false;
  } catch {
    _enabled = false;
  }
  return _enabled;
}

export async function setFrotatorEnabled(enabled: boolean): Promise<void> {
  const [config] = await SiteConfig.findOrCreate({
    where: { key: "frotatorEnabled" },
    defaults: { key: "frotatorEnabled", value: String(enabled) },
  });
  config.set("value", String(enabled));
  await config.save();
  _enabled = enabled;
}
