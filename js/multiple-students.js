// ==========================================
// FUNCIONES PARA MÚLTIPLES ESTUDIANTES
// ==========================================

// 🏁 INICIALIZACIÓN DEL FORMULARIO MÚLTIPLE
function initializeMultipleStudentsForm() {
    const grid = document.getElementById('studentsGrid');
    if (!grid) {
        console.error('Element studentsGrid not found');
        return;
    }
    
    grid.innerHTML = '';
    
    // Crear 3 filas iniciales
    for (let i = 0; i < 3; i++) {
        addStudentRow();
    }
    
    updateStudentsCounter();
    setupMultipleFormValidation();
    
    // ✅ CORREGIDO: Event listener con verificación
    const form = document.getElementById('multipleStudentsForm');
    if (form) {
        // Remover event listener anterior si existe
        form.removeEventListener('submit', handleMultipleStudentsSubmit);
        // Agregar nuevo event listener
        form.addEventListener('submit', handleMultipleStudentsSubmit);
    }
}

function addStudentRow() {
    const grid = document.getElementById('studentsGrid');
    if (!grid) {
        console.error('Element studentsGrid not found');
        return;
    }
    
    const rowCount = grid.children.length + 1;
    
    const studentRow = document.createElement('div');
    studentRow.className = 'student-row';
    studentRow.dataset.studentIndex = rowCount - 1;
    
    studentRow.innerHTML = `
        <div class="student-row-header">
            <div class="row-number">${rowCount}</div>
            <span>Estudiante ${rowCount}</span>
            ${rowCount > 3 ? `<button type="button" class="btn-remove-student" onclick="removeStudentRow(this)">✕</button>` : ''}
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
            <label>Fecha Inicio</label>
            <input type="date" class="start-date" placeholder="YYYY-MM-DD">
        </div>
    `;
    
    grid.appendChild(studentRow);
    updateStudentsCounter();
    
    // Configurar validación para esta fila
    setupRowValidation(studentRow);
    
    // Animación de entrada
    setTimeout(() => {
        studentRow.style.opacity = '1';
        studentRow.style.transform = 'translateY(0)';
    }, 50);
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
    
    // Validaciones básicas
    if (!data.name?.trim()) {
        errors.push('Nombre requerido');
    }
    
    if (!data.instrument) {
        errors.push('Instrumento requerido');
    }
    
    if (!data.day1 || !data.time1) {
        errors.push('Primer horario requerido');
    }
    
    // Validar horarios duplicados en la misma fila
    if (data.day1 && data.time1 && data.day2 && data.time2) {
        if (data.day1 === data.day2 && data.time1 === data.time2) {
            errors.push('Horarios duplicados');
        }
    }
    
    // Validar fecha si está presente
    if (data.startDate && !isValidDateFormat(data.startDate)) {
        errors.push('Formato de fecha inválido');
    }
    
    // Verificar conflictos con otros estudiantes existentes
    const conflictsWithExisting = checkConflictsWithExistingStudents(data);
    errors.push(...conflictsWithExisting);
    
    // Verificar conflictos con otras filas
    const conflictsWithOtherRows = checkConflictsWithOtherRows(index, data);
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
        if (errors.length > 0) {
            allErrors.push(`Estudiante ${index + 1}: ${errors.join(', ')}`);
        }
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
        
        // Generar licencias automáticas si tiene fecha de inicio
        if (studentData.startDate) {
            studentData.schedules.forEach((schedule, index) => {
                generateAutoLicensesForSchedule(newStudent, schedule, index);
            });
        }
    });
}
