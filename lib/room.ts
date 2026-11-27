import layout from "@/lib/room-layout.json"

/**
 * The machines on /device. Each physical machine is named after a Minecraft
 * block, and the room draws it as that block (scripts/pixel/device.mjs).
 * Guests are the ones running; classmates' machines are counted, not named.
 * No addresses: names, roles and parts only.
 */

export type DeviceId =
  "workbench" | "spawner" | "anvil" | "enderchest" | "furnace" | "hopper"

export type Device = {
  id: DeviceId
  block: string
  role: string
  system: string
  parts: string[]
  vms?: string[]
  cts?: string[]
  others?: string
}

export const DEVICES: Device[] = [
  {
    id: "workbench",
    block: "工作台",
    role: "編輯程式與 git，用 ssh 管其他設備",
    system: "macOS",
    parts: ["MacBook Air M2"],
  },
  {
    id: "spawner",
    block: "生怪磚",
    role: "對外入口、開發測試機、tailnet 出口",
    system: "Proxmox VE",
    parts: ["Ryzen 7 9700X", "60 GiB", "2 TB NVMe"],
    vms: ["sandbox", "golem", "aintern-trial", "compose", "dev-demo"],
    cts: ["gateway", "jump", "ap-diag", "eigenflux", "hams-bridge", "lab-638"],
    others: "同學的實驗機 4 台",
  },
  {
    id: "anvil",
    block: "鐵砧",
    role: "大記憶體的機架伺服器",
    system: "Proxmox VE",
    parts: ["Dell R640", "Xeon Gold 5218", "187 GiB", "1.6 TB"],
    vms: ["minecraft"],
  },
  {
    id: "enderchest",
    block: "終界箱",
    role: "備份與 NAS",
    system: "Proxmox VE、Proxmox Backup Server",
    parts: ["Intel N150", "31 GB", "2 × 4 TB ZFS 鏡像"],
    cts: ["nas", "roll", "embed", "auth", "finance"],
  },
  {
    id: "furnace",
    block: "熔爐",
    role: "GPU 工作：算圖、下載論文",
    system: "Windows 11",
    parts: ["Ryzen 9 9900X", "64 GB", "RTX 3080"],
  },
  {
    id: "hopper",
    block: "漏斗",
    role: "家裡的路由器、tailnet 出口",
    system: "FriendlyWrt",
    parts: ["路由器"],
  },
]

export type LinkKind = "ssh" | "backup" | "public" | "exit" | "gpu"
type End = DeviceId | "internet" | "aintern"

/** Colours from the blocks the links stand for: redstone, gold, a portal, water, fire. */
export const KINDS: Record<LinkKind, { label: string; color: string }> = {
  ssh: { label: "ssh", color: "#e0463a" },
  backup: { label: "備份", color: "#e2b13c" },
  public: { label: "對外入口", color: "#a26cf2" },
  exit: { label: "出口", color: "#4fc3d9" },
  gpu: { label: "GPU 工作", color: "#ff8a2a" },
}

/** Each link runs from where the data starts to where it goes. */
export const LINKS: { from: End; to: End; kind: LinkKind }[] = [
  ...(["spawner", "anvil", "enderchest", "furnace", "hopper"] as const).map(
    (to) => ({ from: "workbench" as const, to, kind: "ssh" as const })
  ),
  { from: "spawner", to: "enderchest", kind: "backup" },
  { from: "anvil", to: "enderchest", kind: "backup" },
  { from: "internet", to: "spawner", kind: "public" },
  { from: "spawner", to: "enderchest", kind: "public" },
  { from: "hopper", to: "internet", kind: "exit" },
  { from: "spawner", to: "internet", kind: "exit" },
  { from: "aintern", to: "furnace", kind: "gpu" },
]

export const OUTSIDE_LABEL = { internet: "網際網路", aintern: "AIntern" }

export const ROOM = layout
