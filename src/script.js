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

// Variables del sintetizador armónico
let harmonyContext = null;
let harmonyOscillators = [];
let harmonyGains = [];
let harmonyFilters = [];
let harmonyMasterGain = null;
let harmonyActive = false;

// FUNCIÓN ESPECÍFICA PARA ACTUALIZAR RELOJES
function updateClocks() {
    const homeClockElement = document.getElementById('homeClock');
    const sidebarClockElement = document.getElementById('sidebarClock');
    const liveClockElement = document.getElementById('liveClock');
    const liveTimeElement = document.getElementById('liveTime2');
    
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
        
        if (liveTimeElement) {
            liveTimeElement.textContent = timeString;
        }
        
    } catch (error) {
        console.error('Error actualizando relojes:', error);
    }
}

// FUNCIÓN AUXILIAR PARA MAPEAR VALORES
function mapValue(value, inMin, inMax, outMin, outMax) {
    const clamped = Math.max(inMin, Math.min(inMax, value));
    return (clamped - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

// INICIALIZAR CONTEXTO ARMÓNICO
function initHarmonyContext() {
    console.log('🎵 Inicializando contexto armónico...');
    
    if (!harmonyContext) {
        try {
            harmonyContext = new (window.AudioContext || window.webkitAudioContext)();
            
            harmonyMasterGain = harmonyContext.createGain();
            harmonyMasterGain.gain.setValueAtTime(0.3, harmonyContext.currentTime);
            harmonyMasterGain.connect(harmonyContext.destination);
            
            for (let i = 0; i < 4; i++) {
                harmonyOscillators[i] = null;
                harmonyGains[i] = harmonyContext.createGain();
                harmonyFilters[i] = harmonyContext.createBiquadFilter();
                
                harmonyGains[i].gain.setValueAtTime(0, harmonyContext.currentTime);
                harmonyFilters[i].type = 'lowpass';
                harmonyFilters[i].frequency.setValueAtTime(800, harmonyContext.currentTime);
                
                harmonyGains[i].connect(harmonyFilters[i]);
                harmonyFilters[i].connect(harmonyMasterGain);
            }
            
            console.log('✅ Contexto Armónico inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando Contexto Armónico:', error);
        }
    }
}

// MAPEAR DATOS A ARMONÍAS MUSICALES
function mapDataToHarmony() {
    const temp = visualizerData.temperature;
    const pressure = visualizerData.pressure;
    const humidity = visualizerData.humidity;
    const wind = visualizerData.windSpeed;
    
    // Frecuencia fundamental basada en temperatura (80-120 Hz)
    const fundamentalFreq = mapValue(temp, 5, 35, 80, 120);
    
    const frequencies = {
        fundamental: fundamentalFreq,
        fifth: fundamentalFreq * 1.5,    // Quinta perfecta
        octave: fundamentalFreq * 2.0,   // Octava
        third: fundamentalFreq * 1.26    // Tercera mayor
    };
    
    updateHarmonyDisplays(frequencies, temp, pressure, humidity, wind);
    return frequencies;
}

// ACTUALIZAR DISPLAYS VISUALES
function updateHarmonyDisplays(frequencies, temp, pressure, humidity, wind) {
    // Actualizar frecuencias
    const displays = [
        { id: 'freq0Display', value: frequencies.fundamental },
        { id: 'freq1Display', value: frequencies.fifth },
        { id: 'freq2Display', value: frequencies.octave },
        { id: 'freq3Display', value: frequencies.third }
    ];
    
    displays.forEach(item => {
        const el = document.getElementById(item.id);
        if (el) el.textContent = `${item.value.toFixed(1)} Hz`;
    });
    
    // Actualizar valores de perillas
    const valueElements = [
        { id: 'temp0Value', value: `${temp}°` },
        { id: 'pres1Value', value: `${pressure.toFixed(0)}` },
        { id: 'humi2Value', value: `${humidity}%` },
        { id: 'wind3Value', value: `${wind.toFixed(1)}` }
    ];
    
    valueElements.forEach(item => {
        const el = document.getElementById(item.id);
        if (el) el.textContent = item.value;
    });
    
    // Actualizar stream en vivo
    const streamElements = [
        { id: 'liveTemp2', value: `${temp}°C` },
        { id: 'livePres2', value: `${pressure.toFixed(1)} hPa` },
        { id: 'liveHumi2', value: `${humidity}%` },
        { id: 'liveWind2', value: `${wind.toFixed(1)} km/h` }
    ];
    
    streamElements.forEach(item => {
        const el = document.getElementById(item.id);
        if (el) el.textContent = item.value;
    });
    
    updateKnobRotations(temp, pressure, humidity, wind);
}

// ACTUALIZAR ROTACIÓN DE PERILLAS
function updateKnobRotations(temp, pressure, humidity, wind) {
    const knobData = [
        { id: 'knob0', value: temp, min: 5, max: 35 },
        { id: 'knob1', value: pressure, min: 990, max: 1030 },
        { id: 'knob2', value: humidity, min: 30, max: 100 },
        { id: 'knob3', value: wind, min: 0, max: 50 }
    ];
    
    knobData.forEach(knob => {
        const el = document.getElementById(knob.id);
        if (el) {
            const rotation = mapValue(knob.value, knob.min, knob.max, -135, 135);
            const indicator = el.querySelector('.knob-indicator');
            if (indicator) {
                indicator.style.transform = `translateX(-50%) rotate(${rotation}deg)`;
            }
        }
    });
}

// TOGGLE OSCILADOR ARMÓNICO INDIVIDUAL
function toggleHarmonyOsc(index) {
    console.log(`🎵 Toggle oscilador ${index}`);
    
    if (!harmonyContext) {
        initHarmonyContext();
    }
    
    // Reanudar contexto si está suspendido
    if (harmonyContext.state === 'suspended') {
        harmonyContext.resume();
    }
    
    const powerBtn = document.getElementById(`harm${index}Power`);
    const module = powerBtn.closest('.harmony-module');
    
    if (!powerBtn || !module) {
        console.error(`❌ No se encontraron elementos para oscilador ${index}`);
        return;
    }
    
    if (harmonyOscillators[index]) {
        // Apagar oscilador
        console.log(`🔇 Apagando oscilador ${index}`);
        harmonyGains[index].gain.exponentialRampToValueAtTime(0.001, harmonyContext.currentTime + 0.5);
        setTimeout(() => {
            if (harmonyOscillators[index]) {
                harmonyOscillators[index].stop();
                harmonyOscillators[index] = null;
            }
        }, 500);
        
        powerBtn.classList.remove('active');
        module.classList.remove('active');
        
    } else {
        // Encender oscilador
        console.log(`🔊 Encendiendo oscilador ${index}`);
        const frequencies = mapDataToHarmony();
        const freqArray = [frequencies.fundamental, frequencies.fifth, frequencies.octave, frequencies.third];
        
        harmonyOscillators[index] = harmonyContext.createOscillator();
        harmonyOscillators[index].type = 'sine';
        harmonyOscillators[index].frequency.setValueAtTime(freqArray[index], harmonyContext.currentTime);
        
        harmonyOscillators[index].connect(harmonyGains[index]);
        harmonyOscillators[index].start();
        
        const amplitude = mapValue(visualizerData.pressure, 990, 1030, 0.08, 0.25);
        harmonyGains[index].gain.setValueAtTime(0.001, harmonyContext.currentTime);
        harmonyGains[index].gain.exponentialRampToValueAtTime(amplitude, harmonyContext.currentTime + 1.0);
        
        const filterFreq = mapValue(visualizerData.humidity, 30, 100, 400, 1200);
        harmonyFilters[index].frequency.setValueAtTime(filterFreq, harmonyContext.currentTime);
        
        powerBtn.classList.add('active');
        module.classList.add('active');
    }
    
    updateHarmonyStatus();
}

// TOGGLE MASTER ARMÓNICO
function toggleHarmonyMaster() {
    console.log('🎵 Toggle master armónico');
    
    if (!harmonyContext) {
        initHarmonyContext();
    }
    
    const masterBtn = document.getElementById('harmonyMaster');
    const statusElement = document.getElementById('synthStatus');
    const masterSection = document.querySelector('.master-section');
    
    if (!masterBtn || !statusElement) {
        console.error('❌ No se encontraron elementos del master');
        return;
    }
    
    harmonyActive = !harmonyActive;
    
    if (harmonyActive) {
        console.log('🔊 Activando master armónico');
        masterBtn.classList.add('active');
        if (masterSection) masterSection.classList.add('active');
        statusElement.textContent = 'ARMONÍA';
        statusElement.classList.add('active');
        
        if (harmonyContext.state === 'suspended') {
            harmonyContext.resume();
        }
    } else {
        console.log('🔇 Desactivando master armónico');
        masterBtn.classList.remove('active');
        if (masterSection) masterSection.classList.remove('active');
        statusElement.textContent = 'SILENCIO';
        statusElement.classList.remove('active');
        
        for (let i = 0; i < 4; i++) {
            if (harmonyOscillators[i]) {
                toggleHarmonyOsc(i);
            }
        }
    }
}

// ACTUALIZAR STATUS ARMÓNICO
function updateHarmonyStatus() {
    const activeOscs = harmonyOscillators.filter(osc => osc !== null).length;
    const statusElement = document.getElementById('synthStatus');
    
    if (statusElement) {
        if (harmonyActive && activeOscs > 0) {
            statusElement.textContent = `ARMONÍA [${activeOscs}/4]`;
        } else if (harmonyActive) {
            statusElement.textContent = 'PREPARADO';
        } else {
            statusElement.textContent = 'SILENCIO';
        }
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
            setTimeout(() => animateSidebarItems(true), 100);
        } else {
            animateSidebarItems(false);
            setTimeout(() => sidebar.classList.remove('active'), 300);
        }
    } else {
        animateSidebarItems(true);
    }
}

// FUNCIÓN PARA ANIMAR ELEMENTOS DEL SIDEBAR
function animateSidebarItems(show) {
    const items = document.querySelectorAll('.sidebar-item');
    const microdata = document.querySelector('.sidebar .microdata-container');
    
    if (show) {
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
    console.log('🔄 Mostrando sección:', targetSection);
    
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.querySelectorAll('.sidebar-item').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const target = document.getElementById(targetSection);
    if (target) {
        target.classList.add('active');
        console.log('✅ Sección activada:', targetSection);
    } else {
        console.error('❌ No se encontró la sección:', targetSection);
    }
    
    if (targetSection !== 'home') {
        const targetButton = document.querySelector(`[onclick="showSection('${targetSection}')"]`);
        if (targetButton && targetButton.classList.contains('sidebar-item')) {
            targetButton.classList.add('active');
        }
    }
    
    const isMobile = window.innerWidth < 768;
    if (isMobile && sidebarOpen) {
        setTimeout(() => {
            toggleSidebar();
        }, 200);
    }
    
    const contentArea = document.querySelector('.content-area');
    if (contentArea) {
        contentArea.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
        console.log('🌊 Actualizando datos del río...');
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-34.6118&longitude=-58.3960&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m&timezone=America/Argentina/Buenos_Aires');
        const data = await response.json();
        
        if (data && data.current) {
            const waterTemp = Math.max(8, data.current.temperature_2m - 2).toFixed(1);
            
            visualizerData.temperature = parseFloat(waterTemp);
            visualizerData.pressure = data.current.surface_pressure;
            visualizerData.humidity = data.current.relative_humidity_2m;
            visualizerData.windSpeed = data.current.wind_speed_10m;
            
            const elements = {
                temp: ['waterTemp', 'homeWaterTemp', 'sidebarWaterTemp'],
                pressure: ['pressure', 'homePressure', 'sidebarPressure'],
                wind: ['windSpeed', 'homeWindSpeed', 'sidebarWindSpeed'],
                humidity: ['humidity', 'homeHumidity', 'sidebarHumidity'],
                currentDir: ['currentDir', 'homeCurrentDir', 'sidebarCurrentDir']
            };
            
            elements.temp.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = `${waterTemp}°c`;
            });
            
            elements.pressure.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = id === 'pressure' ? `${data.current.surface_pressure.toFixed(1)} hpa` : `${data.current.surface_pressure.toFixed(1)}`;
            });
            
            elements.wind.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = id === 'windSpeed' ? `${data.current.wind_speed_10m.toFixed(1)} km/h` : `${data.current.wind_speed_10m.toFixed(1)}`;
            });
            
            elements.humidity.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = id === 'humidity' ? `${data.current.relative_humidity_2m}%` : `${data.current.relative_humidity_2m}`;
            });
            
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
            
            mapDataToHarmony();
            
            console.log('✅ Datos del río actualizados');
        }
    } catch (error) {
        console.error('❌ Error obteniendo datos del río:', error);
    }
}

