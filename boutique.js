/* =========================================================================
   BOUTIQUE.JS — Order form logic, Supabase integration & n8n webhook
   ========================================================================= */

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzNSrRa5OSe8gmb4kWG4v-fIS036mH4TvU2JJrEPf4zhtaesPrVQcZxg43_Ohm9NRazLw/exec';

/* =========================================================================
   HELPERS
   ========================================================================= */

function showPopup(id) {
    const el = document.getElementById(id);
    if (el) {
        el.classList.add('popup-visible');
        el.setAttribute('aria-hidden', 'false');
    }
}

function hidePopup(id) {
    const el = document.getElementById(id);
    if (el) {
        el.classList.remove('popup-visible');
        el.setAttribute('aria-hidden', 'true');
    }
}

/**
 * Run a 10-second countdown and fill an element.
 * fillId  = id of the element to fill
 * countId = id of the countdown span
 * cssProp = 'height' or 'width' depending on the animation
 * Returns a Promise that resolves when the timer ends.
 */
function runCountdown(fillId, countId, cssProp = 'height', durationOverride = null) {
    return new Promise((resolve) => {
        const fillElement = document.getElementById(fillId);
        const counter = document.getElementById(countId);
        const DURATION = durationOverride || 2; // Bajado a 2 segundos para no hacer esperar al cliente
        let elapsed = 0;

        if (fillElement) fillElement.style[cssProp] = '0%';

        const interval = setInterval(() => {
            elapsed++;
            const remaining = DURATION - elapsed;
            if (counter) counter.textContent = remaining > 0 ? remaining : 0;
            
            if (fillElement) fillElement.style[cssProp] = (elapsed / DURATION * 100) + '%';

            if (elapsed >= DURATION) {
                clearInterval(interval);
                resolve();
            }
        }, 1000);
    });
}

/* =========================================================================
   FIELD VALIDATION
   ========================================================================= */

function validateField(input) {
    const errorEl = document.getElementById(input.id + '-error');
    let valid = true;

    if (input.hasAttribute('required') && !input.value.trim()) {
        valid = false;
    }

    if (input.type === 'email' && input.value.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.value.trim())) {
            valid = false;
        }
    }

    if (input.type === 'tel' && input.value.trim() !== '') {
        const digits = input.value.replace(/[\s\-().+]/g, '');
        if (!/^\d{10}$/.test(digits)) {
            valid = false;
        }
    }

    if (errorEl) {
        errorEl.classList.toggle('visible', !valid);
    }
    input.classList.toggle('input-error', !valid);
    input.classList.toggle('input-ok', valid && input.value.trim() !== '');

    return valid;
}

function validateForm(form) {
    const fields = form.querySelectorAll('.form-control');
    let allValid = true;
    fields.forEach(field => {
        if (!validateField(field)) allValid = false;
    });
    return allValid;
}

/* =========================================================================
   GOOGLE SHEETS WEBHOOK
   ========================================================================= */

async function submitToGoogleSheets(data) {
    // Google Apps Script usually returns an opaque response (CORS redirect)
    // Using mode: 'no-cors' ensures the browser doesn't block the request,
    // even though we can't read the success response text directly.
    await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
}

/* =========================================================================
   COLOMBIAN MUNICIPALITIES — full official list
   ========================================================================= */

