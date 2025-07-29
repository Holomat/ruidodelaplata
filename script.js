// Variables globales
let isPlaying = false;
let currentChannelIndex = 0;
let currentAudio = null;
let sidebarOpen = false;
let visualizerData = {
    temperature: 16.2,
    pressure: 1013.2,
    humidity: 78,
    windSpeed: 12.4,
    time: Date.now()
};

// Configuración de canales
const channels = [
    { name: "frecuencia 01: próximamente", audio: "audio/channel_01.mp3", status: "próximamente" },
    { name: "frecuencia 02: próximamente", audio: "audio/channel_02.mp3", status: "próximamente" },
    { name: "frecuencia 03: próximamente", audio: "audio/channel_03.mp3", status: "próximamente" },
    { name: "frecuencia 04: próximamente", audio: "audio/channel_04.mp3", status: "próximamente" },
    { name: "frecuencia 05: próximamente", audio: "audio/channel_05.mp3", status: "próximamente" }
];

// FUNCIÓN ESPECÍFICA PARA ACTUALIZAR RELOJES
function updateClocks() {
    const homeClockElement = document.getElementById('homeClock');
    const sidebarClockElement = document.getElementById('sidebarClock');
    const liveClockElement = document.getElementById('liveClock');
    
    try {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timeString = `${hours}:${minutes}:${seconds}`;
        
        if (homeClockElement) {
            homeClockElement.textContent = timeString;
            homeClockElement.style.display = 'inline-block';
            homeClockElement.style.visibility = 'visible';
        }
        
        if (sidebarClockElement) {
            sidebarClockElement.textContent = timeString;
        }
        
        if (liveClockElement) {
            liveClockElement.textContent = timeString;
        }
        
    } catch (error) {
        console.error('Error actualizando relojes:', error);
    }
}

// FUNCIÓN TOGGLE SIDEBAR PARA MÓVIL CON ANIMACIONES
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
        sidebarOpen = !sidebarOpen;
        if (sidebarOpen) {
            sidebar.classList.add('active');
            // Animar entrada de elementos - todos a la vez
            setTimeout(() => animateSidebarItems(true), 100);
        } else {
            // Animar salida antes de cerrar
            animateSidebarItems(false);
            setTimeout(() => sidebar.classList.remove('active'), 300);
        }
    } else {
        // En desktop, siempre mostrar elementos
        animateSidebarItems(true);
    }
}

// FUNCIÓN PARA ANIMAR ELEMENTOS DEL SIDEBAR - TODOS A LA VEZ - USANDO LA CLASE UNIFICADA
function animateSidebarItems(show) {
    const items = document.querySelectorAll('.sidebar-item');
    const microdata = document.querySelector('.sidebar .microdata-container');
    
    if (show) {
        // Todos los elementos aparecen al mismo tiempo
        items.forEach(item => {
            item.classList.add('visible');
        });
        
        if (microdata) microdata.classList.add('visible');
    } else {
        items.forEach(item => item.classList.remove('visible'));
        if (microdata) microdata.classList.remove('visible');
    }
}

