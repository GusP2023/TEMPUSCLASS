function initStudents() {
    // Event listeners específicos de estudiantes
    document.getElementById('instrumentFilter').addEventListener('change', renderStudentsList);
    document.getElementById('statusFilter').addEventListener('change', renderStudentsList);
    
    // Cualquier otra inicialización específica de estudiantes
    populateTimeSlots();
}

// Actualizar switchTab
function switchTab(tab) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    document.querySelector('.main-content').style.display = tab === 'calendar' ? 'block' : 'none';
    document.getElementById('studentsSection').style.display = tab === 'students' ? 'block' : 'none';
    
    if (tab === 'students') {
        renderStudentsList();
        populateTimeSlots();
        updateFabAction();
    } else if (tab === 'calendar') {
        updateFabAction();
    } else {
        showToast(`Sección ${tab} en desarrollo`);
    }
}

// Renderizar lista
function renderStudentsList() {
    const container = document.getElementById('studentsList');
    const instrumentFilter = document.getElementById('instrumentFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    let filteredStudents = students.filter(student => {
        const instrumentMatch = !instrumentFilter || student.instrument === instrumentFilter;
        const statusMatch = !statusFilter || 
            (statusFilter === 'active' && student.active) ||
            (statusFilter === 'inactive' && !student.active);
        return instrumentMatch && statusMatch;
    }).sort((a, b) => a.name.localeCompare(b.name));

    container.innerHTML = filteredStudents.map(student => {
        const scheduleText = student.startDate ? 
            `${getDayName(student.regularDay)} ${student.regularTime} (desde ${student.startDate})` :
            `${getDayName(student.regularDay)} ${student.regularTime}`;
            
        return `
            <div class="student-card ${student.active ? '' : 'inactive'}" onclick="showStudentDetails(${student.id})">
                <div class="student-header">
                    <div class="student-name">${student.name}</div>
                    <div class="student-status ${student.active ? 'active' : 'inactive'}">
                        ${student.active ? 'Activo' : 'Inactivo'}
                    </div>
                </div>
                <div class="student-info">
                    <div><strong>Instrumento:</strong> ${student.instrument}</div>
                    <div><strong>Horario:</strong> ${scheduleText}</div>
                </div>
                ${student.licenseCredits > 0 ? `<div class="student-credits">💳 ${student.licenseCredits} créditos disponibles</div>` : ''}
            </div>
        `;
    }).join('');
}

