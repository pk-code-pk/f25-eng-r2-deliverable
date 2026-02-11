"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import type { Database } from "@/lib/schema";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import EditSpeciesDialog from "./edit-species-dialog";

type Species = Database["public"]["Tables"]["species"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Comment = Database["public"]["Tables"]["comments"]["Row"];

interface CommentWithAuthorName extends Comment {
  author_display_name: string;
}

export default function SpeciesDetailDialog({
  species,
  sessionId,
}: {
  species: Species;
  sessionId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [authorProfile, setAuthorProfile] = useState<Profile | null>(null);
  const [comments, setComments] = useState<CommentWithAuthorName[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = sessionId === species.author;

  const fetchData = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();

    // Fetch author profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", species.author).single();

    if (profile) {
      setAuthorProfile(profile);
    }

    // Fetch comments for this species
    const { data: commentsData } = await supabase
      .from("comments")
      .select("*")
      .eq("species_id", species.id)
      .order("created_at", { ascending: false });

    if (commentsData && commentsData.length > 0) {
      // Batch-fetch author profiles for all comments to avoid N+1
      const authorIds = [...new Set(commentsData.map((c) => c.author))];
      const { data: commentProfiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", authorIds);

      const profileMap = new Map(commentProfiles?.map((p) => [p.id, p.display_name]) ?? []);

      setComments(
        commentsData.map((c) => ({
          ...c,
          author_display_name: profileMap.get(c.author) ?? "Unknown",
        })),
      );
    } else {
      setComments([]);
    }
  }, [species.author, species.id]);

  useEffect(() => {
    if (open) {
      void fetchData();
    }
  }, [open, fetchData]);

  const handleDelete = async () => {
    setIsDeleting(true);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("species").delete().eq("id", species.id);

    if (error) {
      setIsDeleting(false);
      return toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    }

    setOpen(false);
    setIsDeleting(false);
    router.refresh();

    return toast({
      title: "Species deleted.",
      description: `Successfully deleted ${species.scientific_name}.`,
    });
  };

  const handlePostComment = async () => {
    const trimmed = newComment.trim();
    if (!trimmed) return;

    setIsPostingComment(true);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("comments").insert({
      species_id: species.id,
      author: sessionId,
      content: trimmed,
    });

    if (error) {
      setIsPostingComment(false);
      return toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    }

    setNewComment("");
    setIsPostingComment(false);
    void fetchData();

    return toast({ title: "Comment posted!" });
  };

  const handleDeleteComment = async (commentId: string) => {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("comments").delete().eq("id", commentId);

    if (error) {
      return toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    }

    void fetchData();

    return toast({ title: "Comment deleted." });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mt-3 w-full">Learn More</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{species.scientific_name}</DialogTitle>
          {species.common_name && (
            <DialogDescription className="text-base italic">{species.common_name}</DialogDescription>
          )}
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-sm font-semibold">Kingdom</span>
            <span className="col-span-3 text-sm">{species.kingdom}</span>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-sm font-semibold">Population</span>
            <span className="col-span-3 text-sm">
              {species.total_population !== null ? species.total_population.toLocaleString() : "Unknown"}
            </span>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-sm font-semibold">Endangered</span>
            <span className="col-span-3 text-sm">{species.endangered ? "Yes" : "No"}</span>
          </div>

          {authorProfile && (
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-sm font-semibold">Added by</span>
              <span className="col-span-3 text-sm">
                {authorProfile.display_name} ({authorProfile.email})
              </span>
            </div>
          )}

          <div className="grid gap-2">
            <span className="text-sm font-semibold">Description</span>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {species.description ?? "No description available."}
            </p>
          </div>
        </div>

        {isAuthor && (
          <div className="flex justify-end gap-2">
            <EditSpeciesDialog species={species} />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete Species"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {species.scientific_name}. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void handleDelete()}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        <Separator />

        {/* Comments Section */}
        <div className="grid gap-4">
          <h4 className="text-sm font-semibold">Comments</h4>

          {/* Comment composer */}
          <div className="grid gap-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={isPostingComment}
            />
            <Button
              size="sm"
              onClick={() => void handlePostComment()}
              disabled={isPostingComment || newComment.trim() === ""}
              className="w-fit"
            >
              {isPostingComment ? "Posting..." : "Post Comment"}
            </Button>
          </div>

          {/* Comments list */}
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
          ) : (
            <div className="grid gap-3">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded border p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-semibold">{comment.author_display_name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {comment.author === sessionId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-destructive hover:text-destructive"
                        onClick={() => void handleDeleteComment(comment.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                  <p className="mt-1 text-sm">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
