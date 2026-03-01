/** Shared Tailwind class strings for consistent UI. Used during migration from plain CSS. */
export const railBtn =
  "border border-border bg-white text-foreground rounded-lg py-2 px-2.5 font-inherit cursor-pointer transition-all hover:border-[#efbe91] hover:bg-[#fff8f2] disabled:opacity-55 disabled:cursor-not-allowed";
export const railBtnDanger =
  "border border-[#cc7748] bg-[#fff1e8] text-destructive rounded-lg py-2 px-2.5 font-inherit cursor-pointer transition-all hover:bg-[#ffe4d8] hover:border-[#b85a2a] disabled:opacity-55 disabled:cursor-not-allowed";
export const settingsInput =
  "w-full rounded-lg border border-border py-2 px-2.5 font-inherit bg-white focus:outline-none focus:border-[#efbe91] focus:ring-2 focus:ring-[#efbe91]/50 focus:ring-offset-2";
export const settingsTextarea = `${settingsInput} resize-y min-h-[60px]`;
