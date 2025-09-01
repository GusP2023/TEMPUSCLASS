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
    
    // ✅ CORREGIDO: Ocultar TODAS las secciones primero
    document.querySelector('.main-content').style.display = 'none';
    document.getElementById('studentsSection').style.display = 'none';
    
    // Ocultar sección de configuración si existe
    const settingsSection = document.getElementById('settingsSection');
    if (settingsSection) {
        settingsSection.style.display = 'none';
    }
    
    // ✅ CORREGIDO: Mostrar solo la sección seleccionada
    if (tab === 'calendar') {
        document.querySelector('.main-content').style.display = 'block';
        updateFabAction();
    } else if (tab === 'students') {
        document.getElementById('studentsSection').style.display = 'block';
        renderStudentsList();
        populateTimeSlots();
        updateFabAction();
    } else if (tab === 'settings') {
        showSettingsSection();
    } else if (tab === 'finance') {
        showToast('Sección Finanzas en desarrollo');
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
        // ✅ MOSTRAR MÚLTIPLES HORARIOS
        let scheduleText = '';
        
        if (student.schedules && student.schedules.length > 0) {
            scheduleText = student.schedules
                .map(s => `${getDayName(s.day)} ${s.time}`)
                .join(' • ');
        } else {
            // Compatibilidad con formato antiguo
            scheduleText = student.regularDay ? 
                `${getDayName(student.regularDay)} ${student.regularTime}` : 
                'Sin horario';
        }
        
        if (student.startDate) {
            scheduleText += ` (desde ${student.startDate})`;
        }
            
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
                    <div><strong>Horario${student.schedules?.length > 1 ? 's' : ''}:</strong> ${scheduleText}</div>
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
    
    // ✅ INFORMACIÓN DE MÚLTIPLES HORARIOS
    let scheduleInfo = '';
    if (student.schedules && student.schedules.length > 0) {
        scheduleInfo = student.schedules
            .map(s => `${getDayName(s.day)} ${s.time}`)
            .join(' • ');
        if (student.startDate) {
            scheduleInfo += ` (desde ${student.startDate})`;
        }
    } else {
        // Compatibilidad con formato antiguo
        scheduleInfo = student.regularDay ? 
            `${getDayName(student.regularDay)} ${student.regularTime}` : 
            'Sin horario';
        if (student.startDate) {
            scheduleInfo += ` (desde ${student.startDate})`;
        }
    }
    
    body.innerHTML = `
        <div class="student-info">
            <p><strong>Nombre:</strong> ${student.name}</p>
            <p><strong>Instrumento:</strong> ${student.instrument}</p>
            <p><strong>Horario${student.schedules?.length > 1 ? 's' : ''}:</strong> ${scheduleInfo}</p>
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
    
    // Resetear formulario a estado inicial
    form.reset();
    document.getElementById('secondScheduleGroup').style.display = 'none';
    document.getElementById('addScheduleGroup').style.display = 'block';
    
    ensureStartDateField();
    
    // Llenar opciones de tiempo
    populateTimeSlots('studentTime1');
    populateTimeSlots('studentTime2');
    
    if (editId) {
        const student = students.find(s => s.id === editId);
        if (student) {
            document.getElementById('studentName').value = student.name;
            document.getElementById('studentInstrument').value = student.instrument;
            
            // ✅ CARGAR MÚLTIPLES HORARIOS
            if (student.schedules && student.schedules.length > 0) {
                // Primer horario
                const schedule1 = student.schedules[0];
                document.getElementById('studentDay1').value = schedule1.day;
                document.getElementById('studentTime1').value = schedule1.time;
                
                // Segundo horario (si existe)
                if (student.schedules.length > 1) {
                    const schedule2 = student.schedules[1];
                    addSecondSchedule();
                    setTimeout(() => {
                        document.getElementById('studentDay2').value = schedule2.day;
                        document.getElementById('studentTime2').value = schedule2.time;
                    }, 100);
                }
            } else {
                // ✅ COMPATIBILIDAD: Estudiante con formato antiguo
                if (student.regularDay && student.regularTime) {
                    document.getElementById('studentDay1').value = student.regularDay;
                    document.getElementById('studentTime1').value = student.regularTime;
                }
            }
            
            if (student.startDate) {
                document.getElementById('studentStartDate').value = student.startDate;
            }
        }
        
        document.getElementById('studentStartDate').removeAttribute('required');
    } else {
        // Para nuevo alumno
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];
        
        document.getElementById('studentStartDate').min = firstDayStr;
        document.getElementById('studentStartDate').value = new Date().toISOString().split('T')[0];
    }
    
    modal.classList.add('active');

    setTimeout(() => setupMultipleScheduleValidation(), 100);
}

function editStudent(studentId) {
    closeModal();
    openStudentForm(studentId);
}

function saveStudent() {
    const name = document.getElementById('studentName').value.trim();
    const instrument = document.getElementById('studentInstrument').value;
    const day1 = parseInt(document.getElementById('studentDay1').value);
    const time1 = document.getElementById('studentTime1').value;
    const day2 = parseInt(document.getElementById('studentDay2').value);
    const time2 = document.getElementById('studentTime2').value;
    const startDate = document.getElementById('studentStartDate').value || null;
    
    if (!name || !instrument || !day1 || !time1) {
        showToast('Por favor completa todos los campos obligatorios');
        return;
    }
    
    // ✅ VALIDAR MÚLTIPLES HORARIOS
    const scheduleValidation = validateMultipleSchedules(currentEditingStudent);
    
    if (scheduleValidation === false) {
        return; // Error ya mostrado en validateMultipleSchedules
    }
    
    // ✅ CREAR ESTRUCTURA DE HORARIOS
    const schedules = [{ day: day1, time: time1, active: true }];
    
    if (day2 && time2) {
        schedules.push({ day: day2, time: time2, active: true });
    }
    
    if (currentEditingStudent) {
        updateExistingStudent(currentEditingStudent, name, instrument, schedules, startDate);
    } else {
        createNewStudent(name, instrument, schedules, startDate);
    }
}

function createNewStudent(name, instrument, schedules, startDate = null) {
    const newStudentId = Date.now() + Math.floor(Math.random() * 1000);
    
    const newStudent = {
        id: newStudentId,
        name: name,
        instrument: instrument,
        schedules: schedules, // ✅ NUEVO: Array de horarios
        active: true,
        licenseCredits: 0,
        createdAt: new Date().toISOString(),
        startDate: startDate || null
    };
    
    // ✅ CREAR CLASES REGULARES PARA CADA HORARIO
    schedules.forEach((schedule, index) => {
        const newRegularClass = {
            id: Date.now() + Math.floor(Math.random() * 1000) + index + 1,
            studentId: newStudentId,
            day: schedule.day,
            time: schedule.time,
            scheduleIndex: index // ✅ Identificar cuál horario es
        };
        
        regularClasses.push(newRegularClass);
    });
    
    students.push(newStudent);
    
    // ✅ GENERAR LICENCIAS AUTOMÁTICAS PARA CADA HORARIO
    schedules.forEach((schedule, index) => {
        generateAutoLicensesForSchedule(newStudent, schedule, index);
    });
    
    saveData();
    renderStudentsList();
    renderWeekView();
    closeModal();
    
    const scheduleText = schedules.map(s => `${getDayName(s.day)} ${s.time}`).join(' y ');
    const startMessage = startDate ? ` (inicia el ${startDate})` : '';
    showToast(`✅ Alumno ${name} inscrito exitosamente con horarios: ${scheduleText}${startMessage}`);
}

function updateExistingStudent(studentId, name, instrument, schedules, startDate = null) {
    const student = students.find(s => s.id === studentId);
    
    // ✅ DETECTAR CAMBIOS EN HORARIOS
    const oldSchedules = student.schedules || [{ day: student.regularDay, time: student.regularTime }];
    const scheduleChanged = JSON.stringify(oldSchedules) !== JSON.stringify(schedules);
    
    // Si cambió horarios, limpiar licencias automáticas del mes actual
    if (scheduleChanged) {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Eliminar licencias automáticas del mes actual
        specialClasses = specialClasses.filter(sc => {
            if (sc.studentId === studentId && sc.type === 'license' && sc.autoGenerated) {
                const licenseDate = new Date(sc.date);
                if (licenseDate >= firstDayOfMonth) {
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
        
        // ✅ ELIMINAR CLASES REGULARES ANTERIORES
        regularClasses = regularClasses.filter(rc => rc.studentId !== studentId);
    }
    
    // ✅ ACTUALIZAR ESTUDIANTE
    student.name = name;
    student.instrument = instrument;
    student.schedules = schedules;
    
    // Limpiar campos antiguos si existen
    delete student.regularDay;
    delete student.regularTime;
    
    // ✅ CREAR NUEVAS CLASES REGULARES
    schedules.forEach((schedule, index) => {
        const newRegularClass = {
            id: Date.now() + Math.floor(Math.random() * 1000) + index,
            studentId: studentId,
            day: schedule.day,
            time: schedule.time,
            scheduleIndex: index
        };
        
        regularClasses.push(newRegularClass);
    });
    
    // ✅ REGENERAR LICENCIAS PARA NUEVOS HORARIOS
    if (scheduleChanged) {
        schedules.forEach((schedule, index) => {
            generateAutoLicensesForSchedule(student, schedule, index);
        });
    }
    
    saveData();
    renderStudentsList();
    renderWeekView();
    closeModal();
    
    const scheduleText = schedules.map(s => `${getDayName(s.day)} ${s.time}`).join(' y ');
    showToast(`✅ Alumno ${name} actualizado exitosamente. Horarios: ${scheduleText}`);
}

// ✅ NUEVA: Generar licencias automáticas para un horario específico
function generateAutoLicensesForSchedule(student, schedule, scheduleIndex) {
    if (!student.startDate) return;
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const [year, month, day] = student.startDate.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    startDate.setHours(0, 0, 0, 0);
    
    if (startDate > today) return;
    
    // Encontrar la primera fecha de clase válida para este horario
    let firstClassDate = new Date(startDate);
    const targetDayOfWeek = schedule.day % 7;
    
    while (firstClassDate.getDay() !== targetDayOfWeek) {
        firstClassDate.setDate(firstClassDate.getDate() + 1);
    }
    
    // Generar todas las fechas de clase perdidas para este horario
    const missedClassDates = [];
    let currentClassDate = new Date(firstClassDate);
    
    while (currentClassDate <= today) {
        const [hours, minutes] = schedule.time.split(':').map(Number);
        const classDateTime = new Date(currentClassDate);
        classDateTime.setHours(hours, minutes, 0, 0);
        
        if (classDateTime < new Date()) {
            missedClassDates.push(new Date(currentClassDate));
        }
        
        currentClassDate.setDate(currentClassDate.getDate() + 7);
    }
    
    // Crear licencias automáticas para cada clase perdida de este horario
    missedClassDates.forEach(date => {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        const existingLicense = specialClasses.find(sc => 
            sc.studentId === student.id && 
            sc.date === dateStr && 
            sc.time === schedule.time &&
            sc.type === 'license'
        );
        
        if (!existingLicense) {
            const newLicense = {
                id: Date.now() + Math.random(),
                studentId: student.id,
                date: dateStr,
                time: schedule.time,
                type: 'license',
                autoGenerated: true,
                scheduleIndex: scheduleIndex, // ✅ Identificar a qué horario pertenece
                reason: `Clase perdida - Inscripción tardía desde ${student.startDate} (Horario ${scheduleIndex + 1})`
            };
            
            specialClasses.push(newLicense);
            student.licenseCredits = (student.licenseCredits || 0) + 1;
        }
    });
}

// ✅ VALIDACIÓN EN TIEMPO REAL para múltiples horarios
function setupMultipleScheduleValidation() {
    const day1 = document.getElementById('studentDay1');
    const time1 = document.getElementById('studentTime1');
    const day2 = document.getElementById('studentDay2');
    const time2 = document.getElementById('studentTime2');
    
    if (!day1 || !time1) return; // Elementos no existen aún
    
    const validateScheduleInputs = () => {
        // Validar primer horario
        validateSingleScheduleInput(day1, time1, 1);
        
        // Validar segundo horario si existe
        if (day2 && time2 && day2.value && time2.value) {
            validateSingleScheduleInput(day2, time2, 2);
            
            // Validar que no sean idénticos
            if (day1.value === day2.value && time1.value === time2.value && day1.value && time1.value) {
                day2.style.borderColor = '#ef4444';
                time2.style.borderColor = '#ef4444';
                showToast('⚠️ Los horarios no pueden ser idénticos');
            }
        }
    };
    
    // Event listeners para todos los campos
    day1.addEventListener('change', validateScheduleInputs);
    time1.addEventListener('change', validateScheduleInputs);
    
    if (day2 && time2) {
        day2.addEventListener('change', validateScheduleInputs);
        time2.addEventListener('change', validateScheduleInputs);
    }
}

function validateSingleScheduleInput(daySelect, timeSelect, scheduleNumber) {
    const day = parseInt(daySelect.value);
    const time = timeSelect.value;
    
    if (!day || !time) {
        // Resetear estilos si no hay valores
        daySelect.style.borderColor = '';
        timeSelect.style.borderColor = '';
        return;
    }
    
    const validation = validateUniqueSchedule(day, time, currentEditingStudent);
    
    if (validation === false) {
        // Horario ocupado
        daySelect.style.borderColor = '#ef4444';
        timeSelect.style.borderColor = '#ef4444';
        showToast(`❌ Horario ${scheduleNumber} ocupado por otro estudiante`);
    } else if (typeof validation === 'string') {
        // Horario se libera en fecha futura
        daySelect.style.borderColor = '#f59e0b';
        timeSelect.style.borderColor = '#f59e0b';
        showToast(`⚠️ Horario ${scheduleNumber} disponible desde: ${validation}`);
    } else {
        // Horario disponible
        daySelect.style.borderColor = '#10b981';
        timeSelect.style.borderColor = '#10b981';
    }
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
function populateTimeSlots(selectId = 'studentTime1') {
    const timeSelect = document.getElementById(selectId);
    if (!timeSelect) return;
    
    timeSelect.innerHTML = '<option value="">Seleccionar...</option>';
    
    timeSlots.forEach(time => {
        timeSelect.innerHTML += `<option value="${time}">${time}</option>`;
    });
}

// Validar horario único
function validateUniqueSchedule(day, time, excludeId = null, allowFutureStart = true) {
    // ✅ VALIDAR CONTRA MÚLTIPLES HORARIOS
    const conflictingStudent = students.find(s => {
        if (s.id === excludeId || !s.active) return false;
        
        // Verificar nuevo formato (schedules)
        if (s.schedules && s.schedules.length > 0) {
            return s.schedules.some(schedule => 
                schedule.day === day && schedule.time === time
            );
        }
        
        // Compatibilidad con formato antiguo
        return s.regularDay === day && s.regularTime === time;
    });
    
    if (!conflictingStudent) return true;
    
    // Si hay conflicto pero el alumno está desactivado con fecha futura
    if (allowFutureStart && conflictingStudent.deactivatedAt) {
        return conflictingStudent.deactivatedAt; // Retorna fecha de disponibilidad
    }
    
    return false;
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

// Estadísticas mensuales
function getMonthlyAttendance(studentId) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // ✅ ASISTENCIAS DE MÚLTIPLES CLASES REGULARES
    const studentRegularClasses = regularClasses.filter(rc => rc.studentId === studentId);
    let regularAttendance = [];
    
    if (studentRegularClasses.length > 0) {
        regularAttendance = attendance.filter(a => {
            const date = new Date(a.date);
            const isCurrentMonth = date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            const isStudentClass = studentRegularClasses.some(rc => rc.id === a.classId);
            return isCurrentMonth && isStudentClass;
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

// ✅ FUNCIONES PARA MÚLTIPLES HORARIOS

function addSecondSchedule() {
    document.getElementById('secondScheduleGroup').style.display = 'block';
    document.getElementById('addScheduleGroup').style.display = 'none';
    
    // Llenar opciones de tiempo para segundo horario
    populateTimeSlots('studentTime2');

    // ✅ AGREGAR VALIDACIÓN AL SEGUNDO HORARIO
    setTimeout(() => setupMultipleScheduleValidation(), 100);
    
    showToast('✅ Segundo horario agregado');
}

function removeSecondSchedule() {
    document.getElementById('secondScheduleGroup').style.display = 'none';
    document.getElementById('addScheduleGroup').style.display = 'block';
    
    // Limpiar valores
    document.getElementById('studentDay2').value = '';
    document.getElementById('studentTime2').value = '';
    
    showToast('❌ Segundo horario eliminado');
}

// ✅ Validar que no haya conflictos entre horarios del mismo estudiante
function validateMultipleSchedules(excludeId = null) {
    const day1 = parseInt(document.getElementById('studentDay1').value);
    const time1 = document.getElementById('studentTime1').value;
    const day2 = parseInt(document.getElementById('studentDay2').value);
    const time2 = document.getElementById('studentTime2').value;
    
    // Si solo hay un horario, validar normalmente
    if (!day2 || !time2) {
        return validateUniqueSchedule(day1, time1, excludeId);
    }
    
    // Validar que no sean horarios idénticos
    if (day1 === day2 && time1 === time2) {
        showToast('❌ Los dos horarios no pueden ser idénticos');
        return false;
    }
    
    // Validar cada horario individualmente
    const validation1 = validateUniqueSchedule(day1, time1, excludeId);
    const validation2 = validateUniqueSchedule(day2, time2, excludeId);
    
    if (validation1 === false) {
        showToast('❌ El primer horario ya está ocupado');
        return false;
    }
    
    if (validation2 === false) {
        showToast('❌ El segundo horario ya está ocupado');
        return false;
    }
    
    return { schedule1: validation1, schedule2: validation2 };
}

// ✅ GESTIÓN DE CRÉDITOS
function openCreditsModal() {
    const modal = document.getElementById('creditsModal');
    const select = document.getElementById('creditsStudent');
    
    // Llenar lista de estudiantes activos
    select.innerHTML = '<option value="">Seleccionar alumno...</option>';
    
    const activeStudents = students.filter(s => s.active)
        .sort((a, b) => a.name.localeCompare(b.name));
    
    activeStudents.forEach(student => {
        const currentCredits = student.licenseCredits || 0;
        select.innerHTML += `<option value="${student.id}">${student.name} (${currentCredits} créditos actuales)</option>`;
    });
    
    // Event listener para mostrar info del estudiante seleccionado
    select.addEventListener('change', showCurrentCreditsInfo);
    
    // Reset form
    document.getElementById('creditsForm').reset();
    document.getElementById('currentCreditsInfo').style.display = 'none';
    
    modal.classList.add('active');
}

function showCurrentCreditsInfo() {
    const studentId = parseInt(document.getElementById('creditsStudent').value);
    const infoDiv = document.getElementById('currentCreditsInfo');
    
    if (!studentId) {
        infoDiv.style.display = 'none';
        return;
    }
    
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    const currentCredits = student.licenseCredits || 0;
    const recoveries = specialClasses.filter(sc => 
        sc.studentId === studentId && sc.type === 'recovery'
    );
    const licenses = specialClasses.filter(sc => 
        sc.studentId === studentId && sc.type === 'license'
    );
    
    infoDiv.innerHTML = `
        <p><strong>Estado actual de ${student.name}:</strong></p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.5rem; font-size: 0.8rem;">
            <div>• Créditos disponibles: <strong>${currentCredits}</strong></div>
            <div>• Total licencias: <strong>${licenses.length}</strong></div>
            <div>• Recuperaciones agendadas: <strong>${recoveries.length}</strong></div>
            <div>• Balance: <strong>${currentCredits >= 0 ? 'Positivo' : 'Negativo'}</strong></div>
        </div>
    `;
    infoDiv.style.display = 'block';
}

// Event listener para el form
document.addEventListener('DOMContentLoaded', () => {
    const creditsForm = document.getElementById('creditsForm');
    if (creditsForm) {
        creditsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addCreditsToStudent();
        });
    }
});

function addCreditsToStudent() {
    const studentId = parseInt(document.getElementById('creditsStudent').value);
    const amount = parseInt(document.getElementById('creditsAmount').value);
    const reason = document.getElementById('creditsReason').value.trim();
    
    if (!studentId || !amount || amount <= 0) {
        showToast('Por favor completa los campos obligatorios');
        return;
    }
    
    const student = students.find(s => s.id === studentId);
    if (!student) {
        showToast('Estudiante no encontrado');
        return;
    }
    
    // Agregar créditos
    const previousCredits = student.licenseCredits || 0;
    student.licenseCredits = previousCredits + amount;
    
    // Crear registro de la operación (opcional, para auditoría)
    const creditRecord = {
        id: Date.now(),
        studentId: studentId,
        amount: amount,
        reason: reason || 'Ajuste manual de créditos',
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
        previousCredits: previousCredits,
        newCredits: student.licenseCredits
    };
    
    // Guardar en localStorage para auditoría (opcional)
    let creditHistory = JSON.parse(localStorage.getItem('creditHistory') || '[]');
    creditHistory.push(creditRecord);
    localStorage.setItem('creditHistory', JSON.stringify(creditHistory));
    
    saveData();
    renderStudentsList();
    closeModal();
    
    showToast(`✅ ${amount} crédito${amount > 1 ? 's' : ''} agregado${amount > 1 ? 's' : ''} a ${student.name}. Total: ${student.licenseCredits}`);
}

// ==========================================
// FUNCIONES PARA MÚLTIPLES ESTUDIANTES
// Agregar a students.js
// ==========================================

function generateTimeOptions() {
    const times = [
        '08:30', '09:15', '10:00', '10:45', '11:30',
        '14:30', '15:15', '16:00', '16:45', '17:30', '18:15', '19:00'
    ];
    
    return times.map(time => `<option value="${time}">${time}</option>`).join('');
}

function renumberStudentRows() {
    const rows = document.querySelectorAll('.student-row');
    rows.forEach((row, index) => {
        const rowNumber = index + 1;
        row.dataset.studentIndex = index;
        
        const numberDiv = row.querySelector('.row-number');
        const headerSpan = row.querySelector('.student-row-header span');
        
        if (numberDiv) numberDiv.textContent = rowNumber;
        if (headerSpan) headerSpan.textContent = `Estudiante ${rowNumber}`;
        
        // Actualizar botón de eliminar (solo mostrar si es > 3)
        const removeBtn = row.querySelector('.btn-remove-student');
        if (removeBtn) {
            if (rowNumber <= 3) {
                removeBtn.style.display = 'none';
            } else {
                removeBtn.style.display = 'inline-block';
            }
        }
    });
}

function updateStudentsCounter() {
    const count = document.querySelectorAll('.student-row').length;
    const counter = document.getElementById('studentsCounter');
    if (counter) {
        counter.textContent = `${count} estudiante${count !== 1 ? 's' : ''}`;
    }
}

// 🔍 VALIDACIÓN EN TIEMPO REAL
function setupMultipleFormValidation() {
    const form = document.getElementById('multipleStudentsForm');
    
    // Evento para validar cuando cambian los campos
    form.addEventListener('input', debounce(validateAllRows, 500));
    form.addEventListener('change', validateAllRows);
}

function setupRowValidation(row) {
    const inputs = row.querySelectorAll('input, select');
    
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateSingleRow(row));
        input.addEventListener('change', () => validateSingleRow(row));
    });
}

function extractRowData(row) {
    return {
        name: row.querySelector('.student-name')?.value?.trim() || '',
        instrument: row.querySelector('.student-instrument')?.value || '',
        day1: parseInt(row.querySelector('.schedule-day')?.value) || null,
        time1: row.querySelector('.schedule-time')?.value || '',
        day2: parseInt(row.querySelector('.schedule-day-2')?.value) || null,
        time2: row.querySelector('.schedule-time-2')?.value || '',
        startDate: row.querySelector('.start-date')?.value || ''
    };
}

function checkConflictsWithExistingStudents(data) {
    const errors = [];
    const existingSchedules = getAllExistingSchedules();
    
    // Verificar primer horario
    if (data.day1 && data.time1) {
        const conflict1 = existingSchedules.find(s => 
            s.day === data.day1 && s.time === data.time1
        );
        if (conflict1) {
            errors.push(`Horario ${getDayName(data.day1)} ${data.time1} ocupado por ${conflict1.studentName}`);
        }
    }
    
    // Verificar segundo horario
    if (data.day2 && data.time2) {
        const conflict2 = existingSchedules.find(s => 
            s.day === data.day2 && s.time === data.time2
        );
        if (conflict2) {
            errors.push(`Horario ${getDayName(data.day2)} ${data.time2} ocupado por ${conflict2.studentName}`);
        }
    }
    
    return errors;
}

function checkConflictsWithOtherRows(currentIndex, currentData) {
    const errors = [];
    const allRows = document.querySelectorAll('.student-row');
    
    allRows.forEach((row, index) => {
        if (index === currentIndex) return; // No comparar consigo mismo
        
        const otherData = extractRowData(row);
        const otherStudentNumber = index + 1;
        
        // Verificar conflictos de horario entre filas
        if (currentData.day1 && currentData.time1) {
            // Conflicto con primer horario del otro
            if (otherData.day1 === currentData.day1 && otherData.time1 === currentData.time1) {
                errors.push(`Conflicto con Estudiante ${otherStudentNumber}: ${getDayName(currentData.day1)} ${currentData.time1}`);
            }
            // Conflicto con segundo horario del otro
            if (otherData.day2 === currentData.day1 && otherData.time2 === currentData.time1) {
                errors.push(`Conflicto con Estudiante ${otherStudentNumber}: ${getDayName(currentData.day1)} ${currentData.time1}`);
            }
        }
        
        if (currentData.day2 && currentData.time2) {
            // Conflicto con primer horario del otro
            if (otherData.day1 === currentData.day2 && otherData.time1 === currentData.time2) {
                errors.push(`Conflicto con Estudiante ${otherStudentNumber}: ${getDayName(currentData.day2)} ${currentData.time2}`);
            }
            // Conflicto con segundo horario del otro
            if (otherData.day2 === currentData.day2 && otherData.time2 === currentData.time2) {
                errors.push(`Conflicto con Estudiante ${otherStudentNumber}: ${getDayName(currentData.day2)} ${currentData.time2}`);
            }
        }
    });
    
    return errors;
}

function updateRowValidationUI(row, errors) {
    const inputs = row.querySelectorAll('input, select');
    
    if (errors.length > 0) {
        row.classList.add('has-conflict');
        
        inputs.forEach(input => {
            const formGroup = input.closest('.form-group-inline');
            if (formGroup) {
                formGroup.classList.remove('valid');
                formGroup.classList.add('invalid');
            }
        });
    } else {
        row.classList.remove('has-conflict');
        
        inputs.forEach(input => {
            const formGroup = input.closest('.form-group-inline');
            if (formGroup) {
                formGroup.classList.remove('invalid');
                if (input.value) {
                    formGroup.classList.add('valid');
                }
            }
        });
    }
}

function updateValidationSummary(errors) {
    const summaryDiv = document.getElementById('validationSummary');
    
    if (errors.length === 0) {
        summaryDiv.style.display = 'none';
        return;
    }
    
    summaryDiv.innerHTML = `
        <h3>⚠️ Errores que debes corregir:</h3>
        <ul class="validation-list">
            ${errors.map(error => `<li>${error}</li>`).join('')}
        </ul>
    `;
    summaryDiv.style.display = 'block';
}

function collectAllStudentsData() {
    const rows = document.querySelectorAll('.student-row');
    const studentsData = [];
    
    rows.forEach(row => {
        const data = extractRowData(row);
        
        // Solo agregar si tiene datos mínimos
        if (data.name && data.instrument && data.day1 && data.time1) {
            const schedules = [{ day: data.day1, time: data.time1, active: true }];
            
            if (data.day2 && data.time2) {
                schedules.push({ day: data.day2, time: data.time2, active: true });
            }
            
            studentsData.push({
                name: data.name,
                instrument: data.instrument,
                schedules: schedules,
                startDate: data.startDate || null
            });
        }
    });
    
    return studentsData;
}

// 🛠️ FUNCIONES AUXILIARES
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Event listener para importar CSV
document.addEventListener('DOMContentLoaded', () => {
    const importForm = document.getElementById('importForm');
    if (importForm) {
        importForm.addEventListener('submit', (e) => {
            e.preventDefault();
            importCSVData();
        });
    }
});

// CSS para animación de salida
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOutToRight {
        0% {
            transform: translateX(0);
            opacity: 1;
        }
        100% {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);


// ==========================================
// FUNCIONES DE CONFIGURACIÓN/AJUSTES
// ==========================================

function showSettingsSection() {
    // ✅ CORREGIDO: NO ocultar otras secciones aquí, switchTab() ya lo hace
    
    let settingsSection = document.getElementById('settingsSection');
    
    if (!settingsSection) {
        settingsSection = document.createElement('div');
        settingsSection.id = 'settingsSection';
        settingsSection.className = 'students-section';
        
        settingsSection.innerHTML = `
            <div class="students-header">
                <h2>⚙️ Configuración</h2>
            </div>
            
            <div class="settings-content">
                <div class="student-card">
                    <div class="student-header">
                        <div class="student-name">📊 Datos</div>
                    </div>
                    <div style="display: flex; gap: 1rem; margin-top: 1rem; flex-wrap: wrap;">
                        <button class="btn btn-primary" onclick="exportToCSV()" style="flex: 1; min-width: 150px;">
                            📤 Exportar CSV
                        </button>
                        <button class="btn btn-secondary" onclick="openImportModal()" style="flex: 1; min-width: 150px;">
                            📥 Importar CSV
                        </button>
                    </div>
                </div>
                
                <div class="student-card">
                    <div class="student-header">
                        <div class="student-name">👥 Estudiantes</div>
                    </div>
                    <div style="margin-top: 0.5rem; color: var(--text-light); font-size: 0.9rem;">
                        <p>• Total: <strong>${students.length}</strong></p>
                        <p>• Activos: <strong>${students.filter(s => s.active).length}</strong></p>
                        <p>• Créditos totales: <strong>${students.reduce((sum, s) => sum + (s.licenseCredits || 0), 0)}</strong></p>
                    </div>
                </div>
                
                <div class="student-card">
                    <div class="student-header">
                        <div class="student-name">📅 Clases</div>
                    </div>
                    <div style="margin-top: 0.5rem; color: var(--text-light); font-size: 0.9rem;">
                        <p>• Regulares: <strong>${regularClasses.length}</strong></p>
                        <p>• Recuperaciones: <strong>${specialClasses.filter(s => s.type === 'recovery').length}</strong></p>
                        <p>• Licencias: <strong>${specialClasses.filter(s => s.type === 'license').length}</strong></p>
                    </div>
                </div>
                
                <div class="student-card" style="border: 1px solid var(--error); background: rgba(239, 68, 68, 0.05);">
                    <div class="student-header">
                        <div class="student-name" style="color: var(--error);">⚠️ Zona Peligrosa</div>
                    </div>
                    <p style="font-size: 0.9rem; color: var(--text-light); margin: 0.5rem 0;">
                        Estas acciones no se pueden deshacer
                    </p>
                    <button class="btn btn-absent" onclick="confirmResetApp()" style="width: 100%;">
                        🗑️ Borrar Todos los Datos
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(settingsSection);
    }
    
    // ✅ CORREGIDO: Solo actualizar estadísticas y mostrar la sección
    updateSettingsStats();
    settingsSection.style.display = 'block';
    updateFabAction();
}   

