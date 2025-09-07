function initCalendar() {
    renderWeekView();
    // Cualquier otra inicialización específica del calendario
    setupCalendarNavigation();

    // Agregar clase inicial de carga
    setTimeout(() => {
        document.getElementById('scheduleGrid')?.classList.add('initial-load');
    }, 100);
}

function setupCalendarNavigation() {
    initCalendarNavigation();
    initKeyboardNavigation();
    
    // Actualizar indicadores cada vez que se renderiza
    const originalRenderWeekView = renderWeekView;
    renderWeekView = function() {
        // Llamar función original
        originalRenderWeekView();
        
        // Actualizar indicadores de navegación
        updateWeekIndicators();
        
        // Mostrar hints de swipe en primera carga
        if (!localStorage.getItem('swipeHintsShown')) {
            setTimeout(showSwipeHints, 1000);
        }
    };
}

// Inicializar navegación táctil del calendario
function initCalendarNavigation() {
    const scheduleContainer = document.querySelector('.schedule-container');
    const header = document.querySelector('.header');
    
    // Touch events para swipe
    scheduleContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    scheduleContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // También en el header para mejor UX
    header.addEventListener('touchstart', handleTouchStart, { passive: true });
    header.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Mejorar botones de navegación existentes
    enhanceNavigationButtons();
    
    // Agregar indicador de navegación
    addNavigationIndicator();
}

// Navegación por teclado (para testing en desktop)
function initKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                navigateWeek(-1, 'keyboard');
                break;
            case 'ArrowRight':
                e.preventDefault();
                navigateWeek(1, 'keyboard');
                break;
        }
    });
}

function handleTouchStart(e) {
    if (isNavigating) return;
    touchStartX = e.changedTouches[0].screenX;
}

function handleTouchEnd(e) {
    if (isNavigating) return;
    
    touchEndX = e.changedTouches[0].screenX;
    const touchDifference = touchStartX - touchEndX;
    const minSwipeDistance = 50; // Mínimo 50px para activar swipe
    
    // Swipe hacia la izquierda (semana siguiente)
    if (touchDifference > minSwipeDistance) {
        navigateWeek(1, 'swipe-left');
    }
    // Swipe hacia la derecha (semana anterior)
    else if (touchDifference < -minSwipeDistance) {
        navigateWeek(-1, 'swipe-right');
    }
}

function navigateWeek(direction, animationType = 'default') {
    if (isNavigating) return;
    
    isNavigating = true;
    
    // Feedback visual inmediato
    showNavigationFeedback(direction, animationType);
    
    // Actualizar semana
    currentWeek.setDate(currentWeek.getDate() + (direction * 7));
    
    // Renderizar con transición
    renderWeekViewWithTransition(direction, animationType);
    
    // Reset navegación después de animación
    setTimeout(() => {
        isNavigating = false;
    }, 400);
}

