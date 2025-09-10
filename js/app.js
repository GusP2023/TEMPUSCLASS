// Estado de la aplicación
let currentWeek = new Date();
let students = [];
let regularClasses = [];
let specialClasses = []; // Recuperaciones y licencias
let attendance = [];
let attendanceMode = false;
let showMorning = false;
let showSaturday = false;
let hideMorning = false;
let currentEditingStudent = null;

// Variables globales para navegación
let touchStartX = 0;
let touchEndX = 0;
let isNavigating = false;
let navigationTimeout = null;

// Configuración de horarios
const schedule = {
    morning: {
        start: '08:30',
        end: '12:15',
        days: [1,2,3,4,5,6] // L-S
    },
    afternoon: {
        regularEnd: {
            default: '19:45', // L-J
            friday: '17:30',  // V
            saturday: null    // S no hay tarde regular
        },
        recoveryEnd: {
            friday: '19:45',   // V recuperación
            saturday: '13:00'  // S recuperación
        },
        start: '14:30',
        days: [1,2,3,4,5] // L-V
    }
};

// Generar slots de tiempo
const timeSlots = [
    '08:30', '09:15', '10:00', '10:45', '11:30',
    '14:30', '15:15', '16:00', '16:45', '17:30', '18:15', '19:00'
];

// FUNCIONES ***********************************************************************************

// Inicialización principal
document.addEventListener('DOMContentLoaded', () => {
    initApp();        // Cargar datos, configurar estado global
    initCalendar();   // Función que estará en calendar.js
    initStudents();   // Función que estará en students.js
    setupEventListeners(); // Event listeners generales (modales, etc.)
});

function initApp() {
    // Cargar datos del localStorage
    students = JSON.parse(localStorage.getItem('students') || '[]');
    regularClasses = JSON.parse(localStorage.getItem('regularClasses') || '[]');
    specialClasses = JSON.parse(localStorage.getItem('specialClasses') || '[]');
    attendance = JSON.parse(localStorage.getItem('attendance') || '[]');

    // ✅ NUEVA: Detectar primera vez después de cargar datos
    setTimeout(() => {
        if (detectFirstTime()) {
            // Si es primera vez, el modal se muestra automáticamente
            console.log('🎵 Primera vez detectada - Mostrando modal de bienvenida');
        } else {
            // Si no es primera vez, proceder normalmente
            console.log('📚 Datos existentes cargados');
        }
    }, 500);
}

function saveData() {
    localStorage.setItem('students', JSON.stringify(students));
    localStorage.setItem('regularClasses', JSON.stringify(regularClasses));
    localStorage.setItem('specialClasses', JSON.stringify(specialClasses));
    localStorage.setItem('attendance', JSON.stringify(attendance));
}

function detectFirstTime() {
    const hasData = students.length > 0 || 
                   regularClasses.length > 0 || 
                   specialClasses.length > 0 ||
                   localStorage.getItem('appInitialized');
    
    if (!hasData) {
        showFirstTimeModal();
        return true;
    }
    return false;
}

function setupEventListeners() {
    // Recovery form - verificar que existe
    const recoveryForm = document.getElementById('recoveryForm');
    if (recoveryForm) {
        recoveryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveRecoveryClass();
        });
    }

    // Student form - verificar que existe
    const studentForm = document.getElementById('studentForm');
    if (studentForm) {
        studentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveStudent();
        });
    }

    setupScheduleValidation();

    // ✅ CORREGIDO: Event listeners para import/export solo si existen
    const exportButton = document.getElementById('exportDataBtn');
    if (exportButton) {
        exportButton.addEventListener('click', exportToCSV);
    }

    // ✅ NUEVO: Event listener para form de importación
    const importForm = document.getElementById('importForm');
    if (importForm) {
        importForm.addEventListener('submit', (e) => {
            e.preventDefault();
            importCSVData();
        });
    }

    // ✅ NUEVO: Event listener para form de créditos
    const creditsForm = document.getElementById('creditsForm');
    if (creditsForm) {
        creditsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addCreditsToStudent();
        });
    }

    // Cerrar modales al hacer click fuera (mantener)
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            // ✅ MODIFICADO: No cerrar modal de primera vez
            if (modal.id === 'firstTimeModal') {
                return; // No permitir cerrar modal de primera vez
            }
            
            if (e.target === modal) {
                closeModal();
            }
        });
    });
}