function updateSettingsStats() {
    const settingsSection = document.getElementById('settingsSection');
    if (!settingsSection) return;
    
    // Actualizar estadísticas dinámicamente
    const statsHTML = settingsSection.innerHTML
        .replace(/Total: <strong>\d+<\/strong>/, `Total: <strong>${students.length}</strong>`)
        .replace(/Activos: <strong>\d+<\/strong>/, `Activos: <strong>${students.filter(s => s.active).length}</strong>`)
        .replace(/Créditos totales: <strong>\d+<\/strong>/, `Créditos totales: <strong>${students.reduce((sum, s) => sum + (s.licenseCredits || 0), 0)}</strong>`)
        .replace(/Regulares: <strong>\d+<\/strong>/, `Regulares: <strong>${regularClasses.length}</strong>`)
        .replace(/Recuperaciones: <strong>\d+<\/strong>/, `Recuperaciones: <strong>${specialClasses.filter(s => s.type === 'recovery').length}</strong>`)
        .replace(/Licencias: <strong>\d+<\/strong>/, `Licencias: <strong>${specialClasses.filter(s => s.type === 'license').length}</strong>`);
    
    settingsSection.innerHTML = statsHTML;
}

function confirmResetApp() {
    const confirmation = prompt(
        'Esta acción BORRARÁ TODOS LOS DATOS permanentemente.\n\n' +
        'Escribe "BORRAR TODO" para confirmar:'
    );
    
    if (confirmation === 'BORRAR TODO') {
        // Limpiar todos los datos
        students.length = 0;
        regularClasses.length = 0;
        specialClasses.length = 0;
        attendance.length = 0;
        
        // Limpiar localStorage
        localStorage.removeItem('students');
        localStorage.removeItem('regularClasses');
        localStorage.removeItem('specialClasses');
        localStorage.removeItem('attendance');
        localStorage.removeItem('appInitialized');
        localStorage.removeItem('creditHistory');
        
        // Recargar página
        window.location.reload();
    } else {
        showToast('❌ Cancelado - Los datos no fueron borrados');
    }
}