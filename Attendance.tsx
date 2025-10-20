import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Calendar, Check, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceData, setAttendanceData] = useState<Record<string, boolean>>({});

  const utils = trpc.useUtils();
  const { data: activeStudents } = trpc.students.listActive.useQuery();
  const { data: existingAttendance } = trpc.attendance.getByDate.useQuery(
    { classDate: selectedDate },
    { enabled: !!selectedDate }
  );

  const recordMutation = trpc.attendance.record.useMutation({
    onSuccess: () => {
      toast.success("Presença registrada com sucesso!");
      utils.attendance.getByDate.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao registrar presença");
    },
  });

  useEffect(() => {
    if (existingAttendance && existingAttendance.length > 0) {
      const data: Record<string, boolean> = {};
      existingAttendance.forEach((record) => {
        if (record.studentId) {
          data[record.studentId] = record.present;
        }
      });
      setAttendanceData(data);
    } else if (activeStudents) {
      const data: Record<string, boolean> = {};
      activeStudents.forEach((student) => {
        data[student.id] = false;
      });
      setAttendanceData(data);
    }
  }, [existingAttendance, activeStudents]);

  const handleToggleAttendance = (studentId: string) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedDate) {
      toast.error("Selecione uma data");
      return;
    }

    const promises = Object.entries(attendanceData).map(([studentId, present]) =>
      recordMutation.mutateAsync({
        studentId,
        classDate: selectedDate,
        present,
      })
    );

    try {
      await Promise.all(promises);
    } catch (error) {
      // Error already handled by mutation
    }
  };

  const handleMarkAll = (present: boolean) => {
    if (!activeStudents) return;
    const data: Record<string, boolean> = {};
    activeStudents.forEach((student) => {
      data[student.id] = present;
    });
    setAttendanceData(data);
  };

  const presentCount = Object.values(attendanceData).filter((p) => p).length;
  const totalCount = activeStudents?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Controle de Presença</h1>
        <p className="text-muted-foreground">
          Registrar presença dos alunos por data de aula
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecionar Data da Aula</CardTitle>
          <CardDescription>
            Escolha a data para registrar ou visualizar a presença
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="date">Data da Aula</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleMarkAll(true)}
                disabled={!activeStudents || activeStudents.length === 0}
              >
                <Check className="h-4 w-4 mr-2" />
                Marcar Todos
              </Button>
              <Button
                variant="outline"
                onClick={() => handleMarkAll(false)}
                disabled={!activeStudents || activeStudents.length === 0}
              >
                <X className="h-4 w-4 mr-2" />
                Desmarcar Todos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Presença</CardTitle>
          <CardDescription>
            {presentCount} de {totalCount} aluno(s) presente(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!activeStudents || activeStudents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum aluno ativo cadastrado
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Checkbox
                      id={`student-${student.id}`}
                      checked={attendanceData[student.id] || false}
                      onCheckedChange={() => handleToggleAttendance(student.id)}
                    />
                    <Label
                      htmlFor={`student-${student.id}`}
                      className="cursor-pointer flex-1"
                    >
                      <div>
                        <p className="font-medium">{student.name}</p>
                        {student.birthDate && (
                          <p className="text-sm text-muted-foreground">
                            {new Date(student.birthDate).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </Label>
                  </div>
                  <div>
                    {attendanceData[student.id] ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        Presente
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <X className="h-3 w-3 mr-1" />
                        Ausente
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeStudents && activeStudents.length > 0 && (
            <div className="mt-6">
              <Button
                onClick={handleSaveAttendance}
                disabled={recordMutation.isPending}
                className="w-full"
              >
                {recordMutation.isPending ? "Salvando..." : "Salvar Presença"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

