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


const defaultLocales = ["en", "es", "zh_CN", "hi", "ar"];

const x1 = "QUl6YVN5QktjRTNkNjVXVU";
const x2 = "Z6VDJFTTlQSnJrZUtINFZDcThzelBn";

document.addEventListener("DOMContentLoaded", async function () {
  var uploadedZip = null;
  var defaultLocale = "";

  // Function to handle the click event of the upload button
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
              gtag("event", "extract", {
                event_category: "Manifest",
                event_label: "Success",
              });
              if (zip.files["_locales/"]) {
                updateDefaultLocale(defaultLocale);
                enableTranslateButton();
                displayUploadSuccess("Extension uploaded successfully!");
                setActiveCard("translateCard");
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

  // Function to reset the uploaded zip and related UI elements
  function resetUploadedZip() {
    uploadedZip = null;
    updateDefaultLocale("");
    disableTranslateButton();
    disableDownloadButton();
    setActiveCard("uploadCard");
  }

  // Function to update the default locale UI element
  function updateDefaultLocale(locale) {
    document.getElementById("defaultLocale").textContent =
      "Detected Default Locale: " + locale;
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

  // Function to handle the click event of the select locales link
  function handleSelectLocalesLinkClick(event) {
    event.preventDefault();
    var localesList = document.getElementById("localesList");
    if (localesList.style.display === "none") {
      localesList.style.display = "block";
    } else {
      localesList.style.display = "none";
    }
  }

  // Uncheck all checkboxes
  function handleDeselectAllLocalsClick(event) {
    var checkboxes = document.querySelectorAll(
      '#localesList input[type="checkbox"]'
    );
    checkboxes.forEach(function (checkbox) {
      checkbox.checked = false;
    });
  }

  // Function to get selected locales
  function getSelectedLocales() {
    var selectedLocales = [];
    var checkboxes = document.querySelectorAll(
      '#localesList input[type="checkbox"]'
    );
    checkboxes.forEach(function (checkbox) {
      if (checkbox.checked) {
        selectedLocales.push(checkbox.value);
      }
    });
    return selectedLocales;
  }

  // Function to update translation progress
  function updateTranslationProgress(current, total) {
    var progressBar = document.getElementById("translationProgress");
    var progressPercentage = Math.round((current / total) * 100);
    progressBar.style.width = progressPercentage + "%";
    progressBar.setAttribute("aria-valuenow", progressPercentage);
    progressBar.innerHTML = `${progressPercentage}%`;

    // Show the progress bar and translation status when translation begins
    document.querySelector(".progress").style.display = "block";
  }

  // Function to handle the click event of the translate button
  function handleTranslateButtonClick() {
    if (uploadedZip) {
      // Hide the progress bar before starting a new translation
      document.querySelector(".progress").style.display = "none";
      translateExtension(uploadedZip);
    }
  }

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

          var selectedLocales = getSelectedLocales();
          var translatedCount = 0;
          var translatePromises = selectedLocales.map(function (locale) {
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
              zip.file(
                "_locales/" + locale + "/messages.json",
                JSON.stringify(translatedContent, null, 2)
              );
              updateTranslationProgress(
                ++translatedCount,
                selectedLocales.length
              );
            });
          });

          Promise.all(translatePromises)
            .then(function () {
              enableDownloadButton();
              displayTranslateSuccess("Extension translated successfully!");
              setActiveCard("downloadCard");
            })
            .catch(function (error) {
              displayTranslateError(
                "Error translating extension: " + error.message
              );
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
        displayDownloadSuccess("Extension downloaded successfully!");
      });
    });
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

  // Function to display upload error message
  function displayUploadError(message) {
    document.getElementById("uploadMessage").innerHTML =
      '<div class="alert alert-danger">' + message + "</div>";
  }

  // Function to display upload success message
  function displayUploadSuccess(message) {
    document.getElementById("uploadMessage").innerHTML =
      '<div class="alert alert-success">' + message + "</div>";
  }

  // Function to display translate error message
  function displayTranslateError(message) {
    document.getElementById("translateMessage").innerHTML =
      '<div class="alert alert-danger">' + message + "</div>";
  }

  // Function to display translate success message
  function displayTranslateSuccess(message) {
    document.getElementById("translateMessage").innerHTML =
      '<div class="alert alert-success">' + message + "</div>";
  }

  // Function to display download success message
  function displayDownloadSuccess(message) {
    document.getElementById("downloadMessage").innerHTML =
      '<div class="alert alert-success">' + message + "</div>";
  }

  // Function to set the active card
  function setActiveCard(cardId) {
    var cards = document.querySelectorAll(".card");
    cards.forEach(function (card) {
      card.classList.remove("active");
    });
    document.getElementById(cardId).classList.add("active");
  }

  // Function to handle the change event of the locale checkboxes
  function handleLocaleCheckboxChange() {
    var selectedLocales = getSelectedLocales();
    if (selectedLocales.length > 5) {
      this.checked = false;
      displayLocaleNotice(getSelectedLocales());
    } else {
      hideLocaleNotice();
      updateSelectedLocales(selectedLocales);
    }
  }

  // Function to display the locale notice
  function displayLocaleNotice(selectedLocales) {
    var localeNotice = document.getElementById("localeNotice");
    localeNotice.innerHTML =
      "You can only select up to 5 locales at a time (for now due to resource constraints). Selected: " +
      selectedLocales.join(", ");
    localeNotice.style.display = "block";
  }

  // Function to hide the locale notice
  function hideLocaleNotice() {
    document.getElementById("localeNotice").style.display = "none";
  }

  // Function to update the selected locales display
  function updateSelectedLocales(selectedLocales) {
    document.getElementById("selectedLocales").textContent =
      "Target Locales: " + selectedLocales.join(", ");
  }

  // Function to set the default locales checked
  function setDefaultLocalesChecked() {
    var checkboxes = document.querySelectorAll(
      '#localesList input[type="checkbox"]'
    );
    checkboxes.forEach(function (checkbox) {
      checkbox.checked = defaultLocales.includes(checkbox.value);
    });
    updateSelectedLocales(getSelectedLocales());
  }

  document
    .querySelectorAll('#localesList input[type="checkbox"]')
    .forEach(function (checkbox) {
      checkbox.addEventListener("change", handleLocaleCheckboxChange);
    });

  // Set the default locales checked on page load
  setDefaultLocalesChecked();

  // Event listeners
  document
    .getElementById("uploadBtn")
    .addEventListener("click", handleUploadButtonClick);
  document
    .getElementById("uploadZip")
    .addEventListener("change", handleFileInputChange);
  // document
  //   .getElementById("fetchExtensionBtn")
  //   .addEventListener("click", handleFetchExtensionButtonClick);
  document
    .getElementById("selectLocalesLink")
    .addEventListener("click", handleSelectLocalesLinkClick);
  // Function to handle the click event of the deselect all button
  document
    .getElementById("deselectAllBtn")
    .addEventListener("click", handleDeselectAllLocalsClick);
  document
    .getElementById("translateBtn")
    .addEventListener("click", handleTranslateButtonClick);
  document
    .getElementById("downloadBtn")
    .addEventListener("click", handleDownloadButtonClick);
});
