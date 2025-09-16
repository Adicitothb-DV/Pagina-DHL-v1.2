document.addEventListener('DOMContentLoaded', function() {
    const nombre = document.getElementById('mensaje');
    if (nombre) {
        const text = "Logistica Global y Envios Internacionales";
        let index = 0;

        function writeText() {
            nombre.textContent = text.slice(0, index);
            index++;

            if (index > text.length) {
                index = text.length;
            } else {
                setTimeout(writeText, 50);
            }
        }
        writeText();
    }
});
