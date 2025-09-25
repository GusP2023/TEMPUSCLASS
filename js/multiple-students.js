// ==========================================
// FUNCIONES PARA MÚLTIPLES ESTUDIANTES
// ==========================================

// Variables globales para el dashboard
let currentStep = 1;
let dashboardUpdateTimeout = null;


// 🎯 INICIALIZACIÓN MEJORADA
function initializeMultipleStudentsForm() {
    const grid = document.getElementById('studentsGrid');
    if (!grid) {
        console.error('Element studentsGrid not found');
        return;
    }
    
    // Limpiar y resetear estado
    grid.innerHTML = '';
    currentStep = 1;
    updateStepIndicator(1);
    
    // Crear 1 fila inicial
    addStudentRow();
    
    // Configurar el formulario
    setupMultipleFormValidation();
    const form = document.getElementById('multipleStudentsForm');
    if (form) {
        form.removeEventListener('submit', handleMultipleStudentsSubmit);
        form.addEventListener('submit', handleMultipleStudentsSubmit);
    }
    
    // Actualizar dashboard inicial
    updateDashboard();
}

// 🎯 AGREGAR FILA CON DASHBOARD ACTUALIZADO
function addStudentRow() {
    const grid = document.getElementById('studentsGrid');
    if (!grid) return;

    // Validar filas existentes antes de agregar nueva
    if (grid.children.length > 0) {
        const form = document.getElementById('multipleStudentsForm');
        const isHTML5Valid = form.checkValidity();

        if (!isHTML5Valid) {
            form.reportValidity();
            return;
        }

        // Validaciones personalizadas - mostrar errores específicos
        const isValid = validateAllRows(); // Mostrar errores
        if (!isValid) {
            showToast('⚠️ Corrige los errores antes de agregar otro alumno');
            // Hacer scroll hacia arriba para ver los errores
            const summaryDiv = document.getElementById('validationSummary');
            if (summaryDiv && summaryDiv.style.display !== 'none') {
                summaryDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
    }

    const rowCount = grid.children.length + 1;
    
    const studentRow = document.createElement('div');
    studentRow.className = 'student-row';
    studentRow.dataset.studentIndex = rowCount - 1;
    
    studentRow.innerHTML = `
        <div class="student-row-header">
            <div class="row-number">${rowCount}</div>
            <span>Estudiante ${rowCount}</span>
            ${rowCount > 1 ? `<button type="button" class="btn-remove-student" onclick="removeStudentRow(this)">✕</button>` : ''}
        </div>
        
        <div class="form-group-inline">
            <label>Nombre *</label>
            <input type="text" class="student-name" required placeholder="Nombre completo">
        </div>
        
        <div class="form-group-inline">
            <label>Instrumento *</label>
            <select class="student-instrument" required>
                <option value="">Seleccionar...</option>
                <option value="Guitarra">Guitarra</option>
                <option value="Piano">Piano</option>
                <option value="Violín">Violín</option>
                <option value="Bajo">Bajo</option>
                <option value="Batería">Batería</option>
                <option value="Canto">Canto</option>
                <option value="Saxofón">Saxofón</option>
                <option value="Flauta">Flauta</option>
                <option value="Ukelele">Ukelele</option>
            </select>
        </div>
        
        <div class="form-group-inline">
            <label>Día 1 *</label>
            <select class="schedule-day" required>
                <option value="">Día...</option>
                <option value="1">Lunes</option>
                <option value="2">Martes</option>
                <option value="3">Miércoles</option>
                <option value="4">Jueves</option>
                <option value="5">Viernes</option>
                <option value="6">Sábado</option>
            </select>
        </div>
        
        <div class="form-group-inline">
            <label>Hora 1 *</label>
            <select class="schedule-time" required>
                <option value="">Hora...</option>
                ${generateTimeOptions()}
            </select>
        </div>
        
        <div class="form-group-inline">
            <label>Día 2</label>
            <select class="schedule-day-2">
                <option value="">Día...</option>
                <option value="1">Lunes</option>
                <option value="2">Martes</option>
                <option value="3">Miércoles</option>
                <option value="4">Jueves</option>
                <option value="5">Viernes</option>
                <option value="6">Sábado</option>
            </select>
        </div>
        
        <div class="form-group-inline">
            <label>Hora 2</label>
            <select class="schedule-time-2">
                <option value="">Hora...</option>
                ${generateTimeOptions()}
            </select>
        </div>
        
        <div class="form-group-inline">
            <label>Fecha Inicio *</label>
            <input type="date" class="start-date" required placeholder="YYYY-MM-DD">
        </div>
    `;
    
    grid.appendChild(studentRow);
    
    // Configurar validación para esta fila
    setupRowValidation(studentRow);
    setupSecondScheduleValidation(studentRow);
    
    // Configurar listeners para actualizar dashboard
    setupRowDashboardListeners(studentRow);
    
    // Actualizar dashboard
    updateDashboard();
    
    // Animación de entrada
    setTimeout(() => {
        studentRow.style.opacity = '1';
        studentRow.style.transform = 'translateY(0)';
    }, 50);
}

// 🎯 NUEVA: Configurar listeners para actualizar dashboard en tiempo real
function setupRowDashboardListeners(row) {
    const inputs = row.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            // Debounce para evitar demasiadas actualizaciones
            if (dashboardUpdateTimeout) {
                clearTimeout(dashboardUpdateTimeout);
            }
            dashboardUpdateTimeout = setTimeout(() => {
                updateDashboard();
                // También limpiar errores previos cuando el usuario está editando
                clearValidationSummary();
            }, 300);
        });

        input.addEventListener('change', () => {
            updateDashboard();
            // También limpiar errores previos cuando el usuario cambia valores
            clearValidationSummary();
        });
    });
}