const COLOMBIA_DATA = {
    "Amazonas": ["Leticia", "Puerto Nariño", "Tarapacá", "La Pedrera"],
    "Antioquia": ["Medellín", "Abejorral", "Amagá", "Amalfi", "Andes", "Apartadó", "Arboletes", "Barbosa", "Bello", "Caldas", "Caucasia", "Copacabana", "Envigado", "Girardota", "Guarne", "Itagüí", "La Ceja", "Marinilla", "Rionegro", "Sabaneta", "Santa Fe de Antioquia", "Turbo", "Yarumal", "Yondó"],
    "Arauca": ["Arauca", "Arauquita", "Cravo Norte", "Fortul", "Puerto Rondón", "Saravena", "Tame"],
    "Atlántico": ["Barranquilla", "Baranoa", "Campo de la Cruz", "Galapa", "Malambo", "Puerto Colombia", "Sabanalarga", "Soledad"],
    "Bolívar": ["Cartagena de Indias", "Arjona", "Carmen de Bolívar", "Magangué", "Mompox", "Turbaco"],
    "Boyacá": ["Tunja", "Chiquinquirá", "Duitama", "Garagoa", "Moniquirá", "Paipa", "Puerto Boyacá", "Sogamoso", "Villa de Leyva"],
    "Caldas": ["Manizales", "Anserma", "Chinchiná", "La Dorada", "Neira", "Palestina", "Pensilvania", "Riosucio", "Salamina", "Supía", "Villamaría"],
    "Caquetá": ["Florencia", "Cartagena del Chairá", "El Doncello", "El Paujil", "Puerto Rico", "San Vicente del Caguán"],
    "Casanare": ["Yopal", "Aguazul", "Maní", "Monterrey", "Orocué", "Paz de Ariporo", "Tauramena", "Villanueva"],
    "Cauca": ["Popayán", "Buenos Aires", "Corinto", "El Tambo", "Guapi", "Miranda", "Patía", "Piendamó", "Puerto Tejada", "Santander de Quilichao", "Silvia"],
    "Cesar": ["Valledupar", "Aguachica", "Agustín Codazzi", "Bosconia", "Curumaní", "El Copey", "La Jagua de Ibirico", "San Alberto"],
    "Chocó": ["Quibdó", "Acandí", "Bahía Solano", "Carmen del Darién", "Condoto", "Istmina", "Nuquí", "Riosucio", "Tadó"],
    "Córdoba": ["Montería", "Ayapel", "Cereté", "Lorica", "Montelíbano", "Planeta Rica", "Sahagún", "Tierralta"],
    "Cundinamarca": ["Bogotá D.C.", "Cajicá", "Chía", "Cota", "Facatativá", "Funza", "Fusagasugá", "Girardot", "Madrid", "Mosquera", "Pacho", "Soacha", "Sopó", "Tocancipá", "Villeta", "Zipaquirá"],
    "Guainía": ["Inírida", "Barranco Minas", "Mapiripana"],
    "Guaviare": ["San José del Guaviare", "Calamar", "El Retorno", "Miraflores"],
    "Huila": ["Neiva", "Aipe", "Campoalegre", "Garzón", "Gigante", "La Plata", "Pitalito", "Rivera", "Timaná", "Yaguará"],
    "La Guajira": ["Riohacha", "Albania", "Barrancas", "Dibulla", "Fonseca", "Maicao", "Manaure", "San Juan del Cesar", "Uribia"],
    "Magdalena": ["Santa Marta", "Aracataca", "Ciénaga", "El Banco", "Fundación", "Plato", "Pivijay", "Sitionuevo"],
    "Meta": ["Villavicencio", "Acacías", "Cumaral", "Granada", "Guamal", "La Macarena", "Puerto Gaitán", "Puerto López", "Restrepo", "San Martín"],
    "Nariño": ["Pasto", "Barbacoas", "Buesaco", "Chachagüí", "Cumbal", "Ipiales", "La Unión", "Samaniego", "Sandoná", "Tumaco", "Túquerres"],
    "Norte de Santander": ["Cúcuta", "Ábrego", "Chinácota", "Los Patios", "Ocaña", "Pamplona", "Sardinata", "Tibú", "Villa del Rosario"],
    "Putumayo": ["Mocoa", "Orito", "Puerto Asís", "Puerto Leguízamo", "San Francisco", "Sibundoy", "Valle del Guamuez"],
    "Quindío": ["Armenia", "Buenavista", "Calarcá", "Circasia", "Filandia", "Génova", "La Tebaida", "Montenegro", "Pijao", "Quimbaya", "Salento"],
    "Risaralda": ["Pereira", "Apía", "Belén de Umbría", "Dosquebradas", "Guática", "La Virginia", "Marsella", "Quinchía", "Santa Rosa de Cabal", "Santuario"],
    "San Andrés y Providencia": ["San Andrés", "Providencia"],
    "Santander": ["Bucaramanga", "Barrancabermeja", "Barichara", "El Socorro", "Floridablanca", "Girón", "Piedecuesta", "Pinchote", "San Gil", "Vélez", "Zapatoca"],
    "Sucre": ["Sincelejo", "Corozal", "Coveñas", "Guaranda", "Majagual", "Sampués", "San Marcos", "San Onofre", "Tolú"],
    "Tolima": ["Ibagué", "Alpujarra", "Cajamarca", "Chaparral", "Espinal", "Fresno", "Honda", "Líbano", "Melgar", "Mariquita", "Purificación"],
    "Valle del Cauca": ["Cali", "Buenaventura", "Buga", "Cartago", "Candelaria", "Dagua", "El Cerrito", "Florida", "Jamundí", "Palmira", "Pradera", "Roldanillo", "Sevilla", "Tuluá", "Yumbo", "Zarzal"],
    "Vaupés": ["Mitú", "Caruru", "Taraira"],
    "Vichada": ["Puerto Carreño", "Cumaribo", "La Primavera", "Santa Rosalía"]
};