function showNavigationFeedback(direction, animationType) {
    const indicator = document.querySelector('.navigation-indicator');
    
    if (indicator) {
        indicator.className = 'navigation-indicator active';
        indicator.classList.add(direction > 0 ? 'next' : 'prev');
        indicator.textContent = direction > 0 ? '▶' : '◀';
        
        setTimeout(() => {
            indicator.classList.remove('active', 'next', 'prev');
        }, 300);
    }
    
    // Vibración táctil si está disponible
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

function enhanceNavigationButtons() {
    const prevButton = document.querySelector('.week-nav button:first-child');
    const nextButton = document.querySelector('.week-nav button:last-child');
    
    if (prevButton && nextButton) {
        // Reemplazar onclick con nueva función
        prevButton.onclick = () => navigateWeek(-1, 'button-prev');
        nextButton.onclick = () => navigateWeek(1, 'button-next');
        
        // Agregar clases para estilos mejorados
        prevButton.classList.add('nav-btn', 'nav-btn-prev');
        nextButton.classList.add('nav-btn', 'nav-btn-next');
        
        // Mejorar iconos
        prevButton.innerHTML = '<span class="nav-icon">◀</span>';
        nextButton.innerHTML = '<span class="nav-icon">▶</span>';
    }
}

function addNavigationIndicator() {
    const header = document.querySelector('.header');
    
    // Agregar indicador de navegación
    const indicator = document.createElement('div');
    indicator.className = 'navigation-indicator';
    header.appendChild(indicator);
    
    // Agregar instrucciones de swipe (solo primera vez)
    if (!localStorage.getItem('swipeInstructionShown')) {
        setTimeout(() => {
            showSwipeInstruction();
            localStorage.setItem('swipeInstructionShown', 'true');
        }, 2000);
    }
}

function showSwipeInstruction() {
    const toast = document.getElementById('toast');
    toast.textContent = '👆 Desliza izquierda/derecha para cambiar semana';
    toast.classList.add('show', 'instruction-toast');
    
    setTimeout(() => {
        toast.classList.remove('show', 'instruction-toast');
    }, 4000);
}

// Autonavegación a la semana actual
function goToCurrentWeek() {
    if (isNavigating) return;
    
    const today = new Date();
    const currentWeekStart = getStartOfWeek(today);
    const displayedWeekStart = getStartOfWeek(currentWeek);
    
    if (currentWeekStart.getTime() !== displayedWeekStart.getTime()) {
        currentWeek = new Date(today);
        renderWeekViewWithTransition(0, 'reset');
        showToast('📅 Volviendo a la semana actual');
    }
}

// Detectar si estamos en la semana actual
function isCurrentWeek() {
    const today = new Date();
    const currentWeekStart = getStartOfWeek(today);
    const displayedWeekStart = getStartOfWeek(currentWeek);
    
    return currentWeekStart.getTime() === displayedWeekStart.getTime();
}

// Función para actualizar indicadores visuales
function updateWeekIndicators() {
    const currentWeekSpan = document.getElementById('currentWeek');
    
    // Agregar indicador si no estamos en semana actual
    if (!isCurrentWeek()) {
        currentWeekSpan.classList.add('not-current-week');
        
        // Agregar botón para volver a semana actual si no existe
        if (!document.querySelector('.back-to-current')) {
            const backButton = document.createElement('button');
            backButton.className = 'back-to-current';
            backButton.innerHTML = '📅 Hoy';
            backButton.onclick = goToCurrentWeek;
            document.querySelector('.week-nav').appendChild(backButton);
        }
    } else {
        currentWeekSpan.classList.remove('not-current-week');
        
        // Remover botón si existe
        const backButton = document.querySelector('.back-to-current');
        if (backButton) {
            backButton.remove();
        }
    }
}

function renderWeekView() {
    const startOfWeek = getStartOfWeek(currentWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 5); // Solo hasta viernes

    const weekText = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
    document.getElementById('currentWeek').textContent = weekText;

    // Actualizar días (sin domingo)
    for (let i = 0; i < 6; i++) {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        const dayNum = i + 1;
        document.getElementById(`day${dayNum}`).textContent = date.getDate();
        
        const header = document.querySelector(`.week-day-header[data-day="${dayNum}"]`);
        if (isToday(date)) {
            header.classList.add('today');
        } else {
            header.classList.remove('today');
        }
    }

    renderScheduleGrid(startOfWeek);
}

function renderWeekViewWithTransition(direction, animationType) {
    const scheduleGrid = document.getElementById('scheduleGrid');
    const header = document.querySelector('.header');
    
    // Agregar clase de transición
    scheduleGrid.classList.add('transitioning', `transition-${animationType}`);
    header.classList.add('header-transitioning');
    
    // Actualizar contenido
    setTimeout(() => {
        renderWeekView();
        
        // Remover clases de transición
        setTimeout(() => {
            scheduleGrid.classList.remove('transitioning', `transition-${animationType}`);
            header.classList.remove('header-transitioning');
        }, 50);
    }, 150);
}

function renderScheduleGrid(startOfWeek) {
    const grid = document.getElementById('scheduleGrid');
    grid.innerHTML = '';
    
    const morningSlots = ['08:30', '09:15', '10:00', '10:45', '11:30'];
    const afternoonSlots = ['14:30', '15:15', '16:00', '16:45', '17:30', '18:15', '19:00'];
    
    const currentSlots = hideMorning ? afternoonSlots : [...morningSlots, ...afternoonSlots];

    currentSlots.forEach((time, index) => {
        // Separadores de mañana/tarde
        if (!hideMorning && index === 5) {
            const separator = document.createElement('div');
            separator.className = 'time-separator';
            separator.textContent = '▲ Ocultar mañana';
            separator.style.gridColumn = '1 / -1';
            separator.onclick = toggleMorningView;
            grid.appendChild(separator);
        }
        
        if (hideMorning && index === 0) {
            const separator = document.createElement('div');
            separator.className = 'time-separator';
            separator.textContent = '▼ Mostrar mañana';
            separator.style.gridColumn = '1 / -1';
            separator.onclick = toggleMorningView;
            grid.appendChild(separator);
        }

        // Slots para días L-S
        for (let i = 0; i < 6; i++) {
            const date = new Date(startOfWeek);
            date.setDate(date.getDate() + i);
            const dayNum = i + 1;
            
            const slot = document.createElement('div');
            slot.className = 'slot';
            
            // PRIORIDAD 1: Recuperaciones (tienen prioridad sobre todo)
            const specialClasses = findSpecialClass(date, time);
            const recovery = specialClasses?.type === 'recovery' ? specialClasses : null;
            const license = specialClasses?.type === 'license' ? specialClasses : null;
            
            if (recovery) {
                // Si hay recuperación, mostrarla con prioridad
                renderClass(slot, recovery, 'special');
            } 
            // PRIORIDAD 2: Clases regulares (si no hay recuperación)
            else {
                const regularClass = findRegularClass(dayNum, time);
                if (regularClass && !license) {
                    // Mostrar clase regular solo si no hay licencia
                    renderClass(slot, regularClass, 'regular');
                } 
                // PRIORIDAD 3: Licencias (si no hay recuperación ni clase regular)
                else if (license) {
                    renderClass(slot, license, 'special');
                } 
                // PRIORIDAD 4: Slot vacío
                else {
                    slot.classList.add('empty');
                    slot.textContent = time;
                    slot.onclick = () => {
                        const slotDate = new Date(startOfWeek);
                        slotDate.setDate(slotDate.getDate() + i);
                        handleSlotClick(slotDate, time, dayNum);
                    };
                }
            }

            grid.appendChild(slot);
        }
    });
}

function changeWeek(direction) {
    navigateWeek(direction, 'button');
}

function findRegularClass(day, time) {
    const weekStartDate = getStartOfWeek(currentWeek);
    const classDate = getClassDateInWeek(day, weekStartDate);
    
    // Si hay cualquier special class, no mostrar clase regular
    const specialClass = findSpecialClass(classDate, time);
    if (specialClass) {
        return null;
    }
    
    // ✅ BUSCAR ESTUDIANTE CON MÚLTIPLES HORARIOS
    const student = students.find(s => {
        if (!s.active || !isStudentActiveOnDate(s, classDate)) return false;
        
        // Verificar nuevo formato (schedules)
        if (s.schedules && s.schedules.length > 0) {
            return s.schedules.some(schedule => 
                schedule.day === day && schedule.time === time
            );
        }
        
        // Compatibilidad con formato antiguo
        return s.regularDay === day && s.regularTime === time;
    });
    
    if (student) {
        // ✅ ENCONTRAR O CREAR CLASE REGULAR PARA ESTE HORARIO ESPECÍFICO
        let regularClass = regularClasses.find(rc => 
            rc.studentId === student.id && 
            rc.day === day && 
            rc.time === time
        );
        
        if (!regularClass) {
            // Determinar scheduleIndex basado en el horario encontrado
            let scheduleIndex = 0;
            if (student.schedules && student.schedules.length > 0) {
                const matchingSchedule = student.schedules.findIndex(s => 
                    s.day === day && s.time === time
                );
                scheduleIndex = matchingSchedule >= 0 ? matchingSchedule : 0;
            }
            
            regularClass = {
                id: Date.now() + Math.random(),
                studentId: student.id,
                day: day,
                time: time,
                scheduleIndex: scheduleIndex
            };
            regularClasses.push(regularClass);
            saveData();
        }
        
        return { 
            ...regularClass,
            studentName: student.name
        };
    }
    
    return null;
}

function findSpecialClass(date, time) {
    const dateStr = getLocalDateString(date); 
    const specials = specialClasses.filter(c => c.date === dateStr && c.time === time);
    
    if (specials.length === 0) return null;
    
    // Buscar recuperación primero (tiene prioridad visual)
    const recovery = specials.find(c => c.type === 'recovery');
    if (recovery) {
        const student = students.find(s => s.id === recovery.studentId);
        return { ...recovery, studentName: student?.name || 'Desconocido' };
    }
    
    // Si no hay recuperación, retornar licencia
    const license = specials.find(c => c.type === 'license');
    if (license) {
        const student = students.find(s => s.id === license.studentId);
        return { ...license, studentName: student?.name || 'Desconocido' };
    }
    
    return null;
}

// ✅ NUEVA FUNCIÓN AUXILIAR para obtener todos los horarios de un estudiante
function getStudentSchedules(student) {
    // Nuevo formato
    if (student.schedules && student.schedules.length > 0) {
        return student.schedules;
    }
    
    // Compatibilidad con formato antiguo
    if (student.regularDay && student.regularTime) {
        return [{
            day: student.regularDay,
            time: student.regularTime,
            active: true
        }];
    }
    
    return [];
}

// Función renderClass modificada para cambiar comportamiento de licencias
function renderClass(slot, classData, type) {
    const block = document.createElement('div');
    block.className = 'class-block';

    if (type === 'special') {
        block.classList.add(classData.type);
    } else {
        block.classList.add('regular');
        
        const attendanceStatus = getAttendanceStatus(classData, getStartOfWeek(currentWeek));
        if (attendanceStatus) {
            block.classList.add(`attendance-${attendanceStatus}`);
        }
    }

    if (attendanceMode && !hasAttendance(classData)) {
        block.classList.add('attendance-pending');
    }

    block.innerHTML = `
        <div class="class-name">${classData.studentName}</div>
        ${type === 'special' ? `<div class="class-type">${classData.type === 'recovery' ? 'Recuperación' : 'Licencia'}</div>` : ''}
    `;

    // Click para recuperaciones - mostrar detalles y asistencia
    if (type === 'special' && classData.type === 'recovery') {
        block.onclick = (e) => {
            e.stopPropagation();
            showClassDetails(classData, type);
        };
        block.style.cursor = 'pointer';
    }
    // 🔧 CAMBIO PRINCIPAL: Click para licencias - mostrar detalles primero
    else if (type === 'special' && classData.type === 'license') {
        block.onclick = (e) => {
            e.stopPropagation();
            showClassDetails(classData, type); // ✅ Mostrar detalles primero
        };
        
        block.style.cursor = 'pointer';
        block.title = 'Click para ver detalles de la licencia';
    } 
    // Click para clases regulares
    else {
        block.onclick = (e) => {
            e.stopPropagation();
            showClassDetails(classData, type);
        };
    }

    slot.appendChild(block);
}

function handleSlotClick(date, time, day) {
    const studentsWithCredits = students.filter(s => s.licenseCredits > 0);
    
    if (studentsWithCredits.length === 0) {
        showToast('No hay alumnos con créditos de recuperación disponibles');
        return;
    }

    openRecoveryModal(date, time, studentsWithCredits);
}

function findAllConflictsAt(date, time) {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();
    
    const conflicts = {
        recoveries: [],
        regularClasses: [],
        licenses: []
    };
    
    // Buscar recuperaciones
    const recoveries = specialClasses.filter(sc => 
        sc.type === 'recovery' && 
        sc.date === dateStr && 
        sc.time === time
    );
    
    recoveries.forEach(recovery => {
        const student = students.find(s => s.id === recovery.studentId);
        if (student) {
            conflicts.recoveries.push({
                ...recovery,
                studentName: student.name,
                studentId: recovery.studentId
            });
        }
    });
    
    // Buscar licencias
    const licenses = specialClasses.filter(sc => 
        sc.type === 'license' && 
        sc.date === dateStr && 
        sc.time === time
    );
    
    const studentsWithLicense = new Set();
    licenses.forEach(license => {
        const student = students.find(s => s.id === license.studentId);
        if (student) {
            studentsWithLicense.add(license.studentId);
            conflicts.licenses.push({
                ...license,
                studentName: student.name,
                studentId: license.studentId
            });
        }
    });
    
    // Buscar clases regulares SOLO si NO tienen licencia
    if (dayOfWeek !== 0) {
        const systemDay = dayOfWeek;
        
        const regularStudents = students.filter(s => 
            s.regularDay === systemDay && 
            s.regularTime === time &&
            isStudentActiveOnDate(s, dateObj) &&
            !studentsWithLicense.has(s.id) // NO incluir si ya tiene licencia
        );
        
        regularStudents.forEach(student => {
            const regularClass = regularClasses.find(rc => rc.studentId === student.id);
            if (regularClass) {
                conflicts.regularClasses.push({
                    ...regularClass,
                    studentName: student.name,
                    studentId: student.id
                });
            }
        });
    }
    
    return conflicts;
}

function isSlotAvailable(day, time, isRecovery) {
    const hour = parseInt(time.split(':')[0]);
    const minutes = parseInt(time.split(':')[1]);
    const timeValue = hour * 60 + minutes;

    // Domingo no disponible
    if (day === 0) return false;

    // Horario mañana (L-S)
    if (timeValue >= 8*60+30 && timeValue < 12*60+15) {
        if (day >= 1 && day <= 6) {
            if (isRecovery && day === 6 && timeValue >= 12*60+15) {
                return timeValue < 13*60; // Sábado recuperación hasta 1pm
            }
            return true;
        }
    }

    // Horario tarde
    if (timeValue >= 14*60+30) {
        // Sábado tarde solo recuperación hasta 1pm (ya manejado arriba)
        if (day === 6) return false;
        
        // Viernes
        if (day === 5) {
            if (isRecovery) {
                return timeValue < 19*60+45;
            } else {
                return timeValue < 17*60+30;
            }
        }
        
        // Lunes a Jueves
        if (day >= 1 && day <= 4) {
            return timeValue < 19*60+45;
        }
    }

    return false;
}



// ✅ MODIFICAR función existente openRecoveryModal para mostrar mejor info de horarios
function openRecoveryModal(date, time, eligibleStudents) {
    const modal = document.getElementById('recoveryModal');
    const select = document.getElementById('recoveryStudent');
    const dateTimeInput = document.getElementById('recoveryDateTime');

    const dateStr = date.toISOString().split('T')[0];
    dateTimeInput.value = `${formatDate(date)} - ${time}`;
    dateTimeInput.dataset.date = dateStr;
    dateTimeInput.dataset.time = time;
    
    // LIMPIAR MENSAJES ANTERIORES
    const modalContent = modal.querySelector('.modal-content');
    const existingInfo = modalContent.querySelector('.conflict-info');
    if (existingInfo) existingInfo.remove();

    // Verificar conflictos
    const conflicts = findAllConflictsAt(date, time);

    // Si hay recuperaciones, mostrar opción de eliminar
    if (conflicts.recoveries.length > 0) {
        const conflictInfo = document.createElement('div');
        conflictInfo.style.cssText = 'background: rgba(239, 68, 68, 0.1); padding: 0.75rem; border-radius: 8px; margin: 1rem 0; font-size: 0.875rem;';
        conflictInfo.innerHTML = `
            <p><strong>⚠ Ya hay recuperaciones en este horario:</strong></p>
            ${conflicts.recoveries.map(r => `
                <div style="display: flex; justify-content: space-between; align-items: center; margin: 0.5rem 0;">
                    <span>• ${r.studentName}</span>
                    <button onclick="deleteRecovery(${r.id}); closeModal();" style="background: #ef4444; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer;">
                        Eliminar
                    </button>
                </div>
            `).join('')}
        `;
        conflictInfo.className = 'conflict-info';
        modalContent.insertBefore(conflictInfo, modalContent.lastElementChild);
        
        select.disabled = true;
        document.querySelector('#recoveryForm button[type="submit"]').disabled = true;
    } else {
        select.disabled = false;
        document.querySelector('#recoveryForm button[type="submit"]').disabled = false;
        
        const allConflicts = [
            ...conflicts.licenses.map(l => ({ 
                name: l.studentName, 
                type: l.autoGenerated ? 'Licencia automática' : 'Licencia' 
            })),
            ...conflicts.regularClasses.map(r => ({ name: r.studentName, type: 'Clase regular' }))
        ];
        
        if (allConflicts.length > 0) {
            const conflictInfo = document.createElement('div');
            conflictInfo.style.cssText = 'background: rgba(245, 158, 11, 0.1); padding: 0.75rem; border-radius: 8px; margin: 1rem 0; font-size: 0.875rem;';
            conflictInfo.innerHTML = `
                <p><strong>ℹ️ Este horario también tiene:</strong></p>
                ${allConflicts.map(c => `<p>• ${c.name} (${c.type})</p>`).join('')}
                <p><small>La recuperación tendrá prioridad visual</small></p>
            `;
            conflictInfo.className = 'conflict-info';
            modalContent.insertBefore(conflictInfo, modalContent.lastElementChild);
        }
    }

    // ✅ POBLAR SELECT CON INFORMACIÓN DE MÚLTIPLES HORARIOS
    select.innerHTML = '<option value="">Seleccionar alumno...</option>';
    eligibleStudents.forEach(student => {
        const schedules = getStudentSchedules(student);
        const scheduleText = schedules.length > 1 ? 
            ` (${schedules.length} horarios)` : '';
        
        select.innerHTML += `<option value="${student.id}">${student.name}${scheduleText} (${student.licenseCredits} créditos)</option>`;
    });

    modal.classList.add('active');
}

function saveRecoveryClass() {
    const studentId = parseInt(document.getElementById('recoveryStudent').value);
    const dateTimeInput = document.getElementById('recoveryDateTime');
    const date = dateTimeInput.dataset.date;
    const time = dateTimeInput.dataset.time;

    if (!studentId) return;

    // Crear clase de recuperación
    specialClasses.push({
        id: Date.now(),
        studentId,
        date,
        time,
        type: 'recovery'
    });

    // Reducir créditos del estudiante
    const student = students.find(s => s.id === studentId);
    if (student) {
        student.licenseCredits--;
    }

    saveData();
    renderWeekView();
    closeModal();
    showToast('Clase de recuperación agendada');
}

function showClassDetails(classData, type) {
    const modal = document.getElementById('classModal');
    const modalBody = document.getElementById('modalBody');
    const modalFooter = document.getElementById('modalFooter');

    // Limpiar modal anterior
    modalBody.innerHTML = '';
    modalFooter.innerHTML = '';

    if (type === 'regular') {
        const weekStart = getStartOfWeek(currentWeek);
        const classDate = new Date(weekStart);
        classDate.setDate(classDate.getDate() + ((classData.day + 6) % 7));
        const dateStr = classDate.toISOString().split('T')[0];
        
        const attendanceRecord = attendance.find(a => a.classId === classData.id && a.date === dateStr);
        const currentStatus = attendanceRecord?.status || null;
        
        const conflicts = findAllConflictsAt(classDate, classData.time);
        const conflictingRecoveries = conflicts.recoveries.filter(r => r.studentId !== classData.studentId);
        
        // Información básica
        modalBody.innerHTML = `
            <p><strong>Alumno:</strong> ${classData.studentName}</p>
            <p><strong>Horario:</strong> ${getDayName(classData.day)} ${classData.time}</p>
            <p><strong>Fecha:</strong> ${dateStr}</p>
            
            ${currentStatus ? `
                <div class="context-info" style="background: ${getStatusColor(currentStatus)}; color: white;">
                    <strong>📋 Estado actual: ${getStatusText(currentStatus)}</strong>
                    ${attendanceRecord?.previousStatus ? `<br><small>Anterior: ${getStatusText(attendanceRecord.previousStatus)}</small>` : ''}
                </div>
            ` : `
                <div class="context-info no-students">
                    <strong>📋 Sin marcar</strong>
                </div>
            `}
            
            ${conflictingRecoveries.length > 0 ? `
                <div class="context-info conflict">
                    <strong>Conflicto detectado:</strong>
                    ${conflictingRecoveries.map(recovery => 
                        `<p>Recuperación de <strong>${recovery.studentName}</strong> en mismo horario</p>`
                    ).join('')}
                    <p><small>La recuperación tiene prioridad visual en calendario</small></p>
                </div>
            ` : ''}
            
            <div class="attendance-buttons">
                <button class="btn ${currentStatus === 'present' ? 'btn-present active-status' : 'btn-present'}" 
                        onclick="markAttendanceWithDate(${classData.id}, 'present', '${dateStr}')"
                        ${currentStatus === 'present' ? 'style="opacity: 1; font-weight: 600;"' : ''}>
                    ${currentStatus === 'present' ? '✓ ' : ''}Presente
                </button>
                <button class="btn ${currentStatus === 'absent' ? 'btn-absent active-status' : 'btn-absent'}" 
                        onclick="markAttendanceWithDate(${classData.id}, 'absent', '${dateStr}')"
                        ${currentStatus === 'absent' ? 'style="opacity: 1; font-weight: 600;"' : ''}>
                    ${currentStatus === 'absent' ? '✓ ' : ''}Ausente
                </button>
                <button class="btn ${currentStatus === 'license' ? 'btn-license active-status' : 'btn-license'}" 
                        onclick="markAttendanceWithDate(${classData.id}, 'license', '${dateStr}')"
                        ${currentStatus === 'license' ? 'style="opacity: 1; font-weight: 600;"' : ''}>
                    ${currentStatus === 'license' ? '✓ ' : ''}Licencia
                </button>
            </div>
            
            ${currentStatus === 'license' ? `
                <div class="context-info can-schedule">
                    <strong>Revertir licencia:</strong> Click en "Presente" o "Ausente" para cambiar el estado y ajustar créditos automáticamente
                </div>
            ` : ''}
        `;
        
        // Footer simple para clases regulares
        modalFooter.innerHTML = `<button type="button" class="btn btn-secondary" onclick="closeModal()">Cerrar</button>`;
        
    } else if (type === 'special' && classData.type === 'recovery') {
        const attendanceRecord = attendance.find(a => 
            a.classId === classData.id && a.date === classData.date
        );
        const currentStatus = attendanceRecord?.status || null;
        
        const conflicts = findAllConflictsAt(classData.date, classData.time);
        const otherConflicts = [
            ...conflicts.regularClasses.filter(r => r.studentId !== classData.studentId),
            ...conflicts.licenses.filter(l => l.studentId !== classData.studentId)
        ];
        
        modalBody.innerHTML = `
            <p><strong>Alumno:</strong> ${classData.studentName}</p>
            <p><strong>Fecha:</strong> ${classData.date}</p>
            <p><strong>Hora:</strong> ${classData.time}</p>
            <p><strong>Tipo:</strong> Recuperación</p>
            
            ${currentStatus ? `
                <div class="context-info" style="background: ${getStatusColor(currentStatus)}; color: white;">
                    <strong>📋 Estado: ${getStatusText(currentStatus)}</strong>
                    ${attendanceRecord?.previousStatus ? `<br><small>Anterior: ${getStatusText(attendanceRecord.previousStatus)}</small></p>` : ''}
                </div>
            ` : `
                <div class="context-info no-students">
                    <strong>📋 Pendiente</strong>
                </div>
            `}
            
            ${otherConflicts.length > 0 ? `
                <div class="context-info warning">
                    <strong>Este horario también tiene:</strong>
                    ${otherConflicts.map(item => {
                        const isLicense = conflicts.licenses.some(l => l.studentId === item.studentId);
                        const type = isLicense ? 
                            (item.autoGenerated ? 'Licencia automática' : 'Licencia') : 
                            'Clase regular';
                        return `<p>• ${item.studentName} (${type})</p>`;
                    }).join('')}
                </div>
            ` : ''}
            
            <div class="attendance-buttons">
                <button class="btn ${currentStatus === 'present' ? 'btn-present active-status' : 'btn-present'}" 
                        onclick="markRecoveryAttendance(${classData.id}, 'present', '${classData.date}')"
                        ${currentStatus === 'present' ? 'style="opacity: 1; font-weight: 600;"' : ''}>
                    ${currentStatus === 'present' ? '✓ ' : ''}Presente
                </button>
                <button class="btn ${currentStatus === 'absent' ? 'btn-absent active-status' : 'btn-absent'}" 
                        onclick="markRecoveryAttendance(${classData.id}, 'absent', '${classData.date}')"
                        ${currentStatus === 'absent' ? 'style="opacity: 1; font-weight: 600;"' : ''}>
                    ${currentStatus === 'absent' ? '✓ ' : ''}Ausente
                </button>
            </div>
        `;
        
        modalFooter.innerHTML = `
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cerrar</button>
            <button type="button" class="btn" style="background: #ef4444; color: white;" onclick="deleteRecovery(${classData.id})">🗑️ Eliminar</button>
        `;
        
    } else if (type === 'special' && classData.type === 'license') {
        // 🔧 SECCIÓN DE LICENCIAS CON NUEVA LÓGICA
        const conflicts = findAllConflictsAt(classData.date, classData.time);
        const conflictingRecoveries = conflicts.recoveries.filter(r => r.studentId !== classData.studentId);
        const conflictingRegulars = conflicts.regularClasses.filter(r => r.studentId !== classData.studentId);
        
        // Verificar si hay estudiantes con créditos para mostrar opción de agendar
        const studentsWithCredits = students.filter(s => s.licenseCredits > 0);
        const canScheduleRecovery = studentsWithCredits.length > 0 && conflictingRecoveries.length === 0;
        
        modalBody.innerHTML = `
            <p><strong>Alumno:</strong> ${classData.studentName}</p>
            <p><strong>Fecha:</strong> ${classData.date}</p>
            <p><strong>Hora:</strong> ${classData.time}</p>
            <p><strong>Tipo:</strong> ${classData.autoGenerated ? `Licencia automática (${classData.reason || 'Inscripción tardía'})` : 'Licencia manual'}</p>
            
            ${conflictingRecoveries.length > 0 ? `
                <div class="context-info conflict">
                    <strong>Recuperación ya programada:</strong>
                    ${conflictingRecoveries.map(recovery => 
                        `<p><strong>${recovery.studentName}</strong> tiene recuperación en este horario</p>`
                    ).join('')}
                </div>
            ` : ''}
            
            ${conflictingRegulars.length > 0 ? `
                <div class="context-info warning">
                    <strong>Clase regular en este horario:</strong>
                    ${conflictingRegulars.map(regular => 
                        `<p><strong>${regular.studentName}</strong> tiene clase regular programada</p>`
                    ).join('')}
                </div>
            ` : ''}

            <!-- ✅ NUEVA SECCIÓN: Botones para revertir licencia -->
            <div class="context-info can-schedule">
                <strong>🔄 Revertir licencia:</strong>
                <p>¿Te equivocaste al marcar licencia? Puedes cambiarla a presente o ausente.</p>
            </div>
            
            <div class="attendance-buttons">
                <button class="btn btn-present" onclick="revertLicenseToStatus('${classData.id}', 'present', '${classData.date}')">
                    ✓ Marcar Presente
                </button>
                <button class="btn btn-absent" onclick="revertLicenseToStatus('${classData.id}', 'absent', '${classData.date}')">
                    ✓ Marcar Ausente
                </button>
            </div>
            
            
        `;
        
        // Footer con botón de agendar si es posible
        modalFooter.innerHTML = `
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cerrar</button>
            ${canScheduleRecovery ? `
                <button type="button" class="btn btn-primary schedule-recovery" onclick="scheduleRecoveryFromLicense('${classData.date}', '${classData.time}')">
                    🕒 Agendar Recuperación
                </button>
            ` : ''}
        `;
    }

    modal.classList.add('active');
}

// Nueva función para agendar recuperación desde modal de licencia
function scheduleRecoveryFromLicense(date, time) {
    const studentsWithCredits = students.filter(s => s.licenseCredits > 0);
    
    if (studentsWithCredits.length === 0) {
        showToast('No hay estudiantes con créditos disponibles');
        return;
    }
    
    // Añadir clase de cierre para transición suave
    const currentModal = document.getElementById('classModal');
    currentModal.classList.add('closing');
    
    // Cerrar modal actual después de animación
    setTimeout(() => {
        closeModal();
        currentModal.classList.remove('closing');
        
        // Convertir string date a objeto Date
        const dateObj = new Date(date + 'T00:00:00');
        
        // Abrir modal de agendar recuperación
        openRecoveryModal(dateObj, time, studentsWithCredits);
    }, 200);
}

// Función auxiliar para obtener color según estado
function getStatusColor(status) {
    const colors = {
        'present': '#10b981',
        'absent': '#ef4444', 
        'license': '#06b6d4'
    };
    return colors[status] || '#64748b';
}

function detectMorningClasses() {
    const morningTimes = ['08:30', '09:15', '10:00', '10:45', '11:30'];
    return regularClasses.some(cls => 
        cls.day >= 1 && cls.day <= 5 && morningTimes.includes(cls.time)
    ) || specialClasses.some(cls => {
        const date = new Date(cls.date);
        const day = date.getDay();
        return day >= 1 && day <= 5 && morningTimes.includes(cls.time);
    });
}

function getDynamicTimeSlots() {
    const afternoonSlots = ['14:30', '15:15', '16:00', '16:45', '17:30', '18:15', '19:00'];
    const morningSlots = ['08:30', '09:15', '10:00', '10:45', '11:30'];
    
    if (showMorning || detectMorningClasses()) {
        return [...morningSlots, ...afternoonSlots];
    }
    return afternoonSlots;
}

function toggleMorning() {
    showMorning = !showMorning;
    updateToggleStates();
    renderWeekView();
}

function toggleSaturday() {
    showSaturday = !showSaturday;
    updateToggleStates();
    renderWeekView();
}

function updateToggleStates() {
    const morningBtn = document.getElementById('morningToggle');
    const saturdayBtn = document.getElementById('saturdayToggle');
    
    if (showMorning || detectMorningClasses()) {
        morningBtn.classList.add('active');
    } else {
        morningBtn.classList.remove('active');
    }
    
    if (showSaturday) {
        saturdayBtn.classList.add('active');
    } else {
        saturdayBtn.classList.remove('active');
    }
}

// Nueva función para revertir licencias
function revertLicenseToStatus(licenseId, newStatus, date) {
    // Buscar la licencia
    const license = specialClasses.find(sc => sc.id == licenseId);
    if (!license || license.type !== 'license') {
        showToast('❌ Error: Licencia no encontrada');
        return;
    }
    
    // Buscar si existe clase regular para este alumno en este horario
    const student = students.find(s => s.id === license.studentId);
    if (!student) {
        showToast('❌ Error: Estudiante no encontrado');
        return;
    }
    
    // ✅ BUSCAR CLASE REGULAR ESPECÍFICA PARA ESTE HORARIO
    let regularClass = regularClasses.find(rc => 
        rc.studentId === license.studentId &&
        rc.time === license.time &&
        rc.day === getSystemDayFromLicenseDate(date, license.time)
    );
    
    // Si no existe, crear clase regular para este horario específico
    if (!regularClass) {
        const targetDay = getSystemDayFromLicenseDate(date, license.time);
        
        // Verificar que el estudiante tenga este horario en sus schedules
        const studentSchedules = getStudentSchedules(student);
        const matchingSchedule = studentSchedules.find(s => 
            s.day === targetDay && s.time === license.time
        );
        
        if (!matchingSchedule) {
            showToast('❌ Error: El estudiante no tiene clase regular en este horario');
            return;
        }
        
        const scheduleIndex = studentSchedules.findIndex(s => 
            s.day === targetDay && s.time === license.time
        );
        
        regularClass = {
            id: Date.now() + Math.random(),
            studentId: license.studentId,
            day: targetDay,
            time: license.time,
            scheduleIndex: scheduleIndex >= 0 ? scheduleIndex : 0
        };
        regularClasses.push(regularClass);
    }
    
    // Usar la función existente para marcar asistencia
    markAttendanceWithDate(regularClass.id, newStatus, date);
}

// ✅ FUNCIÓN CORREGIDA sin problemas de timezone
function getSystemDayFromLicenseDate(dateStr, time) {
    // Parsear fecha manualmente para evitar problemas de timezone
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0); // Asegurar hora local
    
    const dayOfWeek = date.getDay(); // 0=Dom, 1=Lun, etc.
    return dayOfWeek === 0 ? null : dayOfWeek; // No manejamos domingo
}