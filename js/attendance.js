function markAttendance(classId, status) {
    // ✅ USAR FECHA LOCAL SIN TIMEZONE ISSUES
    const today = getLocalDateString();
    const classData = regularClasses.find(c => c.id === classId);
    
    if (!classData) {
        showToast('Error: Clase no encontrada');
        return;
    }
    
    // Buscar registro de asistencia actual
    const currentRecord = attendance.find(a => a.classId === classId && a.date === today);
    const previousStatus = currentRecord?.status || null;
    
    // Si es el mismo estado, no hacer nada
    if (previousStatus === status) {
        closeModal();
        return;
    }
    
    // Obtener el estudiante para manejar créditos
    const student = students.find(s => s.id === classData.studentId);
    if (!student) {
        showToast('Error: Estudiante no encontrado');
        return;
    }
    
    // LÓGICA DE CRÉDITOS
    let creditChange = 0;
    let changeDescription = '';
    
    if (previousStatus === 'license' && status !== 'license') {
        // Quitar licencia (restar crédito)
        creditChange = -1;
        changeDescription = 'Licencia revertida (-1 crédito)';
    } else if (previousStatus !== 'license' && status === 'license') {
        // Agregar licencia (sumar crédito)
        creditChange = +1;
        changeDescription = 'Licencia agregada (+1 crédito)';
    } else {
        // Cambio entre presente y ausente (sin cambio de créditos)
        changeDescription = `Cambiado a ${getStatusText(status)}`;
    }
    
    // Validar que no queden créditos negativos
    const newCredits = (student.licenseCredits || 0) + creditChange;
    if (newCredits < 0) {
        showToast('❌ No se puede revertir: el estudiante quedaría con créditos negativos');
        return;
    }
    
    // Aplicar cambios
    // 1. Actualizar créditos del estudiante
    student.licenseCredits = newCredits;
    
    // 2. Remover asistencia anterior del mismo día
    attendance = attendance.filter(a => !(a.classId === classId && a.date === today));
    
    // 3. Agregar nueva asistencia
    attendance.push({
        classId,
        date: today,
        status,
        timestamp: Date.now(),
        previousStatus: previousStatus // Para auditoría
    });

    // 4. Si se marca como licencia, crear entrada especial si no existe
    if (status === 'license') {
        markAsLicense(classId);
    } else if (previousStatus === 'license') {
        // Si se revierte una licencia, eliminar la entrada especial de licencia
        removeSpecialLicense(classId, today);
    }
    
    // Guardar y actualizar
    saveData();
    renderWeekView();
    closeModal();
    
    // Mostrar feedback con información de créditos
    const creditsText = student.licenseCredits > 0 ? ` (${student.licenseCredits} créditos disponibles)` : '';
    showToast(`✅ ${changeDescription}${creditsText}`);
}

function markAttendanceWithDate(classId, status, date) {
    const classData = regularClasses.find(c => c.id === classId);
    
    if (!classData) {
        showToast('Error: Clase no encontrada');
        return;
    }
    
    // Buscar registro de asistencia actual para esa fecha
    const currentRecord = attendance.find(a => a.classId === classId && a.date === date);
    const previousStatus = currentRecord?.status || null;
    
    // Si es el mismo estado, no hacer nada
    if (previousStatus === status) {
        closeModal();
        return;
    }
    
    // Obtener el estudiante para manejar créditos
    const student = students.find(s => s.id === classData.studentId);
    if (!student) {
        showToast('Error: Estudiante no encontrado');
        return;
    }
    
    // LÓGICA DE CRÉDITOS (misma que arriba)
    let creditChange = 0;
    let changeDescription = '';
    
    if (previousStatus === 'license' && status !== 'license') {
        creditChange = -1;
        changeDescription = 'Licencia revertida (-1 crédito)';
    } else if (previousStatus !== 'license' && status === 'license') {
        creditChange = +1;
        changeDescription = 'Licencia agregada (+1 crédito)';
    } else {
        changeDescription = `Cambiado a ${getStatusText(status)}`;
    }
    
    // Validar créditos negativos
    const newCredits = (student.licenseCredits || 0) + creditChange;
    if (newCredits < 0) {
        showToast('❌ No se puede revertir: el estudiante quedaría con créditos negativos');
        return;
    }
    
    // Aplicar cambios
    student.licenseCredits = newCredits;
    
    // Remover asistencia anterior del mismo día
    attendance = attendance.filter(a => !(a.classId === classId && a.date === date));
    
    // Agregar nueva asistencia
    attendance.push({
        classId,
        date,
        status,
        timestamp: Date.now(),
        previousStatus: previousStatus
    });

    // Manejar entradas especiales de licencia
    if (status === 'license') {
        markAsLicenseWithDate(classId, date);
    } else if (previousStatus === 'license') {
        removeSpecialLicense(classId, date);
    }
    
    saveData();
    renderWeekView();
    closeModal();
    
    const creditsText = student.licenseCredits > 0 ? ` (${student.licenseCredits} créditos disponibles)` : '';
    showToast(`✅ ${changeDescription}${creditsText}`);
}

