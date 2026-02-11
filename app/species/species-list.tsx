"use client";

import { Input } from "@/components/ui/input";
import type { Database } from "@/lib/schema";
import { useState } from "react";
import SpeciesCard from "./species-card";

type Species = Database["public"]["Tables"]["species"]["Row"];

export default function SpeciesList({ species, sessionId }: { species: Species[]; sessionId: string }) {
  const [search, setSearch] = useState("");

  const filteredSpecies = species.filter((s) => {
    if (search.trim() === "") return true;
    const query = search.toLowerCase();
    return (
      s.scientific_name.toLowerCase().includes(query) ||
      (s.common_name?.toLowerCase().includes(query) ?? false) ||
      (s.description?.toLowerCase().includes(query) ?? false)
    );
  });

  return (
    <>
      <div className="mb-4">
        <Input
          placeholder="Search species by name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>
      <div className="flex flex-wrap justify-center">
        {filteredSpecies.length > 0 ? (
          filteredSpecies.map((s) => <SpeciesCard key={s.id} species={s} sessionId={sessionId} />)
        ) : (
          <p className="py-8 text-muted-foreground">No species found matching your search.</p>
        )}
      </div>
    </>
  );
}