// ✅ NUEVA: Función para configurar validación de horarios de forma segura
function setupScheduleValidation() {
    // Esta función se puede llamar desde otros archivos cuando sea necesario
    // Por ahora está vacía, se puede implementar validación específica aquí
}

// LIMPIAR: Reset variables al cerrar modal
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
        
        // Limpiar mensajes de conflicto
        const conflictInfo = modal.querySelector('.conflict-info');
        if (conflictInfo) {
            conflictInfo.remove();
        }
        
        // Resetear formularios
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
        
        // Habilitar campos que pudieron ser deshabilitados
        const selects = modal.querySelectorAll('select:disabled');
        const buttons = modal.querySelectorAll('button:disabled');
        selects.forEach(s => s.disabled = false);
        buttons.forEach(b => b.disabled = false);
    });

    // Reset variables globales
    currentEditingStudent = null;

    // Reset estilos de validación
    const timeSelect = document.getElementById('studentTime');
    if (timeSelect) {
        timeSelect.style.borderColor = '';
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Funciones auxiliares
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lunes como inicio
    return new Date(d.setDate(diff));
}

function formatDate(date) {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
}

function getDayName(day) {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[day];
}

function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
}

// function toggleMorningView() {
//     const scheduleGrid = document.getElementById('scheduleGrid');
    
//     if (!hideMorning) {
//         // Ocultar mañana
//         scheduleGrid.classList.add('hiding-morning');
        
//         setTimeout(() => {
//             scheduleGrid.classList.remove('hiding-morning');
//             hideMorning = true;
//             renderScheduleGrid(getStartOfWeek(currentWeek));
//         }, 400);
        
//     } else {
//         // Mostrar mañana - NO cambiar hideMorning hasta el final
//         scheduleGrid.classList.add('showing-morning');
        
//         setTimeout(() => {
//             hideMorning = false;  // ← Cambiar DESPUÉS de la animación
//             renderScheduleGrid(getStartOfWeek(currentWeek));
//             scheduleGrid.classList.remove('showing-morning');
//         }, 400);
//     }
// }

function deleteRecovery(recoveryId) {
    const recovery = specialClasses.find(c => c.id === recoveryId);
    if (recovery && recovery.type === 'recovery') {
        // Eliminar recuperación
        specialClasses = specialClasses.filter(c => c.id !== recoveryId);
        
        // Restaurar crédito al estudiante
        const student = students.find(s => s.id === recovery.studentId);
        if (student) {
            student.licenseCredits = (student.licenseCredits || 0) + 1;
        }
        
        // Eliminar asistencias relacionadas
        attendance = attendance.filter(a => a.classId !== recoveryId);
        
        saveData();
        renderWeekView();
        closeModal();
        showToast('Recuperación eliminada. Crédito restaurado.');
    }
}

// ==========================================
// FUNCIONES PARA PRIMERA VEZ E IMPORT/EXPORT
// Agregar a app.js
// ==========================================

// 🔍 DETECCIÓN DE PRIMERA VEZ


function getCurrentDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

