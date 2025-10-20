import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, UserPlus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function Students() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    phone: "",
    email: "",
    address: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    isMinor: false,
    guardianName: "",
    guardianRelationship: "",
    guardianPhone: "",
    guardianEmail: "",
    guardianCpf: "",
  });

  const utils = trpc.useUtils();
  const { data: students, isLoading } = trpc.students.list.useQuery();

  const createMutation = trpc.students.create.useMutation({
    onSuccess: async (data) => {
      if (formData.isMinor && formData.guardianName) {
        await createGuardianMutation.mutateAsync({
          studentId: data.studentId,
          name: formData.guardianName,
          relationship: formData.guardianRelationship,
          phone: formData.guardianPhone,
          email: formData.guardianEmail,
          cpf: formData.guardianCpf,
        });
      }
      toast.success("Aluno cadastrado com sucesso!");
      utils.students.list.invalidate();
      closeDialog();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar aluno");
    },
  });

  const updateMutation = trpc.students.update.useMutation({
    onSuccess: () => {
      toast.success("Aluno atualizado com sucesso!");
      utils.students.list.invalidate();
      closeDialog();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar aluno");
    },
  });

  const deleteMutation = trpc.students.delete.useMutation({
    onSuccess: () => {
      toast.success("Aluno excluído com sucesso!");
      utils.students.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir aluno");
    },
  });

  const createGuardianMutation = trpc.guardians.create.useMutation();

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingStudent(null);
    setFormData({
      name: "",
      birthDate: "",
      phone: "",
      email: "",
      address: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      isMinor: false,
      guardianName: "",
      guardianRelationship: "",
      guardianPhone: "",
      guardianEmail: "",
      guardianCpf: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.birthDate) {
      toast.error("Nome e data de nascimento são obrigatórios");
      return;
    }

    if (formData.isMinor && !formData.guardianName) {
      toast.error("Para menores de idade, é necessário informar um responsável");
      return;
    }

    const studentData = {
      name: formData.name,
      birthDate: formData.birthDate,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      address: formData.address || undefined,
      neighborhood: formData.neighborhood || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      zipCode: formData.zipCode || undefined,
      isMinor: formData.isMinor,
    };

    if (editingStudent) {
      updateMutation.mutate({
        id: editingStudent.id,
        ...studentData,
      });
    } else {
      createMutation.mutate(studentData);
    }
  };

  const handleEdit = (student: any) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      birthDate: student.birthDate ? new Date(student.birthDate).toISOString().split('T')[0] : "",
      phone: student.phone || "",
      email: student.email || "",
      address: student.address || "",
      neighborhood: student.neighborhood || "",
      city: student.city || "",
      state: student.state || "",
      zipCode: student.zipCode || "",
      isMinor: student.isMinor,
      guardianName: "",
      guardianRelationship: "",
      guardianPhone: "",
      guardianEmail: "",
      guardianCpf: "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o aluno ${name}?`)) {
      deleteMutation.mutate({ id });
    }
  };

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alunos</h1>
          <p className="text-muted-foreground">Gerenciar cadastro de alunos</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Aluno
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Alunos</CardTitle>
          <CardDescription>
            {students?.length || 0} aluno(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Carregando...</p>
          ) : students && students.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Data de Nascimento</TableHead>
                    <TableHead>Idade</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>
                        {student.birthDate
                          ? new Date(student.birthDate).toLocaleDateString('pt-BR')
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {student.birthDate ? calculateAge(student.birthDate) : "-"} anos
                      </TableCell>
                      <TableCell>{student.phone || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            student.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {student.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(student)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(student.id, student.name)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum aluno cadastrado</p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                Cadastrar Primeiro Aluno
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStudent ? "Editar Aluno" : "Novo Aluno"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do aluno. Campos marcados com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  maxLength={2}
                  placeholder="ES"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="00000-000"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isMinor"
                checked={formData.isMinor}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isMinor: checked as boolean })
                }
              />
              <Label htmlFor="isMinor" className="cursor-pointer">
                Menor de idade (necessário responsável legal)
              </Label>
            </div>

            {formData.isMinor && !editingStudent && (
              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold">Dados do Responsável Legal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="guardianName">Nome do Responsável *</Label>
                    <Input
                      id="guardianName"
                      value={formData.guardianName}
                      onChange={(e) =>
                        setFormData({ ...formData, guardianName: e.target.value })
                      }
                      required={formData.isMinor}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guardianRelationship">Parentesco</Label>
                    <Input
                      id="guardianRelationship"
                      value={formData.guardianRelationship}
                      onChange={(e) =>
                        setFormData({ ...formData, guardianRelationship: e.target.value })
                      }
                      placeholder="Pai, Mãe, Tio, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guardianPhone">Telefone</Label>
                    <Input
                      id="guardianPhone"
                      value={formData.guardianPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, guardianPhone: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guardianEmail">Email</Label>
                    <Input
                      id="guardianEmail"
                      type="email"
                      value={formData.guardianEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, guardianEmail: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guardianCpf">CPF</Label>
                    <Input
                      id="guardianCpf"
                      value={formData.guardianCpf}
                      onChange={(e) =>
                        setFormData({ ...formData, guardianCpf: e.target.value })
                      }
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Salvando..."
                  : editingStudent
                  ? "Atualizar"
                  : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

