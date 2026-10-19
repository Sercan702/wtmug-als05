// Service Worker Kaydı
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker kayıt başarılı:', reg.scope))
            .catch(err => console.log('Service Worker kayıt hatası:', err));
    });
}

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const imagePreview = document.getElementById('imagePreview');
const startCameraBtn = document.getElementById('startCameraBtn');
const captureBtn = document.getElementById('captureBtn');
const galleryInput = document.getElementById('galleryInput');
const targetLangSelect = document.getElementById('targetLang');
const manualText = document.getElementById('manualText');
const translateManualBtn = document.getElementById('translateManualBtn');
const sourceTextOutput = document.getElementById('sourceTextOutput');
const translatedTextOutput = document.getElementById('translatedTextOutput');
const loadingDiv = document.getElementById('loading');

let mediaStream = null;

// Kamerayı Aç / Kapat
startCameraBtn.addEventListener('click', async () => {
    try {
        if (mediaStream) {
            stopCamera();
            return;
        }
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } },
            audio: false
        });
        video.srcObject = mediaStream;
        video.style.display = 'block';
        imagePreview.style.display = 'none';
        startCameraBtn.textContent = 'Kamerayı Kapat';
        captureBtn.style.display = 'inline-block';
    } catch (err) {
        alert('Kamera erişimi sağlanamadı: ' + err.message);
    }
});

function stopCamera() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    video.style.display = 'none';
    captureBtn.style.display = 'none';
    startCameraBtn.textContent = 'Kamerayı Aç';
}

// Fotoğraf Çek ve İşle
captureBtn.addEventListener('click', () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageDataUrl = canvas.toDataURL('image/png');
    imagePreview.src = imageDataUrl;
    imagePreview.style.display = 'block';
    video.style.display = 'none';
    stopCamera();

    processImage(imageDataUrl);
});

// Galeriden Görsel Yükle
galleryInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageDataUrl = e.target.result;
            imagePreview.src = imageDataUrl;
            imagePreview.style.display = 'block';
            stopCamera();
            processImage(imageDataUrl);
        };
        reader.readAsDataURL(file);
    }
});

// Manuel Metin Çevirisi
translateManualBtn.addEventListener('click', () => {
    const text = manualText.value.trim();
    if (!text) {
        alert('Lütfen bir metin girin.');
        return;
    }
    sourceTextOutput.textContent = text;
    translateText(text, 'autodetect', targetLangSelect.value);
});

// Cihaz Üzerinde Tesseract.js OCR İşlemi
async function processImage(imageSource) {
    showLoading(true);
    try {
        const result = await Tesseract.recognize(
            imageSource,
            'eng+tur', 
            { logger: m => console.log(m) }
        );
        
        const recognizedText = result.data.text.trim();
        if (!recognizedText) {
            sourceTextOutput.textContent = 'Görselde okunabilir metin bulunamadı.';
            translatedTextOutput.textContent = '-';
            showLoading(false);
            return;
        }

        sourceTextOutput.textContent = recognizedText;
        await translateText(recognizedText, 'autodetect', targetLangSelect.value);
    } catch (err) {
        alert('OCR İşlem Hatası: ' + err.message);
        showLoading(false);
    }
}

// Ücretsiz MyMemory Çeviri Servisi
async function translateText(text, sourceLang, targetLang) {
    showLoading(true);
    try {
        const langPair = `${sourceLang === 'autodetect' ? '' : sourceLang}|${targetLang}`;
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.responseData) {
            translatedTextOutput.textContent = data.responseData.translatedText;
        } else {
            translatedTextOutput.textContent = 'Çeviri alınamadı.';
        }
    } catch (err) {
        translatedTextOutput.textContent = 'Çeviri servis hatası: ' + err.message;
    } finally {
        showLoading(false);
    }
}

function showLoading(show) {
    loadingDiv.style.display = show ? 'block' : 'none';
}