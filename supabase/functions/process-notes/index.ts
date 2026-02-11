import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a meeting notes organizer. You will receive an image of handwritten meeting notes. Your job is to:
1. Transcribe the handwritten text accurately
2. Organize it into formal meeting notes with sections like Date, Attendees, Discussion Points
3. Extract all action items/tasks

You MUST respond using the extract_meeting_data tool.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please transcribe and organize these handwritten meeting notes. Extract all tasks and action items.",
              },
              {
                type: "image_url",
                image_url: { url: imageBase64 },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_meeting_data",
              description: "Extract structured meeting notes and tasks from handwritten notes image",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Meeting title or topic" },
                  date: { type: "string", description: "Meeting date if mentioned, otherwise empty string" },
                  attendees: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of attendees if mentioned",
                  },
                  summary: { type: "string", description: "Brief summary of the meeting in 1-2 sentences" },
                  notes: {
                    type: "array",
                    items: { type: "string" },
                    description: "Key discussion points as bullet points",
                  },
                  tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string", description: "The task description" },
                        assignee: { type: "string", description: "Person assigned if mentioned, otherwise empty" },
                      },
                      required: ["text", "assignee"],
                      additionalProperties: false,
                    },
                    description: "Extracted action items and tasks",
                  },
                },
                required: ["title", "date", "attendees", "summary", "notes", "tasks"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_meeting_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Failed to process notes" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI did not return structured data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const meetingData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(meetingData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-notes error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