// FUNCIÓN PRINCIPAL DE NAVEGACIÓN
function showSection(targetSection) {
    console.log('Mostrando sección:', targetSection);
    
    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Desactivar todos los botones del sidebar
    document.querySelectorAll('.sidebar-item').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar sección objetivo
    const target = document.getElementById(targetSection);
    if (target) {
        target.classList.add('active');
        console.log('✅ Sección activada:', targetSection);
    }
    
    // Activar botón correspondiente
    if (targetSection !== 'home') {
        const targetButton = document.querySelector(`[onclick="showSection('${targetSection}')"]`);
        if (targetButton && targetButton.classList.contains('sidebar-item')) {
            targetButton.classList.add('active');
        }
    } else {
        // Para home, no activamos ningún botón del sidebar
        document.querySelectorAll('.sidebar-item').forEach(btn => {
            btn.classList.remove('active');
        });
    }
    
    // Cerrar sidebar en móvil después de seleccionar
    const isMobile = window.innerWidth < 768;
    if (isMobile && sidebarOpen) {
        setTimeout(() => {
            toggleSidebar();
        }, 200);
    }
    
    // Scroll al top
    const contentArea = document.querySelector('.content-area');
    if (contentArea) {
        contentArea.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Funciones del reproductor
function soundTogglePlayPause() {
    const playBtn = document.getElementById('soundPlayBtn');
    if (!playBtn) return;
    
    isPlaying = !isPlaying;
    
    if (isPlaying) {
        playBtn.classList.add('playing');
        playBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12"><rect x="3" y="2" width="2" height="8" fill="#FFFFFF"/><rect x="7" y="2" width="2" height="8" fill="#FFFFFF"/></svg>';
    } else {
        playBtn.classList.remove('playing');
        playBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12"><path d="M3 0v12l9-6z" fill="currentColor"/></svg>';
    }
}

function soundStop() {
    isPlaying = false;
    const playBtn = document.getElementById('soundPlayBtn');
    if (playBtn) {
        playBtn.classList.remove('playing');
        playBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12"><path d="M3 0v12l9-6z" fill="currentColor"/></svg>';
    }
}

function soundSelectChannel(index) {
    currentChannelIndex = index;
    document.querySelectorAll('.sound-channel-item').forEach((item, i) => {
        item.classList.toggle('selected', i === index);
    });
    console.log(`Canal seleccionado: ${index + 1}`);
}

function soundPreviousTrack() {
    currentChannelIndex = (currentChannelIndex - 1 + channels.length) % channels.length;
    soundSelectChannel(currentChannelIndex);
}

function soundNextTrack() {
    currentChannelIndex = (currentChannelIndex + 1) % channels.length;
    soundSelectChannel(currentChannelIndex);
}

// Función para cerrar el scroll bar
function closeScrollBar() {
    const scrollBar = document.getElementById('scrollBarFixed');
    if (scrollBar) {
        scrollBar.classList.add('hidden');
    }
}

// Datos del río
async function updateRiverData() {
    try {
        console.log('Actualizando datos del río...');
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-34.6118&longitude=-58.3960&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m&timezone=America/Argentina/Buenos_Aires');
        const data = await response.json();
        
        if (data && data.current) {
            const waterTemp = Math.max(8, data.current.temperature_2m - 2).toFixed(1);
            
            // Elementos de todas las secciones
            const elements = {
                temp: ['waterTemp', 'homeWaterTemp', 'sidebarWaterTemp'],
                pressure: ['pressure', 'homePressure', 'sidebarPressure'],
                wind: ['windSpeed', 'homeWindSpeed', 'sidebarWindSpeed'],
                humidity: ['humidity', 'homeHumidity', 'sidebarHumidity'],
                currentDir: ['currentDir', 'homeCurrentDir', 'sidebarCurrentDir']
            };
            
            // Actualizar temperatura
            elements.temp.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = id.includes('home') || id.includes('sidebar') ? `${waterTemp}°c` : `${waterTemp}°c`;
            });
            
            // Actualizar presión
            elements.pressure.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = id === 'pressure' ? `${data.current.surface_pressure.toFixed(1)} hpa` : `${data.current.surface_pressure.toFixed(1)}`;
            });
            
            // Actualizar viento
            elements.wind.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = id === 'windSpeed' ? `${data.current.wind_speed_10m.toFixed(1)} km/h` : `${data.current.wind_speed_10m.toFixed(1)}`;
            });
            
            // Actualizar humedad
            elements.humidity.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = id === 'humidity' ? `${data.current.relative_humidity_2m}%` : `${data.current.relative_humidity_2m}`;
            });
            
            // Actualizar dirección de corriente
            const windDir = data.current.wind_direction_10m;
            let currentDirection = 'se-e';
            if (windDir >= 315 || windDir < 45) currentDirection = 'n-ne';
            else if (windDir >= 45 && windDir < 135) currentDirection = 'e-se';
            else if (windDir >= 135 && windDir < 225) currentDirection = 's-sw';
            else if (windDir >= 225 && windDir < 315) currentDirection = 'w-nw';
            
            elements.currentDir.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = currentDirection;
            });
            
            visualizerData.temperature = parseFloat(waterTemp);
            visualizerData.pressure = data.current.surface_pressure;
            visualizerData.humidity = data.current.relative_humidity_2m;
            visualizerData.windSpeed = data.current.wind_speed_10m;
            
            console.log('✅ Datos del río actualizados');
        }
    } catch (error) {
        console.error('Error obteniendo datos del río:', error);
    }
}

// Inicialización cuando carga la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Ruido de la plata - Web cargada');
    
    // Inicializar reproductor
    if (typeof soundSelectChannel === 'function') {
        soundSelectChannel(0);
    }
    
    // INICIALIZAR RELOJES INMEDIATAMENTE
    updateClocks();
    setInterval(updateClocks, 1000);
    
    // Datos del río
    updateRiverData();
    setInterval(updateRiverData, 600000);
    
    // Asegurar que los microdatos de home sean visibles
    const homeMicrodata = document.querySelector('.home-microdata .microdata-container');
    if (homeMicrodata) {
        homeMicrodata.classList.add('visible');
    }
    
    // Verificar si es desktop y mostrar elementos
    const isDesktop = window.innerWidth >= 768;
    if (isDesktop) {
        // En desktop, aplicar efecto de materialización al cargar
        setTimeout(() => {
            animateSidebarItems(true);
        }, 300);
    }
    
    // Cerrar sidebar en móvil al hacer clic fuera
    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById('sidebar');
        const menuBtn = document.querySelector('.navbar-menu');
        const isMobile = window.innerWidth < 768;
        
        if (isMobile && sidebarOpen && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
            toggleSidebar();
        }
    });
    
    console.log('✅ Inicialización completa');
});