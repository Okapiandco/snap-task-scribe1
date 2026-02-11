import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Trash2, Plus, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SavedNote {
  id: string;
  title: string;
  date: string | null;
  summary: string | null;
  created_at: string;
}

const SavedNotes = () => {
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from("meeting_notes")
      .select("id, title, date, summary, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load notes", variant: "destructive" });
    } else {
      setNotes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchNotes(); }, []);

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from("meeting_notes").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete", variant: "destructive" });
    } else {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast({ title: "Note deleted" });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">My Meeting Notes</h1>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/new")} size="sm">
              <Plus className="mr-2 h-4 w-4" /> New
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : notes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <FileText className="mb-4 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">No notes yet</p>
              <p className="text-xs text-muted-foreground mt-1">Upload a photo of your handwritten notes to get started</p>
              <Button className="mt-4" onClick={() => navigate("/new")}>
                <Plus className="mr-2 h-4 w-4" /> Upload Notes
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <Card key={note.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate(`/notes/${note.id}`)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-base">{note.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-xs text-muted-foreground">
                    {note.date || new Date(note.created_at).toLocaleDateString()}
                  </p>
                  {note.summary && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{note.summary}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedNotes;