// Inicialización cuando carga la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Ruido de la plata - Sintetizador Armónico cargado');
    
    // Inicializar relojes
    updateClocks();
    setInterval(updateClocks, 1000);
    
    // Datos del río
    updateRiverData();
    setInterval(updateRiverData, 600000); // Cada 10 minutos
    
    // Actualizar parámetros cada 5 segundos
    setInterval(() => {
        if (harmonyActive) {
            mapDataToHarmony();
        }
    }, 5000);
    
    // Asegurar que los microdatos de home sean visibles
    const homeMicrodata = document.querySelector('.home-microdata .microdata-container');
    if (homeMicrodata) {
        homeMicrodata.classList.add('visible');
    }
    
    // Verificar si es desktop y mostrar elementos
    const isDesktop = window.innerWidth >= 768;
    if (isDesktop) {
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
    
    // Manejar cambios de usuario para audio context
    document.addEventListener('click', function() {
        if (harmonyContext && harmonyContext.state === 'suspended') {
            harmonyContext.resume();
        }
    });
    
    // Inicializar mapeo inicial de datos
    setTimeout(() => {
        mapDataToHarmony();
    }, 1000);
    
    console.log('✅ Inicialización completa - Generador Armónico listo');
    
    // Test inicial para verificar que todo funciona
    setTimeout(() => {
        console.log('🔍 Verificando elementos del sintetizador...');
        const masterBtn = document.getElementById('harmonyMaster');
        const statusEl = document.getElementById('synthStatus');
        
        if (masterBtn) console.log('✅ Botón master encontrado');
        else console.error('❌ Botón master NO encontrado');
        
        if (statusEl) console.log('✅ Status element encontrado');
        else console.error('❌ Status element NO encontrado');
        
        // Verificar osciladores
        for (let i = 0; i < 4; i++) {
            const oscBtn = document.getElementById(`harm${i}Power`);
            if (oscBtn) console.log(`✅ Oscilador ${i} encontrado`);
            else console.error(`❌ Oscilador ${i} NO encontrado`);
        }
    }, 2000);
});