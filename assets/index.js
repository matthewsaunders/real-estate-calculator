(() => {
  let LOCALE = 'en-US';

  const moneyFormatter = new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const percentageToString = (percentage, precision = 2) => (percentage * 100).toFixed(precision) + "%";
  const showElem = elem => elem.classList.remove('hidden');
  const hideElem = elem => elem.classList.add('hidden');

  const generateDiv = (inner = '', classList = []) => {
    let div = document.createElement('div');

    div.innerHTML = inner;
    classList.map(klass => div.classList.add(klass));

    return div;
  }

  const monthlyLoanPayment = ({ principal, interestRate, numPayments }) => {
    rate = interestRate / 12;
    return principal * ((rate * Math.pow((1 + rate), numPayments)) / (Math.pow((1 + rate), numPayments) - 1));
  }

  class App {
    appraisalSteps = 6;
    appraisalIncrement = 0.025;
    appraisalFloor = 1.0 - ((this.appraisalSteps - 1) * this.appraisalIncrement);
    closingCostPercentage = 0.035;

    constructor(data = {}, elems = {}) {
      this.data = data;
      this.elems = elems;
      this.simulations = [];

      this.registerInputListeners();
      this.runSimulations();
      this.updateDOM();
    }

    registerInputListeners() {
      this.registerInputListener(this.elems.offerInput, 'offerPrice');
      this.registerInputListener(this.elems.hoaInput, 'hoa');
      this.registerInputListener(this.elems.taxesInput, 'taxes');
      this.registerInputListener(this.elems.insuranceInput, 'insurance');
      this.registerInputListener(this.elems.downPaymentInput, 'downPaymentPercentage');
      this.registerInputListener(this.elems.interestRateInput, 'interestRate');
      this.registerInputListener(this.elems.durationInput, 'duration');
    }

    runSimulations() {
      this.simulations = [];

      for (let i = 0; i < this.appraisalSteps; i += 1) {
        let appraisalPercentage = (this.appraisalFloor + (i * this.appraisalIncrement)).toFixed(4);
        let assessment = parseInt(appraisalPercentage * this.data.offerPrice);
        let difference = this.data.offerPrice - assessment;
        let mortgageDown = parseInt(this.data.downPaymentPercentage * assessment);
        let totalDown = mortgageDown + (difference < 0 ? 0 : difference);
        let totalClose = totalDown + parseInt(this.closingCostPercentage * this.data.offerPrice);
        let percentageClose = totalDown / this.data.offerPrice;
        let name = `${percentageToString(appraisalPercentage)} Offer`;

        let mortgageTotal = assessment - mortgageDown;
        let mortgageMonthly = monthlyLoanPayment({ principal: mortgageTotal, interestRate: this.data.interestRate, numPayments: this.data.duration });
        let totalMonthly = mortgageMonthly + this.data.hoa + this.data.taxes + this.data.insurance;

        this.simulations.push({
          name,
          assessment,
          difference,
          mortgageDown,
          totalDown,
          totalClose,
          percentageClose,
          mortgageTotal,
          mortgageMonthly,
          totalMonthly,
        });
      }
    }

    updateDOM() {
      this.updateListingDOM();
      this.updateSimulationsDOM();
    }

    updateListingDOM() {
      // Facts
      document.getElementById('js-listing-address').innerText = this.data.address;
      document.getElementById('js-listing-bed').innerText = this.data.numBeds;
      document.getElementById('js-listing-bath').innerText = this.data.numBaths;
      document.getElementById('js-listing-area').innerText = this.data.area?.toLocaleString(LOCALE);

      // Costs
      document.getElementById('js-listing-hoa').value = this.data.hoa;
      document.getElementById('js-listing-taxes').value = this.data.taxes;
      document.getElementById('js-listing-insurance').value = this.data.insurance;

      // Pricing
      document.getElementById('js-listing-list-price').innerText = moneyFormatter.format(this.data.listPrice);
      this.elems.offerInput.value = this.data.offerPrice;

      // Mortgage
      this.elems.downPaymentInput.value = this.data.downPaymentPercentage;
      this.elems.interestRateInput.value = this.data.interestRate;
      this.elems.durationInput.value = this.data.duration;
    }

    updateSimulationsDOM() {
      // Remove previous simulations
      let previousSims = document.getElementsByClassName('Simulator__simData');
      while (previousSims.length > 0) {
        previousSims[0].parentNode.removeChild(previousSims[0]);
      }

      // Add new simulations
      this.simulations.map(sim => this.elems.simulations.appendChild(this.generateSimulationHTML(sim)));
    }

    generateSimulationHTML(sim) {
      let simDiv = generateDiv('', ['Simulator__col','Simulator__simData']);
      simDiv.appendChild(generateDiv(sim.name));
      // simDiv.appendChild(generateDiv(moneyFormatter.format(this.data.listPrice)));
      simDiv.appendChild(generateDiv(moneyFormatter.format(this.data.offerPrice)));
      simDiv.appendChild(generateDiv(moneyFormatter.format(sim.assessment)));
      simDiv.appendChild(generateDiv(moneyFormatter.format(sim.difference)));
      simDiv.appendChild(generateDiv(moneyFormatter.format(sim.mortgageDown)));
      simDiv.appendChild(generateDiv(moneyFormatter.format(sim.totalDown)));
      simDiv.appendChild(generateDiv(moneyFormatter.format(sim.totalClose)));
      simDiv.appendChild(generateDiv(percentageToString(sim.percentageClose)));
      simDiv.appendChild(generateDiv(moneyFormatter.format(sim.mortgageTotal)));
      simDiv.appendChild(generateDiv(moneyFormatter.format(sim.mortgageMonthly)));
      simDiv.appendChild(generateDiv(moneyFormatter.format(sim.totalMonthly)));

      return simDiv;
    }

    updateData(newData = {}) {
      this.data = { ...this.data, ...newData };

      this.runSimulations();
      this.updateDOM();
    }

    registerInputListener(input, pathToValue = '') {
      if (!input || pathToValue === '') { return; }

      let updater = (event) => {
        let data = Number(event.target.value);
        let obj = {};
        obj[pathToValue] = data;

        this.updateData(obj);
      }

      input.addEventListener('change', updater);
      input.addEventListener('keyup', updater);
    }
  }

  const fetchListing = async (url = '') => {
    return await fetch(url)
      .then(response => response.json());
  };

  document.addEventListener("DOMContentLoaded", () => {
    let pageElems = {
      // page sections
      loadingSection: document.getElementById('js-loading'),
      listingInfoSection: document.getElementById('js-listing-info'),
      simulatorSection: document.getElementById('js-simulator'),
      simulations: document.getElementById('js-simulations'),

      // form elements
      listingLinkInput: document.getElementById('js-form-link'),
      submitBtn: document.getElementById('js-form-submit'),
      offerInput: document.getElementById('js-listing-offer-price'),
      hoaInput: document.getElementById('js-listing-hoa'),
      taxesInput: document.getElementById('js-listing-taxes'),
      insuranceInput: document.getElementById('js-listing-insurance'),
      downPaymentInput: document.getElementById('js-mortgage-down-payment-percentage'),
      interestRateInput: document.getElementById('js-mortgage-interest-rate'),
      durationInput: document.getElementById('js-mortgage-duration'),
    };

    pageElems.submitBtn.addEventListener('click', () => {
      // Show loading
      showElem(pageElems.loadingSection);
      hideElem(pageElems.listingInfoSection);
      hideElem(pageElems.simulatorSection);

      const url = `/listing?url=${pageElems.listingLinkInput.value}`;
      fetchListing(url).then(data => {
        appData = Object.assign(
          { offerPrice: data.listPrice,
            downPaymentPercentage: 0.25,
            interestRate: 0.035,
            duration: 360,
          },
          data
        );

        console.log(appData);
        new App(appData, pageElems);

        // Show data
        hideElem(pageElems.loadingSection);
        showElem(pageElems.listingInfoSection);
        showElem(pageElems.simulatorSection);
      });
    });
  });
})();
