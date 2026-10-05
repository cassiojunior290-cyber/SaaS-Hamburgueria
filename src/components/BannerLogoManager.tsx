import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BannerLogoManagerProps {
  type: "banner" | "logo";
}

export function BannerLogoManager({ type }: BannerLogoManagerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${type}-${Math.random()}.${fileExt}`;
    const filePath = `${type}s/${fileName}`;

    const { data, error } = await supabase.storage.from("product-images").upload(filePath, file);

    if (error) {
      toast.error("Erro ao fazer upload.");
      return;
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from("product-images").createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10);

    if (signedUrlError) {
      toast.error("Erro ao gerar URL assinada.");
      return;
    }

    const updatePayload =
      type === "banner"
        ? { banner_url: signedUrlData.signedUrl }
        : { logo_url: signedUrlData.signedUrl };
    const { error: updateError } = await supabase.from("store_settings").update(updatePayload).eq("id", 1);

    if (updateError) {
      toast.error("Erro ao atualizar configurações.");
    } else {
      toast.success(`${type === "banner" ? "Banner" : "Logo"} atualizado com sucesso!`);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-display">{type === "banner" ? "Banner" : "Logo"}</h2>
      <div className="space-y-2">
        <Label htmlFor={`${type}-upload`}>Selecione uma imagem</Label>
        <Input id={`${type}-upload`} type="file" accept="image/*" onChange={handleFileChange} />
      </div>
      {preview && (
        <div className="mt-4">
          <img src={preview} alt="Preview" className="max-h-40 rounded-md" />
        </div>
      )}
      <Button onClick={handleUpload} disabled={!file}>Atualizar {type === "banner" ? "Banner" : "Logo"}</Button>
    </div>
  );
}