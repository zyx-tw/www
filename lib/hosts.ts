import data from "./hosts.json"

/** A site under zyx.tw, by its address, with what it is for. */
export type Host = { host: string; purpose: string }

/** Every live public site under zyx.tw, for /site and its Markdown twin. */
export const hosts: Host[] = data
