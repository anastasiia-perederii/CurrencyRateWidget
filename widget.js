// Ініціалізуємо Zoho SDK для роботи віджета у CRM
ZOHO.embeddedApp.init().then(function() {

  // Слухач подій відкриття картки угоди (Deals)
  ZOHO.embeddedApp.on("PageLoad", function(data) {
    console.log("PageLoad OK");

    // Отримуємо ID відкритої угоди
    const recordId = data.EntityId[0];

    // URL для отримання курсу НБУ (USD)
    const nbuApiUrl = "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json";

    // Запит до API НБУ для отримання курсу
    fetch(nbuApiUrl)
        .then(response => response.json())
        .then(json => {
          // Отримуємо курс НБУ (округлюємо до 2 знаків)
          const nbuRate = parseFloat(json[0].rate).toFixed(2);
          document.querySelector("#nbuRate").innerText = nbuRate;

          // Отримуємо дані угоди з Zoho CRM
          ZOHO.CRM.API.getRecord({ Entity: "Deals", RecordID: recordId })
              .then(function(response) {
                const dealData = response.data[0];
                const dealRateField = dealData["Курс валют"] || 0;
                const dealRate = parseFloat(dealRateField).toFixed(2);
                document.querySelector("#dealRate").innerText = dealRate;

                // Розрахунок різниці у відсотках (неокруглений)
                const diffPercent = ((dealRate / nbuRate - 1) * 100);
                // Округлюємо різницю до 1 знаку після коми (і перетворюємо у число)
                const diffPercentRounded = parseFloat(diffPercent.toFixed(1));
                // Записуємо результат у DOM
                document.querySelector("#diff").innerText = diffPercentRounded.toString();

                // Якщо різниця у відсотках ≥ 5 (по модулю) – показуємо кнопку
                if (Math.abs(diffPercentRounded) >= 5) {
                  const updateBtn = document.querySelector("#updateButton");
                  updateBtn.style.display = "block";

                  // Логіка оновлення поля "Курс валют" у Zoho CRM
                  updateBtn.onclick = function() {
                    const updateData = {
                      data: [
                        {
                          id: recordId,
                          "Курс валют": nbuRate
                        }
                      ]
                    };

                    // Викликаємо Zoho CRM API для оновлення запису
                    ZOHO.CRM.API.updateRecord({ Entity: "Deals", APIData: updateData })
                        .then(function() {
                          alert("Курс оновлено в угоді!");
                          // Перезавантажуємо картку угоди після оновлення
                          location.reload();
                        });
                  };
                }
              });
        });
  });
});
