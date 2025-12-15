// Funciones JavaScript para el CRUD

// Confirmar eliminación
function confirmarEliminacion(id, puesto) {
    if (confirm(`¿Estás seguro de eliminar la oferta #${id} - ${puesto}?`)) {
        return true;
    }
    return false;
}

// Formatear fecha
function formatearFecha(fechaStr) {
    if (!fechaStr) return 'No especificada';
    return fechaStr;
}

// Validar formulario
document.addEventListener('DOMContentLoaded', function() {
    const formularios = document.querySelectorAll('form[method="POST"]');
    
    formularios.forEach(form => {
        form.addEventListener('submit', function(e) {
            const camposRequeridos = form.querySelectorAll('[required]');
            let valido = true;
            
            camposRequeridos.forEach(campo => {
                if (!campo.value.trim()) {
                    campo.classList.add('is-invalid');
                    valido = false;
                } else {
                    campo.classList.remove('is-invalid');
                }
            });
            
            if (!valido) {
                e.preventDefault();
                alert('Por favor, completa todos los campos requeridos.');
            }
        });
    });
    
    // Auto cerrar alertas después de 5 segundos
    const alertas = document.querySelectorAll('.alert');
    alertas.forEach(alerta => {
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alerta);
            bsAlert.close();
        }, 5000);
    });
});