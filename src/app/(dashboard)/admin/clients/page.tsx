"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileUp, FileText, X } from "lucide-react";
import type { Client, ContractType } from "@/types/database";
import { formatCNPJ, formatCPF, formatCEP } from "@/lib/constants";

const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO",
];

const emptyForm = {
  nome_empresa: "",
  cnpj: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
  nome_socio: "",
  cpf_socio: "",
  tipo_contrato: "Mensal" as ContractType,
  valor_contrato: "",
  prazo_contrato: "",
  data_inicio_contrato: "",
  data_termino_contrato: "",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const [form, setForm] = useState(emptyForm);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    setClients(data ?? []);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const clientData = {
      nome_empresa: form.nome_empresa,
      cnpj: form.cnpj.replace(/\D/g, "") || null,
      rua: form.rua || null,
      numero: form.numero || null,
      complemento: form.complemento || null,
      bairro: form.bairro || null,
      cidade: form.cidade || null,
      estado: form.estado || null,
      cep: form.cep.replace(/\D/g, "") || null,
      nome_socio: form.nome_socio || null,
      cpf_socio: form.cpf_socio.replace(/\D/g, "") || null,
      tipo_contrato: form.tipo_contrato,
      valor_contrato: form.valor_contrato ? Number(form.valor_contrato) : null,
      prazo_contrato: form.prazo_contrato || null,
      data_inicio_contrato: form.data_inicio_contrato || null,
      data_termino_contrato: form.data_termino_contrato || null,
      contrato_url: null as string | null,
    };

    if (contractFile) {
      const ext = contractFile.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(fileName, contractFile);

      if (!uploadError && uploadData) {
        clientData.contrato_url = uploadData.path;
      }
    }

    const { error } = await supabase.from("clients").insert(clientData);

    if (!error) {
      setDialogOpen(false);
      setForm(emptyForm);
      setContractFile(null);
      loadClients();
    }
    setSaving(false);
  }

  function displayCNPJ(raw: string | null) {
    if (!raw) return "-";
    const digits = raw.replace(/\D/g, "");
    if (digits.length !== 14) return raw;
    return formatCNPJ(digits);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Clientes</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            Novo Cliente
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Cliente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Razão Social *</Label>
                  <Input
                    value={form.nome_empresa}
                    onChange={(e) => setForm({ ...form, nome_empresa: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input
                    value={form.cnpj}
                    onChange={(e) => setForm({ ...form, cnpj: formatCNPJ(e.target.value) })}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome do Sócio</Label>
                  <Input
                    value={form.nome_socio}
                    onChange={(e) => setForm({ ...form, nome_socio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPF do Sócio</Label>
                  <Input
                    value={form.cpf_socio}
                    onChange={(e) => setForm({ ...form, cpf_socio: formatCPF(e.target.value) })}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
              </div>

              <div className="border-t border-border/40 pt-4">
                <p className="text-xs text-muted-foreground font-semibold tracking-wider uppercase mb-3">Endereço</p>
                <div className="grid grid-cols-6 gap-3">
                  <div className="col-span-4 space-y-2">
                    <Label>Rua / Avenida</Label>
                    <Input
                      value={form.rua}
                      onChange={(e) => setForm({ ...form, rua: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Número</Label>
                    <Input
                      value={form.numero}
                      onChange={(e) => setForm({ ...form, numero: e.target.value })}
                    />
                  </div>
                  <div className="col-span-3 space-y-2">
                    <Label>Complemento</Label>
                    <Input
                      value={form.complemento}
                      onChange={(e) => setForm({ ...form, complemento: e.target.value })}
                      placeholder="Sala, andar, bloco..."
                    />
                  </div>
                  <div className="col-span-3 space-y-2">
                    <Label>Bairro</Label>
                    <Input
                      value={form.bairro}
                      onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                    />
                  </div>
                  <div className="col-span-3 space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      value={form.cidade}
                      onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                    />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <Label>UF</Label>
                    <Select value={form.estado || undefined} onValueChange={(v) => setForm({ ...form, estado: v ?? "" })}>
                      <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                      <SelectContent>
                        {ESTADOS.map((uf) => (
                          <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>CEP</Label>
                    <Input
                      value={form.cep}
                      onChange={(e) => setForm({ ...form, cep: formatCEP(e.target.value) })}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-border/40 pt-4">
                <p className="text-xs text-muted-foreground font-semibold tracking-wider uppercase mb-3">Contrato</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Contrato</Label>
                    <Select
                      value={form.tipo_contrato}
                      onValueChange={(v) => setForm({ ...form, tipo_contrato: v as ContractType })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pack">Pack</SelectItem>
                        <SelectItem value="Mensal">Mensal</SelectItem>
                        <SelectItem value="Anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor do Contrato (R$)</Label>
                    <Input
                      type="number"
                      value={form.valor_contrato}
                      onChange={(e) => setForm({ ...form, valor_contrato: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prazo do Contrato</Label>
                    <Input
                      value={form.prazo_contrato}
                      onChange={(e) => setForm({ ...form, prazo_contrato: e.target.value })}
                      placeholder="Ex: 12 meses"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Início</Label>
                    <Input
                      type="date"
                      value={form.data_inicio_contrato}
                      onChange={(e) => setForm({ ...form, data_inicio_contrato: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Término</Label>
                    <Input
                      type="date"
                      value={form.data_termino_contrato}
                      onChange={(e) => setForm({ ...form, data_termino_contrato: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-border/40 pt-4">
                <p className="text-xs text-muted-foreground font-semibold tracking-wider uppercase mb-3">Anexo do Contrato</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => setContractFile(e.target.files?.[0] ?? null)}
                />
                {contractFile ? (
                  <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate flex-1">{contractFile.name}</span>
                    <button
                      type="button"
                      onClick={() => { setContractFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 py-6 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                  >
                    <FileUp className="h-5 w-5" />
                    Clique para anexar o contrato (PDF, DOC, imagem)
                  </button>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Sócio</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Arquivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhum cliente cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.nome_empresa}</TableCell>
                    <TableCell className="font-mono text-xs">{displayCNPJ(client.cnpj)}</TableCell>
                    <TableCell>{client.nome_socio ?? "-"}</TableCell>
                    <TableCell>
                      {client.cidade && client.estado
                        ? `${client.cidade}/${client.estado}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{client.tipo_contrato ?? "-"}</Badge>
                    </TableCell>
                    <TableCell>
                      {client.valor_contrato
                        ? client.valor_contrato.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {client.contrato_url ? (
                        <button
                          type="button"
                          onClick={async () => {
                            const { data } = await supabase.storage
                              .from("contracts")
                              .createSignedUrl(client.contrato_url!, 60);
                            if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                          }}
                          className="text-primary hover:underline text-xs flex items-center gap-1"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Ver
                        </button>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
