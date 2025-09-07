// ==========================================
// FUNCIONES PARA PRIMERA VEZ E IMPORT/EXPORT
// ==========================================

function showFirstTimeModal() {
    const modal = document.getElementById('firstTimeModal');
    modal.classList.add('active');
    
    // Hacer que el modal sea no cerrrable hasta que se tome una decisión
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            e.stopPropagation();
            // No cerrar
        }
    });
}

// 📝 FUNCIONES DE BIENVENIDA
function openMultipleStudentsForm() {
    closeModal(); // Cerrar modal de bienvenida
    setTimeout(() => {
        const modal = document.getElementById('multipleStudentsModal');
        modal.classList.add('active');
        initializeMultipleStudentsForm();
    }, 200);
}

function openImportModal() {
    closeModal(); // Cerrar modal de bienvenida
    setTimeout(() => {
        const modal = document.getElementById('importModal');
        modal.classList.add('active');
        setupImportForm();
    }, 200);
}

function startFromScratch() {
    // Marcar que ya no es primera vez
    localStorage.setItem('appInitialized', 'true');
    closeModal();
    renderWeekView();
    showToast('🎵 ¡Listo! Puedes agregar alumnos con el botón ➕');
}

function goBackToWelcome() {
    closeModal(); // Cerrar modal actual
    
    // ✅ CORREGIDO: Solo mostrar bienvenida si realmente es primera vez
    const hasData = students.length > 0 || 
                   regularClasses.length > 0 || 
                   specialClasses.length > 0 ||
                   localStorage.getItem('appInitialized');
    
    if (!hasData) {
        // Si realmente no hay datos, mostrar bienvenida
        setTimeout(() => {
            showFirstTimeModal();
        }, 200);
    } else {
        // Si ya hay datos, simplemente cerrar y volver al calendario
        renderWeekView();
        showToast('✅ Cancelado - Volviendo al calendario');
    }
}

// 📊 EXPORTACIÓN A CSV
function exportToCSV() {
    if (students.length === 0) {
        showToast('❌ No hay datos para exportar');
        return;
    }
    
    // Crear contenido CSV
    const headers = [
        'Nombre',
        'Instrumento', 
        'Dia1',
        'Hora1',
        'Dia2', 
        'Hora2',
        'FechaInicio',
        'Estado',
        'Creditos'
    ];
    
    let csvContent = headers.join(',') + '\n';
    
    students.forEach(student => {
        const schedules = getStudentSchedules(student);
        const schedule1 = schedules[0] || {};
        const schedule2 = schedules[1] || {};
        
        const row = [
            `"${student.name}"`,
            `"${student.instrument}"`,
            schedule1.day || '',
            schedule1.time || '',
            schedule2.day || '',
            schedule2.time || '',
            student.startDate || '',
            student.active ? 'Activo' : 'Inactivo',
            student.licenseCredits || 0
        ];
        
        csvContent += row.join(',') + '\n';
    });
    
    // Descargar archivo
    downloadCSV(csvContent, `musicclass_backup_${getCurrentDateString()}.csv`);
    showToast('✅ Datos exportados exitosamente');
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.getElementById('downloadHelper');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// 📂 IMPORTACIÓN DESDE CSV
function setupImportForm() {
    const fileInput = document.getElementById('csvFile');
    const previewBtn = document.getElementById('previewBtn');
    const importBtn = document.getElementById('importBtn');
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            previewBtn.style.display = 'inline-block';
            importBtn.style.display = 'none';
            
            // Limpiar previews anteriores
            document.getElementById('importPreview').style.display = 'none';
            document.getElementById('importValidation').style.display = 'none';
        }
    });
}

function previewCSV() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showToast('❌ Por favor selecciona un archivo');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csvData = parseCSV(e.target.result);
            const validationResult = validateImportData(csvData);
            
            showPreviewTable(csvData, validationResult);
            showValidationResults(validationResult);
            
            // Mostrar botón de importar solo si no hay errores críticos
            if (validationResult.canImport) {
                document.getElementById('importBtn').style.display = 'inline-block';
            } else {
                document.getElementById('importBtn').style.display = 'none';
            }
            
        } catch (error) {
            showToast('❌ Error al leer el archivo: ' + error.message);
        }
    };
    
    reader.readAsText(file);
}

