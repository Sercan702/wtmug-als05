// Manuel Metin Çevirisi
translateManualBtn.addEventListener('click', () => {
    const text = manualText.value.trim();
    if (!text) {
        alert('Lütfen bir metin girin.');
        return;
    }
    sourceTextOutput.textContent = text;
    translateText(text, targetLangSelect.value);
});

// Cihaz Üzerinde Tesseract.js OCR İşlemi
async function processImage(imageSource) {
    showLoading(true);
    try {
        const result = await Tesseract.recognize(
            imageSource,
            'eng+tur+fra+deu+spa+rus+ara', // Desteklenen ana diller
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
        await translateText(recognizedText, targetLangSelect.value);
    } catch (err) {
        alert('OCR İşlem Hatası: ' + err.message);
        showLoading(false);
    }
}

// Ücretsiz ve Otomatik Dil Algılamalı Çeviri Servisi
async function translateText(text, targetLang) {
    showLoading(true);
    try {
        // MyMemory servisi için kaynak dili otomatik bırakıp hedef dili belirtiyoruz.
        // MyMemory metnin dilini kendi içinde otomatik algılayıp çeviri yapar.
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${targetLang}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.responseData && data.responseData.translatedText) {
            // Eğer servis dili algıladıysa ve çevirdiyse yazdır
            let translated = data.responseData.translatedText;
            
            // MyMemory bazen algılayamazsa uyarı metni döner, bunu kontrol edelim
            if (translated.includes('QUERY LENGTH LIMIT') || translated.includes('INVALID')) {
                throw.new('Çeviri limiti veya geçersiz metin.');
            }
            
            translatedTextOutput.textContent = translated;
        } else {
            translatedTextOutput.textContent = 'Çeviri alınamadı, lütfen tekrar deneyin.';
        }
    } catch (err) {
        translatedTextOutput.textContent = 'Çeviri servis hatası: ' + err.message;
    } finally {
        showLoading(false);
    }
}
