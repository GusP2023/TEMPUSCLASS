// ✅ VARIABLES GLOBALES para manejar cambio de horario
let pendingStudentUpdate = null;
// Variables globales para período
let currentFinanceMonth = new Date().getMonth() + 1;
let currentFinanceYear = new Date().getFullYear();

function initStudents() {
    // Event listeners específicos de estudiantes - verificar que existen
    const instrumentFilter = document.getElementById('instrumentFilter');
    const statusFilter = document.getElementById('statusFilter');

    if (instrumentFilter) {
        instrumentFilter.addEventListener('change', renderStudentsList);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', renderStudentsList);
    }

    // Cualquier otra inicialización específica de estudiantes
    populateTimeSlots();
}

function switchTab(tab, event) {
    // ✅ NUEVO: Resetear filtro de estudiantes al cambiar de sección
    if (tab !== 'students') {
        resetStudentsFilter();
    }

    // Actualizar navegación activa
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Encontrar el nav-item correcto
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const onclick = item.getAttribute('onclick');
        if (onclick && onclick.includes(`'${tab}'`)) {
            item.classList.add('active');
        }
    });

    // Ocultar todas las secciones
    const mainContent = document.querySelector('.main-content');
    const studentsSection = document.getElementById('studentsSection');
    const financeSection = document.getElementById('financeSection');
    const settingsSection = document.getElementById('settingsSection');

    if (mainContent) mainContent.style.display = 'none';
    if (studentsSection) studentsSection.style.display = 'none';
    if (financeSection) financeSection.style.display = 'none';
    if (settingsSection) settingsSection.style.display = 'none';

    // Ocultar headers específicos
    const calendarHeader = document.getElementById('calendarHeader');
    const studentsHeader = document.getElementById('studentsHeader');
    const financeHeader = document.getElementById('financeHeader');
    const settingsHeader = document.getElementById('settingsHeader');

    if (calendarHeader) calendarHeader.style.display = 'none';
    if (studentsHeader) studentsHeader.style.display = 'none';
    if (financeHeader) financeHeader.style.display = 'none';
    if (settingsHeader) settingsHeader.style.display = 'none';
    
    // Obtener elemento header y actualizar clase
    const header = document.querySelector('.header');
    if (header) {
        header.classList.remove('header-calendar', 'header-students', 'header-finance', 'header-settings');
    }
    
    // Mostrar sección y header correspondiente
    switch(tab) {
        case 'calendar':
            if (mainContent) mainContent.style.display = 'block';
            if (header) header.classList.add('header-calendar');
            if (calendarHeader) calendarHeader.style.display = 'block';
            break;
            
        case 'students':
            if (studentsSection) studentsSection.style.display = 'block';
            if (header) header.classList.add('header-students');
            if (studentsHeader) studentsHeader.style.display = 'block';

            // ✅ NUEVO: Asegurar filtro por defecto
            const mainFilter = document.getElementById('studentsMainFilter');
            if (mainFilter && mainFilter.value === '') {
                mainFilter.value = 'active';
            }

            // Configurar funcionalidades específicas de estudiantes ANTES de mostrar
            updateStudentsStats();
            setupStudentsHeaderFilters();

            // Aplicar el filtro inmediatamente para evitar flash de contenido
            if (mainFilter && mainFilter.value === 'active') {
                filterStudentsByActiveStatus();
            } else {
                renderStudentsList();
            }

            // ✅ NUEVO: Configurar header colapsable
            setTimeout(() => {
                setupStudentsScrollHeader();
            }, 100);
            break;
            
        case 'finance':
            if (header) header.classList.add('header-finance');
            if (financeHeader) financeHeader.style.display = 'block';
            showBasicFinanceSection();
            updateFinanceStats();
            break;
            
        case 'settings':
            if (header) header.classList.add('header-settings');
            if (settingsHeader) settingsHeader.style.display = 'block';
            showSettingsSection();
            break;
    }
}