// Detalles del alumno
function showStudentDetails(studentId) {
    const student = students.find(s => s.id === studentId);
    const modal = document.getElementById('studentDetailsModal');
    const body = document.getElementById('studentDetailsBody');
    const footer = document.getElementById('studentDetailsFooter');
    
    const monthlyStats = getMonthlyAttendance(studentId);
    const studentRecoveries = specialClasses.filter(sc => 
        sc.studentId === studentId && sc.type === 'recovery'
    ).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Información de horario con fecha de inicio
    const scheduleInfo = student.startDate ? 
        `${getDayName(student.regularDay)} ${student.regularTime} (desde ${student.startDate})` :
        `${getDayName(student.regularDay)} ${student.regularTime}`;
    
    body.innerHTML = `
        <div class="student-info">
            <p><strong>Nombre:</strong> ${student.name}</p>
            <p><strong>Instrumento:</strong> ${student.instrument}</p>
            <p><strong>Horario:</strong> ${scheduleInfo}</p>
            <p><strong>Estado:</strong> ${student.active ? 'Activo' : 'Inactivo'}</p>
            <p><strong>Créditos:</strong> ${student.licenseCredits || 0}</p>
            ${student.startDate ? `<p><strong>Fecha de inicio:</strong> ${student.startDate}</p>` : ''}
        </div>
        
        <h3>Asistencias por mes</h3>
        <div class="monthly-stats">
            <div class="stat-box">
                <div class="stat-number">${monthlyStats.present}</div>
                <div class="stat-label">Presentes</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${monthlyStats.absent}</div>
                <div class="stat-label">Ausentes</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${monthlyStats.licenses}</div>
                <div class="stat-label">Licencias</div>
            </div>
        </div>
        
        ${studentRecoveries.length > 0 ? `
            <h3>Recuperaciones</h3>
            <div class="recoveries-list">
                ${studentRecoveries.map(recovery => {
                    const attendanceRecord = attendance.find(a => 
                        a.classId === recovery.id && a.date === recovery.date
                    );
                    const status = attendanceRecord?.status || 'pendiente';
                    return `
                        <div class="recovery-item">
                            <span>${recovery.date} - ${recovery.time}</span>
                            <span class="recovery-status ${status}">${getStatusText(status)}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        ` : ''}
    `;
    
    footer.innerHTML = `
        <button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>
        <button class="btn btn-primary" onclick="editStudent(${studentId})">Editar</button>
        ${student.active ? `<button class="btn btn-absent" onclick="confirmDeactivateStudent(${studentId})">Desactivar</button>` : 
                        `<button class="btn btn-success" onclick="reactivateStudent(${studentId})">Reactivar</button>`}
    `;
    
    modal.classList.add('active');
}

// Formulario de estudiante
function openStudentForm(editId = null) {
    const modal = document.getElementById('studentModal');
    const title = document.getElementById('studentModalTitle');
    const form = document.getElementById('studentForm');
    
    currentEditingStudent = editId;
    title.textContent = editId ? 'Editar Alumno' : 'Agregar Alumno';
    
    ensureStartDateField();
    
    if (editId) {
        const student = students.find(s => s.id === editId);
        if (student) {
            document.getElementById('studentName').value = student.name;
            document.getElementById('studentInstrument').value = student.instrument;
            document.getElementById('studentDay').value = student.regularDay;
            
            populateTimeSlots();
            setTimeout(() => {
                document.getElementById('studentTime').value = student.regularTime;
                
                if (student.startDate) {
                    document.getElementById('studentStartDate').value = student.startDate;
                }
            }, 50);
        }
        
        document.getElementById('studentStartDate').removeAttribute('required');
        
    } else {
        form.reset();
        populateTimeSlots();
        
        // Para nuevo alumno, permitir fechas desde inicio del mes actual
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];
        
        document.getElementById('studentStartDate').min = firstDayStr;
        document.getElementById('studentStartDate').value = new Date().toISOString().split('T')[0];
    }
    
    modal.classList.add('active');
}

function editStudent(studentId) {
    closeModal();
    openStudentForm(studentId);
}

function saveStudent() {
    const name = document.getElementById('studentName').value.trim();
    const instrument = document.getElementById('studentInstrument').value;
    const day = parseInt(document.getElementById('studentDay').value);
    const time = document.getElementById('studentTime').value;
    const startDate = document.getElementById('studentStartDate').value || null;
    
    if (!name || !instrument || !day || !time) {
        showToast('Por favor completa todos los campos obligatorios');
        return;
    }
    
    const scheduleValidation = validateUniqueSchedule(day, time, currentEditingStudent);
    
    if (scheduleValidation === false) {
        showToast('Este horario ya está ocupado por otro alumno activo');
        return;
    }
    
    // Validar que la fecha de inicio sea correcta si hay conflicto
    if (typeof scheduleValidation === 'string' && startDate) {
        const conflictEndDate = new Date(scheduleValidation);
        const selectedStartDate = new Date(startDate);
        
        if (selectedStartDate < conflictEndDate) {
            showToast(`La fecha de inicio debe ser posterior al ${scheduleValidation}`);
            return;
        }
    }
    
    if (currentEditingStudent) {
        updateExistingStudent(currentEditingStudent, name, instrument, day, time, startDate);
    } else {
        createNewStudent(name, instrument, day, time, startDate);
    }
}

function createNewStudent(name, instrument, day, time, startDate = null) {
    const newStudentId = Date.now() + Math.floor(Math.random() * 1000);
    
    const newStudent = {
        id: newStudentId,
        name: name,
        instrument: instrument,
        regularDay: day,
        regularTime: time,
        active: true,
        licenseCredits: 0,
        createdAt: new Date().toISOString(),
        startDate: startDate || null
    };
    
    const newRegularClass = {
        id: Date.now() + Math.floor(Math.random() * 1000) + 1,
        studentId: newStudentId,
        day: day,
        time: time
    };
    
    students.push(newStudent);
    regularClasses.push(newRegularClass);
    
    // Generar auto-licencias para fechas pasadas del mes actual
    generateAutoLicensesForPastDates(newStudent, newRegularClass);
    
    saveData();
    renderStudentsList();
    renderWeekView();
    closeModal();
    
    const startMessage = startDate ? ` (inicia el ${startDate})` : '';
    showToast(`✅ Alumno ${name} inscrito exitosamente${startMessage}`);
}

function updateExistingStudent(studentId, name, instrument, day, time, startDate = null) {
    const student = students.find(s => s.id === studentId);
    
    // Detectar si hubo cambio de horario
    const scheduleChanged = student.regularDay !== day || student.regularTime !== time;
    
    // Si cambió horario, limpiar licencias automáticas del mes actual
    if (scheduleChanged) {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Eliminar licencias automáticas del mes actual
        specialClasses = specialClasses.filter(sc => {
            if (sc.studentId === studentId && sc.type === 'license' && sc.autoGenerated) {
                const licenseDate = new Date(sc.date);
                // Eliminar si es del mes actual
                if (licenseDate >= firstDayOfMonth) {
                    // Restar el crédito
                    student.licenseCredits = Math.max(0, (student.licenseCredits || 0) - 1);
                    return false;
                }
            }
            return true;
        });
        
        // Limpiar asistencias automáticas relacionadas
        attendance = attendance.filter(a => {
            const classData = regularClasses.find(rc => rc.id === a.classId);
            if (classData?.studentId === studentId && a.autoGenerated) {
                const attDate = new Date(a.date);
                return attDate < firstDayOfMonth;
            }
            return true;
        });
    }
    
    student.name = name;
    student.instrument = instrument;
    student.regularDay = day;
    student.regularTime = time;
    
    let regularClass = regularClasses.find(rc => rc.studentId === studentId);
    if (regularClass) {
        regularClass.day = day;
        regularClass.time = time;
    } else {
        regularClass = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            studentId: studentId,
            day: day,
            time: time
        };
        regularClasses.push(regularClass);
    }

    // Si cambió horario, regenerar licencias para nuevo horario
    if (scheduleChanged) {
        generateAutoLicensesForPastDates(student, regularClass);
    }
    
    saveData();
    renderStudentsList();
    renderWeekView();
    closeModal();
    
    showToast(`✅ Alumno ${name} actualizado exitosamente`);
}

// NUEVA: Asegurar que el campo de fecha de inicio existe en el formulario
function ensureStartDateField() {
    let startDateField = document.getElementById('studentStartDateGroup');
    
    if (!startDateField) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        formGroup.id = 'studentStartDateGroup';
        formGroup.innerHTML = `
            <label class="form-label">Fecha de inicio de clases (opcional)</label>
            <input type="date" class="form-input" id="studentStartDate">
            <small style="color: var(--text-light); font-size: 0.8rem;">
                Fechas pasadas generarán licencias automáticas por días perdidos
            </small>
        `;
        
        const modalFooter = document.querySelector('#studentModal .modal-footer');
        modalFooter.parentNode.insertBefore(formGroup, modalFooter);
    }
}

// Horarios disponibles
function populateTimeSlots() {
    const timeSelect = document.getElementById('studentTime');
    timeSelect.innerHTML = '<option value="">Seleccionar...</option>';
    
    timeSlots.forEach(time => {
        timeSelect.innerHTML += `<option value="${time}">${time}</option>`;
    });
}

// Validar horario único
function validateUniqueSchedule(day, time, excludeId = null, allowFutureStart = true) {
    const conflictingStudent = students.find(s => 
        s.id !== excludeId && 
        s.regularDay == day && 
        s.regularTime === time &&
        s.active
    );
    
    if (!conflictingStudent) return true;
    
    // Si hay conflicto pero el alumno está desactivado con fecha futura
    if (allowFutureStart && conflictingStudent.deactivatedAt) {
        return conflictingStudent.deactivatedAt; // Retorna fecha de disponibilidad
    }
    
    return false;
} 

function setupScheduleValidation() {
    const daySelect = document.getElementById('studentDay');
    const timeSelect = document.getElementById('studentTime');
    
    const validateScheduleInputs = () => {
        const day = parseInt(daySelect.value);
        const time = timeSelect.value;
        
        if (day && time) {
            const validation = validateUniqueSchedule(day, time, currentEditingStudent);
            const submitBtn = document.querySelector('#studentForm .btn-primary');
            const startDateInput = document.getElementById('studentStartDate');
            
            if (validation === false) {
                timeSelect.style.borderColor = '#ef4444';
                submitBtn.textContent = 'Horario ocupado';
                submitBtn.disabled = true;
                startDateInput.disabled = true;
            } else if (typeof validation === 'string') {
                // Horario se libera en fecha futura
                timeSelect.style.borderColor = '#f59e0b';
                submitBtn.textContent = 'Inscribir';
                submitBtn.disabled = false;
                startDateInput.disabled = false;
                startDateInput.min = validation;
                startDateInput.value = validation;
                
                const helpText = startDateInput.parentNode.querySelector('small');
                helpText.textContent = `Horario disponible desde: ${validation}`;
                helpText.style.color = '#f59e0b';
            } else {
                // Horario disponible - permitir fechas desde inicio de mes
                timeSelect.style.borderColor = '#10b981';
                submitBtn.textContent = currentEditingStudent ? 'Actualizar' : 'Guardar';
                submitBtn.disabled = false;
                startDateInput.disabled = false;
                
                // Permitir fechas desde primer día del mes actual
                const firstDayOfMonth = new Date();
                firstDayOfMonth.setDate(1);
                const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];
                startDateInput.min = firstDayStr;
                
                const helpText = startDateInput.parentNode.querySelector('small');
                helpText.textContent = 'Fechas pasadas generarán licencias automáticas por días perdidos';
                helpText.style.color = 'var(--text-light)';
            }
        }
    };
    
    daySelect.addEventListener('change', validateScheduleInputs);
    timeSelect.addEventListener('change', validateScheduleInputs);
}

// Desactivación con fecha
function confirmDeactivateStudent(studentId) {
    const student = students.find(s => s.id === studentId);
    const modal = document.getElementById('deactivateModal');
    
    document.getElementById('deactivateStudentName').textContent = `¿Desactivar a ${student.name}?`;
    document.getElementById('deactivateDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('deactivateDate').min = new Date().toISOString().split('T')[0];
    
    closeModal();
    modal.classList.add('active');
    
    document.getElementById('deactivateForm').onsubmit = (e) => {
        e.preventDefault();
        const fromDate = document.getElementById('deactivateDate').value;
        deactivateStudent(studentId, fromDate);
    };
}

function deactivateStudent(studentId, fromDate) {
    const student = students.find(s => s.id === studentId);
    student.active = false;
    student.deactivatedAt = fromDate;
    
    cancelFutureClasses(studentId, fromDate);
    
    saveData();
    renderStudentsList();
    renderWeekView();
    closeModal();
    showToast('Alumno desactivado y clases futuras canceladas');
}

function reactivateStudent(studentId) {
    const student = students.find(s => s.id === studentId);
    student.active = true;
    student.deactivatedAt = null;
    saveData();
    renderStudentsList();
    closeModal();
    showToast('Alumno reactivado');
}

function cancelFutureClasses(studentId, fromDate) {
    const fromDateObj = new Date(fromDate);
    
    // Solo cancelar recuperaciones futuras (después de la fecha de corte)
    const recoveriesToCancel = specialClasses.filter(sc => {
        if (sc.studentId === studentId && sc.type === 'recovery') {
            const classDate = new Date(sc.date);
            return classDate >= fromDateObj;
        }
        return false;
    });
    
    // Eliminar recuperaciones futuras y restaurar créditos
    recoveriesToCancel.forEach(recovery => {
        const student = students.find(s => s.id === studentId);
        if (student) {
            student.licenseCredits = (student.licenseCredits || 0) + 1;
        }
    });
    
    // Filtrar specialClasses
    specialClasses = specialClasses.filter(sc => {
        if (sc.studentId === studentId && sc.type === 'recovery') {
            const classDate = new Date(sc.date);
            return classDate < fromDateObj; // Mantener solo las anteriores
        }
        return true;
    });
    
    // NO eliminar asistencias - mantener historial completo
    // Las asistencias se conservan para estadísticas y registro histórico
    
    console.log(`✅ Alumno ${studentId} desactivado desde ${fromDate}. Historial conservado.`);
}

// NUEVA: Generar licencias automáticas para fechas pasadas - CORREGIDA
function generateAutoLicensesForPastDates(student, regularClass) {
    if (!student.startDate) return;
    
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fin del día para comparaciones
    
    // Parsear fecha de inicio correctamente
    const [year, month, day] = student.startDate.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    startDate.setHours(0, 0, 0, 0);
    
    // Si empieza en el futuro, no generar licencias
    if (startDate > today) return;
    
    // 1. Encontrar la PRIMERA fecha de clase válida desde la fecha de inicio
    let firstClassDate = new Date(startDate);
    const targetDayOfWeek = student.regularDay % 7; // Convertir a formato Date (0=Dom, 1=Lun, etc.)
    
    // Buscar el primer día que coincida con el día de clase
    while (firstClassDate.getDay() !== targetDayOfWeek) {
        firstClassDate.setDate(firstClassDate.getDate() + 1);
    }
    
    console.log(`📅 ${student.name}: Fecha inicio ${student.startDate}, primer día de clase ${firstClassDate.toISOString().split('T')[0]}`);
    
    // 2. Generar todas las fechas de clase desde la primera fecha válida hasta hoy
    const missedClassDates = [];
    let currentClassDate = new Date(firstClassDate);
    
    while (currentClassDate <= today) {
        // Crear fecha/hora completa de la clase
        const [hours, minutes] = student.regularTime.split(':').map(Number);
        const classDateTime = new Date(currentClassDate);
        classDateTime.setHours(hours, minutes, 0, 0);
        
        // Si la clase ya pasó, agregarla a las perdidas
        if (classDateTime < new Date()) {
            missedClassDates.push(new Date(currentClassDate));
            console.log(`⏰ Clase perdida detectada: ${currentClassDate.toISOString().split('T')[0]} ${student.regularTime}`);
        }
        
        // Avanzar a la siguiente semana (mismo día)
        currentClassDate.setDate(currentClassDate.getDate() + 7);
    }
    
    console.log(`📅 Alumno ${student.name}: encontradas ${missedClassDates.length} clases perdidas desde ${student.startDate}`);
    
    // Crear licencias automáticas para cada clase perdida
    missedClassDates.forEach(date => {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        // Verificar que no exista ya una licencia para esta fecha
        const existingLicense = specialClasses.find(sc => 
            sc.studentId === student.id && 
            sc.date === dateStr && 
            sc.time === student.regularTime &&
            sc.type === 'license'
        );
        
        if (!existingLicense) {
            // Crear licencia automática
            const newLicense = {
                id: Date.now() + Math.random(),
                studentId: student.id,
                date: dateStr,
                time: student.regularTime,
                type: 'license',
                autoGenerated: true,
                reason: `Clase perdida - Inscripción tardía desde ${student.startDate}`
            };
            
            specialClasses.push(newLicense);
            
            // Agregar crédito al estudiante
            student.licenseCredits = (student.licenseCredits || 0) + 1;
            
            console.log(`✅ Licencia automática creada: ${dateStr} ${student.regularTime} para ${student.name}`);
        }
    });
    
    console.log(`💳 ${student.name} tiene ahora ${student.licenseCredits} créditos de recuperación`);
}

// Estadísticas mensuales
function getMonthlyAttendance(studentId) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Asistencias de clases regulares
    const studentRegularClass = regularClasses.find(rc => rc.studentId === studentId);
    let regularAttendance = [];
    if (studentRegularClass) {
        regularAttendance = attendance.filter(a => {
            const date = new Date(a.date);
            return date.getMonth() === currentMonth && 
                date.getFullYear() === currentYear &&
                a.classId === studentRegularClass.id;
        });
    }
    
    // Asistencias de recuperaciones
    const studentRecoveries = specialClasses.filter(sc => 
        sc.studentId === studentId && sc.type === 'recovery'
    );
    
    const recoveryAttendance = attendance.filter(a => {
        const date = new Date(a.date);
        const isCurrentMonth = date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        const isStudentRecovery = studentRecoveries.some(recovery => recovery.id === a.classId);
        return isCurrentMonth && isStudentRecovery;
    });
    
    // Combinar ambas asistencias
    const allAttendance = [...regularAttendance, ...recoveryAttendance];
    
    return {
        present: allAttendance.filter(a => a.status === 'present').length,
        absent: allAttendance.filter(a => a.status === 'absent').length,
        licenses: allAttendance.filter(a => a.status === 'license').length
    };
}

// Actualizar FAB
function updateFabAction() {
    const fab = document.querySelector('.fab');
    const studentsVisible = document.getElementById('studentsSection').style.display !== 'none';
    
    if (studentsVisible) {
        fab.innerHTML = '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14m7-7H5"/></svg>';
        fab.onclick = () => openStudentForm();
    } else {
        fab.innerHTML = '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="3"><path d="M9 11l3 3L22 4"/></svg>';
        fab.onclick = openAttendanceMode;
    }
}

// NUEVA: Función para verificar disponibilidad de horario en fecha específica
function isScheduleAvailableOnDate(day, time, date, excludeStudentId = null) {
    return !students.some(s => 
        s.id !== excludeStudentId &&
        s.regularDay === day && 
        s.regularTime === time &&
        isStudentActiveOnDate(s, date)
    );
}

// NUEVA: Obtener información de ocupación de horario
function getScheduleOccupancyInfo(day, time) {
    const student = students.find(s => s.regularDay === day && s.regularTime === time);
    
    if (!student) {
        return { available: true, message: 'Horario disponible' };
    }
    
    if (student.active) {
        return { 
            available: false, 
            message: `Ocupado por ${student.name} (activo)`,
            student: student
        };
    }
    
    if (student.deactivatedAt) {
        return {
            available: false,
            message: `Ocupado por ${student.name} hasta ${student.deactivatedAt}`,
            student: student,
            availableFrom: student.deactivatedAt
        };
    }
    
    return { available: true, message: 'Horario disponible' };
}