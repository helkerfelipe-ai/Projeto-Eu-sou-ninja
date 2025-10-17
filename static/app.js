// Global variables
let currentUser = null;
let students = [];
let classes = [];
let attendances = [];

// API Base URL
const API_BASE = '/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default for attendance
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('attendanceDate').value = today;
    
    // Check if user is already logged in (simplified for demo)
    checkLoginStatus();
});

// Authentication functions
async function checkLoginStatus() {
    try {
        const response = await fetch(`${API_BASE}/auth/check-session`);
        const data = await response.json();
        
        if (data.authenticated) {
            currentUser = data.user;
            showMainApp();
            loadDashboardData();
        } else {
            showLoginSection();
        }
    } catch (error) {
        console.error('Error checking login status:', error);
        showLoginSection();
    }
}

function showLoginSection() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('mainApp').style.display = 'none';
}

function showMainApp() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    loadStudents();
    loadClasses();
    loadClassesForAttendance();
}

// Login form handler
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro no login');
        }
        
        currentUser = data.user;
        showMainApp();
        showAlert('Login realizado com sucesso!', 'success');
        
    } catch (error) {
        showAlert(error.message, 'danger', 'loginAlert');
    } finally {
        showLoading(false);
    }
});

async function logout() {
    try {
        await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST'
        });
    } catch (error) {
        console.error('Error during logout:', error);
    }
    
    currentUser = null;
    showLoginSection();
    showAlert('Logout realizado com sucesso!', 'success');
}

// Navigation functions
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section-content').forEach(section => {
        section.style.display = 'none';
    });
    
    // Remove active class from all nav links
    document.querySelectorAll('#mainTabs .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionName + 'Section').style.display = 'block';
    
    // Add active class to clicked nav link
    event.target.classList.add('active');
    
    // Load data for the section
    switch(sectionName) {
        case 'students':
            loadStudents();
            break;
        case 'classes':
            loadClasses();
            break;
        case 'attendance':
            loadClassesForAttendance();
            break;
    }
}