// 🎯 NUEVA: Limpiar summary de validación
function clearValidationSummary() {
    const summaryDiv = document.getElementById('validationSummary');
    if (summaryDiv) {
        summaryDiv.style.display = 'none';
    }
}

// 🎯 NUEVA: Actualizar dashboard en tiempo real
function updateDashboard() {
    const rows = document.querySelectorAll('.student-row');
    const totalCount = rows.length;
    let validCount = 0;
    let completedFields = 0;
    let totalFields = 0;
    
    const studentsData = [];
    const schedulesUsed = new Set();
    
    // Analizar cada fila
    rows.forEach((row, index) => {
        const data = extractRowData(row);
        const errors = validateSingleRowQuiet(row); // Versión silenciosa
        
        // Contar campos completados
        const fields = [data.name, data.instrument, data.day1, data.time1, data.startDate];
        const completedInRow = fields.filter(field => field && field.toString().trim()).length;
        completedFields += completedInRow;
        totalFields += 5; // 5 campos obligatorios por fila
        
        // Si segundo horario tiene algún dato, contarlo también
        if (data.day2 || data.time2) {
            totalFields += 2;
            if (data.day2 && data.time2) {
                completedFields += 2;
            } else if (data.day2) {
                completedFields += 1;
            } else if (data.time2) {
                completedFields += 1;
            }
        }
        
        // Determinar si la fila es válida
        if (errors.length === 0 && data.name && data.instrument && data.day1 && data.time1 && data.startDate) {
            validCount++;
            studentsData.push({
                ...data,
                index: index,
                valid: true
            });
        } else {
            studentsData.push({
                ...data,
                index: index,
                valid: false,
                errors: errors
            });
        }
        
        // Recopilar horarios para vista general
        if (data.day1 && data.time1) {
            schedulesUsed.add(`${getDayName(data.day1)} ${data.time1}`);
        }
        if (data.day2 && data.time2) {
            schedulesUsed.add(`${getDayName(data.day2)} ${data.time2}`);
        }
    });
    
    // Actualizar contadores (con verificación de existencia)
    const totalStudentsElement = document.getElementById('totalStudentsCount');
    const validStudentsElement = document.getElementById('validStudentsCount');
    if (totalStudentsElement) totalStudentsElement.textContent = totalCount;
    if (validStudentsElement) validStudentsElement.textContent = validCount;

    // Calcular y actualizar progreso
    const progressPercentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
    const progressPercentageElement = document.getElementById('progressPercentage');
    const progressFillElement = document.getElementById('progressFill');
    if (progressPercentageElement) progressPercentageElement.textContent = `${progressPercentage}%`;
    if (progressFillElement) progressFillElement.style.width = `${progressPercentage}%`;
    
    // Actualizar lista de estudiantes
    updateStudentsPreview(studentsData);
    
    // Actualizar horarios ocupados
    updateSchedulesOverview(Array.from(schedulesUsed));
    
    // Actualizar paso actual y botones
    updateCurrentStep(validCount, totalCount, progressPercentage);
}

