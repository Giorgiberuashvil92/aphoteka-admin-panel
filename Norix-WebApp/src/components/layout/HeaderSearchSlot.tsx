"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { HeaderSearch } from "./HeaderSearch";

interface HeaderSearchSlotProps {
  onPanelOpen?: () => void;
}

export function HeaderSearchSlot({ onPanelOpen }: HeaderSearchSlotProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isSearchPage = pathname === "/search";
  const urlQuery = searchParams.get("q")?.trim() ?? "";

  return (
    <HeaderSearch
      urlQuery={urlQuery}
      isSearchPage={isSearchPage}
      onPanelOpen={onPanelOpen}
    />
  );
}
