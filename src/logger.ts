declare const window: any;

let enabled: boolean = null;
const prefix = `COMPACTR${typeof process === 'object' && ` (pid:${process.pid})`}`;

export function log(msg: string): void {
  if (enabled === null) {
    enabled = (
      (typeof process === 'object' && process.env.NODE_DEBUG)
      || (typeof window === 'object' && window.DEBUG)
      || ''
    ).indexOf('compactr') > -1;
  }
  if (enabled === true) console.log(`${prefix}: ${msg}`);
}
