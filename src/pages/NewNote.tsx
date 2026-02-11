import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Camera, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const NewNote = () => {
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

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

      // Save to database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: saved, error: saveError } = await supabase
        .from("meeting_notes")
        .insert({
          user_id: user.id,
          title: data.title,
          date: data.date || null,
          attendees: data.attendees || [],
          summary: data.summary || null,
          notes: data.notes || [],
          tasks: data.tasks || [],
        })
        .select("id")
        .single();

      if (saveError) throw saveError;

      toast({ title: "Notes processed and saved!" });
      navigate(`/notes/${saved.id}`);
    } catch (err: any) {
      toast({ title: "Failed to process notes", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <FileText className="mx-auto h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Upload Meeting Notes</h1>
          <p className="text-sm text-muted-foreground">
            Upload a photo of your handwritten notes and AI will organize them.
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
              <Button variant="outline" className="flex-1" onClick={() => setImage(null)}>
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

export default NewNote;
