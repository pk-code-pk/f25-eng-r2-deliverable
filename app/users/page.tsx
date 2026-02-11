import { Separator } from "@/components/ui/separator";
import { TypographyH2 } from "@/components/ui/typography";
import { createServerSupabaseClient } from "@/lib/server-utils";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("display_name", { ascending: true });

  return (
    <>
      <TypographyH2>Users</TypographyH2>
      <Separator className="my-4" />
      {profiles && profiles.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <div key={profile.id} className="rounded-lg border p-4 shadow-sm">
              <h3 className="text-lg font-semibold">{profile.display_name}</h3>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <p className="mt-2 text-sm">{profile.biography ?? "\u2014"}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No users found.</p>
      )}
    </>
  );
}
