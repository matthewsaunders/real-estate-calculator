const axios = require("axios");
const cheerio = require("cheerio");

const fetchElemInnerText = elem => (elem.text && elem.text().trim()) || null;
const parseMoney = (str) => parseInt(str?.replace('$', '')?.replace(',', ''));

const extractListing = ($) => {
  const page = $('div#content');
  const listingInfo = page.find('.HomeInfoV2');
  const mortgageCalculator = page.find("div.MortgageCalculator");

  const address = listingInfo.find('.street-address').attr('title').trim();
  const numBeds = parseInt(fetchElemInnerText(listingInfo.find('[data-rf-test-id="abp-beds"] > .statsValue')));
  const numBaths = parseInt(fetchElemInnerText(listingInfo.find('[data-rf-test-id="abp-baths"] > .statsValue')));
  const listPrice = parseMoney(fetchElemInnerText(listingInfo.find('[data-rf-test-id="abp-price"] > .statsValue')));
  const area = parseInt(fetchElemInnerText(listingInfo.find('[data-rf-test-id="abp-sqFt"] > .statsValue')));

  const hoa = parseMoney(fetchElemInnerText(mortgageCalculator.find('.colorBarLegend > div:nth-child(3) > .Row--content')));
  const taxes = parseMoney(fetchElemInnerText(mortgageCalculator.find('.colorBarLegend > div:nth-child(2) > .Row--content')));
  const insurance = Number((parseMoney(fetchElemInnerText(mortgageCalculator.find('.colorBarLegend > div:nth-child(4) > .Row--content'))) / 12.0).toFixed(2));

  return {
    address,
    numBeds,
    numBaths,
    listPrice,
    area,
    hoa,
    taxes,
    insurance,
  };
}

const fetchHtmlFromUrl = async (url = '') => {
  return await axios
    .get(url)
    .then(response => cheerio.load(response.data))
    .catch(error => {
      error.status = (error.response && error.response.status) || 500;
      throw error;
    });
}

const fetchListing = async (url = '') => {
  let $ = await fetchHtmlFromUrl(url);
  let listing = extractListing($);

  return listing;
}

module.exports = {
  fetchListing,
};