// ✅ Header progresivo SIN saltos - técnica mejorada
function setupStudentsScrollHeader() {
    const studentsSection = document.getElementById('studentsSection');
    const studentsHeader = document.getElementById('studentsHeader');
    
    if (!studentsSection || !studentsHeader) {
        return;
    }
    
    // ✅ Medir altura real de las estadísticas para animación suave
    const statsElement = studentsHeader.querySelector('.students-stats-tabs');
    let statsHeight = 0;
    
    if (statsElement) {
        statsHeight = statsElement.offsetHeight;
        console.log('📏 Altura de stats:', statsHeight);
    }
    
    const maxScrollDistance = 100; // Más distancia para transición más suave
    
    function handleStudentsScroll() {
        const scrollTop = studentsSection.scrollTop;
        
        // ✅ Calcular porcentaje (0 = visible, 1 = oculto)
        const hideProgress = Math.min(scrollTop / maxScrollDistance, 1);
        
        if (scrollTop === 0) {
            // ✅ Resetear al estado original
            studentsHeader.style.transform = 'translateY(0)';
            studentsHeader.style.padding = '1rem';
            
            if (statsElement) {
                statsElement.style.opacity = '1';
                statsElement.style.marginBottom = '1rem';
                statsElement.style.transform = 'scaleX(1) scaleY(1) translateY(0)'; // ✅ Resetear correctamente
            }
            
            const titleElement = studentsHeader.querySelector('.header-students-top h1');
            if (titleElement) {
                titleElement.style.fontSize = '1.5rem';
            }
            
            const creditsBtn = studentsHeader.querySelector('.btn-credits-mobile');
            if (creditsBtn) {
                creditsBtn.style.height = '48px';
                creditsBtn.style.fontSize = '0.9rem';
            }
        } else {
            // ✅ OCULTAR HEADER COMPLETO (no solo mover hacia arriba)
            const headerHeight = studentsHeader.offsetHeight;
            const hideAmount = hideProgress * (headerHeight * 0.1); // Ocultar 40% del header
            
            // Usar margin-top negativo en lugar de transform para ocultar mejor
            studentsHeader.style.marginTop = `-${hideAmount}px`;
            
            // ✅ Reducir padding suavemente
            const minPadding = 0.4;
            const maxPadding = 1;
            const currentPadding = maxPadding - (hideProgress * (maxPadding - minPadding));
            studentsHeader.style.padding = `${currentPadding}rem`;
            // ✅ NUEVO: Reducir margin-bottom del título cuando se oculta
            const headerTop = studentsHeader.querySelector('.header-students-top');
            if (headerTop) {
                const minMargin = 0;
                const maxMargin = 1;
                const currentMargin = maxMargin - (hideProgress * (maxMargin - minMargin));
                headerTop.style.marginBottom = `${currentMargin}rem`;
            }
            
            // ✅ Ocultar estadísticas SIN saltos usando maxHeight y scale
            if (statsElement) {
                const statsProgress = Math.min(hideProgress * 1.5, 1);
                
                // Opacidad suave
                const statsOpacity = Math.max(0, 1 - statsProgress);
                
                // ✅ NUEVO: Usar scaleY en lugar de maxHeight para evitar corte
                const currentScaleY = Math.max(0.1, 1 - statsProgress);
                const currentScaleX = Math.max(0.9, 1 - (statsProgress * 0.1));
                
                // Margin suave
                const currentMargin = Math.max(0, 1 * (1 - statsProgress));
                
                // ✅ NUEVO: Mover hacia arriba mientras se contrae
                const translateY = -(statsProgress * 10);
                
                statsElement.style.opacity = statsOpacity;
                statsElement.style.marginBottom = `${currentMargin}rem`;
                
                // ✅ CAMBIO PRINCIPAL: scaleY en lugar de maxHeight
                statsElement.style.transform = `scaleX(${currentScaleX}) scaleY(${currentScaleY}) translateY(${translateY}px)`;
            }
            
            // ✅ Título más pequeño gradualmente
            const titleElement = studentsHeader.querySelector('.header-students-top h1');
            if (titleElement) {
                const minSize = 1.2;
                const maxSize = 1.5;
                const currentSize = maxSize - (hideProgress * (maxSize - minSize));
                titleElement.style.fontSize = `${currentSize}rem`;
            }
            
            // ✅ Botón más pequeño gradualmente
            const creditsBtn = studentsHeader.querySelector('.btn-credits-mobile');
            if (creditsBtn) {
                const minHeight = 38;
                const maxHeight = 48;
                const currentHeight = maxHeight - (hideProgress * (maxHeight - minHeight));
                
                const minFontSize = 0.75;
                const maxFontSize = 0.9;
                const currentFontSize = maxFontSize - (hideProgress * (maxFontSize - minFontSize));
                
                creditsBtn.style.height = `${currentHeight}px`;
                creditsBtn.style.fontSize = `${currentFontSize}rem`;
            }
        }
    }
    
    studentsSection.addEventListener('scroll', handleStudentsScroll, { 
        passive: true 
    });
    
    console.log('📱 Header progresivo SIN saltos configurado');
}