function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    // Verificar headers requeridos
    const requiredHeaders = ['Nombre', 'Instrumento', 'Dia1', 'Hora1'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
        throw new Error(`Headers faltantes: ${missingHeaders.join(', ')}`);
    }
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        const row = {};
        
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        
        // Solo agregar filas con datos mínimos
        if (row.Nombre && row.Instrumento && row.Dia1 && row.Hora1) {
            data.push(row);
        }
    }
    
    return data;
}

function validateImportData(csvData) {
    const errors = [];
    const warnings = [];
    const validRows = [];
    const existingSchedules = getAllExistingSchedules();
    
    csvData.forEach((row, index) => {
        const rowNumber = index + 2; // +2 porque index empieza en 0 y saltamos header
        const rowErrors = [];
        
        // Validar datos básicos
        if (!row.Nombre?.trim()) {
            rowErrors.push(`Fila ${rowNumber}: Nombre requerido`);
        }
        
        if (!row.Instrumento?.trim()) {
            rowErrors.push(`Fila ${rowNumber}: Instrumento requerido`);
        }
        
        // Validar horarios
        const schedules = [];
        
        // Primer horario (obligatorio)
        if (row.Dia1 && row.Hora1) {
            const day1 = parseInt(row.Dia1);
            const time1 = row.Hora1.trim();
            
            if (day1 < 1 || day1 > 6) {
                rowErrors.push(`Fila ${rowNumber}: Día1 debe ser 1-6 (${day1} inválido)`);
            } else if (!isValidTimeFormat(time1)) {
                rowErrors.push(`Fila ${rowNumber}: Hora1 formato inválido (${time1})`);
            } else {
                schedules.push({ day: day1, time: time1 });
                
                // Verificar conflicto con datos existentes
                const hasConflict = existingSchedules.some(es => 
                    es.day === day1 && es.time === time1
                );
                
                if (hasConflict) {
                    const existingStudent = findStudentBySchedule(day1, time1);
                    rowErrors.push(`Fila ${rowNumber}: Horario ${getDayName(day1)} ${time1} ocupado por ${existingStudent?.name || 'otro estudiante'}`);
                }
            }
        }
        
        // Segundo horario (opcional)
        if (row.Dia2 && row.Hora2) {
            const day2 = parseInt(row.Dia2);
            const time2 = row.Hora2.trim();
            
            if (day2 < 1 || day2 > 6) {
                rowErrors.push(`Fila ${rowNumber}: Día2 debe ser 1-6 (${day2} inválido)`);
            } else if (!isValidTimeFormat(time2)) {
                rowErrors.push(`Fila ${rowNumber}: Hora2 formato inválido (${time2})`);
            } else {
                // Verificar que no sea igual al primer horario
                const isDuplicate = schedules.some(s => 
                    s.day === day2 && s.time === time2
                );
                
                if (isDuplicate) {
                    rowErrors.push(`Fila ${rowNumber}: Horarios duplicados`);
                } else {
                    schedules.push({ day: day2, time: time2 });
                    
                    // Verificar conflicto con datos existentes
                    const hasConflict = existingSchedules.some(es => 
                        es.day === day2 && es.time === time2
                    );
                    
                    if (hasConflict) {
                        const existingStudent = findStudentBySchedule(day2, time2);
                        rowErrors.push(`Fila ${rowNumber}: Horario ${getDayName(day2)} ${time2} ocupado por ${existingStudent?.name || 'otro estudiante'}`);
                    }
                }
            }
        }
        
        // Validar fecha de inicio si está presente
        if (row.FechaInicio && !isValidDateFormat(row.FechaInicio)) {
            rowErrors.push(`Fila ${rowNumber}: Formato de fecha inválido (${row.FechaInicio}). Use YYYY-MM-DD`);
        }
        
        // Agregar errores al total
        errors.push(...rowErrors);
        
        // Si no hay errores, agregar a filas válidas
        if (rowErrors.length === 0) {
            validRows.push({
                ...row,
                schedules: schedules,
                rowNumber: rowNumber
            });
        }
    });
    
    // Verificar conflictos entre filas del mismo CSV
    checkInternalConflicts(validRows, errors);
    
    return {
        errors: errors,
        warnings: warnings,
        validRows: validRows,
        totalRows: csvData.length,
        canImport: errors.length === 0
    };
}