// 🎯 NUEVA: Actualizar vista previa de estudiantes
function updateStudentsPreview(studentsData) {
    const preview = document.getElementById('studentsPreview');
    const emptyState = document.getElementById('emptyState');

    // Verificar si los elementos existen (dashboard está deshabilitado)
    if (!preview || !emptyState) {
        return;
    }

    if (studentsData.length === 0 || studentsData.every(s => !s.name)) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    
    const validStudents = studentsData.filter(s => s.name);
    
    let previewHTML = '';
    validStudents.forEach(student => {
        const statusClass = student.valid ? 'valid' : 'invalid';
        const statusIcon = student.valid ? '✅' : '⚠️';
        
        let scheduleText = '';
        if (student.day1 && student.time1) {
            scheduleText = `${getDayName(student.day1)} ${student.time1}`;
            if (student.day2 && student.time2) {
                scheduleText += ` • ${getDayName(student.day2)} ${student.time2}`;
            }
        }
        
        previewHTML += `
            <div class="student-preview-card ${statusClass}">
                <div class="preview-header">
                    <span class="preview-name">${student.name || 'Sin nombre'}</span>
                    <span class="preview-status">${statusIcon}</span>
                </div>
                <div class="preview-details">
                    ${student.instrument ? `<div class="preview-instrument">🎵 ${student.instrument}</div>` : ''}
                    ${scheduleText ? `<div class="preview-schedule">📅 ${scheduleText}</div>` : ''}
                    ${student.errors && student.errors.length > 0 ? `
                        <div class="preview-errors">
                            ${student.errors.slice(0, 2).map(error => `<div class="preview-error">• ${error}</div>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    preview.innerHTML = previewHTML;
}

// 🎯 NUEVA: Actualizar vista general de horarios
function updateSchedulesOverview(schedules) {
    const overview = document.getElementById('schedulesOverview');
    const grid = document.getElementById('schedulesGrid');

    // Verificar si los elementos existen (dashboard está deshabilitado)
    if (!overview || !grid) {
        return;
    }

    if (schedules.length === 0) {
        overview.style.display = 'none';
        return;
    }

    overview.style.display = 'block';
    
    let schedulesHTML = '';
    schedules.forEach(schedule => {
        schedulesHTML += `
            <div class="schedule-chip">
                📅 ${schedule}
            </div>
        `;
    });
    
    grid.innerHTML = schedulesHTML;
}

// 🎯 NUEVA: Actualizar paso actual y estado de botones
function updateCurrentStep(validCount, totalCount, progressPercentage) {
    let newStep = 1;
    
    if (totalCount > 0 && progressPercentage >= 80) {
        newStep = 2; // Paso de validación
        
        if (validCount === totalCount && validCount > 0) {
            newStep = 3; // Listo para confirmar
        }
    }
    
    // Actualizar paso visual
    if (newStep !== currentStep) {
        updateStepIndicator(newStep);
        currentStep = newStep;
    }
    
    // Actualizar botón de creación
    const createBtn = document.getElementById('createBtn');

    if (createBtn) {
        if (newStep === 3 && validCount > 0) {
            createBtn.disabled = false;
            createBtn.textContent = `✅ Crear ${validCount} Alumno${validCount > 1 ? 's' : ''}`;
        } else {
            createBtn.disabled = true;
            createBtn.textContent = '✅ Crear Todos los Alumnos';
        }
    }
}

// 🎯 NUEVA: Actualizar indicador de pasos visual
function updateStepIndicator(step) {
    // Resetear todos los pasos
    document.querySelectorAll('.step').forEach((stepEl, index) => {
        stepEl.classList.remove('active', 'completed');
        
        if (index + 1 < step) {
            stepEl.classList.add('completed');
        } else if (index + 1 === step) {
            stepEl.classList.add('active');
        }
    });
}

// 🎯 NUEVA: Validación silenciosa (sin mostrar errores)
function validateAllRowsQuiet() {
    const rows = document.querySelectorAll('.student-row');
    const allErrors = [];
    
    rows.forEach((row, index) => {
        const errors = validateSingleRowQuiet(row);
        if (errors.length > 0) {
            allErrors.push(...errors);
        }
    });
    
    return allErrors.length === 0;
}

function validateSingleRowQuiet(row) {
    const index = parseInt(row.dataset.studentIndex);
    const data = extractRowData(row);
    const errors = [];
    const studentNumber = index + 1;

    // Validaciones básicas con mensajes específicos
    if (!data.name?.trim()) {
        errors.push(`Estudiante ${studentNumber}: Falta el nombre`);
    }

    if (!data.instrument) {
        errors.push(`Estudiante ${studentNumber}: Falta seleccionar instrumento`);
    }

    if (!data.day1 || !data.time1) {
        errors.push(`Estudiante ${studentNumber}: Falta completar el primer horario (día y hora)`);
    } else if (!data.day1) {
        errors.push(`Estudiante ${studentNumber}: Falta seleccionar el día del primer horario`);
    } else if (!data.time1) {
        errors.push(`Estudiante ${studentNumber}: Falta seleccionar la hora del primer horario`);
    }

    // Validar horarios duplicados en la misma fila
    if (data.day1 && data.time1 && data.day2 && data.time2) {
        if (data.day1 === data.day2 && data.time1 === data.time2) {
            errors.push(`Estudiante ${studentNumber}: Los dos horarios son idénticos (${getDayName(data.day1)} ${data.time1})`);
        }
    }

    // Validar segundo horario incompleto
    if ((data.day2 && !data.time2) || (!data.day2 && data.time2)) {
        errors.push(`Estudiante ${studentNumber}: El segundo horario está incompleto (falta ${data.day2 ? 'hora' : 'día'})`);
    }

    // Validar fecha si está presente
    if (data.startDate && !isValidDateFormat(data.startDate)) {
        errors.push(`Estudiante ${studentNumber}: Formato de fecha inválido (usar YYYY-MM-DD)`);
    }

    if (!data.startDate) {
        errors.push(`Estudiante ${studentNumber}: Falta la fecha de inicio`);
    }

    // Verificar conflictos con otros estudiantes existentes
    const conflictsWithExisting = checkConflictsWithExistingStudents(data, studentNumber);
    errors.push(...conflictsWithExisting);

    // Verificar conflictos con otras filas
    const conflictsWithOtherRows = checkConflictsWithOtherRows(index, data, studentNumber);
    errors.push(...conflictsWithOtherRows);

    return errors;
}

// 🎯 NUEVA: Mostrar vista previa final
function showFinalPreview() {
    const modal = document.getElementById('finalPreviewModal');
    const content = document.getElementById('finalPreviewContent');
    
    const studentsData = collectAllStudentsData();
    
    if (studentsData.length === 0) {
        showToast('❌ No hay estudiantes válidos para crear');
        return;
    }
    
    let previewHTML = `
        <div class="final-summary">
            <div class="summary-stats">
                <div class="summary-stat">
                    <div class="stat-number">${studentsData.length}</div>
                    <div class="stat-label">Estudiantes</div>
                </div>
                <div class="summary-stat">
                    <div class="stat-number">${studentsData.reduce((sum, s) => sum + s.schedules.length, 0)}</div>
                    <div class="stat-label">Horarios</div>
                </div>
            </div>
        </div>
        
        <div class="final-students-list">
    `;
    
    studentsData.forEach((student, index) => {
        const scheduleText = student.schedules.map(s => `${getDayName(s.day)} ${s.time}`).join(' • ');
        const startText = student.startDate ? ` (desde ${student.startDate})` : '';
        
        previewHTML += `
            <div class="final-student-card">
                <div class="final-student-header">
                    <div class="final-student-number">${index + 1}</div>
                    <div class="final-student-info">
                        <div class="final-student-name">${student.name}</div>
                        <div class="final-student-instrument">🎵 ${student.instrument}</div>
                    </div>
                </div>
                <div class="final-student-schedule">
                    📅 ${scheduleText}${startText}
                </div>
            </div>
        `;
    });
    
    previewHTML += '</div>';
    content.innerHTML = previewHTML;
    
    modal.classList.add('active');
}

// 🎯 NUEVA: Cerrar vista previa final
function closeFinalPreview() {
    document.getElementById('finalPreviewModal').classList.remove('active');
}

// 🎯 NUEVA: Confirmar creación desde vista previa
function confirmCreateStudents() {
    closeFinalPreview();
    handleMultipleStudentsSubmit({ preventDefault: () => {} });
}

// 🎯 MODIFICAR: Envío del formulario con mejor feedback
function submitMultipleStudents() {
    // Validar antes de mostrar preview
    const isValid = validateAllRows();
    if (!isValid) {
        showToast('❌ Por favor corrige los errores antes de continuar');
        // Hacer scroll hacia arriba para ver los errores
        const summaryDiv = document.getElementById('validationSummary');
        if (summaryDiv && summaryDiv.style.display !== 'none') {
            summaryDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    const studentsData = collectAllStudentsData();

    if (studentsData.length === 0) {
        showToast('❌ Debes agregar al menos un estudiante');
        return;
    }

    // Limpiar errores antes de mostrar preview
    clearValidationSummary();

    // Mostrar vista previa automáticamente
    showFinalPreview();
}

// 🎯 REMOVER FILA CON ACTUALIZACIÓN DE DASHBOARD
function removeStudentRow(button) {
    const row = button.closest('.student-row');
    row.style.animation = 'slideOutToRight 0.3s ease-in forwards';
    
    setTimeout(() => {
        row.remove();
        renumberStudentRows();
        updateDashboard(); // ✅ Actualizar dashboard al remover
    }, 300);
}

// Validación condicional para segundo horario
function setupSecondScheduleValidation(studentRow) {
    const day2Select = studentRow.querySelector('.schedule-day-2');
    const time2Select = studentRow.querySelector('.schedule-time-2');

    function validateSecondSchedule() {
        const hasDay2 = day2Select.value !== '';
        const hasTime2 = time2Select.value !== '';

        // Si uno está lleno pero el otro no, marcar como requeridos
        if (hasDay2 && !hasTime2) {
            time2Select.setAttribute('required', 'required');
            day2Select.removeAttribute('required');
        } else if (hasTime2 && !hasDay2) {
            day2Select.setAttribute('required', 'required');
            time2Select.removeAttribute('required');
        } else {
            // Si ambos están vacíos o ambos están llenos, quitar required
            day2Select.removeAttribute('required');
            time2Select.removeAttribute('required');
        }
    }

    // Agregar listeners a ambos campos
    day2Select.addEventListener('change', validateSecondSchedule);
    time2Select.addEventListener('change', validateSecondSchedule);
}

function removeStudentRow(button) {
    const row = button.closest('.student-row');
    row.style.animation = 'slideOutToRight 0.3s ease-in forwards';
    
    setTimeout(() => {
        row.remove();
        renumberStudentRows();
        updateStudentsCounter();
        validateAllRows();
    }, 300);
}

function validateSingleRow(row) {
    const index = parseInt(row.dataset.studentIndex);
    const data = extractRowData(row);
    const errors = [];
    const studentNumber = index + 1;

    // Validaciones básicas con mensajes específicos
    if (!data.name?.trim()) {
        errors.push(`Estudiante ${studentNumber}: Falta el nombre`);
    }

    if (!data.instrument) {
        errors.push(`Estudiante ${studentNumber}: Falta seleccionar instrumento`);
    }

    if (!data.day1 || !data.time1) {
        errors.push(`Estudiante ${studentNumber}: Falta completar el primer horario (día y hora)`);
    }

    // Validar horarios duplicados en la misma fila
    if (data.day1 && data.time1 && data.day2 && data.time2) {
        if (data.day1 === data.day2 && data.time1 === data.time2) {
            errors.push(`Estudiante ${studentNumber}: Los dos horarios son idénticos (${getDayName(data.day1)} ${data.time1})`);
        }
    }

    // Validar segundo horario incompleto
    if ((data.day2 && !data.time2) || (!data.day2 && data.time2)) {
        errors.push(`Estudiante ${studentNumber}: El segundo horario está incompleto (falta ${data.day2 ? 'hora' : 'día'})`);
    }

    // Validar fecha si está presente
    if (data.startDate && !isValidDateFormat(data.startDate)) {
        errors.push(`Estudiante ${studentNumber}: Formato de fecha inválido (usar YYYY-MM-DD)`);
    }

    if (!data.startDate) {
        errors.push(`Estudiante ${studentNumber}: Falta la fecha de inicio`);
    }

    // Verificar conflictos con otros estudiantes existentes
    const conflictsWithExisting = checkConflictsWithExistingStudents(data, studentNumber);
    errors.push(...conflictsWithExisting);

    // Verificar conflictos con otras filas
    const conflictsWithOtherRows = checkConflictsWithOtherRows(index, data, studentNumber);
    errors.push(...conflictsWithOtherRows);

    // Aplicar estilos visuales
    updateRowValidationUI(row, errors);

    return errors;
}

function validateAllRows() {
    const rows = document.querySelectorAll('.student-row');
    const allErrors = [];

    rows.forEach((row, index) => {
        const errors = validateSingleRow(row);
        // Los errores ya incluyen el número de estudiante, no duplicar
        allErrors.push(...errors);
    });

    updateValidationSummary(allErrors);
    return allErrors.length === 0;
}

// 💾 ENVÍO DEL FORMULARIO
function handleMultipleStudentsSubmit(e) {
    e.preventDefault();
    
    const isValid = validateAllRows();
    if (!isValid) {
        showToast('❌ Por favor corrige los errores antes de continuar');
        return;
    }
    
    const studentsData = collectAllStudentsData();
    
    if (studentsData.length === 0) {
        showToast('❌ Debes agregar al menos un estudiante');
        return;
    }
    
    // Mostrar confirmación
    const confirmMessage = `¿Crear ${studentsData.length} estudiantes con sus horarios correspondientes?`;
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // Procesar creación
    try {
        createAllStudents(studentsData);
        
        // Marcar app como inicializada
        localStorage.setItem('appInitialized', 'true');
        
        saveData();
        renderStudentsList();
        renderWeekView();
        closeModal();
        
        showToast(`✅ ${studentsData.length} estudiantes creados exitosamente`);
        
    } catch (error) {
        console.error('Error creating multiple students:', error);
        showToast('❌ Error al crear estudiantes: ' + error.message);
    }
}

function createAllStudents(studentsData) {
    studentsData.forEach(studentData => {
        const newStudentId = Date.now() + Math.floor(Math.random() * 10000);
        
        // Crear estudiante
        const newStudent = {
            id: newStudentId,
            name: studentData.name,
            instrument: studentData.instrument,
            schedules: studentData.schedules,
            active: true,
            licenseCredits: 0,
            createdAt: new Date().toISOString(),
            startDate: studentData.startDate
        };
        
        students.push(newStudent);
        
        // Crear clases regulares para cada horario
        studentData.schedules.forEach((schedule, index) => {
            const newRegularClass = {
                id: Date.now() + Math.floor(Math.random() * 10000) + index + 1,
                studentId: newStudentId,
                day: schedule.day,
                time: schedule.time,
                scheduleIndex: index
            };
            
            regularClasses.push(newRegularClass);
        });
        
        // ❌ REMOVIDO: No generar licencias automáticas para múltiples estudiantes
        // Este sistema es para migrar datos existentes, no nuevos estudiantes
        
        // ✅ OPCIONAL: Solo generar si específicamente se indica que es migración de datos antiguos
        // if (studentData.generateAutoLicenses && studentData.startDate) {
        //     studentData.schedules.forEach((schedule, index) => {
        //         generateAutoLicensesForSchedule(newStudent, schedule, index);
        //     });
        // }
    });
}