function showDashboard() {
    // Show all sections for dashboard view
    document.querySelectorAll('.section-content').forEach(section => {
        section.style.display = 'none';
    });
    
    document.getElementById('dashboardSection').style.display = 'block';
    
    // Remove active class from all nav links
    document.querySelectorAll('#mainTabs .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    loadDashboardData();
}

// Dashboard functions
async function loadDashboardData() {
    try {
        showLoading(true);
        
        // Load all data for dashboard stats
        const [studentsData, classesData, usersData] = await Promise.all([
            fetch(`${API_BASE}/students`).then(r => r.json()),
            fetch(`${API_BASE}/classes`).then(r => r.json()),
            fetch(`${API_BASE}/users`).then(r => r.json())
        ]);
        
        // Update dashboard stats
        document.getElementById('totalStudents').textContent = studentsData.length;
        document.getElementById('totalClasses').textContent = classesData.length;
        document.getElementById('activeUsers').textContent = usersData.filter(u => u.active).length;
        
        // Get today's attendance count
        const today = new Date().toISOString().split('T')[0];
        const attendanceData = await fetch(`${API_BASE}/attendances?date=${today}`).then(r => r.json());
        document.getElementById('todayAttendance').textContent = attendanceData.filter(a => a.present).length;
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showAlert('Erro ao carregar dados do dashboard', 'danger');
    } finally {
        showLoading(false);
    }
}

// Student management functions
async function loadStudents() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/students`);
        students = await response.json();
        
        const tbody = document.getElementById('studentsTableBody');
        tbody.innerHTML = '';
        
        students.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.name}</td>
                <td>${student.email || '-'}</td>
                <td>${student.phone || '-'}</td>
                <td>${student.cord_level || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editStudent(${student.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteStudent(${student.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading students:', error);
        showAlert('Erro ao carregar alunos', 'danger');
    } finally {
        showLoading(false);
    }
}

function showAddStudentModal() {
    // Clear form
    document.getElementById('addStudentForm').reset();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addStudentModal'));
    modal.show();
}

async function addStudent() {
    try {
        const formData = {
            name: document.getElementById('studentName').value,
            email: document.getElementById('studentEmail').value || null,
            phone: document.getElementById('studentPhone').value || null,
            birth_date: document.getElementById('studentBirthDate').value || null,
            address: document.getElementById('studentAddress').value || null,
            cord_level: document.getElementById('studentCordLevel').value || null
        };
        
        if (!formData.name) {
            throw new Error('Nome é obrigatório');
        }
        
        showLoading(true);
        
        const response = await fetch(`${API_BASE}/students`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao criar aluno');
        }
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addStudentModal'));
        modal.hide();
        
        // Reload students
        await loadStudents();
        
        showAlert('Aluno criado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Error adding student:', error);
        showAlert(error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

async function deleteStudent(studentId) {
    if (!confirm('Tem certeza que deseja excluir este aluno?')) {
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE}/students/${studentId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Erro ao excluir aluno');
        }
        
        await loadStudents();
        showAlert('Aluno excluído com sucesso!', 'success');
        
    } catch (error) {
        console.error('Error deleting student:', error);
        showAlert(error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

// Class management functions
async function loadClasses() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/classes`);
        classes = await response.json();
        
        const tbody = document.getElementById('classesTableBody');
        tbody.innerHTML = '';
        
        const daysOfWeek = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
        
        classes.forEach(classObj => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${classObj.name}</td>
                <td>${daysOfWeek[classObj.day_of_week]}</td>
                <td>${classObj.start_time} - ${classObj.end_time}</td>
                <td>${classObj.instructor || '-'}</td>
                <td>${classObj.location || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editClass(${classObj.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteClass(${classObj.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading classes:', error);
        showAlert('Erro ao carregar turmas', 'danger');
    } finally {
        showLoading(false);
    }
}

function showAddClassModal() {
    // Clear form
    document.getElementById('addClassForm').reset();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addClassModal'));
    modal.show();
}

async function addClass() {
    try {
        const formData = {
            name: document.getElementById('className').value,
            description: document.getElementById('classDescription').value || null,
            day_of_week: parseInt(document.getElementById('classDayOfWeek').value),
            start_time: document.getElementById('classStartTime').value,
            end_time: document.getElementById('classEndTime').value,
            instructor: document.getElementById('classInstructor').value || null,
            location: document.getElementById('classLocation').value || null,
            max_students: document.getElementById('classMaxStudents').value ? parseInt(document.getElementById('classMaxStudents').value) : null
        };
        
        if (!formData.name || isNaN(formData.day_of_week) || !formData.start_time || !formData.end_time) {
            throw new Error('Nome, dia da semana, horário de início e fim são obrigatórios');
        }
        
        showLoading(true);
        
        const response = await fetch(`${API_BASE}/classes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao criar turma');
        }
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addClassModal'));
        modal.hide();
        
        // Reload classes
        await loadClasses();
        await loadClassesForAttendance();
        
        showAlert('Turma criada com sucesso!', 'success');
        
    } catch (error) {
        console.error('Error adding class:', error);
        showAlert(error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

async function deleteClass(classId) {
    if (!confirm('Tem certeza que deseja excluir esta turma?')) {
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE}/classes/${classId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Erro ao excluir turma');
        }
        
        await loadClasses();
        await loadClassesForAttendance();
        showAlert('Turma excluída com sucesso!', 'success');
        
    } catch (error) {
        console.error('Error deleting class:', error);
        showAlert(error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

// Attendance management functions
async function loadClassesForAttendance() {
    try {
        const response = await fetch(`${API_BASE}/classes`);
        const classesData = await response.json();
        
        const select = document.getElementById('attendanceClass');
        select.innerHTML = '<option value="">Selecione uma turma</option>';
        
        classesData.forEach(classObj => {
            const option = document.createElement('option');
            option.value = classObj.id;
            option.textContent = classObj.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading classes for attendance:', error);
        showAlert('Erro ao carregar turmas', 'danger');
    }
}

async function loadAttendanceForClass() {
    const classId = document.getElementById('attendanceClass').value;
    const date = document.getElementById('attendanceDate').value;
    
    if (!classId || !date) {
        document.getElementById('attendanceList').innerHTML = '';
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE}/classes/${classId}/attendance/${date}`);
        const studentsWithAttendance = await response.json();
        
        const attendanceList = document.getElementById('attendanceList');
        attendanceList.innerHTML = '';
        
        if (studentsWithAttendance.length === 0) {
            attendanceList.innerHTML = '<p class="text-muted">Nenhum aluno matriculado nesta turma.</p>';
            return;
        }
        
        const table = document.createElement('table');
        table.className = 'table table-hover';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Aluno</th>
                    <th>Presente</th>
                    <th>Observações</th>
                </tr>
            </thead>
            <tbody id="attendanceTableBody">
            </tbody>
        `;
        
        const tbody = table.querySelector('#attendanceTableBody');
        
        studentsWithAttendance.forEach(student => {
            const row = document.createElement('tr');
            const isPresent = student.attendance ? student.attendance.present : false;
            const notes = student.attendance ? student.attendance.notes || '' : '';
            
            row.innerHTML = `
                <td>${student.name}</td>
                <td>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" 
                               id="present_${student.id}" 
                               ${isPresent ? 'checked' : ''}
                               data-student-id="${student.id}">
                        <label class="form-check-label" for="present_${student.id}">
                            Presente
                        </label>
                    </div>
                </td>
                <td>
                    <input type="text" class="form-control form-control-sm" 
                           id="notes_${student.id}" 
                           value="${notes}"
                           placeholder="Observações..."
                           data-student-id="${student.id}">
                </td>
            `;
            tbody.appendChild(row);
        });
        
        attendanceList.appendChild(table);
        
    } catch (error) {
        console.error('Error loading attendance:', error);
        showAlert('Erro ao carregar presença', 'danger');
    } finally {
        showLoading(false);
    }
}

async function saveAttendance() {
    const classId = document.getElementById('attendanceClass').value;
    const date = document.getElementById('attendanceDate').value;
    
    if (!classId || !date) {
        showAlert('Selecione uma turma e data', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        
        // Collect attendance data
        const attendanceData = [];
        const checkboxes = document.querySelectorAll('input[type="checkbox"][data-student-id]');
        
        checkboxes.forEach(checkbox => {
            const studentId = checkbox.dataset.studentId;
            const notesInput = document.getElementById(`notes_${studentId}`);
            
            attendanceData.push({
                student_id: parseInt(studentId),
                present: checkbox.checked,
                notes: notesInput.value || null
            });
        });
        
        if (attendanceData.length === 0) {
            showAlert('Nenhum aluno encontrado para registrar presença', 'warning');
            return;
        }
        
        const response = await fetch(`${API_BASE}/attendances/bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                class_id: parseInt(classId),
                date: date,
                attendances: attendanceData,
                recorded_by: currentUser ? currentUser.id : null
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Erro ao salvar presença');
        }
        
        let message = `Presença salva com sucesso! ${result.created.length} registros criados.`;
        if (result.errors.length > 0) {
            message += ` ${result.errors.length} erros encontrados.`;
        }
        
        showAlert(message, result.errors.length > 0 ? 'warning' : 'success');
        
        // Reload attendance to show updated data
        await loadAttendanceForClass();
        
    } catch (error) {
        console.error('Error saving attendance:', error);
        showAlert(error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

// Utility functions
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (show) {
        spinner.classList.add('show');
    } else {
        spinner.classList.remove('show');
    }
}

function showAlert(message, type = 'info', elementId = null) {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert alert at the top of the main content
    if (elementId) {
        const targetElement = document.getElementById(elementId);
        targetElement.innerHTML = message;
        targetElement.style.display = 'block';
        setTimeout(() => {
            targetElement.style.display = 'none';
        }, 5000);
    } else {
        const container = document.querySelector('.container-fluid');
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Placeholder functions for edit operations
function editStudent(studentId) {
    showAlert('Funcionalidade de edição será implementada em breve', 'info');
}

function editClass(classId) {
    showAlert('Funcionalidade de edição será implementada em breve', 'info');
}

// Guardian information functions
function checkMinorStatus() {
    const birthDate = document.getElementById('studentBirthDate').value;
    const guardianSection = document.getElementById('guardianSection');
    
    if (birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        const age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        if (age < 18) {
            guardianSection.style.display = 'block';
        } else {
            guardianSection.style.display = 'none';
            // Clear guardian fields
            clearGuardianFields();
        }
    } else {
        guardianSection.style.display = 'none';
        clearGuardianFields();
    }
}

function clearGuardianFields() {
    document.getElementById('guardianName').value = '';
    document.getElementById('guardianRelationship').value = '';
    document.getElementById('guardianPhone').value = '';
    document.getElementById('guardianEmail').value = '';
    document.getElementById('guardianCpf').value = '';
    document.getElementById('guardianAddress').value = '';
}

// Reports functions
async function generateStudentReport() {
    const studentId = document.getElementById('reportStudent').value;
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    
    if (!studentId) {
        showAlert('Por favor, selecione um aluno', 'warning');
        return;
    }
    
    if (!startDate || !endDate) {
        showAlert('Por favor, selecione o período para o relatório', 'warning');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/reports/frequency/${studentId}?start_date=${startDate}&end_date=${endDate}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao gerar relatório');
        }
        
        displayStudentReport(data);
        
    } catch (error) {
        showAlert(error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

function displayStudentReport(data) {
    const resultsDiv = document.getElementById('reportResults');
    
    const html = `
        <div class="row">
            <div class="col-md-6">
                <h6 class="text-primary">Relatório de Frequência - ${data.student.name}</h6>
                <p><strong>Período:</strong> ${formatDate(data.period.start_date)} a ${formatDate(data.period.end_date)}</p>
                <p><strong>Idade:</strong> ${data.student.age} anos ${data.student.is_minor ? '(Menor de idade)' : ''}</p>
                <p><strong>Nível da Corda:</strong> ${data.student.cord_level || 'Não informado'}</p>
            </div>
            <div class="col-md-6">
                <div class="card bg-light">
                    <div class="card-body">
                        <h6>Resumo da Frequência</h6>
                        <p><strong>Total de Aulas:</strong> ${data.summary.total_classes}</p>
                        <p><strong>Presenças:</strong> ${data.summary.present_count}</p>
                        <p><strong>Faltas:</strong> ${data.summary.absent_count}</p>
                        <p><strong>Taxa de Frequência:</strong> <span class="badge ${data.summary.frequency_rate >= 75 ? 'bg-success' : data.summary.frequency_rate >= 50 ? 'bg-warning' : 'bg-danger'}">${data.summary.frequency_rate}%</span></p>
                    </div>
                </div>
            </div>
        </div>
        
        ${data.student.is_minor && data.student.guardian_name ? `
        <div class="row mt-3">
            <div class="col-12">
                <div class="alert alert-info">
                    <h6><i class="fas fa-user-shield me-2"></i>Responsável Legal</h6>
                    <p><strong>Nome:</strong> ${data.student.guardian_name}</p>
                    <p><strong>Parentesco:</strong> ${data.student.guardian_relationship || 'Não informado'}</p>
                    <p><strong>Telefone:</strong> ${data.student.guardian_phone || 'Não informado'}</p>
                </div>
            </div>
        </div>
        ` : ''}
        
        <div class="row mt-3">
            <div class="col-12">
                <h6>Frequência Mensal</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Mês</th>
                                <th>Presenças</th>
                                <th>Faltas</th>
                                <th>Total</th>
                                <th>Taxa</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.monthly_data.map(month => `
                                <tr>
                                    <td>${formatMonth(month.month)}</td>
                                    <td>${month.present}</td>
                                    <td>${month.absent}</td>
                                    <td>${month.total}</td>
                                    <td><span class="badge ${month.frequency_rate >= 75 ? 'bg-success' : month.frequency_rate >= 50 ? 'bg-warning' : 'bg-danger'}">${month.frequency_rate.toFixed(1)}%</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    resultsDiv.innerHTML = html;
}

async function generateGeneralStats() {
    const startDate = document.getElementById('statsStartDate').value;
    const endDate = document.getElementById('statsEndDate').value;
    
    if (!startDate || !endDate) {
        showAlert('Por favor, selecione o período para as estatísticas', 'warning');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/reports/general-stats?start_date=${startDate}&end_date=${endDate}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao gerar estatísticas');
        }
        
        displayGeneralStats(data);
        
    } catch (error) {
        showAlert(error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

function displayGeneralStats(data) {
    const resultsDiv = document.getElementById('reportResults');
    
    const html = `
        <div class="row">
            <div class="col-md-6">
                <h6 class="text-primary">Estatísticas Gerais</h6>
                <p><strong>Período:</strong> ${formatDate(data.period.start_date)} a ${formatDate(data.period.end_date)}</p>
                
                <div class="card bg-light mt-3">
                    <div class="card-body">
                        <h6>Resumo Geral</h6>
                        <p><strong>Total de Alunos:</strong> ${data.general_stats.total_students}</p>
                        <p><strong>Total de Turmas:</strong> ${data.general_stats.total_classes}</p>
                        <p><strong>Menores de Idade:</strong> ${data.general_stats.minors_count}</p>
                        <p><strong>Adultos:</strong> ${data.general_stats.adults_count}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card bg-light">
                    <div class="card-body">
                        <h6>Frequência no Período</h6>
                        <p><strong>Total de Registros:</strong> ${data.frequency_stats.total_attendances}</p>
                        <p><strong>Presenças:</strong> ${data.frequency_stats.total_present}</p>
                        <p><strong>Faltas:</strong> ${data.frequency_stats.total_absent}</p>
                        <p><strong>Taxa Geral:</strong> <span class="badge ${data.frequency_stats.overall_frequency >= 75 ? 'bg-success' : data.frequency_stats.overall_frequency >= 50 ? 'bg-warning' : 'bg-danger'}">${data.frequency_stats.overall_frequency}%</span></p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-3">
            <div class="col-12">
                <h6>Distribuição por Nível de Corda</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Nível</th>
                                <th>Quantidade</th>
                                <th>Percentual</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.cord_distribution.map(cord => {
                                const percentage = ((cord.count / data.general_stats.total_students) * 100).toFixed(1);
                                return `
                                    <tr>
                                        <td>${cord.level}</td>
                                        <td>${cord.count}</td>
                                        <td>${percentage}%</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    resultsDiv.innerHTML = html;
}

// Load students for reports
async function loadStudentsForReports() {
    try {
        const response = await fetch(`${API_BASE}/students`);
        const students = await response.json();
        
        const select = document.getElementById('reportStudent');
        select.innerHTML = '<option value="">Selecione um aluno</option>';
        
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.name} ${student.is_minor ? '(Menor)' : ''}`;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading students for reports:', error);
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function formatMonth(monthString) {
    const [year, month] = monthString.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
}

// Update showSection function to handle new sections
function showSection(sectionName) {
    // Hide all sections
    const sections = ['students', 'classes', 'attendance', 'reports', 'about'];
    sections.forEach(section => {
        const element = document.getElementById(section + 'Section');
        if (element) {
            element.style.display = 'none';
        }
    });
    
    // Show selected section
    const selectedSection = document.getElementById(sectionName + 'Section');
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }
    
    // Update active tab
    const tabs = document.querySelectorAll('#mainTabs .nav-link');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    const activeTab = document.querySelector(`#mainTabs .nav-link[onclick="showSection('${sectionName}')"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Load data for specific sections
    if (sectionName === 'reports') {
        loadStudentsForReports();
        // Set default dates (last 30 days)
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        
        document.getElementById('reportStartDate').value = thirtyDaysAgo.toISOString().split('T')[0];
        document.getElementById('reportEndDate').value = today.toISOString().split('T')[0];
        document.getElementById('statsStartDate').value = thirtyDaysAgo.toISOString().split('T')[0];
        document.getElementById('statsEndDate').value = today.toISOString().split('T')[0];
    }
}

// Update the addStudent function to include guardian information
async function addStudent() {
    const formData = {
        name: document.getElementById('studentName').value,
        email: document.getElementById('studentEmail').value,
        phone: document.getElementById('studentPhone').value,
        birth_date: document.getElementById('studentBirthDate').value,
        address: document.getElementById('studentAddress').value,
        cord_level: document.getElementById('studentCordLevel').value,
        guardian_name: document.getElementById('guardianName').value,
        guardian_relationship: document.getElementById('guardianRelationship').value,
        guardian_phone: document.getElementById('guardianPhone').value,
        guardian_email: document.getElementById('guardianEmail').value,
        guardian_cpf: document.getElementById('guardianCpf').value,
        guardian_address: document.getElementById('guardianAddress').value
    };
    
    // Validation
    if (!formData.name.trim()) {
        showAlert('Nome é obrigatório', 'danger');
        return;
    }
    
    if (!formData.birth_date) {
        showAlert('Data de nascimento é obrigatória', 'danger');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/students`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao cadastrar aluno');
        }
        
        // Close modal and refresh list
        const modal = bootstrap.Modal.getInstance(document.getElementById('addStudentModal'));
        modal.hide();
        
        // Clear form
        document.getElementById('addStudentForm').reset();
        clearGuardianFields();
        document.getElementById('guardianSection').style.display = 'none';
        
        loadStudents();
        loadDashboardData();
        showAlert('Aluno cadastrado com sucesso!', 'success');
        
    } catch (error) {
        showAlert(error.message, 'danger');
    } finally {
        showLoading(false);
    }
}