// Función auxiliar para marcar licencia con fecha específica
function markAsLicenseWithDate(classId, date) {
    const regularClass = regularClasses.find(c => c.id === classId);
    if (regularClass) {
        // ✅ ASEGURAR QUE LA FECHA ESTÉ EN FORMATO CORRECTO
        const dateStr = typeof date === 'string' ? date : getLocalDateString(date);
        
        // Verificar si ya existe la entrada especial
        const existingLicense = specialClasses.find(sc => 
            sc.originalClassId === classId && sc.date === dateStr && sc.type === 'license'
        );
        
        if (!existingLicense) {
            // Crear entrada de licencia para la fecha específica
            specialClasses.push({
                id: Date.now() + Math.random(),
                studentId: regularClass.studentId,
                date: dateStr,
                time: regularClass.time,
                type: 'license',
                originalClassId: classId
            });
        }
    }
}

// Función auxiliar para remover licencia especial
function removeSpecialLicense(classId, date) {
    const regularClass = regularClasses.find(c => c.id === classId);
    if (regularClass) {
        // ✅ ASEGURAR QUE LA FECHA ESTÉ EN FORMATO CORRECTO
        const dateStr = typeof date === 'string' ? date : getLocalDateString(date);
        
        // Remover entrada de licencia especial del día específico
        specialClasses = specialClasses.filter(sc => {
            return !(sc.originalClassId === classId && sc.date === dateStr && sc.type === 'license');
        });
    }
}

// ✅ NUEVA FUNCIÓN: Validar y normalizar fechas antes de usar
function normalizeDate(date) {
    if (typeof date === 'string') {
        // Si ya es string, verificar formato
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return date;
        } else {
            // Si no es formato correcto, intentar parsear
            const parsedDate = parseLocalDate(date);
            return getLocalDateString(parsedDate);
        }
    } else if (date instanceof Date) {
        // Si es Date, convertir a string local
        return getLocalDateString(date);
    } else {
        // Si es otra cosa, usar fecha actual
        return getLocalDateString();
    }
}

function markRecoveryAttendance(classId, status, date) {
    // Buscar registro de asistencia actual para esa fecha
    const currentRecord = attendance.find(a => a.classId === classId && a.date === date);
    const previousStatus = currentRecord?.status || null;
    
    // Si es el mismo estado, no hacer nada
    if (previousStatus === status) {
        closeModal();
        return;
    }
    
    // Remover asistencia anterior
    attendance = attendance.filter(a => !(a.classId === classId && a.date === date));
    
    // Agregar nueva asistencia
    attendance.push({
        classId,
        date,
        status,
        timestamp: Date.now(),
        previousStatus: previousStatus
    });

    saveData();
    renderWeekView();
    closeModal();
    
    const changeText = previousStatus ? 
        `Cambiado de ${getStatusText(previousStatus)} a ${getStatusText(status)}` :
        `Marcado como ${getStatusText(status)}`;
    
    // ✅ MEJORADO: Toast con emoji según estado
    let emoji = '✅';
    if (status === 'present') emoji = '✅';
    else if (status === 'absent') emoji = '❌';
    
    showToast(`${emoji} Recuperación: ${changeText}`);
}

