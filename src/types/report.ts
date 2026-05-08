export type Report = {
  id: string;
  content: string;
  client_name: string;
  created_at: string;
  source_type?: "notes" | "audio";
};