// 📥 IMPORTAR DATOS
async function importCSVData() {
    const fileInput = document.getElementById('csvFile');
    const replaceAll = document.getElementById('replaceAll').checked;
    const file = fileInput.files[0];
    
    if (!file) {
        showToast('❌ Por favor selecciona un archivo');
        return;
    }
    
    try {
        // Leer archivo nuevamente para importar
        const fileContent = await readFileAsync(file);
        const csvData = parseCSV(fileContent);
        const validationResult = validateImportData(csvData);
        
        if (!validationResult.canImport) {
            showToast('❌ No se puede importar: hay errores en los datos');
            return;
        }
        
        // Mostrar confirmación
        const confirmMessage = replaceAll ? 
            `¿Reemplazar TODOS los datos existentes con ${validationResult.validRows.length} nuevos estudiantes?` :
            `¿Agregar ${validationResult.validRows.length} estudiantes a los datos existentes?`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // Procesar importación
        if (replaceAll) {
            clearAllData();
        }
        
        await processImportData(validationResult.validRows);
        
        // Marcar app como inicializada
        localStorage.setItem('appInitialized', 'true');
        
        saveData();
        renderStudentsList();
        renderWeekView();
        closeImportModal();
        
        showToast(`✅ ${validationResult.validRows.length} estudiantes importados exitosamente`);
        
    } catch (error) {
        showToast('❌ Error al importar: ' + error.message);
    }
}

function showPreviewTable(csvData, validationResult) {
    const previewDiv = document.getElementById('importPreview');
    const tableDiv = document.getElementById('previewTable');
    
    if (csvData.length === 0) {
        previewDiv.style.display = 'none';
        return;
    }
    
    let tableHTML = `
        <table class="preview-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Instrumento</th>
                    <th>Horario 1</th>
                    <th>Horario 2</th>
                    <th>Fecha Inicio</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    csvData.forEach((row, index) => {
        const rowNumber = index + 2;
        const hasError = validationResult.errors.some(error => 
            error.includes(`Fila ${rowNumber}:`)
        );
        const isValid = validationResult.validRows.some(vr => vr.rowNumber === rowNumber);
        
        const horario1 = (row.Dia1 && row.Hora1) ? 
            `${getDayName(parseInt(row.Dia1))} ${row.Hora1}` : '';
        const horario2 = (row.Dia2 && row.Hora2) ? 
            `${getDayName(parseInt(row.Dia2))} ${row.Hora2}` : '';
        
        tableHTML += `
            <tr class="${hasError ? 'invalid' : ''}">
                <td>${rowNumber}</td>
                <td>${row.Nombre || ''}</td>
                <td>${row.Instrumento || ''}</td>
                <td>${horario1}</td>
                <td>${horario2}</td>
                <td>${row.FechaInicio || ''}</td>
                <td>${isValid ? '✅' : '❌'}</td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    tableDiv.innerHTML = tableHTML;
    previewDiv.style.display = 'block';
}

function closeImportModal() {
    closeModal();
    
    // Limpiar formulario
    document.getElementById('importForm').reset();
    document.getElementById('importPreview').style.display = 'none';
    document.getElementById('importValidation').style.display = 'none';
    document.getElementById('previewBtn').style.display = 'none';
    document.getElementById('importBtn').style.display = 'none';
}