// ✅ CORREGIR markAsLicense - usar fecha local consistente
function markAsLicense(classId) {
    const regularClass = regularClasses.find(c => c.id === classId);
    if (!regularClass) return;

    // ✅ USAR FECHA LOCAL CONSISTENTE
    const weekStart = getStartOfWeek(currentWeek);
    const classDate = getClassDateInWeek(regularClass.day, weekStart);
    const dateStr = getLocalDateString(classDate);

    // Verificar si ya existe una licencia especial para esta fecha
    const existingLicense = specialClasses.find(sc => 
        sc.originalClassId === classId && sc.date === dateStr && sc.type === 'license'
    );

    if (!existingLicense) {
        specialClasses.push({
            id: Date.now() + Math.random(),
            studentId: regularClass.studentId,
            date: dateStr,
            time: regularClass.time,
            type: 'license',
            originalClassId: classId
        });
    }

    // Los créditos ya se manejan en markAttendance(), no duplicar aquí
}

// Función para validar cambio de estado antes de aplicar
function validateStatusChange(studentId, fromStatus, toStatus) {
    const student = students.find(s => s.id === studentId);
    if (!student) return { valid: false, message: 'Estudiante no encontrado' };
    
    // Si es el mismo estado, no hacer nada
    if (fromStatus === toStatus) {
        return { valid: false, message: 'Estado no ha cambiado' };
    }
    
    // Validar créditos si se revierte licencia
    if (fromStatus === 'license' && toStatus !== 'license') {
        const currentCredits = student.licenseCredits || 0;
        if (currentCredits <= 0) {
            return { 
                valid: false, 
                message: 'No se puede revertir: el estudiante no tiene créditos suficientes' 
            };
        }
    }
    
    return { valid: true };
}

// Función para obtener información detallada de créditos de un estudiante
function getStudentCreditsInfo(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return null;
    
    const recoveries = specialClasses.filter(sc => 
        sc.studentId === studentId && sc.type === 'recovery'
    );
    
    const licenses = specialClasses.filter(sc => 
        sc.studentId === studentId && sc.type === 'license'
    );
    
    const attendedRecoveries = recoveries.filter(recovery => {
        const attendanceRecord = attendance.find(a => 
            a.classId === recovery.id && a.status === 'present'
        );
        return attendanceRecord;
    });
    
    return {
        availableCredits: student.licenseCredits || 0,
        totalLicenses: licenses.length,
        totalRecoveries: recoveries.length,
        attendedRecoveries: attendedRecoveries.length,
        pendingRecoveries: recoveries.length - attendedRecoveries.length
    };
}

// Función para mostrar información de créditos en el modal
function addCreditsInfoToModal(studentId, modalBody) {
    const creditsInfo = getStudentCreditsInfo(studentId);
    if (!creditsInfo) return;
    
    const creditsHtml = `
        <div class="credits-info">
            <p><strong>💳 Información de créditos:</strong></p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.5rem; font-size: 0.8rem;">
                <div>• Disponibles: <strong>${creditsInfo.availableCredits}</strong></div>
                <div>• Licencias: <strong>${creditsInfo.totalLicenses}</strong></div>
                <div>• Recuperaciones: <strong>${creditsInfo.totalRecoveries}</strong></div>
                <div>• Pendientes: <strong>${creditsInfo.pendingRecoveries}</strong></div>
            </div>
        </div>
    `;
    
    modalBody.insertAdjacentHTML('beforeend', creditsHtml);
}

