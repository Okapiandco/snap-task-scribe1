import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, Camera, FileText, ClipboardCopy, RotateCcw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MeetingData {
  title: string;
  date: string;
  attendees: string[];
  summary: string;
  notes: string[];
  tasks: { text: string; assignee: string }[];
}

const Index = () => {
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<MeetingData | null>(null);
  const [checkedTasks, setCheckedTasks] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please upload an image file", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const processNotes = async () => {
    if (!image) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-notes", {
        body: { imageBase64: image },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setResult(data);
      setCheckedTasks(new Set());
    } catch (err: any) {
      toast({ title: "Failed to process notes", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied to clipboard` });
  };

  const formatNotes = () => {
    if (!result) return "";
    let text = `# ${result.title}\n`;
    if (result.date) text += `**Date:** ${result.date}\n`;
    if (result.attendees.length) text += `**Attendees:** ${result.attendees.join(", ")}\n`;
    text += `\n${result.summary}\n\n## Discussion Points\n`;
    result.notes.forEach((n) => (text += `- ${n}\n`));
    return text;
  };

  const formatTasks = () => {
    if (!result) return "";
    return result.tasks.map((t) => `- [ ] ${t.text}${t.assignee ? ` (@${t.assignee})` : ""}`).join("\n");
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setCheckedTasks(new Set());
  };

  // Results view
  if (result) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Meeting Notes</h1>
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="mr-2 h-4 w-4" /> Upload Another
            </Button>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">{result.title}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(formatNotes(), "Notes")}>
                <ClipboardCopy className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.date && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Date:</span> {result.date}
                </p>
              )}
              {result.attendees.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Attendees:</span> {result.attendees.join(", ")}
                </p>
              )}
              <p className="text-sm text-foreground">{result.summary}</p>
              <div className="space-y-1.5">
                <h3 className="text-sm font-medium text-foreground">Discussion Points</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {result.notes.map((note, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">
                Tasks ({result.tasks.length - checkedTasks.size} remaining)
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(formatTasks(), "Tasks")}>
                <ClipboardCopy className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {result.tasks.map((task, i) => (
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
                      {task.assignee && (
                        <p className="text-xs text-muted-foreground">Assigned to: {task.assignee}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Upload view
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <FileText className="mx-auto h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Meeting Notes Organizer</h1>
          <p className="text-sm text-muted-foreground">
            Upload a photo of your handwritten notes and AI will organize them into formal meeting notes with tasks.
          </p>
        </div>

        {!image ? (
          <Card
            className="cursor-pointer border-dashed border-2 hover:border-primary/50 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Drag & drop your photo here</p>
              <p className="text-xs text-muted-foreground mt-1">or tap to browse files</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4">
              <img src={image} alt="Uploaded notes" className="w-full rounded-md" />
            </CardContent>
          </Card>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

        <div className="flex gap-3">
          {!image && (
            <Button variant="outline" className="flex-1" onClick={() => cameraInputRef.current?.click()}>
              <Camera className="mr-2 h-4 w-4" /> Take Photo
            </Button>
          )}
          {image && !processing && (
            <>
              <Button variant="outline" className="flex-1" onClick={reset}>
                Change Photo
              </Button>
              <Button className="flex-1" onClick={processNotes}>
                <FileText className="mr-2 h-4 w-4" /> Process Notes
              </Button>
            </>
          )}
          {processing && (
            <Button className="flex-1" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
