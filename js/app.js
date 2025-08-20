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
}

function saveData() {
    localStorage.setItem('students', JSON.stringify(students));
    localStorage.setItem('regularClasses', JSON.stringify(regularClasses));
    localStorage.setItem('specialClasses', JSON.stringify(specialClasses));
    localStorage.setItem('attendance', JSON.stringify(attendance));
}

function setupEventListeners() {
    document.getElementById('recoveryForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveRecoveryClass();
    });

    document.getElementById('studentForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveStudent();
    });

    // Validación en tiempo real (NUEVO)
    setupScheduleValidation();

    // Cerrar modales al hacer click fuera
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    });
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

function toggleMorningView() {
    hideMorning = !hideMorning;
    renderScheduleGrid(getStartOfWeek(currentWeek));
}

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