// Función mejorada para mostrar toast con información de créditos
function showToastWithCredits(message, type = 'success', creditsInfo = null) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    
    // Limpiar clases anteriores
    toast.classList.remove('credits-update', 'credits-error', 'show');
    
    // Agregar clase según tipo
    if (type === 'credits') {
        toast.classList.add('credits-update');
    } else if (type === 'error') {
        toast.classList.add('credits-error');
    }
    
    // Mostrar toast
    toast.classList.add('show');
    
    // Auto-ocultar después de 4 segundos (más tiempo para leer info de créditos)
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Función para debugging y auditoría de cambios de estado
function logAttendanceChange(classId, fromStatus, toStatus, studentId, creditsChange) {
    if (typeof console !== 'undefined' && console.log) {
        const student = students.find(s => s.id === studentId);
        const timestamp = new Date().toLocaleString();
        
        console.log(`📋 [${timestamp}] Cambio de asistencia:`, {
            student: student?.name || 'Desconocido',
            classId: classId,
            from: fromStatus || 'Sin marcar',
            to: toStatus,
            creditsChange: creditsChange,
            newCredits: student?.licenseCredits || 0
        });
    }
}

// Función para mostrar confirmación antes de cambios importantes
function confirmStatusChange(fromStatus, toStatus, studentName, currentCredits) {
    if (fromStatus === 'license' && toStatus !== 'license') {
        const newCredits = currentCredits - 1;
        return confirm(
            `¿Revertir licencia de ${studentName}?\n\n` +
            `• Estado: Licencia → ${getStatusText(toStatus)}\n` +
            `• Créditos: ${currentCredits} → ${newCredits}\n\n` +
            `Confirmar cambio?`
        );
    }
    
    if (fromStatus !== 'license' && toStatus === 'license') {
        const newCredits = currentCredits + 1;
        return confirm(
            `¿Marcar licencia para ${studentName}?\n\n` +
            `• Estado: ${getStatusText(fromStatus) || 'Sin marcar'} → Licencia\n` +
            `• Créditos: ${currentCredits} → ${newCredits}\n\n` +
            `Confirmar cambio?`
        );
    }
    
    return true; // Para cambios entre presente/ausente
}

// Función auxiliar para limpiar estados visuales del calendario
function refreshCalendarVisualStates() {
    // Remover animaciones de cambio de estado
    document.querySelectorAll('.class-block').forEach(block => {
        block.classList.remove('attendance-present', 'attendance-absent', 'attendance-license');
    });
    
    // Forzar re-render después de un pequeño delay
    setTimeout(() => {
        renderWeekView();
    }, 100);
}

function hasAttendance(classData) {
    if (classData.day) {
        // Para clases regulares, calcular fecha correcta
        const weekStart = getStartOfWeek(currentWeek);
        const classDate = getClassDateInWeek(classData.day, weekStart);
        const dateStr = getLocalDateString(classDate);
        return attendance.some(a => a.classId === classData.id && a.date === dateStr);
    } else {
        // Para clases especiales, usar su fecha
        return attendance.some(a => a.classId === classData.id && a.date === classData.date);
    }
}

function getAttendanceStatus(classData, weekDate) {
    if (classData.day) { // Clase regular
        // ✅ USAR FUNCIÓN LOCAL SIN TIMEZONE ISSUES
        const classDate = getClassDateInWeek(classData.day, weekDate);
        const dateStr = getLocalDateString(classDate);
        const attendanceRecord = attendance.find(a => a.classId === classData.id && a.date === dateStr);
        return attendanceRecord?.status || null;
    } else { // Clase especial
        const attendanceRecord = attendance.find(a => a.classId === classData.id && a.date === classData.date);
        return attendanceRecord?.status || null;
    }
}

function openAttendanceMode() {
    attendanceMode = !attendanceMode;
    if (attendanceMode) {
        showToast('Modo asistencia activado. Toca las clases para marcar asistencia.');
    } else {
        showToast('Modo asistencia desactivado');
    }
    renderWeekView();
}

function getStatusText(status) {
    const texts = { present: 'Presente', absent: 'Ausente', license: 'Licencia' };
    return texts[status] || status;
}


