const targetLocales = [
  "ar",
  "am",
  "bg",
  "bn",
  "ca",
  "cs",
  "da",
  "de",
  "el",
  "en",
  "es",
  "et",
  "fa",
  "fi",
  "fr",
  "gu",
  "he",
  "hi",
  "hr",
  "hu",
  "id",
  "it",
  "ja",
  "kn",
  "ko",
  "lt",
  "lv",
  "ml",
  "mr",
  "ms",
  "ml",
  "no",
  "pl",
  "pt",
  "ro",
  "ru",
  "sk",
  "sl",
  "sr",
  "sv",
  "sw",
  "ta",
  "te",
  "th",
  "tr",
  "uk",
  "vi",
  "zh-CN",
  "zh-TW",
];

const x1 = "QUl6YVN5QktjRTNkNjVXVU";
const x2 = "Z6VDJFTTlQSnJrZUtINFZDcThzelBn";

document.addEventListener("DOMContentLoaded", function () {
  var uploadedZip = null;
  var defaultLocale = '';

  // Function to handle the click event of the upload button
  function handleUploadButtonClick() {
    document.getElementById('uploadZip').click();
  }

  // Function to handle the change event of the file input
  function handleFileInputChange(e) {
    var file = e.target.files[0];
    if (file && file.type === 'application/zip') {
      uploadedZip = file;
      extractManifestFromZip(file);
    } else {
      resetUploadedZip();
    }
  }

  // Function to extract the manifest.json file from the zip
  function extractManifestFromZip(file) {
    console.log("extracting manifest file");
    JSZip.loadAsync(file).then(function (zip) {
      // TODO: Add error handling for when manifest.json doesn't exist and async is undefined.
      zip.file('manifest.json').async('string').then(function (content) {
        var manifest = JSON.parse(content);
        defaultLocale = manifest.default_locale || 'en';
        updateDefaultLocale(defaultLocale);
        enableTranslateButton();
      });
    });
  }

  // Function to reset the uploaded zip and related UI elements
  function resetUploadedZip() {
    uploadedZip = null;
    updateDefaultLocale('');
    disableTranslateButton();
    disableDownloadButton();
  }

  // Function to update the default locale UI element
  function updateDefaultLocale(locale) {
    document.getElementById('defaultLocale').textContent = 'Default Locale: ' + locale;
  }

  // Function to enable the translate button
  function enableTranslateButton() {
    document.getElementById('translateBtn').disabled = false;
  }

  // Function to disable the translate button
  function disableTranslateButton() {
    document.getElementById('translateBtn').disabled = true;
  }

  // Function to disable the download button
  function disableDownloadButton() {
    document.getElementById('downloadBtn').disabled = true;
  }

  // Function to handle the click event of the translate button
  function handleTranslateButtonClick() {
    if (uploadedZip) {
      translateExtension(uploadedZip);
    }
  }

  // Function to translate the extension using the Google Translate API
// Function to translate the extension using the Google Translate API
function translateExtension(zip) {
  JSZip.loadAsync(zip).then(function (zip) {
    zip.file("_locales/" + defaultLocale + "/messages.json").async("string").then(function (content) {
      var messages = JSON.parse(content);
      var apiKey = atob(x1 + x2);
      console.log("api key:", apiKey);

      var translatePromises = targetLocales.map(function (locale) {
        var translationPromises = Object.keys(messages).map(function (key) {
          var message = messages[key].message;
          var url = "https://translation.googleapis.com/language/translate/v2?key=" + apiKey;
          url += "&q=" + encodeURIComponent(message);
          url += "&target=" + locale;
          return fetch(url)
            .then(function (response) {
              return response.json();
            })
            .then(function (data) {
              return {
                key: key,
                message: data.data.translations[0].translatedText
              };
            });
        });

        return Promise.all(translationPromises).then(function (translatedMessages) {
          var translatedContent = {};
          translatedMessages.forEach(function (translatedMessage) {
            translatedContent[translatedMessage.key] = {
              message: translatedMessage.message
            };
          });
          return {
            locale: locale,
            content: JSON.stringify(translatedContent, null, 2)
          };
        });
      });

      Promise.all(translatePromises).then(function (translatedLocales) {
        translatedLocales.forEach(function (translatedLocale) {
          zip.file("_locales/" + translatedLocale.locale + "/messages.json", translatedLocale.content);
        });
        enableDownloadButton();
      });
    });
  });
}

  // Function to enable the download button
  function enableDownloadButton() {
    document.getElementById("downloadBtn").disabled = false;
  }

  // Function to handle the click event of the download button
  function handleDownloadButtonClick() {
    if (uploadedZip) {
      downloadTranslatedExtension(uploadedZip);
    }
  }

  // Function to download the translated extension
  function downloadTranslatedExtension(zip) {
    JSZip.loadAsync(zip).then(function (zip) {
      zip.generateAsync({ type: "blob" }).then(function (content) {
        var link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = "translated_extension.zip";
        link.click();
      });
    });
  }

  // Event listeners
  document.getElementById('uploadBtn').addEventListener('click', handleUploadButtonClick);
  document.getElementById('uploadZip').addEventListener('change', handleFileInputChange);
  document.getElementById("translateBtn").addEventListener("click", handleTranslateButtonClick);
  document.getElementById("downloadBtn").addEventListener("click", handleDownloadButtonClick);
});
