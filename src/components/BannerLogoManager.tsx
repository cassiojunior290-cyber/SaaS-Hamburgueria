import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BannerLogoManagerProps {
  type: "banner" | "logo";
}

export function BannerLogoManager({ type }: BannerLogoManagerProps) {
  const [method, setMethod] = useState<"url" | "upload">("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (method === "url" && !url) return toast.error("URL é obrigatória");
    if (method === "upload" && !file) return toast.error("Arquivo é obrigatório");

    let imageUrl = url;
    if (method === "upload") {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${type}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from("images").upload(filePath, file);
      if (uploadError) return toast.error("Erro ao fazer upload da imagem");

      const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(filePath);
      imageUrl = publicUrl;
    }

    const { error } = await supabase.from("settings").upsert({ key: type, value: imageUrl });
    if (error) return toast.error("Erro ao salvar configuração");
    toast.success(`${type === "banner" ? "Banner" : "Logo"} atualizado com sucesso`);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl">{type === "banner" ? "Gerenciar Banner" : "Gerenciar Logo"}</h2>
      <RadioGroup defaultValue="url" onValueChange={(value) => setMethod(value as "url" | "upload")} className="flex gap-4">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="url" id="url" />
          <Label htmlFor="url">URL</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="upload" id="upload" />
          <Label htmlFor="upload">Upload</Label>
        </div>
      </RadioGroup>
      {method === "url" ? (
        <div className="space-y-2">
          <Label htmlFor="url-input">URL da Imagem</Label>
          <Input id="url-input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="file-input">Arquivo de Imagem</Label>
          <Input id="file-input" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
      )}
      <Button onClick={handleSubmit}>Salvar</Button>
    </div>
  );
}