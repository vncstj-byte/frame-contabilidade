"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import type { Client, ContractType } from "@/types/database";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const [form, setForm] = useState({
    nome_empresa: "",
    cnpj: "",
    endereco: "",
    nome_socio: "",
    cpf_socio: "",
    tipo_contrato: "Mensal" as ContractType,
    valor_contrato: "",
    prazo_contrato: "",
    data_inicio_contrato: "",
    data_termino_contrato: "",
    user_email: "",
  });

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

    const { error } = await supabase.from("clients").insert({
      nome_empresa: form.nome_empresa,
      cnpj: form.cnpj || null,
      endereco: form.endereco || null,
      nome_socio: form.nome_socio || null,
      cpf_socio: form.cpf_socio || null,
      tipo_contrato: form.tipo_contrato,
      valor_contrato: form.valor_contrato ? Number(form.valor_contrato) : null,
      prazo_contrato: form.prazo_contrato || null,
      data_inicio_contrato: form.data_inicio_contrato || null,
      data_termino_contrato: form.data_termino_contrato || null,
    });

    if (!error) {
      setDialogOpen(false);
      setForm({
        nome_empresa: "",
        cnpj: "",
        endereco: "",
        nome_socio: "",
        cpf_socio: "",
        tipo_contrato: "Mensal",
        valor_contrato: "",
        prazo_contrato: "",
        data_inicio_contrato: "",
        data_termino_contrato: "",
        user_email: "",
      });
      loadClients();
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Carregando...</p>
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
                    onChange={(e) =>
                      setForm({ ...form, nome_empresa: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input
                    value={form.cnpj}
                    onChange={(e) =>
                      setForm({ ...form, cnpj: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Endereço</Label>
                  <Input
                    value={form.endereco}
                    onChange={(e) =>
                      setForm({ ...form, endereco: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome do Sócio</Label>
                  <Input
                    value={form.nome_socio}
                    onChange={(e) =>
                      setForm({ ...form, nome_socio: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPF do Sócio</Label>
                  <Input
                    value={form.cpf_socio}
                    onChange={(e) =>
                      setForm({ ...form, cpf_socio: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Contrato</Label>
                  <Select
                    value={form.tipo_contrato}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        tipo_contrato: v as ContractType,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                    onChange={(e) =>
                      setForm({ ...form, valor_contrato: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prazo do Contrato</Label>
                  <Input
                    value={form.prazo_contrato}
                    onChange={(e) =>
                      setForm({ ...form, prazo_contrato: e.target.value })
                    }
                    placeholder="Ex: 12 meses"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <Input
                    type="date"
                    value={form.data_inicio_contrato}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        data_inicio_contrato: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Término</Label>
                  <Input
                    type="date"
                    value={form.data_termino_contrato}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        data_termino_contrato: e.target.value,
                      })
                    }
                  />
                </div>
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
                <TableHead>Contrato</TableHead>
                <TableHead>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    Nenhum cliente cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      {client.nome_empresa}
                    </TableCell>
                    <TableCell>{client.cnpj ?? "-"}</TableCell>
                    <TableCell>{client.nome_socio ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {client.tipo_contrato ?? "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {client.valor_contrato
                        ? client.valor_contrato.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })
                        : "-"}
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
