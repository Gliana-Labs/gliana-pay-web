export interface CloudflareStatus {
  status: "operational" | "partial_outage" | "major_outage" | "under_maintenance" | "error";
  region: string;
  cityName: string;
  cityStatus: string;
  degradedItems: { name: string; status: string }[];
}

function getRegionFromTimezone(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (tz.startsWith("Asia/")) return "Asia";
  if (tz.startsWith("Europe/")) return "Europe";
  if (tz.startsWith("Africa/")) return "Africa";
  if (tz.startsWith("Australia/") || tz.startsWith("Pacific/"))
    return "Oceania";
  if (tz.startsWith("America/")) {
    const latin = [
      "Argentina", "Bogota", "Buenos_Aires", "Caracas", "Cayenne",
      "Costa_Rica", "Guayaquil", "Guatemala", "Guyana", "Havana",
      "La_Paz", "Lima", "Managua", "Mexico_City", "Montevideo",
      "Panama", "Paramaribo", "Port-au-Prince", "Port_of_Spain",
      "Punta_Arenas", "Santiago", "Sao_Paulo", "Tijuana",
    ];
    if (latin.some((l) => tz.includes(l))) return "South America";
    return "North America";
  }
  return "Asia";
}

export async function fetchCloudflareStatus(
  cacheKey: string = "cf_status",
  cacheAge: number = 300000,
): Promise<CloudflareStatus> {
  const defaultStatus: CloudflareStatus = {
    status: "error",
    region: "",
    cityName: "",
    cityStatus: "",
    degradedItems: [],
  };

  try {
    // Check cache first
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.ts < cacheAge) {
        return {
          status: parsed.status,
          region: parsed.region || "",
          cityName: parsed.city || "",
          cityStatus: parsed.cityStatus || "",
          degradedItems: parsed.degraded || [],
        };
      }
    }

    const res = await fetch(
      "https://www.cloudflarestatus.com/api/v2/summary.json",
    );
    const data = await res.json();
    const region = getRegionFromTimezone();

    // Find user's city from timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tzCity = (tz.split("/").pop() || "").replace(/_/g, " ");

    // Find region group
    const regionGroup = data.components.find(
      (c: any) => c.group === true && c.name === region,
    );

    let cfStatus: CloudflareStatus["status"] = "error";
    let cityName = "";
    let cityStatus = "";
    let degradedItems: { name: string; status: string }[] = [];

    if (regionGroup) {
      cfStatus = regionGroup.status;
      const childIds: string[] = regionGroup.components || [];
      const regionChildren = data.components.filter((c: any) =>
        childIds.includes(c.id),
      );

      // Fuzzy match: try partial match first, then fallback to region
      const cityMatch = regionChildren.find((c: any) =>
        c.name.toLowerCase().includes(tzCity.toLowerCase()),
      );

      if (cityMatch) {
        cityName = cityMatch.name;
        cityStatus = cityMatch.status;
      } else {
        // No exact city match - use region as fallback
        cityName = region;
        cityStatus = regionGroup.status;
      }

      // Get degraded children
      degradedItems = regionChildren
        .filter((c: any) => c.status !== "operational")
        .map((c: any) => ({ name: c.name, status: c.status }))
        .slice(0, 8);
    } else {
      cfStatus = data.status?.indicator === "none" ? "operational" : "partial_outage";
    }

    // Cache result
    sessionStorage.setItem(
      cacheKey,
      JSON.stringify({
        ts: Date.now(),
        status: cfStatus,
        region,
        city: cityName,
        cityStatus: cityStatus,
        degraded: degradedItems,
      }),
    );

    return {
      status: cfStatus,
      region,
      cityName,
      cityStatus,
      degradedItems,
    };
  } catch (e) {
    return defaultStatus;
  }
}

export function getStatusLabel(s: string): string {
  if (s === "operational") return "All Systems Operational";
  if (s === "partial_outage") return "Partial Outage";
  if (s === "major_outage") return "Major Outage";
  if (s === "under_maintenance") return "Maintenance";
  return s;
}

export function getStatusColor(s: string): string {
  if (s === "operational") return "text-green-400";
  if (s === "partial_outage") return "text-yellow-400";
  if (s === "major_outage") return "text-red-400";
  if (s === "under_maintenance") return "text-blue-400";
  return "text-gray-400";
}

export function getStatusDotColor(s: string): string {
  if (s === "operational") return "bg-green-400";
  if (s === "partial_outage") return "bg-yellow-400";
  if (s === "major_outage") return "bg-red-400";
  if (s === "under_maintenance") return "bg-blue-400";
  return "bg-gray-400";
}
