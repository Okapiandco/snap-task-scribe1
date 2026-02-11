import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ClipboardCopy } from "lucide-react";

interface MeetingNote {
  id: string;
  title: string;
  date: string | null;
  attendees: string[];
  summary: string | null;
  notes: string[];
  tasks: { text: string; assignee: string }[];
}

const NoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState<MeetingNote | null>(null);
  const [checkedTasks, setCheckedTasks] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from("meeting_notes")
        .select("*")
        .eq("id", id!)
        .single();
      if (error || !data) {
        toast({ title: "Note not found", variant: "destructive" });
        navigate("/");
        return;
      }
      setNote({
        ...data,
        attendees: data.attendees || [],
        notes: data.notes || [],
        tasks: (data.tasks as any) || [],
      });
      setLoading(false);
    };
    fetch();
  }, [id]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied to clipboard` });
  };

  if (loading || !note) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;

  const formatNotes = () => {
    let text = `# ${note.title}\n`;
    if (note.date) text += `**Date:** ${note.date}\n`;
    if (note.attendees.length) text += `**Attendees:** ${note.attendees.join(", ")}\n`;
    text += `\n${note.summary}\n\n## Discussion Points\n`;
    note.notes.forEach((n) => (text += `- ${n}\n`));
    return text;
  };

  const formatTasks = () =>
    note.tasks.map((t) => `- [ ] ${t.text}${t.assignee ? ` (@${t.assignee})` : ""}`).join("\n");

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Meeting Notes</h1>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">{note.title}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(formatNotes(), "Notes")}>
              <ClipboardCopy className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {note.date && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Date:</span> {note.date}
              </p>
            )}
            {note.attendees.length > 0 && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Attendees:</span> {note.attendees.join(", ")}
              </p>
            )}
            <p className="text-sm text-foreground">{note.summary}</p>
            <div className="space-y-1.5">
              <h3 className="text-sm font-medium text-foreground">Discussion Points</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {note.notes.map((n, i) => (
                  <li key={i} className="flex gap-2">
                    <span>•</span><span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {note.tasks.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Tasks ({note.tasks.length - checkedTasks.size} remaining)</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(formatTasks(), "Tasks")}>
                <ClipboardCopy className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {note.tasks.map((task, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Checkbox
                      checked={checkedTasks.has(i)}
                      onCheckedChange={(checked) => {
                        const next = new Set(checkedTasks);
                        checked ? next.add(i) : next.delete(i);
                        setCheckedTasks(next);
                      }}
                    />
                    <div className={checkedTasks.has(i) ? "line-through text-muted-foreground" : ""}>
                      <p className="text-sm">{task.text}</p>
                      {task.assignee && <p className="text-xs text-muted-foreground">Assigned to: {task.assignee}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NoteDetail;