function scrollToTop() {
    const studentsSection = document.getElementById('studentsSection');
    if (studentsSection) {
        studentsSection.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// Renderizar lista
function renderStudentsList() {
    const container = document.getElementById('studentsList');
    
    // 👥 MEJORADO: Obtener valores de filtro de ambas ubicaciones (header y sección)
    const instrumentFilterSection = document.getElementById('instrumentFilter');
    const statusFilterSection = document.getElementById('statusFilter');
    const instrumentFilterHeader = document.getElementById('headerInstrumentFilter');
    const statusFilterHeader = document.getElementById('headerStatusFilter');
    
    const instrumentFilter = (instrumentFilterSection?.value) || (instrumentFilterHeader?.value) || '';
    const statusFilter = (statusFilterSection?.value) || (statusFilterHeader?.value) || '';
    
    let filteredStudents = students.filter(student => {
        const instrumentMatch = !instrumentFilter || student.instrument === instrumentFilter;

        // ✅ ACTUALIZADO: Manejo simplificado de filtros
        let statusMatch = true;
        if (statusFilter === 'active') {
            statusMatch = student.active !== false;
        } else if (statusFilter === 'inactive') {
            statusMatch = student.active === false;
        }

        return instrumentMatch && statusMatch;
    }).sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

    container.innerHTML = filteredStudents.map(student => {
        // Código existente del mapeo...
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
    
    // 👥 NUEVO: Actualizar estadísticas después del renderizado
    updateStudentsStats();
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
        <button class="btn btn-danger" onclick="openDeleteStudentModal(${studentId})">🗑️ Eliminar</button>
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
    
    // ✅ MANTENER: Generar licencias automáticas para estudiantes individuales
    
    saveData();
    renderStudentsList();
    renderWeekView();
    closeModal();
    updateStudentsStats();
    
    const scheduleText = schedules.map(s => `${getDayName(s.day)} ${s.time}`).join(' y ');
    const startMessage = startDate ? ` (inicia el ${startDate})` : '';
    showToast(`✅ Alumno ${name} inscrito exitosamente con horarios: ${scheduleText}${startMessage}`);
}

function updateExistingStudent(studentId, name, instrument, schedules, startDate = null) {
    const student = students.find(s => s.id === studentId);
    
    // ✅ DETECTAR CAMBIOS EN HORARIOS
    const oldSchedules = student.schedules || [{ day: student.regularDay, time: student.regularTime }];
    const scheduleChanged = JSON.stringify(oldSchedules) !== JSON.stringify(schedules);
    
    if (scheduleChanged) {
        // ✅ GUARDAR datos pendientes y mostrar modal de validación
        pendingStudentUpdate = {
            studentId,
            name,
            instrument,
            oldSchedules,
            newSchedules: schedules,
            startDate
        };
        
        showScheduleChangeModal(student, oldSchedules, schedules);
        return; // No continuar hasta confirmar
    } else {
        // ✅ NO hay cambio de horario, actualizar normalmente
        updateStudentBasicInfo(studentId, name, instrument, schedules, startDate);
    }
}

// ✅ NUEVA: Mostrar modal de cambio de horario
function showScheduleChangeModal(student, oldSchedules, newSchedules) {
    const modal = document.getElementById('scheduleChangeModal');
    const studentNameSpan = document.getElementById('changeStudentName');
    const comparisonDiv = document.getElementById('scheduleComparison');
    const dateInput = document.getElementById('scheduleChangeDate');
    
    // Cerrar modal anterior
    closeModal();
    
    // Configurar modal
    studentNameSpan.textContent = student.name;
    
    // ✅ USAR FECHA LOCAL sin timezone issues
    const today = getLocalDateString();
    dateInput.value = today;
    dateInput.min = today;
    
    // ✅ NUEVO: Buscar asistencias futuras que podrían verse afectadas
    const futureAttendances = findFutureAttendances(student.id, today);
    
    // Mostrar comparación de horarios
    let comparisonHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0;">
            <div>
                <h4 style="color: var(--error); margin-bottom: 0.5rem;">📋 Horario Anterior:</h4>
                <div style="background: rgba(239, 68, 68, 0.1); padding: 0.75rem; border-radius: 6px;">
                    ${oldSchedules.map(s => `
                        <div style="margin-bottom: 0.25rem;">
                            ${getDayName(s.day)} ${s.time}
                        </div>
                    `).join('')}
                </div>
            </div>
            <div>
                <h4 style="color: var(--success); margin-bottom: 0.5rem;">📋 Horario Nuevo:</h4>
                <div style="background: rgba(16, 185, 129, 0.1); padding: 0.75rem; border-radius: 6px;">
                    ${newSchedules.map(s => `
                        <div style="margin-bottom: 0.25rem;">
                            ${getDayName(s.day)} ${s.time}
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        ${futureAttendances.length > 0 ? `
            <div class="context-info warning" style="margin: 1rem 0;">
                <strong>⚠️ Advertencia: Asistencias futuras encontradas</strong>
                <p>Hay ${futureAttendances.length} clases marcadas en fechas futuras que se verán afectadas:</p>
                <div style="max-height: 100px; overflow-y: auto; margin-top: 0.5rem;">
                    ${futureAttendances.map(att => `
                        <div style="font-size: 0.8rem; margin-bottom: 0.25rem;">
                            📅 ${att.date} - ${getStatusText(att.status)}
                        </div>
                    `).join('')}
                </div>
                <p style="font-size: 0.8rem; color: var(--error); margin-top: 0.5rem;">
                    <strong>Recomendación:</strong> Desmarca estas clases antes de cambiar el horario para evitar inconsistencias.
                </p>
            </div>
        ` : ''}
    `;
    
    comparisonDiv.innerHTML = comparisonHTML;
    
    modal.classList.add('active');
}

// ✅ NUEVA: Buscar asistencias futuras del estudiante
function findFutureAttendances(studentId, fromDate) {
    const studentRecoveries = specialClasses.filter(sc => 
        sc.studentId === studentId && sc.type === 'recovery'
    );
    
    // Buscar asistencias de clases regulares futuras (solo las válidas para cada fecha)
    const futureRegularAttendances = attendance.filter(a => {
        if (a.date <= fromDate) return false;
        
        // Verificar si hay una clase regular válida para esta fecha específica
        // Excluir clases temporales y verificar validez por fecha
        return regularClasses.some(rc => {
            if (rc.id !== a.classId || rc.studentId !== studentId || rc.isTemporary) return false;
            
            const validFrom = rc.validFrom || '2024-01-01';
            const validUntil = rc.validUntil || '2099-12-31';
            
            return a.date >= validFrom && a.date <= validUntil;
        });
    });
    
    // Buscar asistencias de recuperaciones futuras
    const futureRecoveryAttendances = attendance.filter(a => {
        if (a.date <= fromDate) return false;
        return studentRecoveries.some(recovery => recovery.id === a.classId);
    });
    
    // Combinar y ordenar por fecha
    const allFutureAttendances = [...futureRegularAttendances, ...futureRecoveryAttendances];
    return allFutureAttendances.sort((a, b) => a.date.localeCompare(b.date));
}

// ✅ NUEVA: Cancelar cambio de horario
function cancelScheduleChange() {
    pendingStudentUpdate = null;
    closeModal();
    showToast('❌ Cambio de horario cancelado');
}

// ✅ CORREGIR confirmScheduleChange - con historial de horarios
function confirmScheduleChange() {
    if (!pendingStudentUpdate) {
        showToast('❌ Error: No hay cambios pendientes');
        return;
    }
    
    const changeDate = document.getElementById('scheduleChangeDate').value;
    if (!changeDate) {
        showToast('❌ Debes seleccionar una fecha');
        return;
    }
    
    const student = students.find(s => s.id === pendingStudentUpdate.studentId);
    
    // ✅ CREAR historial de horarios si no existe
    if (!student.scheduleHistory) {
        student.scheduleHistory = [];
    }
    
    // ✅ GUARDAR horario anterior en el historial
    const previousDay = getPreviousDay(changeDate);
    
    student.scheduleHistory.push({
        schedules: pendingStudentUpdate.oldSchedules,
        effectiveFrom: student.scheduleChangeDate || student.createdAt?.split('T')[0] || '2024-01-01',
        effectiveUntil: previousDay,
        reason: 'Cambio de horario'
    });
    
    // ✅ APLICAR nuevo horario
    student.name = pendingStudentUpdate.name;
    student.instrument = pendingStudentUpdate.instrument;
    student.schedules = pendingStudentUpdate.newSchedules;
    student.scheduleChangeDate = changeDate;
    
    if (pendingStudentUpdate.startDate) {
        student.startDate = pendingStudentUpdate.startDate;
    }
    
    // ✅ ACTUALIZAR clases regulares con fechas de validez
    updateRegularClassesFromDate(student, pendingStudentUpdate.newSchedules, changeDate);
    
    // Limpiar historial problemático si hay demasiadas clases regulares
    const studentClasses = regularClasses.filter(rc => rc.studentId === student.id);
    const currentSchedules = student.schedules ? student.schedules.length : 1;
    const threshold = currentSchedules === 1 ? 2 : (currentSchedules * 3);
    
    if (studentClasses.length > threshold) {
        cleanupStudentScheduleHistory(student, changeDate);
    }
    
    // Limpiar campos antiguos
    delete student.regularDay;
    delete student.regularTime;
    
    // Reset variables
    pendingStudentUpdate = null;
    
    saveData();
    renderStudentsList();
    renderWeekView();
    closeModal();
    
    const scheduleText = student.schedules.map(s => `${getDayName(s.day)} ${s.time}`).join(' y ');
    showToast(`✅ Horario de ${student.name} actualizado desde ${changeDate}. Nuevo horario: ${scheduleText}`);
}

// ✅ NUEVA: Aplicar cambio de horario con fecha
function applyScheduleChange(updateData, effectiveDate) {
    const student = students.find(s => s.id === updateData.studentId);
    
    // ✅ ACTUALIZAR estructura del estudiante con historial de horarios
    if (!student.scheduleHistory) {
        student.scheduleHistory = [];
    }
    
    // ✅ GUARDAR horario anterior con fecha final usando fechas locales
    const previousDay = getPreviousDay(effectiveDate);
    
    student.scheduleHistory.push({
        schedules: updateData.oldSchedules,
        effectiveFrom: student.scheduleChangeDate || student.createdAt?.split('T')[0] || '2024-01-01',
        effectiveUntil: previousDay,
        reason: 'Cambio de horario'
    });
    
    // ✅ APLICAR nuevo horario
    student.name = updateData.name;
    student.instrument = updateData.instrument;
    student.schedules = updateData.newSchedules;
    student.scheduleChangeDate = effectiveDate;
    
    if (updateData.startDate) {
        student.startDate = updateData.startDate;
    }
    
    // ✅ ACTUALIZAR clases regulares desde la fecha efectiva
    updateRegularClassesFromDate(student, updateData.newSchedules, effectiveDate);
    
    // Reset variables
    pendingStudentUpdate = null;
    
    saveData();
    renderStudentsList();
    renderWeekView();
    closeModal();
    
    const scheduleText = updateData.newSchedules.map(s => `${getDayName(s.day)} ${s.time}`).join(' y ');
    showToast(`✅ Horario de ${student.name} actualizado desde ${effectiveDate}. Nuevo horario: ${scheduleText}`);
}

// ✅ NUEVA: Obtener día anterior usando fechas locales
function getPreviousDay(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = createLocalDate(year, month, day);
    date.setDate(date.getDate() - 1);
    return getLocalDateString(date);
}

// ✅ NUEVA: Filtrar clases regulares válidas para una fecha específica
function getValidRegularClassesForDate(studentId, targetDate) {
    const dateStr = typeof targetDate === 'string' ? targetDate : getLocalDateString(targetDate);
    const student = students.find(s => s.id === studentId);
    if (!student) return [];
    
    // Obtener todos los horarios válidos para esta fecha
    const validSchedules = getValidScheduleForDate(student, dateStr);
    
    // Buscar clases regulares válidas para cada horario
    const validClasses = [];
    validSchedules.forEach(schedule => {
        const regularClass = getValidRegularClassForDate(student, schedule.day, schedule.time, dateStr);
        if (regularClass) {
            validClasses.push(regularClass);
        }
    });
    
    return validClasses;
}

// ✅ CORREGIDA: Actualizar clases regulares desde fecha específica
function updateRegularClassesFromDate(student, newSchedules, effectiveDate) {
    // Encontrar TODAS las clases regulares activas del estudiante
    // Una clase está activa si:
    // 1. No tiene validUntil (nunca fue finalizada), O
    // 2. Su validUntil es mayor o igual a la fecha de cambio
    const activeClasses = regularClasses.filter(rc => {
        if (rc.studentId !== student.id) return false;
        
        // Si no tiene validUntil, está activa
        if (!rc.validUntil) return true;
        
        // Si tiene validUntil pero es mayor o igual a la fecha de cambio, también está activa
        return rc.validUntil >= effectiveDate;
    });
    
    // Marcar las clases activas como finalizadas el día anterior al cambio
    const previousDay = getPreviousDay(effectiveDate);
    activeClasses.forEach(rc => {
        rc.validUntil = previousDay;
    });
    
    // Crear nuevas clases regulares para los nuevos horarios
    newSchedules.forEach((schedule, index) => {
        const newRegularClass = {
            id: Date.now() + Math.floor(Math.random() * 10000) + index,
            studentId: student.id,
            day: schedule.day,
            time: schedule.time,
            scheduleIndex: index,
            validFrom: effectiveDate
        };
        
        regularClasses.push(newRegularClass);
    });
    
    // ✅ LIMPIAR asistencias futuras problemáticas
    cleanupFutureAttendances(student, effectiveDate);
}

// ✅ NUEVA: Limpiar asistencias futuras problemáticas
function cleanupFutureAttendances(student, effectiveDate) {
    // Encontrar asistencias futuras del estudiante que apuntan a clases regulares finalizadas
    const problematicAttendances = attendance.filter(a => {
        if (a.date < effectiveDate) return false;
        
        // Buscar si la asistencia apunta a una clase regular del estudiante que ya tiene validUntil
        const referencedClass = regularClasses.find(rc => 
            rc.id === a.classId && rc.studentId === student.id
        );
        
        // Si la clase tiene validUntil y la asistencia es posterior, es problemática
        return referencedClass && referencedClass.validUntil && a.date > referencedClass.validUntil;
    });
    
    // Eliminar estas asistencias problemáticas
    problematicAttendances.forEach(problematicAttendance => {
        const index = attendance.findIndex(a => 
            a.classId === problematicAttendance.classId && 
            a.date === problematicAttendance.date
        );
        
        if (index !== -1) {
            attendance.splice(index, 1);
        }
    });
}

// ✅ NUEVA: Limpiar historial problemático de horarios
function cleanupStudentScheduleHistory(student, newChangeDate) {
    // 1. Eliminar todas las clases regulares duplicadas/problemáticas
    const allStudentClasses = regularClasses.filter(rc => rc.studentId === student.id);
    const classesToRemove = [];
    
    allStudentClasses.forEach(rc => {
        classesToRemove.push(rc);
    });
    
    // Eliminar todas las clases problemáticas
    classesToRemove.forEach(classToRemove => {
        const index = regularClasses.findIndex(rc => rc.id === classToRemove.id);
        if (index !== -1) {
            regularClasses.splice(index, 1);
        }
    });
    
    // 2. Crear clases regulares limpias para los horarios anteriores
    if (student.scheduleHistory && student.scheduleHistory.length > 0) {
        const lastHistoryEntry = student.scheduleHistory[student.scheduleHistory.length - 1];
        
        // Crear clases para el horario anterior
        lastHistoryEntry.schedules.forEach((schedule, index) => {
            const cleanClass = {
                id: Date.now() + Math.floor(Math.random() * 10000) + index + 100,
                studentId: student.id,
                day: schedule.day,
                time: schedule.time,
                scheduleIndex: index,
                validFrom: lastHistoryEntry.effectiveFrom,
                validUntil: lastHistoryEntry.effectiveUntil
            };
            
            regularClasses.push(cleanClass);
        });
    }
}

// ✅ NUEVA: Actualizar info básica sin cambio de horario
function updateStudentBasicInfo(studentId, name, instrument, schedules, startDate) {
    const student = students.find(s => s.id === studentId);
    
    // Solo actualizar campos básicos
    student.name = name;
    student.instrument = instrument;
    if (startDate) student.startDate = startDate;
    
    saveData();
    renderStudentsList();
    renderWeekView();
    closeModal();
    
    showToast(`✅ Información de ${name} actualizada`);
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
    updateStudentsStats(); // 👥 AGREGAR esta línea
    showToast('Alumno desactivado y clases futuras canceladas');
}

function reactivateStudent(studentId) {
    const student = students.find(s => s.id === studentId);
    student.active = true;
    student.deactivatedAt = null;
    saveData();
    renderStudentsList();
    closeModal();
    updateStudentsStats(); 
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
    
}

// Estadísticas mensuales
function getMonthlyAttendance(studentId) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    
    // ✅ ENFOQUE SIMPLE: Obtener TODAS las asistencias del estudiante del mes actual
    // y agrupar por fecha para evitar duplicados
    
    const studentRegularClasses = regularClasses.filter(rc => rc.studentId === studentId);
    const studentRecoveries = specialClasses.filter(sc => 
        sc.studentId === studentId && sc.type === 'recovery'
    );
    
    // Obtener todas las asistencias del mes actual del estudiante
    const monthlyAttendances = attendance.filter(a => {
        const attendanceDate = parseLocalDate(a.date);
        const isCurrentMonth = attendanceDate.getMonth() === currentMonth && 
                              attendanceDate.getFullYear() === currentYear;
        
        if (!isCurrentMonth) return false;
        
        // Verificar si la asistencia pertenece a este estudiante
        const belongsToRegularClass = studentRegularClasses.some(rc => rc.id === a.classId);
        const belongsToRecovery = studentRecoveries.some(recovery => recovery.id === a.classId);
        
        return belongsToRegularClass || belongsToRecovery;
    });
    
    // ✅ AGRUPAR POR FECHA para evitar duplicados
    const attendancesByDate = {};
    monthlyAttendances.forEach(a => {
        // Si ya hay una asistencia para esta fecha, mantener la más reciente o dar prioridad a 'present'
        if (!attendancesByDate[a.date] || 
            (a.status === 'present' && attendancesByDate[a.date].status !== 'present')) {
            attendancesByDate[a.date] = a;
        }
    });
    
    // Ya incluye tanto clases regulares como recuperaciones
    const allAttendance = Object.values(attendancesByDate);
    
    return {
        present: allAttendance.filter(a => a.status === 'present').length,
        absent: allAttendance.filter(a => a.status === 'absent').length,
        licenses: allAttendance.filter(a => a.status === 'license').length
    };
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

// 🎯 GESTIÓN DE CRÉDITOS ACTUALIZADA
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
    
    // Recuperaciones pendientes vs atendidas
    const attendedRecoveries = recoveries.filter(recovery => {
        const attendanceRecord = attendance.find(a => 
            a.classId === recovery.id && a.status === 'present'
        );
        return attendanceRecord;
    });
    
    infoDiv.innerHTML = `
        <p><strong>Estado actual de ${student.name}:</strong></p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.5rem; font-size: 0.8rem;">
            <div>💳 Créditos disponibles: <strong>${currentCredits}</strong></div>
            <div>📋 Total licencias: <strong>${licenses.length}</strong></div>
            <div>🔄 Recuperaciones agendadas: <strong>${recoveries.length}</strong></div>
            <div>✅ Recuperaciones atendidas: <strong>${attendedRecoveries.length}</strong></div>
        </div>
        ${currentCredits < 0 ? `
            <div style="color: var(--error); font-size: 0.8rem; margin-top: 0.5rem;">
                ⚠️ <strong>Créditos negativos:</strong> El estudiante debe ${Math.abs(currentCredits)} crédito${Math.abs(currentCredits) > 1 ? 's' : ''}
            </div>
        ` : ''}
    `;
    infoDiv.style.display = 'block';
}

// // Event listener para el form
// document.addEventListener('DOMContentLoaded', () => {
//     const creditsForm = document.getElementById('creditsForm');
//     if (creditsForm) {
//         creditsForm.addEventListener('submit', (e) => {
//             e.preventDefault();
//             addCreditsToStudent();
//         });
//     }
// });

function removeCreditsFromStudent() {
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
    
    const currentCredits = student.licenseCredits || 0;
    
    // Validar que no queden créditos negativos
    if (currentCredits < amount) {
        showToast(`❌ No se puede quitar ${amount} créditos. El estudiante solo tiene ${currentCredits} créditos disponibles.`);
        return;
    }
    
    // Confirmar operación
    const confirmMessage = `¿Quitar ${amount} crédito${amount > 1 ? 's' : ''} de ${student.name}?\n\nCréditos actuales: ${currentCredits}\nCréditos después: ${currentCredits - amount}`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // Quitar créditos
    const previousCredits = student.licenseCredits;
    student.licenseCredits = currentCredits - amount;
    
    // Crear registro de la operación
    const creditRecord = {
        id: Date.now(),
        studentId: studentId,
        amount: amount,
        operation: 'remove',
        reason: reason || 'Créditos removidos manualmente',
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
        previousCredits: previousCredits,
        newCredits: student.licenseCredits
    };
    
    // Guardar en localStorage para auditoría
    let creditHistory = JSON.parse(localStorage.getItem('creditHistory') || '[]');
    creditHistory.push(creditRecord);
    localStorage.setItem('creditHistory', JSON.stringify(creditHistory));
    
    saveData();
    renderStudentsList();
    closeModal();
    updateStudentsStats(); // 👥 AGREGAR esta línea
    
    showToast(`✅ ${amount} crédito${amount > 1 ? 's' : ''} removido${amount > 1 ? 's' : ''} de ${student.name}. Total: ${student.licenseCredits}`);
}

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
    
    // Crear registro de la operación
    const creditRecord = {
        id: Date.now(),
        studentId: studentId,
        amount: amount,
        operation: 'add',
        reason: reason || 'Créditos agregados manualmente',
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
        previousCredits: previousCredits,
        newCredits: student.licenseCredits
    };
    
    // Guardar en localStorage para auditoría
    let creditHistory = JSON.parse(localStorage.getItem('creditHistory') || '[]');
    creditHistory.push(creditRecord);
    localStorage.setItem('creditHistory', JSON.stringify(creditHistory));
    
    saveData();
    renderStudentsList();
    closeModal();
    updateStudentsStats(); // 👥 AGREGAR esta línea
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
        
        // ✅ CAMBIO: Botón eliminar visible solo cuando hay más de 1
        const removeBtn = row.querySelector('.btn-remove-student');
        if (removeBtn) {
            if (rowNumber <= 1) {
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

// Agregar validación mínima en collectAllStudentsData()
function collectAllStudentsData() {
    const rows = document.querySelectorAll('.student-row');
    const studentsData = [];
    
    rows.forEach(row => {
        const data = extractRowData(row);
        
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

function openMultipleStudentsFromSection() {
    const modal = document.getElementById('multipleStudentsModal');
    if (modal) {
        modal.classList.add('active');
        initializeMultipleStudentsForm();
    } else {
        showToast('❌ Modal de múltiples estudiantes no encontrado');
    }
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
                        <button class="btn btn-primary" onclick="openMultipleStudentsFromSection()" style="flex: 1; min-width: 150px;">
                            👥 Múltiples Estudiantes
                        </button>
                    </div>
                </div>
                
                <div class="student-card" style="border: 1px solid var(--error); background: rgba(239, 68, 68, 0.05);margin-top: 0.5rem;">
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
}   

function updateSettingsStats() {
    const settingsSection = document.getElementById('settingsSection');
    if (!settingsSection) return;
    
    // Actualizar estadísticas dinámicamente
    const statsHTML = settingsSection.innerHTML
        .replace(/Total: <strong>\d+<\/strong>/, `Total: <strong>${students.length}</strong>`)
        .replace(/Activos: <strong>\d+<\/strong>/, `Activos: <strong>${students.filter(s => s.active).length}</strong>`)
        .replace(/Créditos totales: <strong>\d+<\/strong>/, `Créditos totales: <strong>${students.reduce((sum, s) => sum + (s.licenseCredits || 0), 0)}</strong>`)
        .replace(/Regulares: <strong>\d+<\/strong>/, `Regulares: <strong>${regularClasses.filter(rc => !rc.validUntil).length}</strong>`)
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

function showBasicFinanceSection() {
    let financeSection = document.getElementById('financeSection');
    
    if (!financeSection) {
        financeSection = document.createElement('div');
        financeSection.id = 'financeSection';
        financeSection.className = 'students-section';
        document.body.appendChild(financeSection);
    }
    
    const tariff = parseFloat(localStorage.getItem('classTariff')) || 0;
    
    if (tariff === 0) {
        // Vista sin configurar
        financeSection.innerHTML = `
            <div class="finance-container">
                <div class="finance-card">
                    <div class="not-configured">
                        <div class="finance-icon">💰</div>
                        <h3>Configura tu tarifa</h3>
                        <p>Define cuánto cobras por clase para ver tus ingresos automáticamente</p>
                        <button class="btn-config-main" onclick="openTariffConfig()">⚙️ Configurar Tarifa</button>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Vista configurada
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const monthlyStats = calculateDetailedMonthlyStats(currentMonth, currentYear, tariff);
        
        financeSection.innerHTML = `
            <div class="finance-container">
                <!-- Selector de Período -->
                <div class="finance-card">
                    <div class="card-header">📅 Período</div>
                    <div class="period-selector">
                        <button onclick="changeFinancePeriod(-1)">‹</button>
                        <span class="current-period" id="financePeriodDisplay">${getMonthName(currentMonth)} ${currentYear}</span>
                        <button onclick="changeFinancePeriod(1)">›</button>
                    </div>
                </div>

                <!-- Resumen del Mes -->
                <div class="finance-card">
                    <div class="card-header">📊 Resumen</div>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <div class="summary-number">$${monthlyStats.total.toLocaleString()}</div>
                            <div class="summary-label">Total</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-number">${monthlyStats.totalClasses}</div>
                            <div class="summary-label">Clases</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-number">${monthlyStats.regularClasses}</div>
                            <div class="summary-label">Regulares</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-number">${monthlyStats.recoveryClasses}</div>
                            <div class="summary-label">Recuperaciones</div>
                        </div>
                    </div>
                </div>

                <!-- Detalle por Estudiante -->
                <div class="finance-card">
                    <div class="card-header">📋 Detalle por Estudiante</div>
                    <div class="classes-list" id="studentsDetailList">
                        ${generateStudentsDetail(monthlyStats.studentDetails, tariff)}
                    </div>
                </div>
            </div>
        `;
    }
    
    financeSection.style.display = 'block';
}


// ✅ updateStudentsStats NUEVA para el header móvil
function updateStudentsStats() {
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.active !== false).length;
    const totalCredits = students.reduce((sum, s) => sum + (s.licenseCredits || 0), 0);
    
    // Actualizar contador de activos
    const activeElement = document.getElementById('activeStudentsCount');
    if (activeElement) {
        activeElement.textContent = activeStudents;
    }
    
    // Actualizar contador de créditos
    const creditsElement = document.getElementById('totalCreditsCount');
    if (creditsElement) {
        creditsElement.textContent = totalCredits;
    }
    
    console.log(`📊 Stats updated: ${activeStudents} activos, ${totalCredits} créditos`);
}

// ✅ setupStudentsHeaderFilters NUEVA para el filtro combinado
function setupStudentsHeaderFilters() {
    const mainFilter = document.getElementById('studentsMainFilter');
    
    if (mainFilter) {
        // Remover listeners anteriores
        mainFilter.removeEventListener('change', handleMainFilterChange);
        mainFilter.addEventListener('change', handleMainFilterChange);
    }
    
    // Configurar clicks en tabs de estadísticas
    const activeTab = document.getElementById('activeStudentsTab');
    const creditsTab = document.getElementById('creditsTab');
    
    if (activeTab) {
        activeTab.addEventListener('click', () => {
            setActiveTab('active');
            filterStudentsByActiveStatus();
        });
    }
    
    if (creditsTab) {
        creditsTab.addEventListener('click', () => {
            setActiveTab('credits');
            filterStudentsByCredits();
        });
    }
}

// ✅ NUEVA: Manejar cambio en filtro principal
// ✅ ACTUALIZAR filtros para incluir scroll al top
function handleMainFilterChange() {
    const mainFilter = document.getElementById('studentsMainFilter');
    const filterValue = mainFilter.value;
    
    // Resetear tabs activos
    resetActiveTabs();
    
    // Scroll al top al cambiar filtro
    scrollToTop();
    
    // Aplicar filtro (código existente)
    switch(filterValue) {
        case 'active':
            filterStudentsByActiveStatus();
            break;
        case 'inactive':
            filterStudentsByInactiveStatus();
            break;
        default:
            renderStudentsList();
    }
}

// ✅ NUEVA: Filtrar estudiantes por estado activo
function filterStudentsByActiveStatus() {
    const activeStudents = students.filter(s => s.active !== false);
    renderFilteredStudents(activeStudents);
}

// ✅ NUEVA: Filtrar estudiantes inactivos
function filterStudentsByInactiveStatus() {
    const inactiveStudents = students.filter(s => s.active === false);
    renderFilteredStudents(inactiveStudents);
}

// ✅ NUEVA: Filtrar estudiantes con créditos (para el tab de créditos)
function filterStudentsByCredits() {
    const studentsWithCredits = students.filter(s => (s.licenseCredits || 0) > 0);
    renderFilteredStudents(studentsWithCredits);
}

// ✅ NUEVA: Renderizar lista filtrada
function renderFilteredStudents(filteredStudents) {
    const container = document.getElementById('studentsList');
    if (!container) return;
    
    if (filteredStudents.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-light);">
                <p>No se encontraron estudiantes con este filtro</p>
            </div>
        `;
        return;
    }

    // ✅ FIX: Ordenamiento case-insensitive aquí también
    const sortedStudents = filteredStudents.sort((a, b) => 
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );
    
    // Usar la misma lógica de renderStudentsList pero con estudiantes filtrados
    container.innerHTML = filteredStudents.map(student => {
        let scheduleText = '';
        
        if (student.schedules && student.schedules.length > 0) {
            scheduleText = student.schedules
                .map(s => `${getDayName(s.day)} ${s.time}`)
                .join(' • ');
        } else {
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

// ✅ NUEVA: Establecer tab activo
function setActiveTab(tabType) {
    const activeTab = document.getElementById('activeStudentsTab');
    const creditsTab = document.getElementById('creditsTab');
    
    if (activeTab && creditsTab) {
        activeTab.classList.remove('active');
        creditsTab.classList.remove('active');
        
        if (tabType === 'active') {
            activeTab.classList.add('active');
        } else if (tabType === 'credits') {
            creditsTab.classList.add('active');
        }
    }
}

// ✅ NUEVA: Resetear tabs activos
function resetActiveTabs() {
    const activeTab = document.getElementById('activeStudentsTab');
    const creditsTab = document.getElementById('creditsTab');

    if (activeTab) activeTab.classList.remove('active');
    if (creditsTab) creditsTab.classList.remove('active');
}

// ===== FUNCIONES DE ELIMINACIÓN DE ALUMNOS =====

let currentStudentToDelete = null;

function openDeleteStudentModal(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    currentStudentToDelete = student;

    // Cerrar modal actual y abrir modal de eliminación
    closeModal();

    const modal = document.getElementById('deleteStudentModal');
    const studentNameSpan = document.getElementById('deleteStudentName');
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    studentNameSpan.textContent = student.name;

    // Reset modal state
    confirmBtn.disabled = true;
    document.getElementById('deleteConfirmationName').value = '';

    // Agregar event listener para validar confirmación
    const confirmationInput = document.getElementById('deleteConfirmationName');
    confirmationInput.addEventListener('input', validateDeleteConfirmation);

    modal.classList.add('active');
}

function validateDeleteConfirmation() {
    const confirmationInput = document.getElementById('deleteConfirmationName');
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    if (currentStudentToDelete && confirmationInput.value.trim() === currentStudentToDelete.name) {
        confirmBtn.disabled = false;
    } else {
        confirmBtn.disabled = true;
    }
}

function confirmDeleteStudent() {
    if (!currentStudentToDelete) return;

    // Solo eliminación completa
    hardDeleteStudent(currentStudentToDelete.id);
}

function hardDeleteStudent(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const studentName = student.name;

    // Eliminar todas las asistencias del alumno
    attendance = attendance.filter(att => att.studentId !== studentId);

    // Eliminar todas las clases regulares del alumno
    regularClasses = regularClasses.filter(rc => rc.studentId !== studentId);

    // Eliminar todas las clases especiales (recuperaciones) del alumno
    specialClasses = specialClasses.filter(sc => sc.studentId !== studentId);

    // Eliminar el alumno del array
    const studentIndex = students.findIndex(s => s.id === studentId);
    if (studentIndex !== -1) {
        students.splice(studentIndex, 1);
    }

    // Guardar cambios
    saveData();

    // Actualizar interfaz
    renderStudentsList();
    updateStudentsStats();

    // Actualizar calendario si existe la función
    if (typeof renderWeekView === 'function') {
        renderWeekView();
    }

    // Cerrar modal y mostrar mensaje
    closeModal();
    showToast(`${studentName} y todos sus datos han sido eliminados completamente.`, 'success');

    currentStudentToDelete = null;
}

// ✅ NUEVA: Resetear filtro de estudiantes
function resetStudentsFilter() {
    const mainFilter = document.getElementById('studentsMainFilter');
    if (mainFilter) {
        mainFilter.value = 'active'; // Por defecto Solo activos
        // Aplicar el filtro inmediatamente
        filterStudentsByActiveStatus();
    }
}

// Finance Functions
function updateFinanceStats() {
    const tariff = parseFloat(localStorage.getItem('classTariff')) || 0;
    
    if (tariff === 0) {
        document.getElementById('monthlyIncome').textContent = '--';
        document.getElementById('currentFinancePeriod').textContent = '⚙️ Configurar tarifa';
        return;
    }
    
    const monthlyClasses = calculateMonthlyClasses(currentFinanceMonth, currentFinanceYear);
    const monthlyIncome = monthlyClasses * tariff;
    
    document.getElementById('monthlyIncome').textContent = `$${monthlyIncome.toLocaleString()}`;
    document.getElementById('currentFinancePeriod').textContent = getMonthName(currentFinanceMonth) + ' ' + currentFinanceYear;
}

function calculateMonthlyClasses(month, year) {
    // Contar clases con asistencia marcada (presente/ausente) del mes actual
    return attendance.filter(a => {
        const attendanceDate = parseLocalDate(a.date);
        return attendanceDate.getMonth() + 1 === month && 
               attendanceDate.getFullYear() === year &&
               (a.status === 'present' || a.status === 'absent');
    }).length;
}

function getMonthName(month) {
    const months = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[month];
}

function toggleFinanceMenu() {
    const dropdown = document.getElementById('financeDropdown');
    dropdown.classList.toggle('show');
}

function openTariffConfig() {
    const currentTariff = localStorage.getItem('classTariff') || '';
    const newTariff = prompt('Ingresa tu tarifa por clase:', currentTariff);
    
    if (newTariff !== null && !isNaN(newTariff) && newTariff > 0) {
        localStorage.setItem('classTariff', newTariff);
        updateFinanceStats();
        showToast(`💰 Tarifa configurada: $${newTariff} por clase`);
    }
}

// Cerrar dropdown al hacer click fuera
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('show'));
    }
});

function calculateDetailedMonthlyStats(month, year, tariff) {
    const monthlyAttendances = attendance.filter(a => {
        const attendanceDate = parseLocalDate(a.date);
        return attendanceDate.getMonth() + 1 === month && 
               attendanceDate.getFullYear() === year &&
               (a.status === 'present' || a.status === 'absent');
    });

    const studentStats = {};
    let regularCount = 0;
    let recoveryCount = 0;

    monthlyAttendances.forEach(a => {
        // Determinar si es clase regular o recuperación
        const isRecovery = specialClasses.some(sc => 
            sc.id === a.classId && sc.type === 'recovery'
        );
        
        if (isRecovery) {
            recoveryCount++;
        } else {
            regularCount++;
        }

        // Obtener ID del estudiante
        let studentId;
        if (isRecovery) {
            const recovery = specialClasses.find(sc => sc.id === a.classId);
            studentId = recovery.studentId;
        } else {
            const regularClass = regularClasses.find(rc => rc.id === a.classId);
            studentId = regularClass?.studentId;
        }

        if (studentId) {
            if (!studentStats[studentId]) {
                const student = students.find(s => s.id === studentId);
                studentStats[studentId] = {
                    name: student?.name || 'Desconocido',
                    classes: 0,
                    amount: 0
                };
            }
            studentStats[studentId].classes++;
            studentStats[studentId].amount += tariff;
        }
    });

    const totalClasses = monthlyAttendances.length;
    const total = totalClasses * tariff;

    return {
        total,
        totalClasses,
        regularClasses: regularCount,
        recoveryClasses: recoveryCount,
        studentDetails: Object.values(studentStats).sort((a, b) => b.amount - a.amount)
    };
}

function generateStudentsDetail(studentDetails, tariff) {
    if (studentDetails.length === 0) {
        return `
            <div style="text-align: center; padding: 2rem; color: #64748b;">
                <p>No hay clases registradas para este período</p>
            </div>
        `;
    }

    return studentDetails.map(student => `
        <div class="class-item">
            <span class="class-student">${student.name} (${student.classes} clases)</span>
            <span class="class-amount">$${student.amount.toLocaleString()}</span>
        </div>
    `).join('');
}

function changeFinancePeriod(direction) {
    currentFinanceMonth += direction;
    
    if (currentFinanceMonth > 12) {
        currentFinanceMonth = 1;
        currentFinanceYear++;
    } else if (currentFinanceMonth < 1) {
        currentFinanceMonth = 12;
        currentFinanceYear--;
    }
    
    // Actualizar display
    document.getElementById('financePeriodDisplay').textContent = 
        `${getMonthName(currentFinanceMonth)} ${currentFinanceYear}`;
    
    // Actualizar stats
    const tariff = parseFloat(localStorage.getItem('classTariff')) || 0;
    const monthlyStats = calculateDetailedMonthlyStats(currentFinanceMonth, currentFinanceYear, tariff);
    
    // Actualizar resumen
    const summaryNumbers = document.querySelectorAll('.summary-number');
    summaryNumbers[0].textContent = `$${monthlyStats.total.toLocaleString()}`;
    summaryNumbers[1].textContent = monthlyStats.totalClasses;
    summaryNumbers[2].textContent = monthlyStats.regularClasses;
    summaryNumbers[3].textContent = monthlyStats.recoveryClasses;
    
    // Actualizar detalle de estudiantes
    document.getElementById('studentsDetailList').innerHTML = 
        generateStudentsDetail(monthlyStats.studentDetails, tariff);
}