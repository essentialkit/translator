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

document.addEventListener("DOMContentLoaded", async function () {
  var uploadedZip = null;
  var defaultLocale = "";

  // Function to handle the click event of the upload button
  function handleUploadButtonClick() {
    document.getElementById("uploadZip").click();
  }

  // Function to handle the change event of the file input
  function handleFileInputChange(e) {
    var file = e.target.files[0];
    if (file && file.type === "application/zip") {
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
      zip
        .file("manifest.json")
        .async("string")
        .then(function (content) {
          var manifest = JSON.parse(content);
          defaultLocale = manifest.default_locale || "en";
          updateDefaultLocale(defaultLocale);
          enableTranslateButton();
        });
    });
  }

  // Function to reset the uploaded zip and related UI elements
  function resetUploadedZip() {
    uploadedZip = null;
    updateDefaultLocale("");
    disableTranslateButton();
    disableDownloadButton();
  }

  // Function to update the default locale UI element
  function updateDefaultLocale(locale) {
    document.getElementById("defaultLocale").textContent =
      "Default Locale: " + locale;
  }

  // Function to enable the translate button
  function enableTranslateButton() {
    document.getElementById("translateBtn").disabled = false;
  }

  // Function to disable the translate button
  function disableTranslateButton() {
    document.getElementById("translateBtn").disabled = true;
  }

  // Function to disable the download button
  function disableDownloadButton() {
    document.getElementById("downloadBtn").disabled = true;
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
      zip
        .file("_locales/" + defaultLocale + "/messages.json")
        .async("string")
        .then(function (content) {
          var messages = JSON.parse(content);
          var apiKey = atob(x1 + x2);
          console.log("api key:", apiKey);

          var translatePromises = targetLocales.map(function (locale) {
            var translationPromises = Object.keys(messages).map(function (key) {
              var message = messages[key].message;
              var url =
                "https://translation.googleapis.com/language/translate/v2?key=" +
                apiKey;
              url += "&q=" + encodeURIComponent(message);
              url += "&target=" + locale;
              return fetch(url)
                .then(function (response) {
                  return response.json();
                })
                .then(function (data) {
                  return {
                    key: key,
                    message: data.data.translations[0].translatedText,
                  };
                });
            });

            return Promise.all(translationPromises).then(function (
              translatedMessages
            ) {
              var translatedContent = {};
              translatedMessages.forEach(function (translatedMessage) {
                translatedContent[translatedMessage.key] = {
                  message: translatedMessage.message,
                };
              });
              return {
                locale: locale,
                content: JSON.stringify(translatedContent, null, 2),
              };
            });
          });

          Promise.all(translatePromises).then(function (translatedLocales) {
            translatedLocales.forEach(function (translatedLocale) {
              zip.file(
                "_locales/" + translatedLocale.locale + "/messages.json",
                translatedLocale.content
              );
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

  function handleUploadButtonClick() {
    document.getElementById("uploadZip").click();
    gtag("event", "click", {
      event_category: "Upload",
      event_label: "Upload Button",
    });
  }

  // Function to handle the change event of the file input
  function handleFileInputChange(e) {
    var file = e.target.files[0];
    if (file && file.type === "application/zip") {
      uploadedZip = file;
      extractManifestFromZip(file);
      gtag("event", "upload", {
        event_category: "Upload",
        event_label: "Zip File",
      });
    } else {
      resetUploadedZip();
      displayUploadError("Invalid file type. Please upload a valid zip file.");
      gtag("event", "error", {
        event_category: "Upload",
        event_label: "Invalid File Type",
      });
    }
  }

  // Function to extract the manifest.json file from the zip
  function extractManifestFromZip(file) {
    console.log("extracting manifest file");
    JSZip.loadAsync(file)
      .then(function (zip) {
        if (zip.files["manifest.json"]) {
          zip
            .file("manifest.json")
            .async("string")
            .then(function (content) {
              var manifest = JSON.parse(content);
              defaultLocale = manifest.default_locale || "en";
              if (zip.files["_locales/"]) {
                updateDefaultLocale(defaultLocale);
                enableTranslateButton();
                gtag("event", "extract", {
                  event_category: "Manifest",
                  event_label: "Success",
                });
              } else {
                displayUploadError(
                  'Missing "_locales" directory in the zip file.'
                );
                gtag("event", "error", {
                  event_category: "Manifest",
                  event_label: "Missing Locales Directory",
                });
              }
            });
        } else {
          displayUploadError('Missing "manifest.json" file in the zip file.');
          gtag("event", "error", {
            event_category: "Manifest",
            event_label: "Missing Manifest File",
          });
        }
      })
      .catch(function (error) {
        displayUploadError("Error extracting manifest file: " + error.message);
        gtag("event", "error", {
          event_category: "Manifest",
          event_label: "Extraction Error",
        });
      });
  }

  // Function to display upload error message
  function displayUploadError(message) {
    document.getElementById("uploadError").textContent = message;
  }

  // Function to handle the click event of the fetch extension button
  function handleFetchExtensionButtonClick() {
    var extensionUrl = document.getElementById("extensionUrl").value;
    var extensionIdPattern =
      /^https?:\/\/chromewebstore.google.com\/detail(?:\/[^\/]+)?\/([a-z]{32})(?=[\/#?]|$)/;
    var match = extensionUrl.match(extensionIdPattern);
    if (match && match[1]) {
      var extensionId = match[1];
      fetchExtensionFromWebStore(extensionId);
      gtag("event", "click", {
        event_category: "Fetch Extension",
        event_label: "Fetch Button",
      });
    } else {
      displayUploadError("Invalid Chrome extension URL.");
      gtag("event", "error", {
        event_category: "Fetch Extension",
        event_label: "Invalid URL",
      });
    }
  }

  // Function to fetch extension from Chrome Web Store
  function fetchExtensionFromWebStore(extensionId) {
    var url = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=91.0.1609.0&acceptformat=crx2,crx3&x=id%3D${extensionId}%26uc`;
    fetch(url, { method: "POST", mode: "no-cors", redirect: "follow" })
      .then(function (response) {
        console.log("response", response);
        if (response.ok) {
          return response.blob();
        } else {
          throw new Error(
            "Failed to fetch extension from Chrome Web Store. status: ",
            response.status,
            response
          );
        }
      })
      .then(function (blob) {
        uploadedZip = new File([blob], "extension.zip", {
          type: "application/zip",
        });
        extractManifestFromZip(uploadedZip);
        gtag("event", "fetch", {
          event_category: "Fetch Extension",
          event_label: "Success",
        });
      })
      .catch(function (error) {
        displayUploadError("Error fetching extension: " + error.message);
        gtag("event", "error", {
          event_category: "Fetch Extension",
          event_label: "Fetch Error",
        });
      });
  }

  // Event listeners
  document
    .getElementById("uploadBtn")
    .addEventListener("click", handleUploadButtonClick);
  document
    .getElementById("uploadZip")
    .addEventListener("change", handleFileInputChange);
  document
    .getElementById("fetchExtensionBtn")
    .addEventListener("click", handleFetchExtensionButtonClick);
  document
    .getElementById("translateBtn")
    .addEventListener("click", handleTranslateButtonClick);
  document
    .getElementById("downloadBtn")
    .addEventListener("click", handleDownloadButtonClick);
});