function isValidTimeFormat(time) {
    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

function isValidDateFormat(date) {
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(new Date(date));
}

function getAllExistingSchedules() {
    const schedules = [];
    
    students.forEach(student => {
        const studentSchedules = getStudentSchedules(student);
        studentSchedules.forEach(schedule => {
            schedules.push({
                studentId: student.id,
                studentName: student.name,
                day: schedule.day,
                time: schedule.time
            });
        });
    });
    
    return schedules;
}

function findStudentBySchedule(day, time) {
    return students.find(student => {
        const schedules = getStudentSchedules(student);
        return schedules.some(s => s.day === day && s.time === time);
    });
}

function checkInternalConflicts(validRows, errors) {
    const scheduleMap = new Map();
    
    validRows.forEach(row => {
        row.schedules.forEach(schedule => {
            const key = `${schedule.day}-${schedule.time}`;
            
            if (scheduleMap.has(key)) {
                const conflictRow = scheduleMap.get(key);
                errors.push(`Conflicto entre filas ${conflictRow.rowNumber} y ${row.rowNumber}: horario ${getDayName(schedule.day)} ${schedule.time}`);
            } else {
                scheduleMap.set(key, row);
            }
        });
    });
}

function showValidationResults(validationResult) {
    const validationDiv = document.getElementById('importValidation');
    
    if (validationResult.errors.length === 0 && validationResult.warnings.length === 0) {
        validationDiv.style.display = 'none';
        return;
    }
    
    let validationHTML = '';
    
    if (validationResult.errors.length > 0) {
        validationHTML += `
            <h3 style="color: var(--error); margin-bottom: 0.5rem;">
                ❌ Errores encontrados (${validationResult.errors.length}):
            </h3>
            <ul class="validation-errors">
                ${validationResult.errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
        `;
    }
    
    if (validationResult.warnings.length > 0) {
        validationHTML += `
            <h3 style="color: var(--accent); margin-bottom: 0.5rem;">
                ⚠️ Advertencias (${validationResult.warnings.length}):
            </h3>
            <ul class="validation-errors">
                ${validationResult.warnings.map(warning => `<li>${warning}</li>`).join('')}
            </ul>
        `;
    }
    
    const summary = `
        <div style="margin-top: 1rem; padding: 0.75rem; background: var(--bg-main); border-radius: 6px;">
            <strong>Resumen:</strong> 
            ${validationResult.validRows.length} de ${validationResult.totalRows} filas válidas para importar
        </div>
    `;
    
    validationDiv.innerHTML = validationHTML + summary;
    validationDiv.style.display = 'block';
}

function readFileAsync(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsText(file);
    });
}

function clearAllData() {
    students.length = 0;
    regularClasses.length = 0;
    specialClasses.length = 0;
    attendance.length = 0;
}

async function processImportData(validRows) {
    for (const row of validRows) {
        const newStudentId = Date.now() + Math.floor(Math.random() * 1000);
        
        // Crear estudiante
        const newStudent = {
            id: newStudentId,
            name: row.Nombre.trim(),
            instrument: row.Instrumento.trim(),
            schedules: row.schedules,
            active: row.Estado !== 'Inactivo',
            licenseCredits: parseInt(row.Creditos) || 0,
            createdAt: new Date().toISOString(),
            startDate: row.FechaInicio || null
        };
        
        students.push(newStudent);
        
        // Crear clases regulares
        row.schedules.forEach((schedule, index) => {
            const newRegularClass = {
                id: Date.now() + Math.floor(Math.random() * 1000) + index + 1,
                studentId: newStudentId,
                day: schedule.day,
                time: schedule.time,
                scheduleIndex: index
            };
            
            regularClasses.push(newRegularClass);
        });
        
        // ❌ REMOVIDO: No generar licencias automáticas para importación CSV
        // La importación CSV es para migrar datos existentes del sistema anterior
        
        // ✅ OPCIONAL: Solo si el CSV específicamente incluye una columna "GenerarLicenciasAuto"
        // if (row.FechaInicio && row.GenerarLicenciasAuto === 'Si') {
        //     row.schedules.forEach((schedule, index) => {
        //         generateAutoLicensesForSchedule(newStudent, schedule, index);
        //     });
        // }
    }
}