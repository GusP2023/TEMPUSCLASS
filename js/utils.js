// Nueva función helper para verificar si alumno está activo en fecha específica
function isStudentActiveOnDate(student, targetDate) {
    // Parsear fechas correctamente sin timezone
    const checkDate = new Date(targetDate);
    checkDate.setHours(0, 0, 0, 0);
    
    // Verificar fecha de inicio
    if (student.startDate) {
        const [year, month, day] = student.startDate.split('-').map(Number);
        const startDate = new Date(year, month - 1, day);
        startDate.setHours(0, 0, 0, 0);
        
        // Si la clase es ANTES de la fecha de inicio, NO está activo
        if (checkDate < startDate) {
            return false;
        }
    }
    
    // Verificar si está activo globalmente
    if (!student.active) {
        // Verificar fecha de desactivación
        if (student.deactivatedAt) {
            const [year, month, day] = student.deactivatedAt.split('-').map(Number);
            const deactivationDate = new Date(year, month - 1, day);
            deactivationDate.setHours(0, 0, 0, 0);
            
            return checkDate < deactivationDate;
        }
        return false;
    }
    
    return true;
}

function showSwipeHints() {
    const header = document.querySelector('.header');
    
    // Solo mostrar hints si no se han visto antes
    if (!localStorage.getItem('swipeHintsShown')) {
        const leftHint = document.createElement('div');
        leftHint.className = 'swipe-hint left';
        leftHint.innerHTML = '👈';
        
        const rightHint = document.createElement('div');
        rightHint.className = 'swipe-hint right';
        rightHint.innerHTML = '👉';
        
        header.style.position = 'relative';
        header.appendChild(leftHint);
        header.appendChild(rightHint);
        
        // Mostrar hints por 3 segundos
        setTimeout(() => {
            leftHint.style.opacity = '0.6';
            rightHint.style.opacity = '0.6';
        }, 500);
        
        // Ocultar hints después de 5 segundos
        setTimeout(() => {
            leftHint.remove();
            rightHint.remove();
            localStorage.setItem('swipeHintsShown', 'true');
        }, 5000);
    }
}

// Función helper para obtener fecha de una clase en semana específica
function getClassDateInWeek(day, weekStartDate) {
    const classDate = new Date(weekStartDate);
    classDate.setDate(classDate.getDate() + (day - 1));
    classDate.setHours(0, 0, 0, 0); // Agregar esta línea
    return classDate;
}

function validateLicenseBalance(studentId) {
    const student = students.find(s => s.id === studentId);
    const studentRecoveries = specialClasses.filter(c => 
        c.studentId === studentId && c.type === 'recovery'
    );
    const studentLicenses = specialClasses.filter(c => 
        c.studentId === studentId && c.type === 'license'
    );
    
    return {
        credits: student?.licenseCredits || 0,
        recoveries: studentRecoveries.length,
        licenses: studentLicenses.length,
        isBalanced: (studentLicenses.length + (student?.licenseCredits || 0)) >= studentRecoveries.length
    };
}

function showLicenseWarning(studentId) {
    const balance = validateLicenseBalance(studentId);
    if (!balance.isBalanced) {
        showToast(`⚠️ Alumno tiene ${balance.recoveries} recuperaciones pero solo ${balance.licenses} licencias. Revisa y elimina recuperaciones incorrectas.`);
    }
}

// Migrar datos existentes
function migrateStudentData() {
    students.forEach(student => {
        if (student.day && !student.regularDay) {
            student.regularDay = student.day;
            student.regularTime = student.time;
            delete student.day;
            delete student.time;
        }
    });
    
    regularClasses.forEach(rc => {
        const student = students.find(s => s.id === rc.studentId);
        if (student && !student.regularDay) {
            student.regularDay = rc.day;
            student.regularTime = rc.time;
        }
    });
}

// DEBUG: Función para verificar conflictos
function debugConflicts(date, time) {
    console.log('=== DEBUG CONFLICTOS ===');
    console.log('Fecha:', date, 'Hora:', time);
    
    const recoveries = specialClasses.filter(sc => 
        sc.type === 'recovery' && 
        sc.date === date && 
        sc.time === time
    );
    console.log('Recuperaciones:', recoveries);
    
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();
    const systemDay = getSystemDayFromDateDay(dayOfWeek);
    
    const regulars = students.filter(s => 
        s.regularTime === time && 
        s.regularDay === systemDay &&
        isStudentActiveOnDate(s, dateObj)
    );
    console.log('Clases regulares:', regulars);
}

function debugAllConflicts() {
    console.log('=== DEBUG TODOS LOS CONFLICTOS ===');
    
    // Verificar todas las fechas con recuperaciones
    const recoveryDates = [...new Set(specialClasses
        .filter(sc => sc.type === 'recovery')
        .map(sc => sc.date))];
    
    recoveryDates.forEach(date => {
        const dayConflicts = findAllConflictsAt(date, '16:00'); // ejemplo
        console.log(`${date}:`, dayConflicts);
    });
}

// NUEVA: Función debug específica para un caso
function debugSpecificConflict(dateStr, time) {
    console.log('=== DEBUG CASO ESPECÍFICO ===');
    console.log(`Fecha: ${dateStr}, Hora: ${time}`);
    
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();
    console.log(`Día de la semana: ${dayOfWeek} (0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb)`);
    
    console.log('\n--- TODOS LOS ESTUDIANTES ---');
    students.forEach(s => {
        console.log(`${s.name}: regularDay=${s.regularDay}, regularTime=${s.regularTime}, active=${s.active}, startDate=${s.startDate}, deactivatedAt=${s.deactivatedAt}`);
        console.log(`  ¿Activo en ${dateStr}? ${isStudentActiveOnDate(s, dateObj)}`);
    });
    
    console.log('\n--- RECUPERACIONES EN ESTA FECHA/HORA ---');
    const recoveries = specialClasses.filter(sc => 
        sc.type === 'recovery' && sc.date === dateStr && sc.time === time
    );
    console.log(recoveries);
    
    console.log('\n--- LICENCIAS EN ESTA FECHA/HORA ---');
    const licenses = specialClasses.filter(sc => 
        sc.type === 'license' && sc.date === dateStr && sc.time === time
    );
    console.log(licenses);
    
    return findAllConflictsAt(dateStr, time);
}

function debugStudentData() {
    console.log('=== DEBUG STUDENT DATA ===');
    console.log('Students:', students.length);
    console.log('Regular Classes:', regularClasses.length);
    
    students.forEach(s => {
        const rc = regularClasses.find(rc => rc.studentId === s.id);
        console.log(`${s.name}: Student(${s.regularDay}, ${s.regularTime}) | Class(${rc?.day}, ${rc?.time}) | Active: ${s.active}`);
    });
}

// HELPER: Convertir día del sistema (1-6) a día de Date (0-6)
function getDateDayFromSystemDay(systemDay) {
    // Sistema: 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
    // Date: 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
    return systemDay === 6 ? 6 : systemDay;
}

// HELPER: Convertir día de Date (0-6) a día del sistema (1-6)
function getSystemDayFromDateDay(dateDay) {
    // Date: 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
    // Sistema: 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
    return dateDay === 0 ? null : dateDay; // No manejamos domingo
}