document.addEventListener('DOMContentLoaded', () => {
    const deptSelect = document.getElementById('department');
    const cityInput = document.getElementById('city');
    const cityDatalist = document.getElementById('cities-list');

    // Populate department select
    if (deptSelect) {
        Object.keys(COLOMBIA_DATA).sort().forEach(dept => {
            const opt = document.createElement('option');
            opt.value = dept;
            opt.textContent = dept;
            deptSelect.appendChild(opt);
        });

        // Event listener: cascade department -> cities datalist
        deptSelect.addEventListener('change', (e) => {
            const selectedDept = e.target.value;
            // Clear existing cities
            cityDatalist.innerHTML = '';
            cityInput.value = ''; // Reset chosen city

            if (selectedDept && COLOMBIA_DATA[selectedDept]) {
                const cities = COLOMBIA_DATA[selectedDept].slice().sort();
                cities.forEach(city => {
                    const opt = document.createElement('option');
                    opt.value = city;
                    cityDatalist.appendChild(opt);
                });
                // Enable city input
                cityInput.removeAttribute('disabled');
                cityInput.placeholder = 'Escribe o selecciona tu ciudad';
                // Trigger validation if it was previously marked invalid
                if (cityInput.classList.contains('input-error')) validateField(cityInput);
            } else {
                cityInput.setAttribute('disabled', 'true');
                cityInput.placeholder = 'Selecciona primero tu departamento';
            }
        });
    }

    const coffeeTypeSelect = document.getElementById('coffee_type');
    const grindRow = document.getElementById('grind-row');
    const grindSelect = document.getElementById('grind_type');

    if (coffeeTypeSelect && grindRow && grindSelect) {
        coffeeTypeSelect.addEventListener('change', (e) => {
            if (e.target.value === 'Molido') {
                grindRow.style.display = 'grid'; // or block/flex
                grindSelect.setAttribute('required', 'true');
            } else {
                grindRow.style.display = 'none';
                grindSelect.removeAttribute('required');
                grindSelect.value = ''; // clear value
                // clear error if it was showing
                grindSelect.classList.remove('input-error');
                const err = document.getElementById('grind_type-error');
                if (err) err.classList.remove('visible');
            }
        });
    }

    const form = document.getElementById('order-form');
    if (!form) return;

    // Live validation on blur
    form.querySelectorAll('.form-control').forEach(field => {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => {
            if (field.classList.contains('input-error')) validateField(field);
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm(form)) return;

        // Collect data
        const payload = {
            name:       document.getElementById('name').value.trim(),
            phone:      document.getElementById('phone').value.trim(),
            email:      document.getElementById('email').value.trim() || null,
            department: document.getElementById('department').value,
            city:       document.getElementById('city').value.trim(),
            address:    document.getElementById('address').value.trim(),
            benchmark:  document.getElementById('benchmark').value.trim() || null,
            // Extra context fields (non-Supabase columns may be ignored by RLS)
            coffee_type: document.getElementById('coffee_type').value,
            grind_type:  document.getElementById('grind_type') ? document.getElementById('grind_type').value : null,
            variety:     document.getElementById('variety').value
        };

        // Disable submit button
        const btn = document.getElementById('submit-btn');
        const btnText = document.getElementById('submit-text');
        const spinner = document.getElementById('submit-spinner');
        btn.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';

        // --- BACKEND: Enviar a Google Sheets (Opcional, en segundo plano) ---
        try {
            submitToGoogleSheets(payload).catch(e => console.log(e));
        } catch (err) {
            console.error('❌ Error enviando a Google Sheets:', err);
        }

        // --- CONSTRUIR MENSAJE DE WHATSAPP ---
        let message = `¡Hola Linaje! Quiero hacer un pedido.\n\n`;
        message += `☕ *Detalles del Café:*\n`;
        message += `- Variedad: ${payload.variety}\n`;
        message += `- Formato: ${payload.coffee_type}\n`;
        if (payload.grind_type) {
            message += `- Molienda: ${payload.grind_type}\n`;
        }
        
        message += `\n👤 *Mis Datos:*\n`;
        message += `- Nombre: ${payload.name}\n`;
        message += `- Teléfono: ${payload.phone}\n`;
        if (payload.email) {
            message += `- Correo: ${payload.email}\n`;
        }

        message += `\n📍 *Dirección de Entrega:*\n`;
        message += `- Departamento: ${payload.department}\n`;
        message += `- Ciudad: ${payload.city}\n`;
        message += `- Dirección: ${payload.address}\n`;
        if (payload.benchmark) {
            message += `- Referencia: ${payload.benchmark}\n`;
        }

        message += `\nQuedo atento(a) para coordinar el pago y envío. ¡Gracias!`;

        const whatsappNumber = '573206366862';
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

        // Mostrar animación rápida de éxito
        showPopup('popup-almost');
        await runCountdown('timer-fill-1', 'countdown-1', 'width'); // Esto tomaba 10s. Lo bajaremos en la función o redirigimos directo.
        hidePopup('popup-almost');

        // Redirigir a WhatsApp
        window.location.href = whatsappUrl;

        // Restaurar botón por si regresan a la página
        setTimeout(() => {
            btn.disabled = false;
            btnText.style.display = 'inline-block';
            spinner.style.display = 'none';
        }, 3000);
    });
});
